import {
  handleDragStart,
  handleDragOver,
  handleDrop,
} from "./draggableLogic.js";
import { getFolderByPath, saveAndRender } from "./utils.js";

export default function createBookmarksRenderer(bookmarkTree, bookmarks) {
  function render() {
    bookmarkTree.innerHTML = "";

    bookmarks.forEach((folder, index) => {
      renderFolder(folder, [index], bookmarkTree);
    });
  }

  function renderFolder(folder, folderPath, parentElement) {
    const folderElement = createFolderElement(folder, folderPath);

    const folderContent = document.createElement("ul");
    folderContent.className = "folder-content";
    folderContent.style.display = folder.open ? "block" : "none";

    folder.folders?.forEach((subFolder, fIndex) => {
      renderFolder(subFolder, [...folderPath, fIndex], folderContent);
    });

    folder.bookmarks?.forEach((bookmark, bIndex) => {
      const bookmarkEl = createBookmarkElement(bookmark, folderPath, bIndex);
      folderContent.appendChild(bookmarkEl);
    });

    folderElement.appendChild(folderContent);
    parentElement.appendChild(folderElement);
  }

  function createFolderElement(folder, folderPath) {
    const folderElement = document.createElement("li");

    const folderName = document.createElement("span");
    folderName.classList.add("folder");
    folderName.textContent = `📁 ${folder.name}`;
    folderName.onclick = () => toggleFolder(folderPath);
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

  function createBookmarkElement(bookmark, folderPath, bIndex) {
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

  return { render };
}

function toggleFolder(folderPath) {
  const folder = getFolderByPath(folderPath);
  if (!folder) return console.error("Folder not found:", folderPath);

  folder.open = !folder.open;
  saveAndRender();
}
