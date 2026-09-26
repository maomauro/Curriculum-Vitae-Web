#!/bin/sh
# Arma la connection string a MariaDB a partir de las variables MARIADB_* (ver
# docker/mariadb.local.env) y arranca la API con hot-reload (dotnet watch).
#
# El host es siempre "db": dentro de la red del docker-compose, MariaDB se alcanza
# por el nombre del servicio, no por host.docker.internal (eso solo aplica al flujo
# de `docker run` suelto documentado en docker/backend.local.env.mariadb.example).
set -e

export ConnectionStrings__DefaultConnection="server=db;port=3306;database=${MARIADB_DATABASE};user=${MARIADB_USER};password=${MARIADB_PASSWORD};"

exec dotnet watch run \
  --project PortalCV.Api/PortalCV.Api.csproj \
  --urls http://+:8080 \
  --no-launch-profile
