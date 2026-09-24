@echo off
TITLE Microservices Cluster Stopper
cd /d "%~dp0"
echo =====================================================================
echo   Stopping all Microservice processes on ports (8761, 8080, 8081, 8082, 8083, 5173)...
echo =====================================================================
node service-orchestrator.js --stop
pause
