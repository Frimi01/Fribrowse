//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { app } from '../main.js';

export function exportBookmarks() {
    const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(app.manager.bookmarks));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "bookmarks.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

export function importBookmarks(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            app.manager.bookmarks = JSON.parse(e.target.result);
            app.saveAndRender();
        } catch (err) {
            return console.error("Failed toimport bookmarks:", err);
        }
    };
    reader.readAsText(file);
}

export function addRootFolder() {
    const name = prompt("Enter folder name:");
    if (name) {
        app.manager.addFolder(name);
        app.saveAndRender();
    }
}
