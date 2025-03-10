//server.js
require("dotenv").config();
const express = require("express");
const process = require("process");
const fs = require("fs");
const cors = require("cors");
const { exec } = require("child_process"); //to open browser

//config
const app = express();
const PORT = process.env.PORT;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const API_KEY = process.env.API_KEY;

app.use(express.json()); // Allows JSON in requests
app.use(
  cors({
    origin: `http://localhost:${PORT}`,
  }),
); // Allow frontend to call API

app.use(express.static(process.cwd() + "/public")); //hosts files in public

//Saves Bookmarks to local file
app.post("/save-json", (req, res) => {
  console.log("json save requested");

  const data = JSON.stringify(req.body, null, 2); // Format JSON

  fs.writeFile("./bookmarks.json", data, (err) => {
    if (err) {
      console.error("Error saving bookmarks:", err);
      return res.status(500).json({ error: "Failed to save bookmarks" });
    }

    console.log("Saved JSON successfully");
    res.json({ message: "Bookmarks saved successfully!" }); // Send response
  });
});

//Sends Bookmarks to Frontend
app.get("/get-bookmarks", (req, res) => {
  console.log("Received request for bookmarks");

  fs.readFile("./bookmarks.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Failed to read bookmarks" });
    }
    res.json(JSON.parse(data)); // Send parsed JSON data
    console.log("sent bookmarks");
  });
});

// Sends API key to frontend
app.get("/get-api-key", (req, res) => {
  res.json({ apiKey: API_KEY, engineId: SEARCH_ENGINE_ID });
  console.log("sent .env");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Open browser depending on OS
const url = `http://localhost:${PORT}/`;
if (process.platform === "win32") {
  exec(`start ${url}`); // Windows
} else if (process.platform === "darwin") {
  exec(`open ${url}`); // macOS
} else if (process.platform === "linux") {
  exec(`xdg-open ${url}`); // Linux
}
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed.");
    process.exitCode = 0;
  });
});
