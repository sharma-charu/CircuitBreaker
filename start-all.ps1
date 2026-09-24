# PowerShell Cluster Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   Starting Circuit Breaker Microservices & Resilience Dashboard" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
node service-orchestrator.js
