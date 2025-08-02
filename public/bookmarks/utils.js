// search bar logic
import bookmarkManager from "./bookmarkManager.js";
import { renderTree } from "./main.js";

export function getFolderByPath(folderPath) {
  let folder = { folders: bookmarkManager.bookmarks };
  for (let index of folderPath) {
    if (!folder.folders || !folder.folders[index]) {
      return null;
    }
    folder = folder.folders[index];
  }
  return folder;
}

export async function saveAndRender() {
    bookmarkManager.bookmarks.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
    bookmarkManager.bookmarks.forEach((folder) =>
        sortSubfoldersAndBookmarks(folder),
    );
        await bookmarkManager.saveBookmarksToServer();

    renderTree.render();
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
