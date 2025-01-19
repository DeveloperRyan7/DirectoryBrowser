Project Name: TestProject
_______________________________________________________________________
Overview: 
This project is a Single Page Application (SPA) for browsing, 
searching, uploading, and downloading files and directories. 
The application is built with JavaScript for the frontend 
and .NET for the backend, leveraging ASP.NET Core to serve 
a RESTful API. It also includes recursive folder size 
calculation and breadcrumb navigation for a seamless user 
experience.
_______________________________________________________________________
Features:
Browse Directories: Navigate through directories on the server.
Search: Perform recursive searches for files and directories.
Upload Files: Upload files to the currently selected directory.
Download Files: Download files directly from the browser.
Breadcrumb Navigation: Easily navigate back to parent directories.
File and Folder Statistics: View the total file and folder 
	counts and sizes for the current view.
Deep-Linking: Shareable URLs for any directory or search result.
Responsive Design: Optimized for different screen sizes.
_______________________________________________________________________
Prerequisites:
Software:
	Visual Studio 2022 or later
	.NET SDK 6.0 or later
Libraries:
	No third-party JavaScript plugins are used.
_______________________________________________________________________
Folder Structure:
ProjectRoot/
|-- wwwroot/                 # Frontend files (HTML, CSS, JS)
|   |-- index.html          # Main HTML file
|   |-- style.css           # Styling for the app
|   |-- app.js              # Frontend JavaScript
|
|-- Controllers/            # ASP.NET Core controllers
|   |-- TestController.cs   # Main API controller
|
|-- Properties/             # Debugging and hosting configuration
|   |-- launchSettings.json # Debugging and hosting configuration
|
|-- appsettings.json        # Configuration file
|-- Program.cs              # Main entry point for the .NET app
_______________________________________________________________________
Setup Instructions:
Step 1: Extract the Zip Folder
	- Download and extract the provided zip folder.
	- Open the extracted folder in Visual Studio 2022.
Step 2: Configure the Backend
	- Open appsettings.json and set the HomeDirectory to the directory 
	you want to serve:
		{
		  "HomeDirectory": "C:\\path\\to\\directory"
		}
	- Ensure your directory path exists and has appropriate 
	read/write permissions.
Step 3: Build and Run the Application
	- Open the project in Visual Studio 2022.
	- Restore dependencies:
		- Should not be any dependencies
		- Use the built-in NuGet Package Manager 
		to restore dependencies for .NET.
	- Run the application:
		- Start the application using Ctrl+F5 or the 
		Run button in Visual Studio.
Step 4: Access the Application
	- Open your web browser.
	- Navigate to:
		- https://localhost:7146/ (default HTTPS endpoint)
		- http://localhost:5120/ (default HTTP endpoint)
_______________________________________________________________________
TESTING: Test API Endpoints
- Use a tool like Postman to test the following endpoints:
---------------------------
- Browse Directory
- GET /test/browse
- Query Parameters: path (optional)
- Example: https://localhost:7146/test/browse?path=Subfolder
---------------------------
- Search
- GET /test/search
- Query Parameters: query, path (optional)
- Example: https://localhost:7146/test/search?query=file&path=Subfolder
---------------------------
- Upload
- POST /test/upload
- Form Data: file, path (optional)
- Example: Upload a file to the current directory.
---------------------------
- Download
- GET /test/download
- Query Parameters: filePath
- Example: https://localhost:7146/test/download?filePath=Subfolder\\file.txt
_______________________________________________________________________
How to Use
Browse: Navigate through directories using the breadcrumb at the top.
Search: Enter a search term in the search bar to find files and folders.
Upload: Use the upload section to add files to the current directory.
Download: Click on a file name to download it directly.
