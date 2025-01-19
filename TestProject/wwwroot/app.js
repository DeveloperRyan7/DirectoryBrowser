/// GLOBAL CONSTANTS
/**
 * Base URL for API endpoints.
 * Change this value if the server URL or port changes.
 */
const apiBaseUrl = "https://localhost:7146"; // Base URL for API requests

/// UTILITY FUNCTIONS
/** formatBytes
 * Converts a given size in bytes into a human-readable format.
 *
 * @param {number} bytes - The size in bytes to format.
 * @returns {string} - The formatted size string (e.g., "1.23 MB").
 */
function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

/** isValidApiResponse
 * Validates the structure of an API response to ensure it has expected properties.
 *
 * @param {object} response - The API response to validate.
 * @returns {boolean} - True if the response is valid, false otherwise.
 */
function isValidApiResponse(response) {
    console.log("Validating API Response:", response);

    if (!response || typeof response !== "object") {
        console.error("Invalid response: Response is null or not an object");
        return false;
    }

    // Validation for browse response
    if (response.contents && Array.isArray(response.contents)) {
        console.log("Valid browse response detected");
        return true;
    }

    // Validation for search response
    if (
        response.matches &&
        Array.isArray(response.matches) &&
        typeof response.path === "string" &&
        typeof response.query === "string"
    ) {
        console.log("Valid search response detected");
        return true;
    }

    console.error("Invalid response: Unrecognized structure");
    return false;
}




/// RENDERING FUNTIONS
/** renderBreadcrumb
 * Renders the breadcrumb navigation based on the given path.
 *
 * @param {string} path - The current directory path (e.g., "Folder1/Folder2").
 * Updates the "breadcrumb" element to reflect the current navigation hierarchy.
 */
function renderBreadcrumb(path = "") {
    const breadcrumb = document.getElementById("breadcrumb");
    breadcrumb.innerHTML = ""; // Clear existing breadcrumbs

    // Add "Home" link
    const homeLink = document.createElement("a");
    homeLink.href = "#";
    homeLink.textContent = "Home";
    homeLink.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Navigating to Home");
        location.hash = ""; // Navigate to the root
        window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    breadcrumb.appendChild(homeLink);

    if (!path) return; // No additional breadcrumbs needed for the root

    // Normalize path to use forward slashes
    const segments = path.replace(/\\/g, "/").split("/").filter(Boolean);

    segments.forEach((segment, index) => {
        // Create the accumulated path up to this segment
        const accumulatedPath = segments.slice(0, index + 1).join("/");

        const link = document.createElement("a");
        link.href = `#${accumulatedPath}`;
        link.textContent = segment;
        link.addEventListener("click", (e) => {
            e.preventDefault();
            console.log(`Breadcrumb clicked: Segment=${segment}, Path=${accumulatedPath}`);
            location.hash = accumulatedPath; // Update hash for navigation
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });

        breadcrumb.appendChild(document.createTextNode(" / "));
        breadcrumb.appendChild(link);
    });
}

/** renderContent
 * Renders the contents of the current directory (files and folders).
 *
 * @param {Array} contents - An array of objects representing files and folders.
 * Each object should contain: name, type ("file" or "directory"), size, and path.
 * Updates the "directory-viewer" element with the directory's contents.
 */
function renderContent(contents) {
    const viewer = document.getElementById("directory-viewer");
    viewer.innerHTML = ""; // Clear current content

    contents.forEach((item) => {
        const div = document.createElement("div");
        div.className = `item ${item.type}`;

        if (item.type === "directory") {
            // Render directories
            div.innerHTML = `&#128193; ${item.name} <span class="size">(${formatBytes(item.size)})</span>`;
            div.addEventListener("click", () => {
                const currentPath = location.hash.slice(1) || ""; // Get current path
                const newPath = currentPath
                    ? `${currentPath}/${item.name}` // Append folder name to current path
                    : item.name; // If at root, start with folder name
                console.log("Navigating to new path:", newPath);
                location.hash = newPath; // Update hash for navigation
            });
        } else if (item.type === "file") {
            // Render files with download link
            div.innerHTML = `<a href="${apiBaseUrl}/test/download?filePath=${encodeURIComponent(item.path)}" target="_blank">📄 ${item.name}</a> <span class="size">(${formatBytes(item.size)})</span>`;
            console.log(`Generated download link for file: ${item.name}`);
        }

        viewer.appendChild(div); // Add the 'div' to the viewer container
    });
}

/// API INTERFACE FUNCTIONS
/** fetchData
 * Fetches and displays the contents of the given directory path.
 *
 * @param {string} path - The directory path to fetch (default is root).
 * Makes a GET request to the "/browse" API and updates the UI with the results.
 * Also updates the breadcrumb and directory stats.
 */
async function fetchData(path = "") {
    const viewer = document.getElementById("directory-viewer");
    const fileCountElement = document.getElementById("file-count");
    const folderCountElement = document.getElementById("folder-count");
    const totalSizeElement = document.getElementById("total-size");

    // Guard: Ensure containers exist
    if (!viewer || !fileCountElement || !folderCountElement || !totalSizeElement) {
        console.error("Error: One or more elements are missing!");
        return;
    }

    viewer.innerHTML = "<p>Loading...</p>"; // Show loading message

    try {
        const response = await fetch(`${apiBaseUrl}/test/browse?path=${encodeURIComponent(path)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("API Response for path:", path, data);

        if (!isValidApiResponse(data)) {
            throw new Error("Invalid API response");
        }

        renderBreadcrumb(data.path); // Render breadcrumbs
        renderContent(data.contents); // Render directory contents

        // Render stats
        fileCountElement.textContent = `Files: ${data.fileCount}`;
        folderCountElement.textContent = `Folders: ${data.folderCount}`;
        totalSizeElement.textContent = `Total Size: ${formatBytes(data.totalSize)}`;
    } catch (error) {
        console.error("Error fetching data:", error);
        viewer.innerHTML = "<p class='error'>Failed to load directory contents.</p>";
    }
}

/** updateStats
 * Updates the directory statistics (file and folder counts, total size).
 *
 * @param {number} fileCount - The number of files in the current directory.
 * @param {number} folderCount - The number of folders in the current directory.
 * @param {number} totalSize - The total size of all files in the current directory.
 * Updates the "directory-stats" section with the provided values.
 */
function updateStats(fileCount, folderCount, totalSize) {
    document.getElementById("file-count").textContent = `Files: ${fileCount}`;
    document.getElementById("folder-count").textContent = `Folders: ${folderCount}`;
    document.getElementById("total-size").textContent = `Total Size: ${formatBytes(totalSize)}`;
}

/** handleSearch
 * Performs a search for files and folders matching the query in the given path.
 *
 * @param {string} query - The search term (required).
 * @param {string} path - The directory path to search in (default is root).
 * Makes a GET request to the "/search" API and updates the UI with the results.
 */
function handleSearch(query, path = "") {
    const encodedQuery = encodeURIComponent(query);
    const encodedPath = path.includes('%') ? path : encodeURIComponent(path); // Avoid double-encoding

    const searchUrl = `${apiBaseUrl}/test/search?query=${encodedQuery}&path=${encodedPath}`;
    console.log("Search URL:", searchUrl);

    fetch(searchUrl)
        .then((response) => {
            console.log("Raw Response:", response);
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("Parsed Response:", data);
            if (isValidApiResponse(data)) {
                renderBreadcrumb(data.path);
                renderContent(data.matches);
            } else {
                console.error("Invalid API response:", data);
                alert("Search returned unexpected data.");
            }
        })
        .catch((error) => {
            console.error("Error during search:", error);
            alert("Failed to perform search. Check the console for details.");
        });
}



/// EVENT HANDLERS
/** DOMContentLoaded
 * Initializes the application when the DOM is fully loaded.
 * - Fetches the initial directory contents based on the URL hash.
 * - Sets up a single event listener for hash changes.
 * - Sets up event listeners for file uploads and searches.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Initialize the app
    const path = decodeURIComponent(location.hash.slice(1)) || "";
    fetchData(path);

    // Listen for hash changes
    window.addEventListener("hashchange", () => {
        const newPath = decodeURIComponent(location.hash.slice(1));
        fetchData(newPath);
    });

    // Search button event listener
    const searchButton = document.getElementById("search-button");
    if (searchButton) {
        searchButton.addEventListener("click", (e) => {
            e.preventDefault();
            const query = document.getElementById("search-input").value.trim();
            const currentPath = decodeURIComponent(location.hash.slice(1)) || "";
            if (query) {
                handleSearch(query, currentPath);
            }
        });
    }
});

/** upload-button
 * Handles the "Upload" button click event.
 * Triggers the file upload process using the `handleUpload` function.
 * Validates that a file is selected and displays alerts for upload success or failure.
 */
document.querySelector("#upload-button").addEventListener("click", () => {
    const fileInput = document.querySelector("#upload-input");

    if (!fileInput) {
        console.error("Upload input element not found.");
        alert("File input element is missing.");
        return;
    }

    if (!fileInput.files.length) {
        alert("No file selected for upload.");
        return;
    }

    const file = fileInput.files[0];

    // Get the current path from the URL hash
    const currentPath = decodeURIComponent(location.hash.slice(1)) || "";

    const formData = new FormData();
    formData.append("file", file);
    console.log("Current Path for Upload:", currentPath); // Add this
    formData.append("path", currentPath); // Pass the current path

    console.log("FormData before fetch:");
    formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    fetch(`${apiBaseUrl}/test/upload`, {
        method: "POST",
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("File uploaded successfully:", data);
            alert(`File uploaded successfully: ${data.fileName}`);
            fetchData(currentPath); // Refresh directory after upload
        })
        .catch((error) => {
            console.error("Error uploading file:", error);
            alert("Failed to upload file. Check the console for details.");
        });
});





