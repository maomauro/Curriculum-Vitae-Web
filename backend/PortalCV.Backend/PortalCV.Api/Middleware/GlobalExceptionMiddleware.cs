using System.Net;
using System.Text.Json;
using PortalCV.Application.Constants;

namespace PortalCV.Api.Middleware;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Recurso no encontrado en {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorResponseAsync(context, (int)HttpStatusCode.NotFound, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Acceso no autorizado en {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorResponseAsync(context, (int)HttpStatusCode.Forbidden, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado en la solicitud {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorResponseAsync(
                context,
                (int)HttpStatusCode.InternalServerError,
                ApiMessages.General.ErrorInternoServidor);
        }
    }

    private static Task WriteErrorResponseAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var payload = JsonSerializer.Serialize(new { message, statusCode });
        return context.Response.WriteAsync(payload);
    }
}
