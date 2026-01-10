//GitHub (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
export class BookmarkManager {
// Saving - false, pendingsave - false, bookmarks [], api key?
    constructor(api = "/api") {
        this.api = api;
        this.bookmarks = [];
        this.saving = false;
        this.pendingSave = false;
    }
    async couchFetch(path, options = {}) {
        const auth = btoa(`${this.username}:${this.password}`);
        const url = `${this.serveruri}/${path}`;
        return fetch(url, {
            ...options,
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });
    }

    // Load all bookmarks (just one document)
    async getBookmarks() {
        try {
            const res = await fetch(`${this.api}/bookmarks`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.bookmarks = await res.json();
            return this.bookmarks;
        } catch (err) {
            console.error("Error loading bookmarks:", err);
            this.bookmarks = [];
            return [];
        }
    }

    // Save bookmarks (overwrite the single document)
    async saveBookmarksToServer() {
        if (this.saving) {
            this.pendingSave = true;
            return;
        }
        this.saving = true;

        try {
            const res = await fetch(`${this.api}/bookmarks`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.bookmarks),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            console.error("Failed to save bookmarks:", err);
            alert("Failed to save bookmarks.");
        }

        this.saving = false;
        if (this.pendingSave) {
            this.pendingSave = false;
            await this.saveBookmarksToServer();
        }
    }

        this.saving = false;
        if (this.pendingSave) {
            this.pendingSave = false;
            await this.saveBookmarksToServer();
        }
    }

    // Bookmark Manipulation

    getFolderByPath(folderPath) {
        let folder = { folders: this.bookmarks };
        for (let index of folderPath) {
            if (!folder.folders || !folder.folders[index]) {
                return null;
            }
            folder = folder.folders[index];
        }
        return folder;
    }

    sort() {
        this.bookmarks.sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        );
        this.bookmarks.forEach((folder) => this.sortSubfoldersAndBookmarks(folder));
    }

    sortSubfoldersAndBookmarks(node) {
        if (node.bookmarks) {
            node.bookmarks.sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
            );
        }

        if (node.folders) {
            node.folders.sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
            );

            node.folders.forEach((childFolder) => {
                this.sortSubfoldersAndBookmarks(childFolder);
            });
        }
    }

    toggleFolder(folderPath) {
        const folder = this.getFolderByPath(folderPath);
        if (!folder) return console.error("Folder not found:", folderPath);
        folder.open = !folder.open;
    }

    addFolder(name, parentPath = null) {
        if (!name) {
            console.error("Error making folder: No name parameter.");
            return;
        }

        const newFolder = {
            name,
            folders: [],
            bookmarks: [],
            open: false,
        };

        if (parentPath === null) {
            this.bookmarks.push(newFolder);
        } else {
            const parent = this.getFolderByPath(parentPath);
            if (parent) parent.folders.push(newFolder);
        }
    }

    deleteFolder(folderPath) {
        let parentPath = [...folderPath];
        let folderIndex = parentPath.pop();
        let parentFolder = this.getFolderByPath(parentPath);

        if (parentFolder) {
            parentFolder.folders.splice(folderIndex, 1);
        } else {
            this.bookmarks.splice(folderIndex, 1);
        }
    }

    renameFolder(folderPath, newName) {
        let folder = this.getFolderByPath(folderPath);
        if (!folder) return console.error("Error: Folder not found.");
        if (!newName) {
            return console.error("Error: New name parameter not found.");
        }
        folder.name = newName;
    }

    addBookmark(folderPath, name, url) {
        if (!name || !url) {
            return console.error("Error: Lacking required parameters.");
        }

        const targetFolder = this.getFolderByPath(folderPath);
        if (!targetFolder || !targetFolder.bookmarks) {
            return console.error("Error: Could not find target folder!");
        }

        targetFolder.bookmarks.push({ name, url });
    }

    updateBookmark(folderPath, bookmarkIndex, property, value) {
        const folder = this.getFolderByPath(folderPath);
        if (!folder || !folder.bookmarks[bookmarkIndex]) {
            return console.error("Error: Bookmark not found.");
        }
        if (value !== null && value !== "") {
            folder.bookmarks[bookmarkIndex][property] = value;
        }
    }

    deleteBookmark(folderPath, bookmarkIndex) {
        const folder = this.getFolderByPath(folderPath);
        if (!folder || !folder.bookmarks[bookmarkIndex])
            return console.error("Error: Bookmark not found.");

        folder.bookmarks.splice(bookmarkIndex, 1);
    }

    //dragging
    moveFolder(sourcePath, targetPath) {
        if (targetPath.join(",").startsWith(sourcePath.join(","))) {
            console.error(
                "Error: Cannot move a folder into itself or its subfolders.",
            );
            return false;
        }

        let sourceFolder = this.getFolderByPath(sourcePath);
        if (!sourceFolder) return false;

        let targetFolder = this.getFolderByPath(targetPath);
        if (!targetFolder || !targetFolder.folders) return false;

        let index = sourcePath[sourcePath.length - 1];
        this.getFolderByPath(sourcePath.slice(0, -1)).folders.splice(index, 1);

        targetFolder.folders.push(sourceFolder);
        return true;
    }

    moveBookmark(sourceFolderPath, bookmarkIndex, targetFolderPath) {
        let sourceFolder = this.getFolderByPath(sourceFolderPath);
        if (!sourceFolder || !sourceFolder.bookmarks) return false;
        let targetFolder = this.getFolderByPath(targetFolderPath);
        if (!targetFolder || !targetFolder.bookmarks) return false;

        let bookmark = sourceFolder.bookmarks.splice(bookmarkIndex, 1)[0];

        targetFolder.bookmarks.push(bookmark);
        return true;
    }
}
