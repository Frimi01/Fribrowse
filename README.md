This is FriBrowse, a minimalistic website for searching and storing bookmarks!

# Plans:

1. ~~Add subfolders to bookmark manager.~~
2. ~~Drag and drop bookmarks.~~
3. Move off google api.
4. ~~Remake the look while keeping the minimalistic theme.~~
5. Custom background and themes
6. ~~Moved to it's own repo~~

# Questions and Answers

**How to use with google search api.**

(probably isn't needed for the bookmark part of things.. probably)

This program currently looks for a .env file in the same folder as the exported .exe file. Simply make a file with the name .env (nothing before the ".") and enter the following information:

```.env
API_KEY = # your api key

SEARCH_ENGINE_ID = # your search engine id

PORT = # your desired port (To actually work with something other than 3000 you'll have to change the const at the top of bookmanager.js too)
```

Make a API_KEY and SEARCH_ENGINE_ID on https://console.cloud.google.com with google custom search api

Again, I plan to eliminate this step in the future, but other than google's confusing documentation it's actually quite simple.

**What is this project about?**

This project is designed to create a minimalistic yet practical and customizable browsing experience. So far mostly in how you interact with bookmarks and the searchbar. Optimal for people who want a safe and transportable list of research materials.

**How can I contribute?**

Feel free to open an issue or submit a pull request! I'm happy to consider improvements, bug fixes, or suggestions.

**I found a bug. What should I do?**

Please create an issue with a description of the problem. Be sure to include any relevant details, like error messages or steps to reproduce the issue.

**How to download for use?**

I currently don't have a way to just download a finished build. You can either build it yourself (by cloning the repo and packaging it) or ask me to upload it.

**How do I use this?**
It's quite intuative! for the bookmarks just add folders, right click on folders and bookmarks for options, and drag stuff around as you want. To add a url you can use the search functiona and just copy the url provided all in one place.

**Can the website be used without a backend?**
You can replace the code calling the backend with localstorage. Beware that refreshing the catche like this will delete the bookmarks, so export some backups.
