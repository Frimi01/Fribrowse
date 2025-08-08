# 🌐 FriBrowse

FriBrowse is a minimalistic, customizable hub for organizing bookmarks, searching the internet, and streamlining research workflows.

*How it looks in chrome*
![2025-05-13 06_48_38-](https://github.com/user-attachments/assets/56577f1b-ee53-436a-858b-71c1d72b3c44)
*Right click for context menus*
![2025-05-13 06_51_47-🔍FriBrowse](https://github.com/user-attachments/assets/31aa2bea-8c97-4561-9842-0d4f2c06ea74)



# 🚧 Plans

1. ~~Refit the functionality of V1.0 to follow new goals.~~
2. ~~Add Search Bar for navigating folders.~~
3. ~~Rewrite backend in go.~~
4. Make a website ready version of the server that can be deployed and handle multiple users.

# 🏗️  Download and Build Instructions
For a ready-to-use version, visit the [Releases](https://github.com/Frimi01/Fribrowse/releases/) section.
If the release is outdated, open an issue requesting an updated build.

If you simply want the app up and running you can download all the neccasary
files already set up for you in the GitHub Releases panel. If it's outdated and
you want a updated version you can issue a issue.

## Windows:
To build the app without opening a console you can use the following command:
```bash
go build -ldflags -H=windowsgui
```
## Linux and Mac
On linux you should usually be able to build it normally with `go build` if you have gcc, gtk3 and libayatana-appindicator installed. 

For further instructions you should try to following the instructions from systray: https://github.com/getlantern/systray

MacOS is untested.

# ⚡ How to use:

It's pretty intuitive:

- Double click executable! (or make program start at startup)
- Use the tray icon to open the page in your browser or quit
- Add folders for organizing bookmarks.
- Right-click folders/bookmarks for options.
- To add a bookmark, click add bookmark under folder, imput name and paste URL in the prompts.
- Drag and drop to rearrange.
- It will keep the last automatic backups when you open a page or stop the program. You can find them in the backup folder.
- If you are updating or want store, use or recover bookmarks.json files the intended import/export buttons works the best. 

# ❓ Questions and Answers

**1. What happened to the searching feature?**

It's still available in the FribrowseV1.0 branch and may be included in future releases. While the focus of this project has shifted from purely research and note-taking to focus on better received more general-purpose features, the search bar was a useful workflow tool. That version will remain accessible and may continue to receive updates.

**2. What is this project about?**

This project is designed to create a minimalistic yet practical and customizable browsing experience. So far mostly in how you interact with bookmarks. It's designed for users who want a safe, and focuses to remain a portable way to organize and access research materials.

**3. How can I contribute?**

Feel free to open an issue or submit a pull request! I'm happy to consider improvements, bug fixes, or suggestions.

**4. I found a bug. What should I do?**

Please open an issue describing the problem. Include any relevant details if possible:
- Description of bug and intended behaviour.
- Error messages (try to run the server from a console if possible)
- Screenshots
- Steps to reproduce the bug.

**5. How do i change the background image?**

Replace the image in the public/bookmark folder with the one you want. The image name needs to be exactly the same as the old one! 
