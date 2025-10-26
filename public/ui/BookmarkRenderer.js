//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { handleDragStart, handleDragOver, handleDrop } from "./DragHandler.js";
import { showContextMenu } from "./ContextMenu.js";

export class BookmarkRenderer {
    constructor(containerElement, manager) {
        this.container = containerElement;
        this.manager = manager;
    }

    render() {
        this.container.innerHTML = "";
        this.manager.bookmarks.forEach((folder, index) => {
            this.renderFolder(folder, [index], this.container);
        });
    }

    renderFolder(folder, folderPath, parentElement) {
        const folderElement = this.createFolderElement(folder, folderPath);
        const folderContent = document.createElement("ul");
        folderContent.className = "folder-content";
        folderContent.style.display = folder.open ? "block" : "none";

        folder.folders?.forEach((subFolder, fIndex) => {
            this.renderFolder(
                subFolder,
                [...folderPath, fIndex],
                folderContent,
            );
        });

        folder.bookmarks?.forEach((bookmark, bIndex) => {
            const bookmarkEl = this.createBookmarkElement(
                bookmark,
                folderPath,
                bIndex,
            );
            folderContent.appendChild(bookmarkEl);
        });

        folderElement.appendChild(folderContent);
        parentElement.appendChild(folderElement);
    }

    createFolderElement(folder, folderPath) {
        const folderElement = document.createElement("li");
        const folderName = document.createElement("span");

        folderName.classList.add("folder");
        folderName.textContent = `📁 ${folder.name}`;

        folderName.onclick = () => {
            this.manager.toggleFolder(folderPath);
            this.render();
        };

        folderName.oncontextmenu = (event) =>
            showContextMenu(event, "folder", folderPath);

        folderName.draggable = true;
        folderName.ondragstart = (event) =>
            handleDragStart(event, "folder", folderPath);
        folderName.ondragover = handleDragOver;
        folderName.ondrop = (event) => handleDrop(event, folderPath);

        folderElement.appendChild(folderName);
        return folderElement;
    }

    createBookmarkElement(bookmark, folderPath, bIndex) {
        const bookmarkElement = document.createElement("li");
        bookmarkElement.classList.add("bookmark");

        const bookmarkLink = document.createElement("a");
        bookmarkLink.href = bookmark.url;
        bookmarkLink.target = "_blank";
        bookmarkLink.textContent = `🔗 ${bookmark.name}`;

        bookmarkElement.appendChild(bookmarkLink);
        bookmarkElement.oncontextmenu = (event) =>
            showContextMenu(event, "bookmark", folderPath, bIndex);

        bookmarkElement.draggable = true;
        bookmarkElement.ondragstart = (event) =>
            handleDragStart(event, "bookmark", folderPath, bIndex);
        bookmarkElement.ondragover = handleDragOver;
        bookmarkElement.ondrop = (event) => handleDrop(event, folderPath);

        return bookmarkElement;
    }
}
