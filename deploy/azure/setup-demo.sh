#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  bash deploy/azure/setup-demo.sh [options]

What it does (demo-oriented):
  1. Provisions Azure services needed by this repo:
     - Resource Group
     - Azure Container Registry (ACR)
     - Azure Container Apps Environment
     - Azure Database for PostgreSQL Flexible Server + database
  2. Builds/pushes backend + dashboard images to ACR using ACR Tasks
  3. Deploys backend + dashboard to Azure Container Apps
  4. Pins both apps to a single replica (min=1, max=1)

Options:
  --subscription-id <id>           Azure subscription ID (default: current az account)
  --resource-group <name>          Resource group name (default: ambulink-demo-rg)
  --location <azure-region>        Azure region (default: southeastasia)
  --prefix <name-prefix>           Prefix for resource names (default: ambulinkdemo)
  --acr-name <name>                Override ACR name
  --env-name <name>                Override Container Apps environment name
  --backend-app <name>             Override backend Container App name
  --dashboard-app <name>           Override dashboard Container App name
  --pg-server <name>               Override PostgreSQL server name
  --pg-db <name>                   PostgreSQL database name (default: ambulink)
  --pg-admin-user <name>           PostgreSQL admin username (default: ambuadmin)
  --pg-admin-password <password>   PostgreSQL admin password (auto-generated if omitted)
  --jwt-secret <value>             Backend JWT secret (auto-generated if omitted)
  --image-tag <tag>                Docker tag for both images (default: utc timestamp)
  --vite-dispatcher-id <uuid>      Optional Vite build arg
  --vite-provider-id <uuid>        Optional Vite build arg
  --skip-db-init                   Skip migration + seed step
  --help                           Show this help

USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found" >&2
    exit 1
  fi
}

info() {
  echo "[INFO] $*"
}

warn() {
  echo "[WARN] $*"
}

error() {
  echo "[ERROR] $*" >&2
}

slugify() {
  local value="$1"
  value="${value,,}"
  value="$(echo "$value" | tr -cd 'a-z0-9-')"
  value="${value#-}"
  value="${value%-}"
  echo "$value"
}

resource_exists() {
  local cmd="$1"
  if eval "$cmd" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

SUBSCRIPTION_ID=""
RESOURCE_GROUP="ambulink-demo-rg"
LOCATION="southeastasia"
PREFIX="ambulinkdemo"
ACR_NAME=""
CONTAINERAPPS_ENV=""
BACKEND_APP=""
DASHBOARD_APP=""
PG_SERVER=""
PG_DB="ambulink"
PG_ADMIN_USER="ambuadmin"
PG_ADMIN_PASSWORD=""
PG_ADMIN_PASSWORD_EXPLICIT=false
JWT_SECRET=""
JWT_SECRET_EXPLICIT=false
IMAGE_TAG="demo-$(date -u +%Y%m%d%H%M%S)"
VITE_DISPATCHER_ID=""
VITE_PROVIDER_ID=""
SKIP_DB_INIT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --subscription-id)
      SUBSCRIPTION_ID="$2"
      shift 2
      ;;
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
      shift 2
      ;;
    --prefix)
      PREFIX="$2"
      shift 2
      ;;
    --acr-name)
      ACR_NAME="$2"
      shift 2
      ;;
    --env-name)
      CONTAINERAPPS_ENV="$2"
      shift 2
      ;;
    --backend-app)
      BACKEND_APP="$2"
      shift 2
      ;;
    --dashboard-app)
      DASHBOARD_APP="$2"
      shift 2
      ;;
    --pg-server)
      PG_SERVER="$2"
      shift 2
      ;;
    --pg-db)
      PG_DB="$2"
      shift 2
      ;;
    --pg-admin-user)
      PG_ADMIN_USER="$2"
      shift 2
      ;;
    --pg-admin-password)
      PG_ADMIN_PASSWORD="$2"
      PG_ADMIN_PASSWORD_EXPLICIT=true
      shift 2
      ;;
    --jwt-secret)
      JWT_SECRET="$2"
      JWT_SECRET_EXPLICIT=true
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --vite-dispatcher-id)
      VITE_DISPATCHER_ID="$2"
      shift 2
      ;;
    --vite-provider-id)
      VITE_PROVIDER_ID="$2"
      shift 2
      ;;
    --skip-db-init)
      SKIP_DB_INIT=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      error "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

require_cmd az
require_cmd openssl

if [[ -z "$SUBSCRIPTION_ID" ]]; then
  SUBSCRIPTION_ID="$(az account show --query id -o tsv 2>/dev/null || true)"
fi

if [[ -z "$SUBSCRIPTION_ID" ]]; then
  error "Could not determine subscription id. Pass --subscription-id explicitly."
  exit 1
fi

PREFIX="$(slugify "$PREFIX")"
if [[ -z "$PREFIX" ]]; then
  error "Prefix resolves to empty after sanitization."
  exit 1
fi

if [[ -z "$ACR_NAME" ]]; then
  ACR_NAME="$(echo "${PREFIX}acr" | tr -cd 'a-z0-9' | cut -c1-50)"
fi
if [[ -z "$CONTAINERAPPS_ENV" ]]; then
  CONTAINERAPPS_ENV="$(slugify "${PREFIX}-env" | cut -c1-32)"
fi
if [[ -z "$BACKEND_APP" ]]; then
  BACKEND_APP="$(slugify "${PREFIX}-backend" | cut -c1-32)"
fi
if [[ -z "$DASHBOARD_APP" ]]; then
  DASHBOARD_APP="$(slugify "${PREFIX}-dashboard" | cut -c1-32)"
fi
if [[ -z "$PG_SERVER" ]]; then
  PG_SERVER="$(slugify "${PREFIX}-pg" | cut -c1-63)"
fi

if [[ -z "$PG_ADMIN_PASSWORD" ]]; then
  PG_ADMIN_PASSWORD="$(openssl rand -hex 16)"
fi

if [[ -z "$JWT_SECRET" ]]; then
  JWT_SECRET="$(openssl rand -hex 32)"
fi

if [[ ${#JWT_SECRET} -lt 32 ]]; then
  error "JWT secret must be at least 32 chars."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

info "Using subscription: $SUBSCRIPTION_ID"
info "Using resource group: $RESOURCE_GROUP"
info "Using location: $LOCATION"
info "Using ACR: $ACR_NAME"
info "Using Container Apps env: $CONTAINERAPPS_ENV"
info "Using backend app: $BACKEND_APP"
info "Using dashboard app: $DASHBOARD_APP"
info "Using PostgreSQL server: $PG_SERVER"

az extension add --name containerapp --upgrade --only-show-errors >/dev/null
az provider register --namespace Microsoft.App --wait >/dev/null
az provider register --namespace Microsoft.OperationalInsights --wait >/dev/null
az provider register --namespace Microsoft.DBforPostgreSQL --wait >/dev/null

az account set --subscription "$SUBSCRIPTION_ID"

info "Ensuring resource group"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --only-show-errors >/dev/null

if resource_exists "az acr show -g '$RESOURCE_GROUP' -n '$ACR_NAME'"; then
  info "ACR exists: $ACR_NAME"
else
  info "Creating ACR: $ACR_NAME"
  az acr create -g "$RESOURCE_GROUP" -n "$ACR_NAME" --sku Basic --only-show-errors >/dev/null
fi

az acr update -g "$RESOURCE_GROUP" -n "$ACR_NAME" --admin-enabled true --only-show-errors >/dev/null
ACR_LOGIN_SERVER="$(az acr show -g "$RESOURCE_GROUP" -n "$ACR_NAME" --query loginServer -o tsv)"
ACR_USER="$(az acr credential show -g "$RESOURCE_GROUP" -n "$ACR_NAME" --query username -o tsv)"
ACR_PASS="$(az acr credential show -g "$RESOURCE_GROUP" -n "$ACR_NAME" --query 'passwords[0].value' -o tsv)"

if resource_exists "az containerapp env show -g '$RESOURCE_GROUP' -n '$CONTAINERAPPS_ENV'"; then
  info "Container Apps environment exists: $CONTAINERAPPS_ENV"
else
  info "Creating Container Apps environment: $CONTAINERAPPS_ENV"
  az containerapp env create -g "$RESOURCE_GROUP" -n "$CONTAINERAPPS_ENV" -l "$LOCATION" --only-show-errors >/dev/null
fi

PG_EXISTS=false
if resource_exists "az postgres flexible-server show -g '$RESOURCE_GROUP' -n '$PG_SERVER'"; then
  PG_EXISTS=true
fi

if [[ "$PG_EXISTS" == true ]]; then
  info "PostgreSQL server exists: $PG_SERVER"
  if [[ "$PG_ADMIN_PASSWORD_EXPLICIT" != true ]]; then
    error "PostgreSQL server already exists. Re-run with --pg-admin-password for that existing server."
    exit 1
  fi
else
  info "Creating PostgreSQL flexible server (this can take a few minutes): $PG_SERVER"
  az postgres flexible-server create \
    -g "$RESOURCE_GROUP" \
    -n "$PG_SERVER" \
    -l "$LOCATION" \
    --tier Burstable \
    --sku-name Standard_B1ms \
    --storage-size 32 \
    --version 16 \
    --admin-user "$PG_ADMIN_USER" \
    --admin-password "$PG_ADMIN_PASSWORD" \
    --public-access 0.0.0.0 \
    --only-show-errors >/dev/null
fi

if resource_exists "az postgres flexible-server db show -g '$RESOURCE_GROUP' -s '$PG_SERVER' -d '$PG_DB'"; then
  info "PostgreSQL database exists: $PG_DB"
else
  info "Creating PostgreSQL database: $PG_DB"
  az postgres flexible-server db create -g "$RESOURCE_GROUP" -s "$PG_SERVER" -d "$PG_DB" --only-show-errors >/dev/null
fi

DATABASE_URL="postgres://${PG_ADMIN_USER}:${PG_ADMIN_PASSWORD}@${PG_SERVER}.postgres.database.azure.com:5432/${PG_DB}?sslmode=require"

BACKEND_REPO="ambulink-backend"
DASHBOARD_REPO="ambulink-dashboard"
BACKEND_IMAGE="${ACR_LOGIN_SERVER}/${BACKEND_REPO}:${IMAGE_TAG}"
DASHBOARD_IMAGE="${ACR_LOGIN_SERVER}/${DASHBOARD_REPO}:${IMAGE_TAG}"

info "Building backend image in ACR"
az acr build \
  -r "$ACR_NAME" \
  -t "${BACKEND_REPO}:${IMAGE_TAG}" \
  -f deploy/docker/Dockerfile.backend \
  "$ROOT_DIR" --only-show-errors >/dev/null

if resource_exists "az containerapp show -g '$RESOURCE_GROUP' -n '$BACKEND_APP'"; then
  info "Updating backend Container App"
  az containerapp secret set -g "$RESOURCE_GROUP" -n "$BACKEND_APP" \
    --secrets database-url="$DATABASE_URL" jwt-secret="$JWT_SECRET" --only-show-errors >/dev/null

  az containerapp update \
    -g "$RESOURCE_GROUP" \
    -n "$BACKEND_APP" \
    --image "$BACKEND_IMAGE" \
    --min-replicas 1 \
    --max-replicas 1 \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USER" \
    --registry-password "$ACR_PASS" \
    --set-env-vars \
      NODE_ENV=production \
      APP_STAGE=prod \
      PORT=3000 \
      AUTH_DISABLED=false \
      LOG_LEVEL=info \
      DATABASE_URL=secretref:database-url \
      JWT_SECRET=secretref:jwt-secret \
    --only-show-errors >/dev/null
else
  info "Creating backend Container App"
  az containerapp create \
    -g "$RESOURCE_GROUP" \
    -n "$BACKEND_APP" \
    --environment "$CONTAINERAPPS_ENV" \
    --image "$BACKEND_IMAGE" \
    --target-port 3000 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 1 \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USER" \
    --registry-password "$ACR_PASS" \
    --secrets database-url="$DATABASE_URL" jwt-secret="$JWT_SECRET" \
    --env-vars \
      NODE_ENV=production \
      APP_STAGE=prod \
      PORT=3000 \
      AUTH_DISABLED=false \
      LOG_LEVEL=info \
      DATABASE_URL=secretref:database-url \
      JWT_SECRET=secretref:jwt-secret \
    --only-show-errors >/dev/null
fi

BACKEND_FQDN="$(az containerapp show -g "$RESOURCE_GROUP" -n "$BACKEND_APP" --query properties.configuration.ingress.fqdn -o tsv)"
if [[ -z "$BACKEND_FQDN" ]]; then
  error "Could not resolve backend FQDN after deployment."
  exit 1
fi
BACKEND_BASE_URL="https://${BACKEND_FQDN}"
VITE_API_SERVER_URL="${BACKEND_BASE_URL}/api"
VITE_WS_SERVER_URL="wss://${BACKEND_FQDN}"

info "Building dashboard image in ACR"
az acr build \
  -r "$ACR_NAME" \
  -t "${DASHBOARD_REPO}:${IMAGE_TAG}" \
  -f deploy/docker/Dockerfile.dashboard \
  "$ROOT_DIR" \
  --build-arg VITE_API_SERVER_URL="$VITE_API_SERVER_URL" \
  --build-arg VITE_WS_SERVER_URL="$VITE_WS_SERVER_URL" \
  --build-arg VITE_DISPATCHER_ID="$VITE_DISPATCHER_ID" \
  --build-arg VITE_PROVIDER_ID="$VITE_PROVIDER_ID" \
  --only-show-errors >/dev/null

if resource_exists "az containerapp show -g '$RESOURCE_GROUP' -n '$DASHBOARD_APP'"; then
  info "Updating dashboard Container App"
  az containerapp update \
    -g "$RESOURCE_GROUP" \
    -n "$DASHBOARD_APP" \
    --image "$DASHBOARD_IMAGE" \
    --min-replicas 1 \
    --max-replicas 1 \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USER" \
    --registry-password "$ACR_PASS" \
    --only-show-errors >/dev/null
else
  info "Creating dashboard Container App"
  az containerapp create \
    -g "$RESOURCE_GROUP" \
    -n "$DASHBOARD_APP" \
    --environment "$CONTAINERAPPS_ENV" \
    --image "$DASHBOARD_IMAGE" \
    --target-port 80 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 1 \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USER" \
    --registry-password "$ACR_PASS" \
    --only-show-errors >/dev/null
fi

DASHBOARD_FQDN="$(az containerapp show -g "$RESOURCE_GROUP" -n "$DASHBOARD_APP" --query properties.configuration.ingress.fqdn -o tsv)"
DASHBOARD_URL="https://${DASHBOARD_FQDN}"

info "Setting backend CORS env to dashboard URL"
az containerapp update \
  -g "$RESOURCE_GROUP" \
  -n "$BACKEND_APP" \
  --set-env-vars \
    FRONTEND_URL="$DASHBOARD_URL" \
    FRONTEND_URLS="$DASHBOARD_URL" \
  --only-show-errors >/dev/null

if [[ "$SKIP_DB_INIT" == false ]]; then
  require_cmd npm
  info "Applying migrations"
  (
    cd "$ROOT_DIR"
    DATABASE_URL="$DATABASE_URL" npm run migrate:apply --prefix apps/backend >/dev/null
  )

  info "Seeding demo data"
  (
    cd "$ROOT_DIR"
    DATABASE_URL="$DATABASE_URL" npm run seed --prefix apps/backend >/dev/null
  )
else
  warn "Skipping DB migration + seed (--skip-db-init)."
fi

cat <<SUMMARY

Setup complete.

Backend URL:   ${BACKEND_BASE_URL}
Dashboard URL: ${DASHBOARD_URL}
Health URL:    ${BACKEND_BASE_URL}/health
Swagger URL:   ${BACKEND_BASE_URL}/docs

Resources:
  Resource group:          ${RESOURCE_GROUP}
  Container Apps env:      ${CONTAINERAPPS_ENV}
  Backend app:             ${BACKEND_APP}
  Dashboard app:           ${DASHBOARD_APP}
  ACR:                     ${ACR_NAME}
  PostgreSQL server:       ${PG_SERVER}
  PostgreSQL database:     ${PG_DB}
  Image tag used:          ${IMAGE_TAG}

Secrets generated:
  PostgreSQL admin password: ${PG_ADMIN_PASSWORD}
  JWT secret:                ${JWT_SECRET}

Store these securely.
SUMMARY
