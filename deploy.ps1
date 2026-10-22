# Windows PowerShell Deployment Script for Vahlay Task / Office CRM (Backend Only)
param (
    [switch]$IncludeClient = $false
)

$ErrorActionPreference = "Stop"

$SERVER_IP = "193.203.163.119"
$SERVER_USER = "vahlayconsulting"
$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying Vahlay Task Backend         " -ForegroundColor Cyan
Write-Host "  Domain: https://task.cloudastro.space " -ForegroundColor Cyan
Write-Host "  Port  : 5055                          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$tarFiles = @()

# 1. Client build (Skipped by default, enabled only with -IncludeClient)
if ($IncludeClient) {
    Write-Host "`n[1/3] Building client for production..." -ForegroundColor Yellow
    Push-Location "$ROOT_DIR\client"
    try {
        $env:VITE_API_URL = "https://task.cloudastro.space/api"
        npm run build
    } finally {
        Pop-Location
    }

    Write-Host "Compressing client build..." -ForegroundColor DarkGray
    Push-Location "$ROOT_DIR\client\dist"
    try {
        tar -czf "$ROOT_DIR\client_dist.tar.gz" *
        $tarFiles += "$ROOT_DIR\client_dist.tar.gz"
    } finally {
        Pop-Location
    }
} else {
    Write-Host "`nBackend-Only Mode (Skipping frontend client)..." -ForegroundColor Green
}

# 2. Archive Backend Files
Write-Host "`n[2/3] Preparing backend update archive..." -ForegroundColor Yellow
$tempStaging = "$ROOT_DIR\staging_backend"
if (Test-Path $tempStaging) { Remove-Item -Recurse -Force $tempStaging }
New-Item -ItemType Directory -Path "$tempStaging" -Force | Out-Null

# Copy backend source tree
Copy-Item -Recurse -Force "$ROOT_DIR\server\src" "$tempStaging\src"
Copy-Item -Force "$ROOT_DIR\server\package.json" "$tempStaging\"
if (Test-Path "$ROOT_DIR\server\package-lock.json") {
    Copy-Item -Force "$ROOT_DIR\server\package-lock.json" "$tempStaging\"
}
if (Test-Path "$ROOT_DIR\server\firebase-admin.json") {
    Copy-Item -Force "$ROOT_DIR\server\firebase-admin.json" "$tempStaging\"
}

# Copy client dist only if requested
if ($IncludeClient -and (Test-Path "$ROOT_DIR\client\dist")) {
    New-Item -ItemType Directory -Path "$tempStaging\public" -Force | Out-Null
    Copy-Item -Recurse -Force "$ROOT_DIR\client\dist\*" "$tempStaging\public\"
}

# Production .env for port 5055 and local MongoDB
$prodEnvContent = @"
PORT=5055
MONGO_URI=mongodb://localhost:27017/office_crm
JWT_SECRET=office_crm_jwt_super_secret_key_2026
NODE_ENV=production
"@
Set-Content -Path "$tempStaging\.env" -Value $prodEnvContent -Encoding UTF8

Push-Location $tempStaging
try {
    tar -czf "$ROOT_DIR\backend_patch.tar.gz" *
    $tarFiles += "$ROOT_DIR\backend_patch.tar.gz"
} finally {
    Pop-Location
    Remove-Item -Recurse -Force $tempStaging
}

# 3. Single SCP Upload (1 Connection)
Write-Host "`nUploading backend archive to production server..." -ForegroundColor Yellow
scp -o ConnectTimeout=15 $tarFiles "${SERVER_USER}@${SERVER_IP}:/tmp/"

# 4. Extract & Reload via PM2 (1 SSH Connection)
Write-Host "`n[3/3] Extracting backend & reloading PM2 process..." -ForegroundColor Yellow
$remoteScript = @'
set -e

mkdir -p ~/apps/vahlay-task/server

if [ -f /tmp/backend_patch.tar.gz ]; then
  echo "Extracting backend files to ~/apps/vahlay-task/server/..."
  tar -xzf /tmp/backend_patch.tar.gz -C ~/apps/vahlay-task/server/
  rm -f /tmp/backend_patch.tar.gz
fi

if [ -f /tmp/client_dist.tar.gz ]; then
  echo "Extracting frontend static build to ~/apps/vahlay-task/server/public/..."
  mkdir -p ~/apps/vahlay-task/server/public
  tar -xzf /tmp/client_dist.tar.gz -C ~/apps/vahlay-task/server/public/
  rm -f /tmp/client_dist.tar.gz
fi

cd ~/apps/vahlay-task/server
echo "Installing production dependencies..."
npm install --omit=dev --silent

echo "Reloading vahlay-task in PM2..."
if pm2 describe vahlay-task > /dev/null 2>&1; then
  pm2 reload vahlay-task --update-env
else
  pm2 start src/server.js --name vahlay-task
fi
pm2 save

sleep 2
echo "--- Verifying Health Endpoint ---"
curl -s http://127.0.0.1:5055/api/health
echo ""
'@

$remoteScript | ssh -o ConnectTimeout=15 "${SERVER_USER}@${SERVER_IP}" "bash"

# Cleanup local archives
Remove-Item -Force $tarFiles -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Backend deployed & reloaded in PM2!   " -ForegroundColor Green
Write-Host "  API: https://task.cloudastro.space/api" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
