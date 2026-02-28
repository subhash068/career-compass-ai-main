#!/bin/bash

# Load Balancer Setup Script for Career Compass AI

set -e

echo "=========================================="
echo "  Load Balancer Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Function to check if required files exist
check_files() {
    echo ""
    echo "Checking required files..."
    
    if [ ! -f "docker-compose.loadbalancer.yml" ]; then
        echo -e "${RED}Error: docker-compose.loadbalancer.yml not found${NC}"
        exit 1
    fi
    
    if [ ! -f "nginx/nginx-loadbalancer.conf" ]; then
        echo -e "${RED}Error: nginx/nginx-loadbalancer.conf not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All required files present${NC}"
}

# Function to backup existing configuration
backup_config() {
    echo ""
    echo "Backing up existing configuration..."
    
    if [ -f "docker-compose.yml" ] && [ ! -f "docker-compose.yml.backup" ]; then
        cp docker-compose.yml docker-compose.yml.backup
        echo -e "${GREEN}✓ Backed up docker-compose.yml${NC}"
    fi
    
    if [ -f "nginx/nginx.conf" ] && [ ! -f "nginx/nginx.conf.backup" ]; then
        cp nginx/nginx.conf nginx/nginx.conf.backup
        echo -e "${GREEN}✓ Backed up nginx/nginx.conf${NC}"
    fi
}

# Function to start infrastructure services
start_infrastructure() {
    echo ""
    echo "Starting infrastructure services (MySQL, Redis)..."
    docker-compose -f docker-compose.loadbalancer.yml up -d mysql redis
    
    echo "Waiting for MySQL to be healthy..."
    sleep 10
    
    # Check MySQL health
    until docker-compose -f docker-compose.loadbalancer.yml exec -T mysql mysqladmin ping -h localhost -u root -p kali --silent; do
        echo -e "${YELLOW}Waiting for MySQL...${NC}"
        sleep 5
    done
    
    echo -e "${GREEN}✓ MySQL is ready${NC}"
}

# Function to start backend services
start_backend() {
    echo ""
    echo "Starting backend API instances..."
    docker-compose -f docker-compose.loadbalancer.yml up -d flask-api-1 flask-api-2 flask-api-3
    
    echo "Waiting for backend services to be healthy..."
    sleep 15
    
    # Check health of all backends
    for i in 1 2 3; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend instance $i is healthy${NC}"
        else
            echo -e "${YELLOW}⚠ Backend instance $i may still be starting${NC}"
        fi
    done
}

# Function to start frontend services
start_frontend() {
    echo ""
    echo "Starting frontend instances..."
    docker-compose -f docker-compose.loadbalancer.yml up -d frontend-1 frontend-2
    
    echo "Waiting for frontend services..."
    sleep 10
    
    echo -e "${GREEN}✓ Frontend instances started${NC}"
}

# Function to start load balancer
start_loadbalancer() {
    echo ""
    echo "Starting Nginx load balancer..."
    docker-compose -f docker-compose.loadbalancer.yml up -d nginx
    
    sleep 5
    
    # Test load balancer
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Load balancer is running${NC}"
    else
        echo -e "${YELLOW}⚠ Load balancer may need more time to start${NC}"
    fi
}

# Function to start monitoring
start_monitoring() {
    echo ""
    echo "Starting monitoring services..."
    docker-compose -f docker-compose.loadbalancer.yml up -d prometheus grafana
    
    echo -e "${GREEN}✓ Prometheus: http://localhost:9090${NC}"
    echo -e "${GREEN}✓ Grafana: http://localhost:3000 (admin/admin)${NC}"
}

# Function to display status
show_status() {
    echo ""
    echo "=========================================="
    echo "  Service Status"
    echo "=========================================="
    docker-compose -f docker-compose.loadbalancer.yml ps
    
    echo ""
    echo "=========================================="
    echo "  Access URLs"
    echo "=========================================="
    echo -e "${GREEN}Application:${NC} http://localhost"
    echo -e "${GREEN}API:${NC} http://localhost/api"
    echo -e "${GREEN}Prometheus:${NC} http://localhost:9090"
    echo -e "${GREEN}Grafana:${NC} http://localhost:3000"
    echo -e "${GREEN}Nginx Status:${NC} http://localhost/nginx_status"
    
    echo ""
    echo "=========================================="
    echo "  Load Balancer Configuration"
    echo "=========================================="
    echo "Method: Least Connections"
    echo "Backend Instances: 3"
    echo "Frontend Instances: 2"
    echo ""
    echo "To scale up: docker-compose -f docker-compose.loadbalancer.yml up -d --scale flask-api-1=2"
    echo "To view logs: docker-compose -f docker-compose.loadbalancer.yml logs -f nginx"
    echo "To stop: docker-compose -f docker-compose.loadbalancer.yml down"
}

# Function to run load test
run_load_test() {
    echo ""
    echo "Running simple load test..."
    echo "Sending 100 requests to test load balancing..."
    
    for i in {1..100}; do
        curl -s -o /dev/null -w "%{http_code}" http://localhost/health
        if [ $((i % 10)) -eq 0 ]; then
            echo " ($i/100)"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✓ Load test completed${NC}"
}

# Main menu
show_menu() {
    echo ""
    echo "=========================================="
    echo "  Load Balancer Setup Menu"
    echo "=========================================="
    echo "1) Full Setup (Start everything)"
    echo "2) Start infrastructure only (MySQL, Redis)"
    echo "3) Start backend only (API instances)"
    echo "4) Start frontend only"
    echo "5) Start load balancer only"
    echo "6) Start monitoring only"
    echo "7) Run load test"
    echo "8) Show status"
    echo "9) Stop all services"
    echo "10) Exit"
    echo ""
    read -p "Select option [1-10]: " choice
    
    case $choice in
        1)
            check_files
            backup_config
            start_infrastructure
            start_backend
            start_frontend
            start_loadbalancer
            start_monitoring
            show_status
            ;;
        2)
            start_infrastructure
            ;;
        3)
            start_backend
            ;;
        4)
            start_frontend
            ;;
        5)
            start_loadbalancer
            ;;
        6)
            start_monitoring
            ;;
        7)
            run_load_test
            ;;
        8)
            show_status
            ;;
        9)
            echo "Stopping all services..."
            docker-compose -f docker-compose.loadbalancer.yml down
            echo -e "${GREEN}✓ All services stopped${NC}"
            ;;
        10)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            show_menu
            ;;
    esac
}

# Check if running in interactive mode
if [ -t 0 ]; then
    show_menu
else
    # Non-interactive mode - run full setup
    check_files
    backup_config
    start_infrastructure
    start_backend
    start_frontend
    start_loadbalancer
    start_monitoring
    show_status
fi
