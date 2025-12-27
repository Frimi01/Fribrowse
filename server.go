package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
)

const (
	port          = ":3002"
	bookmarksFile = "./bookmarks.json"
	backupDir     = "./backups"
)

var stopChan = make(chan os.Signal, 1)

func main() {
	go startServer()

	signal.Notify(stopChan, os.Interrupt)
	<-stopChan
	log.Println("Shutting down...")
	backupJSON("lastServerShutdown")
}

func startServer() {
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir("./public/bookmarks")))
	mux.HandleFunc("/get-bookmarks", getBookmarksHandler)
	mux.HandleFunc("/save-json", saveJSONHandler)

	log.Println("Server running on http://localhost" + port)

	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func getBookmarksHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request to send bookmarks")
	data, err := os.ReadFile(bookmarksFile)
	if err != nil {
		http.Error(w, "Failed to read bookmarks", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
	backupJSON("lastInitialized")
}

func saveJSONHandler(w http.ResponseWriter, r *http.Request) {
	file, err := os.Create(bookmarksFile)
	if err != nil {
		http.Error(w, "Error opening file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	_, err = io.Copy(file, r.Body)
	if err != nil {
		http.Error(w, "Error saving JSON", http.StatusInternalServerError)
		return
	}

	log.Println("Bookmarks saved successfully")
	w.Write([]byte(`{"message": "Bookmarks saved successfully!"}`))
}

func backupJSON(label string) {
	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		os.MkdirAll(backupDir, 0755)
	}
	backupFile := filepath.Join(backupDir, "data-backup-"+label+".json")
	err := copyFile(bookmarksFile, backupFile)
	if err != nil {
		log.Println("Backup failed:", err)
	} else {
		log.Println("Backup created at", backupFile)
	}
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		log.Println("Failed to open browser:", err)
	}
}
