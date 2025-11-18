# Frontend Startup Script for Windows PowerShell

Write-Host "Starting DCW Dashboard Frontend..." -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Set environment variables for frontend
$env:VITE_API_URL = "http://localhost:3001/api"

Write-Host "Environment Variables Set:" -ForegroundColor Cyan
Write-Host "  VITE_API_URL: $env:VITE_API_URL" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting development server..." -ForegroundColor Green
npm run dev

