//GitHub (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { app } from '../main.js';

export function exportBookmarks() {
    const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify({
            version: app.manager.version,
            data: app.manager.bookmarks
        }));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "bookmarks.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

export function importBookmarks(event) {
    if (confirm("Importing bookmarks will overwrite your current bookmarks. \n" +
        "It is recommended that you cancel and export your bookmarks first. \n" +
        "Do you still wish to continue?")){
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                await app.manager.loadBookmarks(jsonData)
                await app.saveAndRender();
            } catch (err) {
                return console.error("Failed to import bookmarks:", err);
            }
        };
        reader.readAsText(file);
    }
}

export async function addRootFolder() {
    const name = prompt("Enter folder name:");
    if (name) {
        app.manager.addFolder(name);
        await app.saveAndRender();
    }
}
