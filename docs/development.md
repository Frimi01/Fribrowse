The below is a simple docker-compsose.yaml made to easily drop in, test, and develop with. 
THIS SETUP IS NOT INTENDED FOR PRODUCTION USE.

```yaml
# YOU CAN EDIT THE CONFIGURATION BELOW BY CHANGING OR REMOVING VARIABLES
# ALWAYS TAKE A BACKUP OF ANY EXISTING BOOKMARKS BEFORE CHANGING CONFIGURATION

# This file configures both the application and datase for use with docker compose.

services:
  app:
    image: golang
    container_name: fribrowse-go-server
    working_dir: /app
    volumes:
      - .:/app
    command: go run server.go
    ports:
      - "3002:3002"
    environment:
      # Storage mode:
      # - couchdb
      # - json (stores bookmarks in a local JSON file, no database required)
      STORE: couchdb

      # CouchDB connection settings
      # These are ignored if STORE is set to "json"
      COUCH_URL: http://couchdb:5984
      COUCH_USER: admin
      COUCH_PASS: admin
      COUCH_DB: fribrowsedb
    depends_on:
      couchdb:
        condition: service_healthy

  couchdb:
    image: couchdb:latest
    container_name: bookmarks-couchdb
    restart: unless-stopped
    ports:
      - "5984:5984"
    environment:
      COUCHDB_USER: admin
      COUCHDB_PASSWORD: admin
    volumes:
      - couchdb-data:/opt/couchdb/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5984/_up"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: Initializes CouchDB internal system databases
  # Safe to remove after the first successful startup
  couchdb-init:
    image: curlimages/curl:latest
    container_name: bookmarks-couchdb-init
    depends_on:
      couchdb:
        condition: service_healthy
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        echo "Creating CouchDB system databases..."
        curl -X PUT http://admin:admin@couchdb:5984/_users
        curl -X PUT http://admin:admin@couchdb:5984/_replicator
        curl -X PUT http://admin:admin@couchdb:5984/_global_changes
        echo "System databases created!"
    restart: "no"



#################Volumes#####################################
volumes:
  couchdb-data:
```