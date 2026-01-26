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
    image: ghcr.io/frimi01/fribrowse:latest 
  ports: 
    - "3002:3002" 
  volumes: 
    - ./data:/app/data 
  environment: 
    - STORE=json 
```

#### For use with CouchDB
```yaml
# docker-compose.yaml
services:
  fribrowse:
    image: ghcr.io/frimi01/fribrowse:latest
    container_name: fribrowse-go-server
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      STORE: couchdb
      COUCH_URL: http://couchdb:5984 # If couchdb is hosted on a different device you need to change this url, otherwise keep this.
      COUCH_USER: Username # CHANGE
      COUCH_PASS: StrongPassword # CHANGE
      COUCH_DB: fribrowse # Can be changed
```

## Documentation

Environment variables. If none are set, the API will fall back on JSON.

| Variable    | Description     | Example                         |
| ----------- | --------------- | ------------------------------- |
| STORE       | Storage backend | `json` or `couchdb`             |
| COUCH_URL   | CouchDB URL     | `http://database/url/here:5984` |
| COUCH_USER: | Username        | `admin`                         |
| COUCH_PASS: | Password        | `StrongPassword`                |
| COUCH_DB:   | Database name   | `fribrowse`                     |

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
