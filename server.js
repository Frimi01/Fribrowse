//server.js
require("dotenv").config();
const express = require("express");
const process = require("process");
const fs = require("fs");
const path = require('path');
const cors = require("cors");
const { exec } = require("child_process"); //to open browser

//config
const app = express();
const PORT = 3002;
const BOOKMARK_PATH = "./bookmarks.json";

app.use(express.json());
app.use(
    cors({
        origin: `http://localhost:${PORT}`,
    }),
); // Allow frontend to call API


//hosts files in public
app.use(express.static(process.cwd() + "/public/bookmarks"));

//Saves Bookmarks to local file
app.post("/save-json", (req, res) => {
    console.log(
        new Date().toLocaleTimeString() +
        " Request to save to bookmarks.json receved",
    );

    const data = JSON.stringify(req.body, null, 2);

    fs.writeFile(BOOKMARK_PATH, data, (err) => {
        if (err) {
            console.error(
                new Date().toLocaleTimeString() + " Error saving bookmarks:",
                err,
            );
            return res.status(500).json({ error: " Errpr saving bookmarks" });
        }

        console.log(
            new Date().toLocaleTimeString() +
            " Request to save to bookmarks.json completed",
        );
        res.json({ message: "Bookmarks saved successfully!" });
    });
});

//Sends Bookmarks to Frontend
app.get("/get-bookmarks", (req, res) => {
    console.log(
        new Date().toLocaleTimeString() + " Received request to send bookmarks",
    );

    fs.readFile(BOOKMARK_PATH, "utf8", (err, data) => {
        if (err) {
            console.error(
                new Date().toLocaleTimeString() + " Error reading file:",
                err,
            );
            return res.status(500).json({ error: "Failed to read bookmarks" });
        }
        res.json(JSON.parse(data)); // Send parsed JSON data
        console.log(new Date().toLocaleTimeString() + " Bookmarks sent");
        backupJson('lastInitilized')
    });
});

// Backup logic
const DATA_FILE = './bookmarks.json';
const BACKUP_DIR = './backups';

function backupJson(backupType) {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }

    const backupFile = path.join(BACKUP_DIR,
        `data-backup-${backupType}.json`);

    fs.copyFile(DATA_FILE, backupFile, (err) => {
        if (err) {
            console.error('Backup failed:', err);
        } else {
            console.log(`Backup created at ${backupFile}`);
        }
    });
}

// Server
const server = app.listen(PORT, () => {
    console.log(
        new Date().toLocaleTimeString() +
        ` Server running on http://localhost:${PORT}`,
    );
});

// Open browser depending on OS
if (process.env.NODE_ENV !== "test") {
    const url = `http://localhost:${PORT}/`;
    if (process.platform === "win32") {
        exec(`start ${url}`);
    } else if (process.platform === "darwin") {
        exec(`open ${url}`);
    } else if (process.platform === "linux") {
        exec(`xdg-open ${url}`);
    }
}
process.on("SIGINT", () => {
    console.log(new Date().toLocaleTimeString() + " Shutting down server...");
    backupJson('lastServerShutdown');

    server.close(() => {
        process.exitCode = 0;
        console.log("Server closed.");
    });
});

module.exports = { app, server }; // Export the server instance
