# Backend Server Startup Script for Windows PowerShell
# Sets environment variables and starts the development server

Write-Host "Starting DCW Dashboard Backend..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Set Environment Variables
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "dashboard"
$env:DB_USER = "root"
$env:DB_PASSWORD = "mysql"
$env:PORT = "3001"
$env:NODE_ENV = "development"

Write-Host ""
Write-Host "Environment Variables Set:" -ForegroundColor Cyan
Write-Host "  DB_HOST: $env:DB_HOST" -ForegroundColor White
Write-Host "  DB_PORT: $env:DB_PORT" -ForegroundColor White
Write-Host "  DB_NAME: $env:DB_NAME" -ForegroundColor Yellow
Write-Host "  DB_USER: $env:DB_USER" -ForegroundColor White
Write-Host "  PORT: $env:PORT" -ForegroundColor White
Write-Host ""

# Start the server
Write-Host "Starting backend server on port $env:PORT..." -ForegroundColor Green
npm run dev

