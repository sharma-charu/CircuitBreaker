@echo off
TITLE Microservices Cluster Orchestrator
cd /d "%~dp0"
echo =====================================================================
echo   Starting Circuit Breaker Microservices & Resilience Dashboard
echo =====================================================================
node service-orchestrator.js
pause
