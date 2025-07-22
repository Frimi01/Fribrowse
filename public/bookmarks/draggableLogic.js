//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { getFolderByPath, saveAndRender } from "./utils.js";

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
        moveFolder(sourcePath, targetPath);
    } else if (type === "bookmark") {
        const bookmarkIndex = event.dataTransfer.getData("bookmarkIndex");
        moveBookmark(sourcePath, bookmarkIndex, targetPath);
    }
}

export function moveFolder(sourcePath, targetPath) {
    if (targetPath.join(",").startsWith(sourcePath.join(","))) {
        console.error("Error: Cannot move a folder into itself or its subfolders.");
        return;
    }

    let sourceFolder = getFolderByPath(sourcePath);
    if (!sourceFolder) return;

    let targetFolder = getFolderByPath(targetPath);
    if (!targetFolder || !targetFolder.folders) return;

    let index = sourcePath[sourcePath.length - 1];
    getFolderByPath(sourcePath.slice(0, -1)).folders.splice(index, 1);

    targetFolder.folders.push(sourceFolder);
    saveAndRender();
}

export function moveBookmark(
    sourceFolderPath,
    bookmarkIndex,
    targetFolderPath,
) {
    let sourceFolder = getFolderByPath(sourceFolderPath);
    if (!sourceFolder || !sourceFolder.bookmarks) return;

    let bookmark = sourceFolder.bookmarks.splice(bookmarkIndex, 1)[0];

    let targetFolder = getFolderByPath(targetFolderPath);
    if (!targetFolder || !targetFolder.bookmarks) return;

    targetFolder.bookmarks.push(bookmark);
    saveAndRender();
}
