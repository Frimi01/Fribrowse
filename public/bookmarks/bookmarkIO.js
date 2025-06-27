import bookmarkManager from "./bookmarkManager.js";
import { saveAndRender } from "./utils.js";
import { reinitializeRenderTree } from "./main.js";

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
    reinitializeRenderTree(bookmarkTree, bookmarkManager.bookmarks);
    saveAndRender();
  };
  reader.readAsText(file);
}

window.exportBookmarks = exportBookmarks;
window.importBookmarks = importBookmarks;
