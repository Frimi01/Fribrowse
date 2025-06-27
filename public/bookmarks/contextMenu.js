//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects

import bookmarkManager from "./bookmarkManager.js";
import { getFolderByPath, saveAndRender } from "./utils.js";

let currentTarget = null;

export function showContextMenu(event, type, folderPath, bookmarkIndex = null) {
  event.preventDefault();
  currentTarget = { type, folderPath, bookmarkIndex };

  const menu = document.getElementById("contextMenu");

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

  let targetFolder = getFolderByPath(folderPath);
  if (!targetFolder || !targetFolder.folders) {
    console.error("Target folder not found.");
    return;
  }

  targetFolder.folders.push({ name, folders: [], bookmarks: [], open: false });
  saveAndRender();
}

function renameFolder(folderPath) {
  let folder = getFolderByPath(folderPath);
  if (!folder) return console.error("Error: Folder not found.");

  const name = prompt("Enter new folder name:", folder.name);
  if (name) {
    folder.name = name;
    saveAndRender();
  }
}

function addBookmark(folderPath) {
  const name = prompt("Enter bookmark name:");
  const url = prompt("Enter bookmark URL:");
  if (!name || !url) return;

  const targetFolder = getFolderByPath(folderPath);
  if (!targetFolder || !targetFolder.bookmarks) {
    console.error("Error: Could not find target folder!");
    return;
  }

  targetFolder.bookmarks.push({ name, url });
  saveAndRender();
}

function renameBookmark(folderPath, bookmarkIndex) {
  updateBookmark("name", folderPath, bookmarkIndex);
}

function editBookmarkUrl(folderPath, bookmarkIndex) {
  updateBookmark("url", folderPath, bookmarkIndex);
}

function updateBookmark(property, folderPath, bookmarkIndex) {
  const folder = getFolderByPath(folderPath);
  if (!folder || !folder.bookmarks[bookmarkIndex]) {
    return console.error("Error: Bookmark not found.");
  }
  const currentValue = folder.bookmarks[bookmarkIndex][property];
  const newValue = prompt(`Enter new bookmark ${property}:`, currentValue);
  if (newValue !== null && newValue !== "") {
    folder.bookmarks[bookmarkIndex][property] = newValue;
    saveAndRender();
  }
}
function deleteFolder(folderPath) {
  if (!confirm("Are you sure you want to delete this folder?")) return;

  let parentPath = [...folderPath];
  let folderIndex = parentPath.pop();

  let parentFolder = getFolderByPath(parentPath);

  if (parentFolder) {
    parentFolder.folders.splice(folderIndex, 1);
  } else {
    bookmarkManager.bookmarks.splice(folderIndex, 1);
  }

  saveAndRender();
}

function deleteBookmark(folderPath, bookmarkIndex) {
  if (!confirm("Are you sure you want to delete this bookmark?")) return;

  const folder = getFolderByPath(folderPath);
  if (!folder || !folder.bookmarks[bookmarkIndex])
    return console.error("Error: Bookmark not found.");

  folder.bookmarks.splice(bookmarkIndex, 1);
  saveAndRender();
}
