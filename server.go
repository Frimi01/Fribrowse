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
	"time"
)

const (
	defaultPort       = "3002"
	bookmarksFile     = "./bookmarks.json"
	backupDir         = "./backups"
	maxRequestBodyMB  = 10
	shutdownTimeout   = 5 * time.Second
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
		return []byte("[]"), nil
	}
	return data, err
}

func (s *JSONStore) Save(data []byte) error {
	return os.WriteFile(s.path, data, 0644)
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
		return "", err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)

	res, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		return "", nil
	}

	etag := res.Header.Get("ETag")
	if etag == "" {
		return "", nil
	}

	// Remove quotes from ETag
	return etag[1 : len(etag)-1], nil
}

func (c *CouchStore) Load() ([]byte, error) {
	req, err := http.NewRequest(
		"GET",
		c.baseURL+"/"+c.dbName+"/bookmarks",
		nil,
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)

	res, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		return []byte("[]"), nil
	}

	if res.StatusCode >= 300 {
		body, _ := io.ReadAll(res.Body)
		return nil, fmtError(res.Status, body)
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	var doc struct {
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(body, &doc); err != nil {
		return nil, err
	}

	return doc.Data, nil
}

func (c *CouchStore) Save(data []byte) error {
	// Get the latest revision before saving
	rev, err := c.getLatestRev()
	if err != nil {
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
		return err
	}

	req, err := http.NewRequest(
		"PUT",
		c.baseURL+"/"+c.dbName+"/bookmarks",
		bytes.NewReader(buf),
	)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		body, _ := io.ReadAll(res.Body)
		return fmtError(res.Status, body)
	}

	return nil
}

func (c *CouchStore) ensureDatabase() error {
	req, err := http.NewRequest(
		"PUT",
		c.baseURL+"/"+c.dbName,
		nil,
	)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Basic "+c.auth)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	// 201 = created, 412 = already exists (both are fine)
	if res.StatusCode != http.StatusCreated && res.StatusCode != http.StatusPreconditionFailed {
		body, _ := io.ReadAll(res.Body)
		return fmtError(res.Status, body)
	}

	return nil
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
		
		log.Println("Using CouchDB storage")
		log.Println("Ensuring database exists...")
		if err := couchStore.ensureDatabase(); err != nil {
			log.Fatalf("Failed to ensure CouchDB database exists: %v", err)
		}
		
		store = couchStore
	} else {
		store = &JSONStore{path: bookmarksFile}
		log.Println("Using JSON file storage")
		
		// Initialize empty file if it doesn't exist
		if _, err := os.Stat(bookmarksFile); os.IsNotExist(err) {
			if err := os.WriteFile(bookmarksFile, []byte("[]"), 0644); err != nil {
				log.Fatalf("Failed to create bookmarks file: %v", err)
			}
		}
	}

	srv := startServer(store, port)

	// Wait for interrupt signal
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	log.Println("Shutting down gracefully...")
	
	// Create backup before shutdown
	if os.Getenv("STORE") != "couchdb" {
		backupJSON("lastServerShutdown")
	}

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	
	log.Println("Server stopped")
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
	mux.HandleFunc("/health", healthCheckHandler())

	srv := &http.Server{
		Addr:    port,
		Handler: mux,
	}

	go func() {
		log.Printf("Server running on http://localhost%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
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
	data, err := store.Load()
	if err != nil {
		log.Printf("Error loading bookmarks: %v", err)
		http.Error(w, "Failed to load bookmarks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func handleSaveBookmarks(store BookmarkStore, w http.ResponseWriter, r *http.Request) {
	// Limit request body size
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyMB*1024*1024)
	
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate JSON
	if !json.Valid(body) {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Create backup before save (JSON only)
	if _, ok := store.(*JSONStore); ok {
		backupJSON("beforeSave")
	}

	if err := store.Save(body); err != nil {
		log.Printf("Error saving bookmarks: %v", err)
		http.Error(w, "Failed to save bookmarks", http.StatusInternalServerError)
		return
	}

	log.Println("Bookmarks saved successfully")
	w.WriteHeader(http.StatusNoContent)
}

func backupJSON(label string) {
	if _, err := os.Stat(bookmarksFile); err != nil {
		return
	}

	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		_ = os.MkdirAll(backupDir, 0755)
	}

	timestamp := time.Now().Format("2006-01-02_15-04-05")
	dst := filepath.Join(backupDir, fmt.Sprintf("data-backup-%s-%s.json", label, timestamp))

	data, err := os.ReadFile(bookmarksFile)
	if err != nil {
		log.Printf("Backup failed (read): %v", err)
		return
	}

	if err := os.WriteFile(dst, data, 0644); err != nil {
		log.Printf("Backup failed (write): %v", err)
		return
	}

	log.Printf("Backup created: %s", dst)
}

func fmtError(status string, body []byte) error {
	return fmt.Errorf("http error %s: %s", status, string(body))
}
