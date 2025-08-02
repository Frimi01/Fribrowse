//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
class BookmarkManager {
  constructor() {
    this.port = 3002;
    this.bookmarks = [];
  }

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
      return this.bookmarks;
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      this.bookmarks = [];
      return [];
    }
  }

  async saveBookmarksToServer() {
 while (true) {
    try {
      await fetch(`http://localhost:${this.port}/save-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.bookmarks),
      });
      console.log("Bookmarks saved successfully!");
      break; 
    } catch (error) {
      console.error("Failed to save bookmarks:", error);
      const retry = confirm("Failed to reach server. Try starting the server and save again. Do you wish to retry?");
      if (!retry) {
        break; 
      }
    }
  }  }
}
const bookmarkManager = new BookmarkManager();
export default bookmarkManager;
