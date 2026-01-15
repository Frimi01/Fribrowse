package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"time"
)

const (
	defaultPort       = "3002"
	bookmarksFile     = "./bookmarks.json"
	backupDir         = "./backups"
	maxRequestBodyMB  = 10
	shutdownTimeout   = 5 * time.Second
)

const (
	logInfo  = "[INFO]  "
	logError = "[ERROR] "
	logDebug = "[DEBUG] "
)

type BookmarkStore interface {
	Load() ([]byte, error)
	Save([]byte) error
}

type JSONStore struct {
	path string
}

func (s *JSONStore) Load() ([]byte, error) {
	data, err := os.ReadFile(s.path)
	if os.IsNotExist(err) {
		log.Printf("%sJSON file not found, returning empty array", logInfo)
		return []byte("[]"), nil
	}
	if err != nil {
		log.Printf("%sFailed to read JSON file: %v", logError, err)
		return nil, err
	}
	
	log.Printf("%sLoaded %d bytes from JSON file", logDebug, len(data))
	return data, err
}

func (s *JSONStore) Save(data []byte) error {
	err := os.WriteFile(s.path, data, 0644)
	if err != nil {
		log.Printf("%sFailed to write JSON file: %v", logError, err)
		return err
	}
	
	log.Printf("%sSaved %d bytes to JSON file", logInfo, len(data))
	return nil
}

type CouchStore struct {
	baseURL string
	dbName  string
	client  *http.Client
	auth    string
}

func NewCouchStore(url, user, pass, db string) *CouchStore {
	auth := base64.StdEncoding.EncodeToString([]byte(user + ":" + pass))
	return &CouchStore{
		baseURL: url,
		dbName:  db,
		auth:    auth,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *CouchStore) getLatestRev() (string, error) {
	req, err := http.NewRequest(
		"HEAD",
		c.baseURL+"/"+c.dbName+"/bookmarks",
		nil,
	)
	if err != nil {
		log.Printf("%sFailed to create HEAD request: %v", logError, err)
		return "", err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)

	res, err := c.client.Do(req)
	if err != nil {
		log.Printf("%sCouchDB HEAD request failed: %v", logError, err)
		return "", err
	}
	defer res.Body.Close()

	log.Printf("%sCouchDB HEAD /bookmarks - Status: %d", logDebug, res.StatusCode)

	if res.StatusCode == http.StatusNotFound {
		log.Printf("%sNo existing document found in CouchDB", logDebug)
		return "", nil
	}

	etag := res.Header.Get("ETag")
	if etag == "" {
		log.Printf("%sNo ETag in CouchDB response", logDebug)
		return "", nil
	}

	// Remove quotes from ETag
	rev := etag[1 : len(etag)-1]
	log.Printf("%sRetrieved revision: %s", logDebug, rev)
	return rev, nil
}

func (c *CouchStore) Load() ([]byte, error) {
	req, err := http.NewRequest(
		"GET",
		c.baseURL+"/"+c.dbName+"/bookmarks",
		nil,
	)
	if err != nil {
		log.Printf("%sFailed to create GET request: %v", logError, err)
		return nil, err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)

	res, err := c.client.Do(req)
	if err != nil {
		log.Printf("%sCouchDB GET request failed: %v", logError, err)
		return nil, err
	}
	defer res.Body.Close()

	log.Printf("%sCouchDB GET /bookmarks - Status: %d", logDebug, res.StatusCode)

	if res.StatusCode == http.StatusNotFound {
		log.Printf("%sNo bookmarks document in CouchDB, returning empty array", logInfo)
		return []byte("[]"), nil
	}

	if res.StatusCode >= 300 {
		body, _ := io.ReadAll(res.Body)
		log.Printf("%sCouchDB GET failed - Status: %d, Error: %s", logError, res.StatusCode, strings.TrimSpace(string(body)))
		return nil, fmtError(res.Status, body)
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		log.Printf("%sFailed to read CouchDB response: %v", logError, err)
		return nil, err
	}

	var doc struct {
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(body, &doc); err != nil {
		log.Printf("%sFailed to parse CouchDB document: %v", logError, err)
		return nil, err
	}

	log.Printf("%sLoaded %d bytes from CouchDB", logDebug, len(doc.Data))
	return doc.Data, nil
}

func (c *CouchStore) Save(data []byte) error {
	// Get the latest revision before saving
	rev, err := c.getLatestRev()
	if err != nil {
		log.Printf("%sFailed to get latest revision: %v", logError, err)
		return fmt.Errorf("failed to get latest revision: %w", err)
	}

	payload := map[string]interface{}{
		"_id":  "bookmarks",
		"data": json.RawMessage(data),
	}

	if rev != "" {
		payload["_rev"] = rev
	}

	buf, err := json.Marshal(payload)
	if err != nil {
		log.Printf("%sFailed to marshal CouchDB payload: %v", logError, err)
		return err
	}

	req, err := http.NewRequest(
		"PUT",
		c.baseURL+"/"+c.dbName+"/bookmarks",
		bytes.NewReader(buf),
	)
	if err != nil {
		log.Printf("%sFailed to create PUT request: %v", logError, err)
		return err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.client.Do(req)
	if err != nil {
		log.Printf("%sCouchDB PUT request failed: %v", logError, err)
		return err
	}
	defer res.Body.Close()

	log.Printf("%sCouchDB PUT /bookmarks - Status: %d", logDebug, res.StatusCode)

	if res.StatusCode >= 300 {
		body, _ := io.ReadAll(res.Body)
		log.Printf("%sCouchDB PUT failed - Status: %d, Error: %s", logError, res.StatusCode, strings.TrimSpace(string(body)))
		return fmtError(res.Status, body)
	}

	log.Printf("%sSaved %d bytes to CouchDB", logInfo, len(data))
	return nil
}

func (c *CouchStore) ensureDatabase() error {
	req, err := http.NewRequest(
		"PUT",
		c.baseURL+"/"+c.dbName,
		nil,
	)
	if err != nil {
		log.Printf("%sFailed to create database creation request: %v", logError, err)
		return err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)

	res, err := c.client.Do(req)
	if err != nil {
		log.Printf("%sCouchDB database creation request failed: %v", logError, err)
		return err
	}
	defer res.Body.Close()

	log.Printf("%sCouchDB PUT /%s - Status: %d", logDebug, c.dbName, res.StatusCode)

	// 201 = created, 412 = already exists (both are fine)
	if res.StatusCode == http.StatusCreated {
		log.Printf("%sCreated CouchDB database: %s", logInfo, c.dbName)
		return nil
	}
	
	if res.StatusCode == http.StatusPreconditionFailed {
		log.Printf("%sCouchDB database already exists: %s", logInfo, c.dbName)
		return nil
	}
	
	body, _ := io.ReadAll(res.Body)
	log.Printf("%sFailed to create database - Status: %d, Error: %s", logError, res.StatusCode, strings.TrimSpace(string(body)))
	return fmtError(res.Status, body)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}
	if port[0] != ':' {
		port = ":" + port
	}

	var store BookmarkStore

	if os.Getenv("STORE") == "couchdb" {
		couchStore := NewCouchStore(
			os.Getenv("COUCH_URL"),
			os.Getenv("COUCH_USER"),
			os.Getenv("COUCH_PASS"),
			os.Getenv("COUCH_DB"),
		)
		
		log.Printf("%sUsing CouchDB storage", logInfo)
		log.Printf("%sEnsuring database exists...", logInfo)
		if err := couchStore.ensureDatabase(); err != nil {
			log.Fatalf("%sFailed to ensure CouchDB database exists: %v", logError, err)
		}
		
		store = couchStore
	} else {
		store = &JSONStore{path: bookmarksFile}
		log.Printf("%sUsing JSON file storage", logInfo)
		
		// Initialize empty file if it doesn't exist
		if _, err := os.Stat(bookmarksFile); os.IsNotExist(err) {
			if err := os.WriteFile(bookmarksFile, []byte("[]"), 0644); err != nil {
				log.Fatalf("%sFailed to create bookmarks file: %v", logError, err)
			}
			log.Printf("%sCreated new bookmarks file", logInfo)
		}
	}

	srv := startServer(store, port)

	// Wait for interrupt signal
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Printf("%sShutdown signal received, shutting down gracefully...", logInfo)
	
	// Create backup before shutdown
	if os.Getenv("STORE") != "couchdb" {
		backupJSON("lastServerShutdown")
	}

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("%sServer shutdown error: %v", logError, err)
	}
	
	log.Printf("%sServer stopped", logInfo)
}

func startServer(store BookmarkStore, port string) *http.Server {
	mux := http.NewServeMux()

	// Add CORS middleware for local development
	corsMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			next(w, r)
		}
	}

	mux.Handle("/", http.FileServer(http.Dir("./public")))
	mux.HandleFunc("/api/bookmarks", corsMiddleware(bookmarksHandler(store)))
	mux.HandleFunc("/api/health", healthCheckHandler())

	srv := &http.Server{
		Addr:    port,
		Handler: mux,
	}

	go func() {
		log.Printf("%sServer running on http://localhost%s", logInfo, port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("%sServer failed to start: %v", logError, err)
		}
	}()

	return srv
}

func healthCheckHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	}
}

func bookmarksHandler(store BookmarkStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			handleGetBookmarks(store, w, r)
		case "POST", "PUT":
			handleSaveBookmarks(store, w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

func handleGetBookmarks(store BookmarkStore, w http.ResponseWriter, r *http.Request) {
	log.Printf("%sGET /bookmarks", logDebug)
	
	data, err := store.Load()
	if err != nil {
		log.Printf("%sFailed to load bookmarks: %v", logError, err)
		http.Error(w, "Failed to load bookmarks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
	log.Printf("%sGET /bookmarks - Status: 200, Size: %d bytes", logInfo, len(data))
}

func handleSaveBookmarks(store BookmarkStore, w http.ResponseWriter, r *http.Request) {
	log.Printf("%s%s /bookmarks", logDebug, r.Method)
	
	// Limit request body size
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyMB*1024*1024)
	
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("%sFailed to read request body: %v", logError, err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate JSON
	if !json.Valid(body) {
		log.Printf("%sInvalid JSON in request body", logError)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Create backup before save (JSON only)
	if _, ok := store.(*JSONStore); ok {
		backupJSON("beforeSave")
	}

	if err := store.Save(body); err != nil {
		log.Printf("%sFailed to save bookmarks: %v", logError, err)
		http.Error(w, "Failed to save bookmarks", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
	log.Printf("%s%s /bookmarks - Status: 204, Size: %d bytes", logInfo, r.Method, len(body))
}

func backupJSON(label string) {
	if _, err := os.Stat(bookmarksFile); err != nil {
		log.Printf("%sNo bookmarks file to backup", logDebug)
		return
	}

	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		if err := os.MkdirAll(backupDir, 0755); err != nil {
			log.Printf("%sFailed to create backup directory: %v", logError, err)
			return
		}
	}

	timestamp := time.Now().Format("2006-01-02_15-04-05")
	dst := filepath.Join(backupDir, fmt.Sprintf("data-backup-%s-%s.json", label, timestamp))

	data, err := os.ReadFile(bookmarksFile)
	if err != nil {
		log.Printf("%sBackup failed (read): %v", logError, err)
		return
	}

	if err := os.WriteFile(dst, data, 0644); err != nil {
		log.Printf("%sBackup failed (write): %v", logError, err)
		return
	}

	log.Printf("%sBackup created: %s (%d bytes)", logInfo, filepath.Base(dst), len(data))
}

func fmtError(status string, body []byte) error {
	return fmt.Errorf("http error %s: %s", status, string(body))
}
