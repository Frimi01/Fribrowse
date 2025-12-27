//GitHub (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { app } from "../main.js";

export function handleDragStart(event, type, folderPath, bookmarkIndex = null) {
    event.dataTransfer.setData("type", type);
    event.dataTransfer.setData("folderPath", JSON.stringify(folderPath));
    if (bookmarkIndex !== null) {
        event.dataTransfer.setData("bookmarkIndex", bookmarkIndex);
    }
}

export function handleDragOver(event) {
    event.preventDefault();
}

export function handleDrop(event, targetPath) {
    event.preventDefault();

    const type = event.dataTransfer.getData("type");
    const sourcePath = JSON.parse(event.dataTransfer.getData("folderPath"));

    if (type === "folder") {
        if (app.manager.moveFolder(sourcePath, targetPath)) {
            app.saveAndRender();
        }
    } else if (type === "bookmark") {
        const bookmarkIndex = event.dataTransfer.getData("bookmarkIndex");
        if (app.manager.moveBookmark(sourcePath, bookmarkIndex, targetPath)) {
            app.saveAndRender();
        }

    }
}
