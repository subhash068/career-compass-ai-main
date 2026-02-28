# Load Balancer Setup Guide

## Overview
This setup provides horizontal scaling with load balancing for your Career Compass AI application using Nginx as a reverse proxy and load balancer.

## Architecture

```
                    ┌─────────────┐
                    │    NGINX    │
                    │ Load Balancer│
                    │   (Port 80) │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
      │Backend 1│     │Backend 2│     │Backend 3│
      │:5000    │     │:5000    │     │:5000    │
      └─────────┘     └─────────┘     └─────────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────┴──────┐
                    │   MySQL     │
                    │   Redis     │
                    └─────────────┘
```

## Load Balancing Methods

### 1. Least Connections (Default)
Routes to the server with the fewest active connections. Best for:
- Variable request processing times
- Long-running requests
- WebSocket connections

### 2. Round Robin (Alternative)
Distributes requests evenly in a circular manner. Best for:
- Similar server capabilities
- Short, uniform requests

### 3. IP Hash (Alternative)
Routes based on client IP for session persistence. Best for:
- Sticky sessions required
- Stateful applications

## Quick Start

### Option 1: Using Docker Compose with Load Balancer

```bash
# Start with load balancer configuration
docker-compose -f docker-compose.loadbalancer.yml up -d

# Scale backend instances
docker-compose -f docker-compose.loadbalancer.yml up -d --scale flask-api-1=1 --scale flask-api-2=1 --scale flask-api-3=1

# Scale frontend instances
docker-compose -f docker-compose.loadbalancer.yml up -d --scale frontend-1=1 --scale frontend-2=1
```

### Option 2: Manual Scaling with Original Compose

```bash
# Start infrastructure
docker-compose up -d mysql redis

# Start multiple backend instances on different ports
docker-compose up -d flask-api
docker-compose run -d -p 5001:5000 --name flask-api-2 flask-api
docker-compose run -d -p 5002:5000 --name flask-api-3 flask-api

# Update nginx.conf upstream to use:
# upstream flask_api {
#     server flask-api:5000;
#     server flask-api-2:5001;
#     server flask-api-3:5002;
# }
```

## Configuration Files

### 1. nginx-loadbalancer.conf
- **Location**: `nginx/nginx-loadbalancer.conf`
- **Features**:
  - Least connections load balancing
  - Health checks (passive)
  - Connection pooling (keepalive)
  - Rate limiting
  - WebSocket support
  - Gzip compression

### 2. docker-compose.loadbalancer.yml
- **Location**: `docker-compose.loadbalancer.yml`
- **Services**:
  - 3x Backend API instances
  - 2x Frontend instances
  - MySQL, Redis (shared)
  - Prometheus, Grafana (monitoring)
  - Nginx (load balancer)

## Health Checks

Each backend instance has health checks configured:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Monitoring

### Nginx Status Page
Access at: `http://localhost/nginx_status`

Shows:
- Active connections
- Accepted connections
- Handled connections
- Requests per second

### Prometheus Metrics
Configure Prometheus to scrape Nginx metrics for:
- Request latency
- Upstream response times
- Error rates
- Connection counts

### Grafana Dashboard
Import dashboard ID: `9614` (Nginx) for visual monitoring.

## Performance Tuning

### Nginx Worker Processes
```nginx
worker_processes auto;  # Matches CPU cores
worker_connections 4096; # Per worker
```

### Connection Pooling
```nginx
upstream flask_api {
    keepalive 32;  # Persistent connections
    # ... servers
}
```

### Buffer Settings
```nginx
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
```

## SSL/TLS Termination

To enable HTTPS at the load balancer:

1. Add certificates to `nginx/ssl/`
2. Uncomment HTTPS server block in `nginx-loadbalancer.conf`
3. Update docker-compose to expose port 443

## Troubleshooting

### Check Backend Health
```bash
curl http://localhost/health
```

### View Nginx Logs
```bash
docker-compose logs nginx
```

### Test Load Balancing
```bash
# Run multiple requests and check which backend handles them
for i in {1..10}; do curl -s http://localhost/api/health; done
```

### Check Active Connections
```bash
docker exec -it <nginx-container> nginx -s reload
docker exec -it <nginx-container> cat /var/log/nginx/access.log
```

## Scaling Commands

```bash
# Scale up backend to 5 instances
docker-compose -f docker-compose.loadbalancer.yml up -d --scale flask-api-1=2 --scale flask-api-2=2 --scale flask-api-3=1

# Scale down
docker-compose -f docker-compose.loadbalancer.yml up -d --scale flask-api-1=1 --scale flask-api-2=1 --scale flask-api-3=1

# Zero-downtime deployment
docker-compose -f docker-compose.loadbalancer.yml up -d --no-deps --build flask-api-1
sleep 5
docker-compose -f docker-compose.loadbalancer.yml up -d --no-deps --build flask-api-2
sleep 5
docker-compose -f docker-compose.loadbalancer.yml up -d --no-deps --build flask-api-3
```

## Advanced Features

### Session Persistence (Sticky Sessions)
```nginx
upstream flask_api {
    ip_hash;  # or hash $cookie_sessionid consistent;
    server flask-api-1:5000;
    server flask-api-2:5000;
}
```

### Weighted Load Balancing
```nginx
upstream flask_api {
    server flask-api-1:5000 weight=3;  # 3x more traffic
    server flask-api-2:5000 weight=1;
    server flask-api-3:5000 weight=1;
}
```

### Backup Servers
```nginx
upstream flask_api {
    server flask-api-1:5000;
    server flask-api-2:5000;
    server flask-api-3:5000 backup;  # Only used when others fail
}
```

## Production Considerations

1. **Use Docker Swarm or Kubernetes** for auto-scaling
2. **Enable active health checks** with nginx-plus or third-party modules
3. **Configure log aggregation** (ELK stack or similar)
4. **Set up alerting** for high error rates or latency
5. **Use a CDN** for static assets
6. **Implement circuit breakers** for fault tolerance
