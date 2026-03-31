# ─── ETAPA 1: Compilación ───────────────────────────────────────────────────
# Usamos la imagen oficial del SDK de .NET 8 para compilar el proyecto.
# Esta imagen incluye todo lo necesario para compilar pero NO se incluye
# en la imagen final (solo se usa dentro del proceso de build).
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Directorio de trabajo dentro del contenedor
WORKDIR /src

# Copiamos primero el archivo de proyecto para restaurar dependencias.
# Esto aprovecha el cache de Docker: si no cambia el .csproj, no re-descarga.
COPY ["*.csproj", "./"]
RUN dotnet restore

# Copiamos el resto del código fuente
COPY . .

# Compilamos y publicamos en modo Release en la carpeta /app/publish
RUN dotnet publish -c Release -o /app/publish


# ─── ETAPA 2: Ejecución ─────────────────────────────────────────────────────
# Usamos la imagen de runtime (más liviana, sin el SDK de compilación).
# Esto reduce el tamaño final del contenedor considerablemente.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# Copiamos solo los archivos publicados desde la etapa de build
COPY --from=build /app/publish .

# Puerto en el que escucha la API dentro del contenedor
EXPOSE 8080

# Comando que se ejecuta cuando arranca el contenedor.
# Reemplaza "BackendApp" con el nombre real de tu .dll cuando tengas el proyecto.
ENTRYPOINT ["dotnet", "BackendApp.dll"]
