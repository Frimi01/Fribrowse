//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
//BOOKMARK LOGIC:

// Config:
const PORT = 3002;

class BookmarkManager {
  constructor(port) {
    this.port = port;
    this.bookmarks = [];
  }

  // Communicate with server:
  async getBookmarks() {
    try {
      const response = await fetch(
        `http://localhost:${this.port}/get-bookmarks`,
        {
          method: "GET",
          mode: "cors",
        },
      );
      if (!response.ok) throw new Error("Failed to fetch bookmarks");

      this.bookmarks = await response.json();
      if (!renderTree) {
        renderTree = createBookmarksRenderer(bookmarkTree, this.bookmarks);
      }
      renderTree.render();
      console.log("Bookmarks loaded sucsessfully!");
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      this.bookmarks = [];
    }
  }
  async saveBookmarksToServer() {
    try {
      await fetch(`http://localhost:${this.port}/save-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.bookmarks),
      });
      console.log("Bookmarks saved successfully!");
    } catch (error) {
      console.error("Failed to save bookmarks:", error);
    }
  }
}

// render logic
function createBookmarksRenderer(bookmarkTree, bookmarks) {
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

function sortSubfoldersAndBookmarks(node) {
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
      sortSubfoldersAndBookmarks(childFolder);
    });
  }
}

// search bar logic

// main draggable logic
function handleDragStart(event, type, folderPath, bookmarkIndex = null) {
  event.dataTransfer.setData("type", type);
  event.dataTransfer.setData("folderPath", JSON.stringify(folderPath));
  if (bookmarkIndex !== null) {
    event.dataTransfer.setData("bookmarkIndex", bookmarkIndex);
  }
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event, targetPath) {
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

function moveFolder(sourcePath, targetPath) {
  if (targetPath.join(",").startsWith(sourcePath.join(","))) {
    console.error("Error: Cannot move a folder into itself or its subfolders.");
    return;
  }

  let sourceFolder = getFolderByPath(sourcePath);
  if (!sourceFolder) return;

  let targetFolder = getFolderByPath(targetPath);
  if (!targetFolder || !targetFolder.folders) return;

  // Remove from source
  let index = sourcePath[sourcePath.length - 1];
  getFolderByPath(sourcePath.slice(0, -1)).folders.splice(index, 1);

  // Add to target
  targetFolder.folders.push(sourceFolder);
  saveAndRender();
}

function moveBookmark(sourceFolderPath, bookmarkIndex, targetFolderPath) {
  let sourceFolder = getFolderByPath(sourceFolderPath);
  if (!sourceFolder || !sourceFolder.bookmarks) return;

  let bookmark = sourceFolder.bookmarks.splice(bookmarkIndex, 1)[0];

  let targetFolder = getFolderByPath(targetFolderPath);
  if (!targetFolder || !targetFolder.bookmarks) return;

  targetFolder.bookmarks.push(bookmark);
  saveAndRender();
}

// Exports and imports bookmarks (frontend)
function exportBookmarks() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(bookmarkManager.bookmarks));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "bookmarks.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}

function importBookmarks(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    bookmarkManager.bookmarks = JSON.parse(e.target.result);
    saveAndRender();
  };
  reader.readAsText(file);
}

// Main Context Menu Logic:
function showContextMenu(event, type, folderPath, bookmarkIndex = null) {
  event.preventDefault();
  //console.log("Context menu opened:", { type, folderPath });
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

  menu.innerHTML = ""; // Clear existing menu
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

// Context menu options:
function addFolder() {
  const name = prompt("Enter folder name:");
  if (name)
    bookmarkManager.bookmarks.push({
      name,
      folders: [],
      bookmarks: [],
      open: false,
    });
  saveAndRender();
}

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

  targetFolder.bookmarks.push({ name, url }); // Add bookmark
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
  let folderIndex = parentPath.pop(); // Get the last index (folder to delete)

  let parentFolder = getFolderByPath(parentPath);

  if (parentFolder) {
    parentFolder.folders.splice(folderIndex, 1); // Remove the folder from its parent's list
  } else {
    bookmarkManager.bookmarks.splice(folderIndex, 1); // If it's a top-level folder
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

// Opens and closes the folder:
function toggleFolder(folderPath) {
  const folder = getFolderByPath(folderPath);
  if (!folder) return console.error("Folder not found:", folderPath);

  folder.open = !folder.open;
  saveAndRender();
}

// Saves and renders the bookmarks
async function saveAndRender() {
  bookmarkManager.bookmarks.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
  bookmarkManager.bookmarks.forEach((folder) =>
    sortSubfoldersAndBookmarks(folder),
  );
  await bookmarkManager.saveBookmarksToServer();
  renderTree.render();
}

// Function to find a folder by index path
function getFolderByPath(folderPath) {
  let folder = { folders: bookmarkManager.bookmarks };
  for (let index of folderPath) {
    if (!folder.folders || !folder.folders[index]) {
      return null;
    }
    folder = folder.folders[index]; // Move into the subfolder
  }
  return folder;
}

const bookmarkManager = new BookmarkManager(PORT);
const bookmarkTree = document.getElementById("bookmarkTree");
let renderTree;
bookmarkManager.getBookmarks();
