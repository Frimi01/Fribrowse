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
const searchInput = document.querySelector(".search-bar");
const searchResultsDropdown = document.getElementById(
  "searchBarResultsDropdown",
);
let highlightedElement = null;

function handleSearch(searchTerm) {
  searchResultsDropdown.innerHTML = "";
  highlightedElement?.classList?.remove("highlighted-search-result");

  if (!searchTerm.trim()) {
    searchResultsDropdown.style.display = "none";
    return;
  }

  const results = findSearchResults(bookmarkManager.bookmarks, searchTerm);

  if (results.length > 0) {
    results.forEach((result) => {
      const resultElement = document.createElement("a");
      const highlightedName = highlightMatch(result.name, searchTerm);
      resultElement.innerHTML = `${result.type === "folder" ? "📁" : `<a href="${findurl(result)}" class="chainEmoji" target="_blank" rel="noopener noreferrer">🔗</a>`} ${highlightedName}`;
      resultElement.addEventListener("mouseover", () =>
        highlightInTree(result.path),
      );
      resultElement.addEventListener("click", () =>
        handleSearchResultClick(result),
      );
      searchResultsDropdown.appendChild(resultElement);
    });
    searchResultsDropdown.style.display = "block";
  } else {
    searchResultsDropdown.style.display = "none";
  }
}

function findurl(result) {
  const path = result.path;
  let targetBookmark;
  let cbookmark = bookmarkManager.bookmarks;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (
      !(
        typeof segment === "number" &&
        cbookmark &&
        cbookmark[segment] &&
        (cbookmark[segment].folders || cbookmark[segment].bookmarks)
      )
    ) {
      return null;
    } else {
      if (path[i + 1] === "folders") {
        cbookmark = cbookmark[segment].folders;
        i++;
      } else if (path[i + 1] === "bookmarks") {
        cbookmark = cbookmark[segment].bookmarks;
        i++;
      } else {
        return null;
      }
    }
    const lastSegment = path[path.length - 1];
    targetBookmark =
      typeof lastSegment === "number" && cbookmark && cbookmark[lastSegment]
        ? cbookmark[lastSegment]
        : null;
  }
  return targetBookmark.url;
}
function findSearchResults(items, searchTerm, path = []) {
  const results = [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  items.forEach((item, index) => {
    const currentPath = [...path, index];
    if (item.name.toLowerCase().includes(lowerSearchTerm)) {
      results.push({
        type: item.folders ? "folder" : "bookmark",
        name: item.name,
        path: currentPath,
      });
    }
    if (item.folders) {
      results.push(
        ...findSearchResults(item.folders, searchTerm, [
          ...currentPath,
          "folders",
        ]),
      );
    }
    if (item.bookmarks) {
      results.push(
        ...findSearchResults(item.bookmarks, searchTerm, [
          ...currentPath,
          "bookmarks",
        ]),
      );
    }
  });
  return results;
}

function highlightMatch(text, searchTerm) {
  const regex = new RegExp(searchTerm, "gi");
  return text.replace(regex, '<span class="highlight">$&</span>');
}

function highlightInTree(path) {
  // Remove previous highlight
  if (highlightedElement) {
    highlightedElement.classList.remove("highlighted-search-result");
  }

  let elementToHighlight = bookmarkTree;
  let currentLevel = bookmarkManager.bookmarks;

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    // console.log(segment, elementToHighlight);

    if (typeof segment === "number" && currentLevel && currentLevel[segment]) {
      elementToHighlight = elementToHighlight.children[segment];
      if (currentLevel[segment].folders) {
        currentLevel = currentLevel[segment].folders;
      } else {
        currentLevel = null;
      }
    } else if (segment === "folders" && elementToHighlight) {
      elementToHighlight = elementToHighlight.querySelector(".folder-content");
    } else if (segment === "bookmarks" && elementToHighlight) {
      const folderContent = elementToHighlight.querySelector(".folder-content");
      const bookmarks = folderContent
        ? Array.from(folderContent.querySelectorAll(":scope > .bookmark"))
        : [];
      const bookmarkIndex = path[i + 1]; // lookahead to get the index
      if (typeof bookmarkIndex === "number" && bookmarks[bookmarkIndex]) {
        elementToHighlight = bookmarks[bookmarkIndex];
        i++;
      } else {
        elementToHighlight = null;
        break;
      }
    }

    if (!elementToHighlight) break;
  }

  if (elementToHighlight) {
    const target =
      elementToHighlight.querySelector(".folder") ||
      elementToHighlight.querySelector("a") ||
      elementToHighlight;
    if (target) {
      target.classList.add("highlighted-search-result");
      highlightedElement = target;
    }
  }
}

function handleSearchResultClick(result) {
  searchResultsDropdown.style.display = "none";

  openParents();

  function openParents() {
    const path = result.path;
    let cbookmark = bookmarkManager.bookmarks;

    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];

      if (
        !(
          typeof segment === "number" &&
          cbookmark &&
          cbookmark[segment] &&
          (cbookmark[segment].folders || cbookmark[segment].bookmarks)
        )
      ) {
        console.error(
          "Invalid path segment or bookmark structure at index",
          i,
          path,
        );
      }

      if (path[i + 1] === "folders") {
        cbookmark[segment].open = true;
        cbookmark = cbookmark[segment].folders;
        i++;
      } else if (path[i + 1] === "bookmarks") {
        cbookmark[segment].open = true;
        i++;
      } else {
        console.error("Unexpected path segment type after index", i, path);
      }
    }

    const lastIndex = path.length - 1;
    const lastSegment = path[lastIndex];

    if (result.type === "folder") {
      if (
        typeof lastSegment === "number" &&
        cbookmark &&
        cbookmark[lastSegment]
      ) {
        cbookmark[lastSegment].open = true;
      } else {
        console.error("Invalid target folder at end of path:", path);
      }
    } else if (!result.type === "bookmark") {
      console.error(
        "Unknown result type for the last segment:",
        result.type,
        path,
      );
    }
  }
  saveAndRender();
}

function clearSearchResults() {
  setTimeout(() => {
    if (!searchInput.matches(":focus")) {
      searchResultsDropdown.style.display = "none";
      if (highlightedElement) {
        highlightedElement.classList.remove("highlighted-search-result");
        highlightedElement = null;
      }
    }
  }, 100);
}

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

  let index = sourcePath[sourcePath.length - 1];
  getFolderByPath(sourcePath.slice(0, -1)).folders.splice(index, 1);

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
  reader.onload = async function (e) {
    bookmarkManager.bookmarks = JSON.parse(e.target.result);
    renderTree = createBookmarksRenderer(
      bookmarkTree,
      bookmarkManager.bookmarks,
    );
    saveAndRender();
  };
  reader.readAsText(file);
}

// Main Context Menu Logic:
function showContextMenu(event, type, folderPath, bookmarkIndex = null) {
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

function toggleFolder(folderPath) {
  const folder = getFolderByPath(folderPath);
  if (!folder) return console.error("Folder not found:", folderPath);

  folder.open = !folder.open;
  saveAndRender();
}

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
    folder = folder.folders[index];
  }
  return folder;
}

const bookmarkManager = new BookmarkManager(PORT);
const bookmarkTree = document.getElementById("bookmarkTree");
let renderTree;
bookmarkManager.getBookmarks();
