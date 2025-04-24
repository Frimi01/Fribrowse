// server.test.js
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import request from "supertest";
//import express from "express";
import fs from "fs";

describe("Server API Endpoints", () => {
  let app;
  let server;
  const mockBookmarks = {
    name: "Awesome githubs!",
    folders: [],
    bookmarks: [
      { name: "Frimi01", url: "https://github.com/Frimi01/Frimi01-Projects" },
    ],
    open: false,
  };

  beforeEach(() => {
    // sets environment variables before importing server.js
    process.env.NODE_ENV = "test";
    process.env.PORT = "3005";
    process.env.SEARCH_ENGINE_ID = "test_engine_id";
    process.env.API_KEY = "test_api_key";

    // Clear the require cache for server.js
    delete require.cache[require.resolve("../server.js")];

    // Import server.js after clearing the cache and setting env variables
    const imported = require("../server.js");
    app = imported.app;
    server = imported.server;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (server) {
      server.close();
    }
  });

  it("POST writes on /save-json", async () => {
    vi.spyOn(fs, "writeFile").mockImplementation((_path, _data, callback) => {
      callback(null);
    });

    const response = await request(app).post("/save-json").send(mockBookmarks);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Bookmarks saved successfully!" });
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("GET /get-bookmarks returns", async () => {
    const mockBookmarks = { bookmarks: [{ id: 1, title: "Test Bookmark" }] };
    vi.spyOn(fs, "readFile").mockImplementation(
      (_path, _encoding, callback) => {
        callback(null, JSON.stringify(mockBookmarks));
      },
    );

    const response = await request(app).get("/get-bookmarks");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockBookmarks);
    expect(fs.readFile).toHaveBeenCalled();
  });

  it("tests the error handling of the get bookmark endpoint", async () => {
    vi.spyOn(fs, "readFile").mockImplementation(
      (_path, _encoding, callback) => {
        callback("File read error", null);
      },
    );
    const response = await request(app).get("/get-bookmarks");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to read bookmarks" });
  });
});
