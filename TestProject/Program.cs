namespace TestProject {
    public class Program {
        public static void Main(string[] args) {
            var builder = WebApplication.CreateBuilder(args);

            // Configure Kestrel to use the specified ports
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.ListenLocalhost(5120); // HTTP
                options.ListenLocalhost(7146, listenOptions => listenOptions.UseHttps()); // HTTPS
            });

            // Add services to the container.
            builder.Services.AddControllers();

            var app = builder.Build();

            // Capture all unhandled exceptions
            app.Use(async (context, next) =>
            {
                try
                {
                    await next.Invoke();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Unhandled exception: {ex.Message}");
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsync("An unexpected error occurred.");
                }
            });

            // Log when the server starts
            app.Logger.LogInformation("Application started. Listening on: https://localhost:7146 and http://localhost:5120");

            // Configure the HTTP request pipeline.
            app.UseHttpsRedirection();

            // Enable static file serving
            app.UseStaticFiles();

            // Enable routing
            app.UseRouting();

            // Map API controllers
            app.MapControllers();

            // Fallback to index.html for Single Page Application (SPA)
            app.MapFallbackToFile("index.html");

            app.Run();

        }
    }
}