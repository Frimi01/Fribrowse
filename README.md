# 🌐 FriBrowse

FriBrowse is a minimalistic, customizable hub for organizing bookmarks, searching the internet, and streamlining research workflows.

*How it looks in chrome*
![2025-05-13 06_48_38-](https://github.com/user-attachments/assets/56577f1b-ee53-436a-858b-71c1d72b3c44)
*Right click for context menus*
![2025-05-13 06_51_47-🔍FriBrowse](https://github.com/user-attachments/assets/31aa2bea-8c97-4561-9842-0d4f2c06ea74)

## ⚠ Notice:
Before any and all migrations, as well as periodically, it can be smart to export your bookmarks. The app has been tested for various situations but I cannot currently give a 100% guarantee that there are no bugs.

The mobile interface is unfinished. You can still use your existing bookmarks but the context menu isn't functional.

## 🏗️ Download and Build Instructions
If any release is outdated, you can open an issue requesting an updated build or compile it yourself.

### Windows and Linux (No Docker Required):
1. Download the latest release from [Releases](https://github.com/Frimi01/Fribrowse/releases/) 
2. Unzip and run the executable 
3. Open http://localhost:3002 in your browser

### Docker:
#### For use with JSON
```yaml 
# docker-compose.yaml 
services: 
  fribrowse: 
    image: frimi01/fribrowse:latest 
  ports: 
    - "3002:3002" # Maps container ports to host ports, remove if you only need to access ports on docker network.
  volumes: 
    - ./data:/app/data 
  environment: 
    - STORE=json 
    # Optional: password-protect the bookmarks API
    - FRIBROWSE_PASSWORD=StrongPassword # CHANGE or remove to disable auth
    - FRIBROWSE_SECURE_COOKIE=false # Set to true if using HTTPS
    - FRIBROWSE_ORIGIN=http://localhost:3002 # Restrict CORS to this origin
```

#### For use with CouchDB
```yaml
# docker-compose.yaml
services:
  fribrowse:
    image: frimi01/fribrowse:latest
    container_name: fribrowse-go-server
    restart: unless-stopped
    ports:
      - "3002:3002" # Maps container ports to host ports, remove if you only need to access ports on docker network.
    environment:
      STORE: couchdb
      COUCH_URL: http://couchdb:5984 # If couchdb is hosted on a different device you need to change this url, otherwise keep this.
      COUCH_USER: Username # CHANGE
      COUCH_PASS: StrongPassword # CHANGE
      COUCH_DB: fribrowse # Can be changed
      # Optional: password-protect the bookmarks API
      FRIBROWSE_PASSWORD: StrongPassword # CHANGE or remove to disable auth
      FRIBROWSE_SECURE_COOKIE: "false" # Set to "true" if using HTTPS
      FRIBROWSE_ORIGIN: http://localhost:3002 # Restrict CORS to this origin
```

## Documentation

Environment variables. If none are set, the API will fall back on JSON.

| Variable                | Description                                                                  | Example                         |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| STORE                   | Storage backend                                                              | `json` or `couchdb`             |
| COUCH_URL               | CouchDB URL                                                                  | `http://database/url/here:5984` |
| COUCH_USER              | Username                                                                     | `admin`                         |
| COUCH_PASS              | Password                                                                     | `StrongPassword`                |
| COUCH_DB                | Database name                                                                | `fribrowse`                     |
| PORT                    | HTTP port the server listens on. Defaults to `3002`.                         | `3002`                          |
| FRIBROWSE_PASSWORD      | Shared identity token to protect the bookmarks API. When set, a valid session is required.| `StrongToken`                   |
| FRIBROWSE_SECURE_COOKIE | Set to `true` when serving over HTTPS to mark the session cookie as Secure.  | `true`                          |
| FRIBROWSE_ORIGIN        | Allowed CORS origin for cross-origin access with credentials.                | `http://localhost:3002`         |

### API Endpoints

Authentication endpoints are only active when `FRIBROWSE_PASSWORD` is set.

| Method | Endpoint      | Description                                                                 |
| ------ | ------------- | --------------------------------------------------------------------------- |
| POST   | `/api/login`  | Authenticate with `{"password": "..."}` using the configured shared token. Sets a session cookie on success. |
| POST   | `/api/logout` | Invalidate the current session cookie.                                      |

[Development Setup](development.md)

## ⚡ How to use:

- Add folders for organizing bookmarks.
- Right-click folders/bookmarks for options.
- To add a bookmark, click add bookmark under folder, input name and paste URL in the prompts.
- Drag and drop to rearrange.
- If you are updating or want store, use or recover bookmarks your bookmarks, use the import/export buttons. 

## ❓ Questions and Answers

**1. What happened to the searching feature?**

It's still available in the FribrowseV1.0 branch and may be included in future releases. While the focus of this project has shifted from purely research and note-taking to focus on better received more general-purpose features, the search bar was a useful workflow tool. That version will remain accessible and may continue to receive updates.

**2. What is this project about?**

This project is designed to create a minimalistic yet practical and customizable browsing experience. So far mostly in how you interact with bookmarks. It's designed for users who want a safe, and focuses to remain a portable way to organize and access research materials.

**3. How can I contribute?**

Feel free to open an issue or submit a pull request! I'm happy to consider improvements, bug fixes, or suggestions.

**4. I found a bug. What should I do?**

Please open an issue describing the problem. Include any relevant details if possible:
- Description of bug and intended behavior.
- Error messages (try to run the server from a console if possible)
- Screenshots
- Steps to reproduce the bug.

**5. How do i change the background image?**

Replace the image in the public/bookmark folder with the one you want. The image name needs to be exactly the same as the old one! 
