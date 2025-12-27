//GitHub (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { app } from '../main.js';

const menu = document.getElementById("contextMenu");

export function showContextMenu(event, type, folderPath, bookmarkIndex = null) {
    event.preventDefault();

    const actions = {
        folder: [
            { label: "Rename Folder", action: () => renameFolder(folderPath) },
            { label: "Delete Folder", action: () => deleteFolder(folderPath) },
            { label: "Add Folder", action: () => addSubFolder(folderPath) },
            { label: "Add Bookmark", action: () => addBookmark(folderPath) },
        ],
        bookmark: [
            {
                label: "Rename Bookmark",
                action: () => renameBookmark(folderPath, bookmarkIndex),
            },
            {
                label: "Edit URL",
                action: () => editBookmarkUrl(folderPath, bookmarkIndex),
            },
            {
                label: "Delete Bookmark",
                action: () => deleteBookmark(folderPath, bookmarkIndex),
            },
        ],
    };

    menu.innerHTML = "";
    actions[type]?.forEach(({ label, action }) => {
        const button = document.createElement("button");
        button.textContent = label;
        button.onclick = action;
        menu.appendChild(button);
    });

    menu.style.display = "block";
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
}

document.addEventListener("click", () => {
    document.getElementById("contextMenu").style.display = "none";
});

function addSubFolder(folderPath) {
    const name = prompt("Enter folder name:");
    if (!name) return;
    app.manager.addFolder(name, folderPath)
    app.saveAndRender();
}

function renameFolder(folderPath) {
    const folder = app.manager.getFolderByPath(folderPath);
    if (!folder) return console.error("Error: Folder not found.");
    const name = prompt("Enter new folder name:", folder.name);
    if (name) {
        app.manager.renameFolder(folderPath, name);
        app.saveAndRender();
    }
}

function addBookmark(folderPath) {
    const name = prompt("Enter bookmark name:");
    const url = prompt("Enter bookmark URL:");
    if (!name || !url) return;
    app.manager.addBookmark(folderPath, name, url);
    app.saveAndRender();
}

function renameBookmark(folderPath, bookmarkIndex) {
    const folder = app.manager.getFolderByPath(folderPath);
    if (!folder || !folder.bookmarks[bookmarkIndex]) return console.error("Error: Bookmark not found.");
    const newValue = prompt("Enter new bookmark name:", folder.bookmarks[bookmarkIndex].name);
    if (newValue) {
        app.manager.updateBookmark(folderPath, bookmarkIndex, "name", newValue);
        app.saveAndRender();
    }
}

function editBookmarkUrl(folderPath, bookmarkIndex) {
    const folder = app.manager.getFolderByPath(folderPath);
    if (!folder || !folder.bookmarks[bookmarkIndex]) return console.error("Error: Bookmark not found.");
    const newValue = prompt("Enter new bookmark URL:", folder.bookmarks[bookmarkIndex].url);
    if (newValue) {
        app.manager.updateBookmark(folderPath, bookmarkIndex, "url", newValue);
        app.saveAndRender();
    }
}

function deleteFolder(folderPath) {
    if (!confirm("Are you sure you want to delete this folder?")) return;
    app.manager.deleteFolder(folderPath);
    app.saveAndRender();
}

function deleteBookmark(folderPath, bookmarkIndex) {
    if (!confirm("Are you sure you want to delete this bookmark?")) return;
    app.manager.deleteBookmark(folderPath, bookmarkIndex);
    app.saveAndRender();
}
