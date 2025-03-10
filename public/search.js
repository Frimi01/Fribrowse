//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
//Config

let API_KEY;
let SEARCH_ENGINE_ID;

async function getApiKey() {
  const response = await fetch("http://localhost:3000/get-api-key");
  const data = await response.json();
  API_KEY = data.apiKey;
  SEARCH_ENGINE_ID = data.engineId;
}
getApiKey();

//search.js
const searchForm = document.getElementById("searchForm");
const resultsContainer = document.getElementById("results");

searchForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const searchTerm = document.querySelector("input[name=q]").value.trim();

  if (!searchTerm) {
    resultsContainer.innerHTML =
      '<div class="error-message">Please enter a search term.</div>';
    return;
  }

  resultsContainer.innerHTML = "";
  resultsContainer.innerHTML = '<div class="loading-message">Loading..</div>';
  fetch(
    `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(searchTerm)}&key=${API_KEY}&cx=${SEARCH_ENGINE_ID}`,
  )
    .then((response) => response.json())
    .then((data) => {
      resultsContainer.innerHTML = "";
      if (!data.items || data.items.length === 0) {
        resultsContainer.innerHTML =
          '<div class="error-message">No results found for your search.</div>';
        return;
      }

      data.items.forEach((item) => {
        const resultItem = document.createElement("div");
        resultItem.className = "result-item";
        resultItem.innerHTML = `
                    <h3>${item.title}</h3>
                    <a class="result-link">${item.link}</a>
                    <p>${item.snippet}</p>
                    <a href="${item.link}" target="_blank">View Source</a>
                `;
        resultsContainer.appendChild(resultItem);
      });
    })
    .catch((error) => {
      let errorMessage = "An error occurred. Please try again.";

      if (error.message.includes("403")) {
        errorMessage =
          "Error: API key is invalid or quota exceeded. Please check your API key.";
      } else if (error.message.includes("NetworkError")) {
        errorMessage =
          "Error: Unable to connect to the server. Please check your internet connection.";
      }

      resultsContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;
    });
});
