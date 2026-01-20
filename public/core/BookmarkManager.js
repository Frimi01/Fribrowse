//GitHub (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { notification } from '../ui/NotificationHandler.js';
export class BookmarkManager {
    constructor(api = "/api") {
        this.api = api;
        this.bookmarks = [];
        this.saving = false;
        this.pendingSave = false;
    }

    async getBookmarks() {
        try {
            const res = await fetch(`${this.api}/bookmarks`);
            
            if (!res.ok) {
                console.error("Error loading bookmarks:", res);
                
                let userMessage = "Unable to load bookmarks.";
                let technicalDetails = `Server responded with status ${res.status}`;
                
                if (res.status === 404) {
                    userMessage = "Bookmarks not found. Starting with an empty collection.";
                    technicalDetails = `No bookmarks.json file exists yet. One will be created when you save.\nStatus: ${res.status}`;
                } else if (res.status === 500) {
                    userMessage = "Server error while loading bookmarks.";
                    technicalDetails = `The server encountered an internal error. Check server logs.\nStatus: ${res.status}`;
                } else if (res.status === 0 || res.status >= 502) {
                    userMessage = "Cannot connect to bookmark server.";
                    technicalDetails = `Server may be down or unreachable. Check if the server is running.\nStatus: ${res.status}`;
                }
                
                notification(userMessage, technicalDetails, true, true);
                this.bookmarks = [];
                return [];
            }
            
            this.bookmarks = await res.json();
            return this.bookmarks;
            
        } catch (err) {
            console.error("Error loading bookmarks:", err);
            
            // Network/connection errors
            let userMessage = "Cannot connect to bookmark server.";
            let technicalDetails = err.message;
            notification(userMessage, technicalDetails, true, true);

            this.bookmarks = [];
            return [];
        }
    }

    async saveBookmarksToServer() {
        if (this.saving) {
            this.pendingSave = true;
            return;
        }

        this.saving = true;

		while(true) {
			try {
				const res = await fetch(`${this.api}/bookmarks`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(this.bookmarks),
				});
				
				if (!res.ok) {
					console.error("Failed to save bookmarks:", res);
					
					const retry = confirm(
						"Saving request failed. Do you wish to retry?\n\n" +
						"Make sure the server is up, or press Cancel to review the error details before trying again.\n" +
						"You can continue to make changes, but remember to export any unsynced changes if you choose to cancel."
					);
					if (!retry) { 
						let userMessage = "Failed to save bookmarks.";
						let technicalDetails = `Server responded with status ${res.status}`;
						
						if (res.status === 500) {
							technicalDetails = `Server error while saving. Changes may not be persisted. Check server logs.\nStatus: ${res.status}`;
						} else if (res.status === 400) {
							userMessage = "Invalid bookmark data.";
							technicalDetails = `Server rejected the bookmark data.\nStatus: ${res.status}`;
						} else if (res.status === 0 || res.status >= 502) {
							userMessage = "Cannot connect to bookmark server.";
							technicalDetails = `Server is unreachable. Changes will be lost if you close this page.\nStatus: ${res.status}`;
						}

						notification(userMessage, technicalDetails, true, true);
						break; 
					} 
					continue;

				} else {
					console.log("Bookmarks saved successfully!")
					break;
				}
				
			} catch (err) {
				console.error("Failed to save bookmarks:", err);
				
				const retry = confirm(
					"Saving request failed. Do you wish to retry?\n\n" +
					"Make sure the server is up, or press Cancel to review the error details before trying again.\n" +
					"You can continue to make changes, but remember to export any unsynced changes if you choose to cancel."
				);
				
				if (!retry) { 
					let userMessage = "Cannot save bookmarks.";
					let technicalDetails = "Server connection failed. Changes will be lost if you close this page.";

					notification(userMessage, technicalDetails, true, true);
					break; 
				} 
				continue;
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
