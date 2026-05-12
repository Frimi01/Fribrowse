package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// TestGetBookmarks_FileNotFound verifies that GET /api/bookmarks returns 404
// when the bookmarks.json file does not exist.
func TestGetBookmarks_FileNotFound(t *testing.T) {
	store := &JSONStore{path: filepath.Join(t.TempDir(), "bookmarks.json")}

	req := httptest.NewRequest("GET", "/api/bookmarks", nil)
	rr := httptest.NewRecorder()

	handleGetBookmarks(store, rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", rr.Code)
	}
}

// TestGetBookmarks_FileExists verifies that GET /api/bookmarks returns 200
// with the file contents when the bookmarks.json file exists.
func TestGetBookmarks_FileExists(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "bookmarks.json")

	content := `{"version":1,"revision":1,"data":[]}`
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	store := &JSONStore{path: path}

	req := httptest.NewRequest("GET", "/api/bookmarks", nil)
	rr := httptest.NewRecorder()

	handleGetBookmarks(store, rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}

	body := strings.TrimSpace(rr.Body.String())
	if body != content {
		t.Errorf("expected body %q, got %q", content, body)
	}

	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}
}

// TestJSONStore_Load_FileNotFound verifies that JSONStore.Load returns an
// os.ErrNotExist-wrapped error (not a nil error with an empty array) when the
// backing file is absent.
func TestJSONStore_Load_FileNotFound(t *testing.T) {
	store := &JSONStore{path: filepath.Join(t.TempDir(), "missing.json")}

	data, err := store.Load()
	if err == nil {
		t.Fatalf("expected an error for missing file, got nil (data=%q)", data)
	}
	if !os.IsNotExist(err) {
		t.Errorf("expected os.IsNotExist error, got: %v", err)
	}
	if data != nil {
		t.Errorf("expected nil data for missing file, got %q", data)
	}
}

// TestJSONStore_Load_FileExists verifies that JSONStore.Load returns the file
// contents when the file is present.
func TestJSONStore_Load_FileExists(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "bookmarks.json")

	content := `[{"name":"test"}]`
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	store := &JSONStore{path: path}

	data, err := store.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if string(data) != content {
		t.Errorf("expected %q, got %q", content, string(data))
	}
}

func TestLogoutHandler_MethodNotAllowed(t *testing.T) {
	t.Setenv("FRIBROWSE_PASSWORD", "token")

	req := httptest.NewRequest(http.MethodGet, "/api/logout", nil)
	rr := httptest.NewRecorder()

	logoutHandler().ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func TestLoginAndLogoutFlow(t *testing.T) {
	t.Setenv("FRIBROWSE_PASSWORD", "token")

	sessionsMu.Lock()
	sessions = map[string]session{}
	sessionsMu.Unlock()

	loginReq := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(`{"password":"token"}`))
	loginRR := httptest.NewRecorder()
	loginHandler().ServeHTTP(loginRR, loginReq)

	if loginRR.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, loginRR.Code)
	}

	loginResp := loginRR.Result()
	loginCookie := loginResp.Cookies()[0]
	if loginCookie.Name != "session" || loginCookie.Value == "" {
		t.Fatalf("expected non-empty session cookie, got %q=%q", loginCookie.Name, loginCookie.Value)
	}

	sessionsMu.RLock()
	_, ok := sessions[loginCookie.Value]
	sessionsMu.RUnlock()
	if !ok {
		t.Fatalf("expected session to be stored after login")
	}

	logoutReq := httptest.NewRequest(http.MethodPost, "/api/logout", nil)
	logoutReq.AddCookie(loginCookie)
	logoutRR := httptest.NewRecorder()
	logoutHandler().ServeHTTP(logoutRR, logoutReq)

	if logoutRR.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, logoutRR.Code)
	}

	sessionsMu.RLock()
	_, ok = sessions[loginCookie.Value]
	sessionsMu.RUnlock()
	if ok {
		t.Fatalf("expected session to be deleted after logout")
	}
}

func TestAuthMiddleware_UnauthorizedWithExpiredSession(t *testing.T) {
	t.Setenv("FRIBROWSE_PASSWORD", "token")

	sessionID := "expired-session"
	sessionsMu.Lock()
	sessions = map[string]session{
		sessionID: {expires: time.Now().Add(-time.Hour)},
	}
	sessionsMu.Unlock()

	req := httptest.NewRequest(http.MethodGet, "/api/bookmarks", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: sessionID})
	rr := httptest.NewRecorder()

	authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}).ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}
}
