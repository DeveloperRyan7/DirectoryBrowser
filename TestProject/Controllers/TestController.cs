using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace TestProject.Controllers {
    /// <summary>
    /// Handles operations for browsing, searching, uploading, downloading, and managing files and directories.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class TestController : ControllerBase {

        // Private Fields
        private readonly ILogger<TestController> _logger;
        private readonly string _homeDirectory;

        /// <summary>
        /// Constructor for the TestController
        /// </summary>
        /// <param name="configuration"></param>
        /// <param name="logger"></param>
        public TestController(IConfiguration configuration, ILogger<TestController> logger)
        {
            _logger = logger;
            _homeDirectory = configuration["HomeDirectory"];
        }

        // Private Helper Methods
        /// <summary>
        /// Recursively calculates the size of a directory.
        /// </summary>
        /// <param name="directoryPath"></param>
        /// <returns></returns>
        private long GetDirectorySize(string directoryPath)
        {
            long size = 0;

            try
            {
                // Get the sizes of all files in the directory
                size += Directory.GetFiles(directoryPath).Sum(file => new FileInfo(file).Length);

                // Recursively add the sizes of all subdirectories
                foreach (var subDir in Directory.GetDirectories(directoryPath))
                {
                    size += GetDirectorySize(subDir);
                }
            }
            catch (UnauthorizedAccessException)
            {
                // Handle access-denied errors gracefully
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error calculating size for directory {directoryPath}: {ex.Message}");
            }

            return size;
        }


        //Public Endpoin Methods
        /// <summary>
        /// Browses the contents of a directory.
        /// </summary>
        /// <param name="path"></param>
        /// <returns></returns>
        [HttpGet("browse")]
        public IActionResult Browse(string? path = "")
        {
            string resolvedPath = Path.Combine(_homeDirectory, path ?? "");

            // Prevent path traversal
            if (!resolvedPath.StartsWith(_homeDirectory))
            {
                return Forbid("Access denied.");
            }

            if (!Directory.Exists(resolvedPath))
            {
                return NotFound(new { error = "Directory not found." });
            }

            var contents = Directory.EnumerateFileSystemEntries(resolvedPath)
                .Select(entry => new
                {
                    Name = Path.GetFileName(entry),
                    Type = Directory.Exists(entry) ? "directory" : "file",
                    Size = Directory.Exists(entry) ? GetDirectorySize(entry) : new FileInfo(entry).Length, // Recursive size for folders
                    Path = entry.Replace(_homeDirectory, "").TrimStart(Path.DirectorySeparatorChar)
                });

            // Calculate counts and total size for the current directory
            int fileCount = contents.Count(item => item.Type == "file");
            int folderCount = contents.Count(item => item.Type == "directory");
            long totalSize = contents.Sum(item => item.Size);

            return Ok(new
            {
                path = path ?? "",
                fileCount,
                folderCount,
                totalSize, // Total size of all files and folders
                contents
            });
        }

        /// <summary>
        /// Searches for files and directories matching a query.
        /// </summary>
        /// <param name="query"></param>
        /// <param name="path"></param>
        /// <returns></returns>
        [HttpGet("search")]
        public IActionResult Search(string query, string? path = "")
        {
            Console.WriteLine($"Search endpoint hit: query={query}, path={path}");

            if (string.IsNullOrWhiteSpace(query))
            {
                Console.WriteLine("Query parameter is missing.");
                return BadRequest(new { error = "Query parameter is required." });
            }

            try
            {
                string decodedPath = Uri.UnescapeDataString(path ?? "");
                Console.WriteLine($"Decoded Path: {decodedPath}");

                string resolvedPath = Path.Combine(_homeDirectory, decodedPath);
                Console.WriteLine($"Resolved Path: {resolvedPath}");

                if (!resolvedPath.StartsWith(_homeDirectory))
                {
                    Console.WriteLine("Path traversal detected.");
                    return Forbid("Access denied.");
                }

                if (!Directory.Exists(resolvedPath))
                {
                    Console.WriteLine("Directory not found.");
                    return NotFound(new { error = "Directory not found." });
                }

                var matches = Directory.EnumerateFileSystemEntries(resolvedPath, $"*{query}*", SearchOption.AllDirectories)
                    .Select(entry => new
                    {
                        Name = Path.GetFileName(entry),
                        Type = Directory.Exists(entry) ? "directory" : "file",
                        Size = Directory.Exists(entry) ? GetDirectorySize(entry) : new FileInfo(entry).Length,
                        Path = entry.Replace(_homeDirectory, "").TrimStart(Path.DirectorySeparatorChar)
                    });

                return Ok(new { path = decodedPath, query, matches });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Search error: {ex.Message}");
                return StatusCode(500, new { error = "An unexpected error occurred." });
            }
        }

        // Upload and Download Operations
        /// <summary>
        /// Downloads a specified file.
        /// </summary>
        /// <param name="filePath"></param>
        /// <returns></returns>
        [HttpGet("download")]
        public IActionResult Download(string filePath)
        {
            Console.WriteLine($"Encoded filePath received: {filePath}");
            filePath = Uri.UnescapeDataString(filePath ?? "");
            Console.WriteLine($"Decoded filePath: {filePath}");

            string resolvedPath = Path.Combine(_homeDirectory, filePath);
            Console.WriteLine($"Resolved Path: {resolvedPath}");

            // Prevent path traversal
            if (!resolvedPath.StartsWith(_homeDirectory))
            {
                Console.WriteLine("Access denied: Path traversal attempt.");
                return Forbid("Access denied.");
            }

            if (!System.IO.File.Exists(resolvedPath))
            {
                Console.WriteLine($"File not found: {resolvedPath}");
                return NotFound(new { error = "File not found." });
            }

            try
            {
                var stream = new FileStream(resolvedPath, FileMode.Open, FileAccess.Read);
                string fileName = Path.GetFileName(resolvedPath);
                return File(stream, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error serving file: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Uploads a file to the specified directory.
        /// </summary>
        /// <param name="file"></param>
        /// <param name="path"></param>
        /// <returns></returns>
        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? path = "")
        {
            Console.WriteLine($"Path received on upload: {path}");
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "No file uploaded or file is empty." });
            }

            string resolvedPath = Path.Combine(_homeDirectory, path ?? "");

            // Prevent path traversal
            if (!resolvedPath.StartsWith(_homeDirectory))
            {
                return Forbid("Access denied.");
            }

            if (!Directory.Exists(resolvedPath))
            {
                return NotFound(new { error = "Directory not found." });
            }

            try
            {
                string fullPath = Path.Combine(resolvedPath, file.FileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(new { message = "File uploaded successfully.", fileName = file.FileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

    }
}