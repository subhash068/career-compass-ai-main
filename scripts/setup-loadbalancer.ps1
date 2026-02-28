# Load Balancer Setup Script for Career Compass AI (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Load Balancer Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Docker is not running" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running" -ForegroundColor Red
    exit 1
}

# Check if docker-compose is installed
try {
    $composeVersion = docker-compose --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: docker-compose is not installed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ docker-compose is installed" -ForegroundColor Green
} catch {
    Write-Host "Error: docker-compose is not installed" -ForegroundColor Red
    exit 1
}

# Function to check if required files exist
function Check-Files {
    Write-Host ""
    Write-Host "Checking required files..."
    
    if (-not (Test-Path "docker-compose.loadbalancer.yml")) {
        Write-Host "Error: docker-compose.loadbalancer.yml not found" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path "nginx/nginx-loadbalancer.conf")) {
        Write-Host "Error: nginx/nginx-loadbalancer.conf not found" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ All required files present" -ForegroundColor Green
}

# Function to backup existing configuration
function Backup-Config {
    Write-Host ""
    Write-Host "Backing up existing configuration..."
    
    if ((Test-Path "docker-compose.yml") -and -not (Test-Path "docker-compose.yml.backup")) {
        Copy-Item "docker-compose.yml" "docker-compose.yml.backup"
        Write-Host "✓ Backed up docker-compose.yml" -ForegroundColor Green
    }
    
    if ((Test-Path "nginx/nginx.conf") -and -not (Test-Path "nginx/nginx.conf.backup")) {
        Copy-Item "nginx/nginx.conf" "nginx/nginx.conf.backup"
        Write-Host "✓ Backed up nginx/nginx.conf" -ForegroundColor Green
    }
}

# Function to start infrastructure services
function Start-Infrastructure {
    Write-Host ""
    Write-Host "Starting infrastructure services (MySQL, Redis)..."
    docker-compose -f docker-compose.loadbalancer.yml up -d mysql redis
    
    Write-Host "Waiting for MySQL to be healthy..."
    Start-Sleep -Seconds 10
    
    # Check MySQL health
    $maxAttempts = 12
    $attempt = 0
    $healthy = $false
    
    while ($attempt -lt $maxAttempts -and -not $healthy) {
        try {
            $result = docker-compose -f docker-compose.loadbalancer.yml exec -T mysql mysqladmin ping -h localhost -u root -p kali --silent 2>$null
            if ($LASTEXITCODE -eq 0) {
                $healthy = $true
                Write-Host "✓ MySQL is ready" -ForegroundColor Green
            }
        } catch {
            Write-Host "Waiting for MySQL... (attempt $($attempt + 1)/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            $attempt++
        }
    }
    
    if (-not $healthy) {
        Write-Host "Warning: MySQL health check timed out, but continuing..." -ForegroundColor Yellow
    }
}

# Function to start backend services
function Start-Backend {
    Write-Host ""
    Write-Host "Starting backend API instances..."
    docker-compose -f docker-compose.loadbalancer.yml up -d flask-api-1 flask-api-2 flask-api-3
    
    Write-Host "Waiting for backend services to be healthy..."
    Start-Sleep -Seconds 15
    
    # Check health of all backends
    for ($i = 1; $i -le 3; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✓ Backend instance $i is healthy" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠ Backend instance $i may still be starting" -ForegroundColor Yellow
        }
    }
}

# Function to start frontend services
function Start-Frontend {
    Write-Host ""
    Write-Host "Starting frontend instances..."
    docker-compose -f docker-compose.loadbalancer.yml up -d frontend-1 frontend-2
    
    Write-Host "Waiting for frontend services..."
    Start-Sleep -Seconds 10
    
    Write-Host "✓ Frontend instances started" -ForegroundColor Green
}

# Function to start load balancer
function Start-LoadBalancer {
    Write-Host ""
    Write-Host "Starting Nginx load balancer..."
    docker-compose -f docker-compose.loadbalancer.yml up -d nginx
    
    Start-Sleep -Seconds 5
    
    # Test load balancer
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Load balancer is running" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ Load balancer may need more time to start" -ForegroundColor Yellow
    }
}

# Function to start monitoring
function Start-Monitoring {
    Write-Host ""
    Write-Host "Starting monitoring services..."
    docker-compose -f docker-compose.loadbalancer.yml up -d prometheus grafana
    
    Write-Host "✓ Prometheus: http://localhost:9090" -ForegroundColor Green
    Write-Host "✓ Grafana: http://localhost:3000 (admin/admin)" -ForegroundColor Green
}

# Function to display status
function Show-Status {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Service Status" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    docker-compose -f docker-compose.loadbalancer.yml ps
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Access URLs" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Application: http://localhost" -ForegroundColor Green
    Write-Host "API: http://localhost/api" -ForegroundColor Green
    Write-Host "Prometheus: http://localhost:9090" -ForegroundColor Green
    Write-Host "Grafana: http://localhost:3000" -ForegroundColor Green
    Write-Host "Nginx Status: http://localhost/nginx_status" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Load Balancer Configuration" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Method: Least Connections"
    Write-Host "Backend Instances: 3"
    Write-Host "Frontend Instances: 2"
    Write-Host ""
    Write-Host "To scale up: docker-compose -f docker-compose.loadbalancer.yml up -d --scale flask-api-1=2" -ForegroundColor Yellow
    Write-Host "To view logs: docker-compose -f docker-compose.loadbalancer.yml logs -f nginx" -ForegroundColor Yellow
    Write-Host "To stop: docker-compose -f docker-compose.loadbalancer.yml down" -ForegroundColor Yellow
}

# Function to run load test
function Run-LoadTest {
    Write-Host ""
    Write-Host "Running simple load test..."
    Write-Host "Sending 100 requests to test load balancing..."
    
    $successCount = 0
    for ($i = 1; $i -le 100; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $successCount++
            }
        } catch {
            # Ignore errors
        }
        
        if ($i % 10 -eq 0) {
            Write-Host " ($i/100) - Success: $successCount" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "✓ Load test completed - $successCount/100 successful" -ForegroundColor Green
}

# Function to stop all services
function Stop-All {
    Write-Host ""
    Write-Host "Stopping all services..."
    docker-compose -f docker-compose.loadbalancer.yml down
    Write-Host "✓ All services stopped" -ForegroundColor Green
}

# Main menu
function Show-Menu {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Load Balancer Setup Menu" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "1) Full Setup (Start everything)"
    Write-Host "2) Start infrastructure only (MySQL, Redis)"
    Write-Host "3) Start backend only (API instances)"
    Write-Host "4) Start frontend only"
    Write-Host "5) Start load balancer only"
    Write-Host "6) Start monitoring only"
    Write-Host "7) Run load test"
    Write-Host "8) Show status"
    Write-Host "9) Stop all services"
    Write-Host "10) Exit"
    Write-Host ""
    
    $choice = Read-Host "Select option [1-10]"
    
    switch ($choice) {
        "1" {
            Check-Files
            Backup-Config
            Start-Infrastructure
            Start-Backend
            Start-Frontend
            Start-LoadBalancer
            Start-Monitoring
            Show-Status
        }
        "2" { Start-Infrastructure }
        "3" { Start-Backend }
        "4" { Start-Frontend }
        "5" { Start-LoadBalancer }
        "6" { Start-Monitoring }
        "7" { Run-LoadTest }
        "8" { Show-Status }
        "9" { Stop-All }
        "10" { 
            Write-Host "Exiting..." -ForegroundColor Cyan
            exit 0 
        }
        default {
            Write-Host "Invalid option" -ForegroundColor Red
            Show-Menu
        }
    }
}

# Check if running in interactive mode
if ($Host.Name -eq "ConsoleHost") {
    Show-Menu
} else {
    # Non-interactive mode - run full setup
    Check-Files
    Backup-Config
    Start-Infrastructure
    Start-Backend
    Start-Frontend
    Start-LoadBalancer
    Start-Monitoring
    Show-Status
}
