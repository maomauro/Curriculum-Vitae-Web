# ─── ETAPA 1: Compilación ───────────────────────────────────────────────────
# Usamos la imagen oficial del SDK de .NET 10 para compilar el proyecto.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

# Directorio de trabajo dentro del contenedor
WORKDIR /src

# Copiamos primero archivos de solución y proyectos para aprovechar cache.
COPY ["PortalCV.Backend/PortalCV.Backend.slnx", "PortalCV.Backend/"]
COPY ["PortalCV.Backend/PortalCV.Api/PortalCV.Api.csproj", "PortalCV.Backend/PortalCV.Api/"]
COPY ["PortalCV.Backend/PortalCV.Application/PortalCV.Application.csproj", "PortalCV.Backend/PortalCV.Application/"]
COPY ["PortalCV.Backend/PortalCV.Domain/PortalCV.Domain.csproj", "PortalCV.Backend/PortalCV.Domain/"]
COPY ["PortalCV.Backend/PortalCV.Infrastructure/PortalCV.Infrastructure.csproj", "PortalCV.Backend/PortalCV.Infrastructure/"]
RUN dotnet restore "PortalCV.Backend/PortalCV.Api/PortalCV.Api.csproj"

# Copiamos el resto del código fuente
COPY . .

# Compilamos y publicamos en modo Release en la carpeta /app/publish
RUN dotnet publish "PortalCV.Backend/PortalCV.Api/PortalCV.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false


# ─── ETAPA 2: Ejecución ─────────────────────────────────────────────────────
# Usamos la imagen de runtime (más liviana, sin el SDK de compilación).
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

# Copiamos solo los archivos publicados desde la etapa de build
COPY --from=build /app/publish .

# Puerto en el que escucha la API dentro del contenedor
EXPOSE 8080

# Comando que se ejecuta cuando arranca el contenedor.
ENTRYPOINT ["dotnet", "PortalCV.Api.dll"]
