//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
import { saveAndRender } from "./utils.js";
import bookmarkManager from "./bookmarkManager.js";

const searchInput = document.querySelector(".search-bar");
const searchResultsDropdown = document.getElementById(
    "searchBarResultsDropdown",
);
let highlightedElement = null;

function handleSearch(searchTerm) {
    searchResultsDropdown.innerHTML = "";
    highlightedElement?.classList?.remove("highlighted-search-result");

    if (!searchTerm.trim()) {
        searchResultsDropdown.style.display = "none";
        return;
    }

    const results = findSearchResults(bookmarkManager.bookmarks, searchTerm);

    if (results.length > 0) {
        results.forEach((result) => {
            const resultElement = document.createElement("a");
            const highlightedName = highlightMatch(result.name, searchTerm);
            resultElement.innerHTML = `${result.type === "folder" ? "📁" : `<a href="${findurl(result)}" class="chainEmoji" target="_blank" rel="noopener noreferrer">🔗</a>`} ${highlightedName}`;
            resultElement.addEventListener("mouseover", () =>
                highlightInTree(result.path),
            );
            resultElement.addEventListener("click", () =>
                handleSearchResultClick(result),
            );
            searchResultsDropdown.appendChild(resultElement);
        });
        searchResultsDropdown.style.display = "block";
    } else {
        searchResultsDropdown.style.display = "none";
    }
}

function findurl(result) {
    const path = result.path;
    let targetBookmark;
    let cbookmark = bookmarkManager.bookmarks;
    for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (
            !(
                typeof segment === "number" &&
                cbookmark &&
                cbookmark[segment] &&
                (cbookmark[segment].folders || cbookmark[segment].bookmarks)
            )
        ) {
            return null;
        } else {
            if (path[i + 1] === "folders") {
                cbookmark = cbookmark[segment].folders;
                i++;
            } else if (path[i + 1] === "bookmarks") {
                cbookmark = cbookmark[segment].bookmarks;
                i++;
            } else {
                return null;
            }
        }
        const lastSegment = path[path.length - 1];
        targetBookmark =
            typeof lastSegment === "number" &&
            cbookmark &&
            cbookmark[lastSegment]
                ? cbookmark[lastSegment]
                : null;
    }
    return targetBookmark.url;
}
function findSearchResults(items, searchTerm, path = []) {
    const results = [];
    const lowerSearchTerm = searchTerm.toLowerCase();

    items.forEach((item, index) => {
        const currentPath = [...path, index];
        if (item.name.toLowerCase().includes(lowerSearchTerm)) {
            results.push({
                type: item.folders ? "folder" : "bookmark",
                name: item.name,
                path: currentPath,
            });
        }
        if (item.folders) {
            results.push(
                ...findSearchResults(item.folders, searchTerm, [
                    ...currentPath,
                    "folders",
                ]),
            );
        }
        if (item.bookmarks) {
            results.push(
                ...findSearchResults(item.bookmarks, searchTerm, [
                    ...currentPath,
                    "bookmarks",
                ]),
            );
        }
    });
    return results;
}

function highlightMatch(text, searchTerm) {
    const regex = new RegExp(searchTerm, "gi");
    return text.replace(regex, '<span class="highlight">$&</span>');
}

function highlightInTree(path) {
    // Remove previous highlight
    if (highlightedElement) {
        highlightedElement.classList.remove("highlighted-search-result");
    }

    let elementToHighlight = bookmarkTree;
    let currentLevel = bookmarkManager.bookmarks;

    for (let i = 0; i < path.length; i++) {
        const segment = path[i];
        // console.log(segment, elementToHighlight);

        if (
            typeof segment === "number" &&
            currentLevel &&
            currentLevel[segment]
        ) {
            elementToHighlight = elementToHighlight.children[segment];
            if (currentLevel[segment].folders) {
                currentLevel = currentLevel[segment].folders;
            } else {
                currentLevel = null;
            }
        } else if (segment === "folders" && elementToHighlight) {
            elementToHighlight =
                elementToHighlight.querySelector(".folder-content");
        } else if (segment === "bookmarks" && elementToHighlight) {
            const folderContent =
                elementToHighlight.querySelector(".folder-content");
            const bookmarks = folderContent
                ? Array.from(
                      folderContent.querySelectorAll(":scope > .bookmark"),
                  )
                : [];
            const bookmarkIndex = path[i + 1]; // lookahead to get the index
            if (typeof bookmarkIndex === "number" && bookmarks[bookmarkIndex]) {
                elementToHighlight = bookmarks[bookmarkIndex];
                i++;
            } else {
                elementToHighlight = null;
                break;
            }
        }

        if (!elementToHighlight) break;
    }

    if (elementToHighlight) {
        const target =
            elementToHighlight.querySelector(".folder") ||
            elementToHighlight.querySelector("a") ||
            elementToHighlight;
        if (target) {
            target.classList.add("highlighted-search-result");
            highlightedElement = target;
        }
    }
}

function handleSearchResultClick(result) {
    searchResultsDropdown.style.display = "none";

    openParents();

    function openParents() {
        const path = result.path;
        let cbookmark = bookmarkManager.bookmarks;

        for (let i = 0; i < path.length - 1; i++) {
            const segment = path[i];

            if (
                !(
                    typeof segment === "number" &&
                    cbookmark &&
                    cbookmark[segment] &&
                    (cbookmark[segment].folders || cbookmark[segment].bookmarks)
                )
            ) {
                console.error(
                    "Invalid path segment or bookmark structure at index",
                    i,
                    path,
                );
            }

            if (path[i + 1] === "folders") {
                cbookmark[segment].open = true;
                cbookmark = cbookmark[segment].folders;
                i++;
            } else if (path[i + 1] === "bookmarks") {
                cbookmark[segment].open = true;
                i++;
            } else {
                console.error(
                    "Unexpected path segment type after index",
                    i,
                    path,
                );
            }
        }

        const lastIndex = path.length - 1;
        const lastSegment = path[lastIndex];

        if (result.type === "folder") {
            if (
                typeof lastSegment === "number" &&
                cbookmark &&
                cbookmark[lastSegment]
            ) {
                cbookmark[lastSegment].open = true;
            } else {
                console.error("Invalid target folder at end of path:", path);
            }
        } else if (!result.type === "bookmark") {
            console.error(
                "Unknown result type for the last segment:",
                result.type,
                path,
            );
        }
    }
    saveAndRender();
}

function clearSearchResults() {
    setTimeout(() => {
        if (!searchInput.matches(":focus")) {
            searchResultsDropdown.style.display = "none";
            if (highlightedElement) {
                highlightedElement.classList.remove(
                    "highlighted-search-result",
                );
                highlightedElement = null;
            }
        }
    }, 100);
}

window.handleSearch = handleSearch;
window.clearSearchResults = clearSearchResults;
