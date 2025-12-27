//GitHub (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { BookmarkManager } from './core/BookmarkManager.js';
import { exportBookmarks, importBookmarks, addRootFolder } from './core/BookmarkIO.js';
import { BookmarkRenderer } from './ui/BookmarkRenderer.js';
import { handleSearch, clearSearchResults } from './ui/SearchHandler.js';

class BookmarkApp {
    constructor(containerElement) {
        this.manager = new BookmarkManager();
        this.renderer = new BookmarkRenderer(containerElement, this.manager);
    }

    async initialize() {
        await this.manager.getBookmarks();
        this.renderer.render();
    }

    async saveAndRender() {
        this.manager.sort();
        await this.manager.saveBookmarksToServer();
        this.renderer.render();
    }
}

// Create singleton app instance
export const app = new BookmarkApp(document.getElementById("bookmarkTree"));

// Initialize
(async () => {
    await app.initialize();
})();

// Expose to window for HTML event handlers
window.handleSearch = handleSearch;
window.clearSearchResults = clearSearchResults;
window.exportBookmarks = exportBookmarks;
window.importBookmarks = importBookmarks;
window.addFolder = addRootFolder;
