# Configuration:

This section explains the different ways you can run Fribrowse,
depending on how and where you want your bookmarks to be stored.

You do **not** need to understand Docker or Go to use this — just
follow the option that matches what you want to do.


## Scenario: I want my files to be saved on my local computer:

### Option 1: docker-compose

1. Change `STORE: couchdb` with `STORE: json`.
3. Delete **both** `couchdb` and `couchdb-init` sections
3. Run docker-compose with docker or podman. (You can look online on how to do
this)


### Option 2: Run or compile the Go server manually

1. Clone the repository into the folder where you want the application
2. Use Go to either:
   - Run `server.go` directly, or
   - Compile it into an executable

This will store bookmarks as a local JSON file.

### Option 3: Download a preconfigured release (if available)

1. Go to the repository’s **GitHub Releases** page
2. Choose the version you want  
   (newer versions usually include new features)
3. Download and unzip the release file
4. Run the included executable

---

## Scenario: I want to run couchdb on another server.

Option 1: docker-compose //TODO
Option 2: Command line //TODO
Option 3: Compiled app properties //TODO

---

## Scenario: I want to run without using docker.

Option 1: Command line //TODO
Option 2: Compiled app properties //TODO
