# Aereo GeoMeasure — Deployment Guide

This guide covers deploying Aereo GeoMeasure in various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Clone repository
git clone https://github.com/aereo/geomeasure.git
cd geomeasure

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend runs at: `http://127.0.0.1:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: `http://127.0.0.1:5173`

### Access Application

- **Application:** http://127.0.0.1:5173
- **API Docs:** http://127.0.0.1:8000/docs
- **Health Check:** http://127.0.0.1:8000/health

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Build Docker Images

```bash
# Build backend image
docker build -t aereo-geomeasure-backend:latest .

# Build frontend image (if separate Dockerfile exists)
docker build -t aereo-geomeasure-frontend:latest ./frontend
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - AEREO_LOG_LEVEL=INFO
      - AEREO_ENVIRONMENT=development
    volumes:
      - ./app:/app/app
    command: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev
```

Run with:
```bash
docker-compose up
```

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    image: aereo-geomeasure-backend:latest
    ports:
      - "8000:8000"
    environment:
      - AEREO_LOG_LEVEL=WARNING
      - AEREO_ENVIRONMENT=production
      - AEREO_DATABASE_URL=postgresql://user:password@db:5432/aereo
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: aereo-geomeasure-frontend:latest
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=https://api.example.com
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=aereo
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=aereo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Production Deployment

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx   │ (Reverse Proxy)
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼───┐        ┌───▼───┐      ┌───▼───┐
    │Backend│        │Backend│      │Backend│ (Load Balanced)
    │  1    │        │  2    │      │  3    │
    └───┬───┘        └───┬───┘      └───┬───┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │PostgreSQL│ (Database)
                    └──────────┘
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/aereo-geomeasure
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    listen 80;
    server_name api.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for large uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Systemd Service

```ini
# /etc/systemd/system/aereo-geomeasure.service
[Unit]
Description=Aereo GeoMeasure API
After=network.target postgresql.service

[Service]
Type=notify
User=aereo
WorkingDirectory=/opt/aereo-geomeasure
Environment="PATH=/opt/aereo-geomeasure/.venv/bin"
Environment="AEREO_ENVIRONMENT=production"
Environment="AEREO_LOG_LEVEL=INFO"
ExecStart=/opt/aereo-geomeasure/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable aereo-geomeasure
sudo systemctl start aereo-geomeasure
sudo systemctl status aereo-geomeasure
```

---

## Environment Configuration

### Backend Environment Variables

```bash
# Application
AEREO_ENVIRONMENT=production              # development, staging, production
AEREO_LOG_LEVEL=INFO                      # DEBUG, INFO, WARNING, ERROR, CRITICAL
AEREO_APP_URL=https://app.example.com     # Frontend URL for CORS and docs links

# Upload Limits
AEREO_MAX_UPLOAD_BYTES=20971520           # 20 MiB
AEREO_MAX_ARCHIVE_MEMBERS=256
AEREO_MAX_EXTRACTED_BYTES=104857600       # 100 MiB
AEREO_MAX_FEATURES=10000
AEREO_MAX_VERTICES=10000

# Measurement
AEREO_MAX_UTM_SPAN_DEGREES=6.0
AEREO_MIN_UTM_LATITUDE=-80.0
AEREO_MAX_UTM_LATITUDE=84.0

# CORS
AEREO_CORS_ORIGINS=https://app.example.com,https://www.example.com

# Database
AEREO_DATABASE_URL=postgresql://user:password@db:5432/aereo
AEREO_ENABLE_PERSISTENCE=true

# Features
AEREO_ENABLE_EXPORT=true
AEREO_ENABLE_BATCH_PROCESSING=true
AEREO_ENABLE_VALIDATION=true
AEREO_SUPPORT_MULTI_GEOMETRIES=false
AEREO_SUPPORT_3D_GEOMETRIES=false
```

### Frontend Environment Variables

```bash
# .env.local
VITE_API_BASE_URL=https://api.example.com
```

---

## Database Setup

### PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start service
sudo systemctl start postgresql
```

### Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE aereo;
CREATE USER aereo WITH PASSWORD 'secure_password';
ALTER ROLE aereo SET client_encoding TO 'utf8';
ALTER ROLE aereo SET default_transaction_isolation TO 'read committed';
ALTER ROLE aereo SET default_transaction_deferrable TO on;
ALTER ROLE aereo SET default_transaction_level TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE aereo TO aereo;
\q
```

### Run Migrations

```bash
# Install Alembic
pip install alembic

# Initialize migrations
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

---

## Monitoring & Logging

### Application Logs

```bash
# View logs
journalctl -u aereo-geomeasure -f

# View logs with timestamps
journalctl -u aereo-geomeasure --since "2 hours ago" -o short-iso

# Export logs
journalctl -u aereo-geomeasure > aereo-logs.txt
```

### Health Monitoring

```bash
# Check API health
curl https://api.example.com/health

# Monitor with uptime monitoring service
# Example: UptimeRobot, Pingdom, or custom monitoring
```

### Performance Monitoring

```bash
# Monitor system resources
top
htop

# Monitor database
sudo -u postgres psql -d aereo -c "SELECT * FROM pg_stat_statements;"

# Monitor disk usage
df -h
du -sh /var/lib/postgresql/data
```

### Log Aggregation

For production, use centralized logging:

**ELK Stack (Elasticsearch, Logstash, Kibana)**
```yaml
# docker-compose.yml addition
  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
```

**Datadog, New Relic, or Splunk** — Use their agents

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
journalctl -u aereo-geomeasure -n 50

# Check port availability
lsof -i :8000

# Check Python version
python --version

# Check dependencies
pip check
```

### Database Connection Issues

```bash
# Test connection
psql -h localhost -U aereo -d aereo

# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string
echo $AEREO_DATABASE_URL
```

### High Memory Usage

```bash
# Monitor memory
free -h

# Check process memory
ps aux | grep uvicorn

# Reduce worker count in systemd service
ExecStart=... --workers 2
```

### Slow Uploads

```bash
# Check network
iperf3 -c server

# Increase timeouts in Nginx
proxy_connect_timeout 120s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;

# Increase buffer size
client_max_body_size 100M;
```

### SSL Certificate Issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/api.example.com/fullchain.pem -noout -dates
```

---

## Backup & Recovery

### Database Backup

```bash
# Full backup
pg_dump -U aereo -d aereo > aereo-backup.sql

# Compressed backup
pg_dump -U aereo -d aereo | gzip > aereo-backup.sql.gz

# Restore from backup
psql -U aereo -d aereo < aereo-backup.sql
```

### Automated Backups

```bash
# Cron job for daily backups
0 2 * * * pg_dump -U aereo -d aereo | gzip > /backups/aereo-$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups -name "aereo-*.sql.gz" -mtime +30 -delete
```

---

## Security Checklist

- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set strong database password
- [ ] Configure firewall rules
- [ ] Enable CORS only for trusted origins
- [ ] Set secure environment variables
- [ ] Enable database backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep dependencies updated
- [ ] Use strong authentication for admin access
- [ ] Enable rate limiting on API endpoints

---

## Performance Tuning

### PostgreSQL

```sql
-- Increase shared buffers (25% of RAM)
shared_buffers = 4GB

-- Increase effective cache size (50-75% of RAM)
effective_cache_size = 12GB

-- Increase work memory
work_mem = 10MB

-- Enable parallel queries
max_parallel_workers_per_gather = 4
```

### Uvicorn

```bash
# Increase worker count
python -m uvicorn app.main:app --workers 8

# Increase timeout
python -m uvicorn app.main:app --timeout-keep-alive 65
```

---

## Scaling

### Horizontal Scaling

1. Deploy multiple backend instances
2. Use load balancer (Nginx, HAProxy)
3. Share database across instances
4. Use Redis for caching (optional)

### Vertical Scaling

1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Enable caching
4. Use CDN for static files

---

## Support

For deployment issues:
1. Check logs: `journalctl -u aereo-geomeasure -f`
2. Review this guide
3. Check [GitHub Issues](https://github.com/aereo/geomeasure/issues)
4. Contact support team

---

**Happy deploying!** 🚀
