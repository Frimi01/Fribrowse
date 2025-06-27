//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import bookmarkManager from "./bookmarkManager.js";
import createBookmarksRenderer from "./renderer.js";

// Config:
const bookmarkTree = document.getElementById("bookmarkTree");
export let renderTree;

(async () => {
  const bookmarks = await bookmarkManager.getBookmarks();

  renderTree = createBookmarksRenderer(bookmarkTree, bookmarks);
  renderTree.render();
})();

export function reinitializeRenderTree(bookmarkTree, bookmarks) {
  renderTree = createBookmarksRenderer(bookmarkTree, bookmarks);
}
