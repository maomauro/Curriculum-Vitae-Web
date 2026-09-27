# ─── ETAPA 1: Compilación ───────────────────────────────────────────────────
# Usamos la imagen oficial del SDK de .NET 10 para compilar el proyecto.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

# Directorio de trabajo dentro del contenedor
WORKDIR /src

# Contexto de build = raiz del repo (no backend/): PortalCV.Infrastructure.csproj
# embebe los .sql de database/migrations/ como recurso (ver SchemaMigrationRunner.cs),
# y esa carpeta vive fuera de backend/.

# Copiamos primero archivos de solución y proyectos para aprovechar cache.
COPY ["backend/PortalCV.Backend/PortalCV.Backend.slnx", "backend/PortalCV.Backend/"]
COPY ["backend/PortalCV.Backend/PortalCV.Api/PortalCV.Api.csproj", "backend/PortalCV.Backend/PortalCV.Api/"]
COPY ["backend/PortalCV.Backend/PortalCV.Application/PortalCV.Application.csproj", "backend/PortalCV.Backend/PortalCV.Application/"]
COPY ["backend/PortalCV.Backend/PortalCV.Domain/PortalCV.Domain.csproj", "backend/PortalCV.Backend/PortalCV.Domain/"]
COPY ["backend/PortalCV.Backend/PortalCV.Infrastructure/PortalCV.Infrastructure.csproj", "backend/PortalCV.Backend/PortalCV.Infrastructure/"]
COPY ["database/migrations/", "database/migrations/"]
RUN dotnet restore "backend/PortalCV.Backend/PortalCV.Api/PortalCV.Api.csproj"

# Copiamos solo el codigo fuente del backend (evita copia recursiva del context).
COPY backend/PortalCV.Backend/ backend/PortalCV.Backend/

# Compilamos y publicamos en modo Release en la carpeta /app/publish
RUN dotnet publish "backend/PortalCV.Backend/PortalCV.Api/PortalCV.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false


# ─── ETAPA 2: Ejecución ─────────────────────────────────────────────────────
# Usamos la imagen de runtime (más liviana, sin el SDK de compilación).
# Esta imagen oficial trae un usuario no-root llamado `app` (UID 1654).
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

# Copiamos los archivos publicados desde la etapa de build.
# Los mantenemos con owner=root para que el usuario `app` que ejecuta la API
# pueda leerlos y ejecutarlos, pero NO modificarlos (defensa ante RCE).
COPY --from=build /app/publish .

# Cambiamos al usuario no-root antes de ejecutar la API (defensa en profundidad).
USER app

# Puerto en el que escucha la API dentro del contenedor (no privilegiado).
EXPOSE 8080

# Comando que se ejecuta cuando arranca el contenedor.
ENTRYPOINT ["dotnet", "PortalCV.Api.dll"]
