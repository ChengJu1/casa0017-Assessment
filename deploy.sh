#!/bin/bash

echo "=========================================="
echo "Starting deployment process..."
echo "Time: $(date)"
echo "=========================================="

# Navigate to project directory
cd ~/casa0017-Assessment/Website

# Pull latest changes from GitHub
echo "Pulling latest code from GitHub..."
git pull origin deploy_v2

if [ $? -ne 0 ]; then
    echo "ERROR: Git pull failed!"
    exit 1
fi

# Stop and remove old containers
echo "Stopping existing containers..."
docker-compose down

# Remove old images to free space (optional)
echo "Cleaning up old images..."
docker image prune -f

# Rebuild and start containers
echo "Building and starting new containers..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "Deployment successful!"
    echo "Time: $(date)"
    echo "=========================================="
    
    # Show running containers
    echo ""
    echo "Running containers:"
    docker-compose ps
    
    echo ""
    echo "Testing endpoints..."
    sleep 5
    
    # Test backend
    echo "Backend health check:"
    curl -s http://localhost:3000/api/health || echo "Backend not responding"
    
    echo ""
    echo "Frontend health check:"
    curl -s http://localhost/ | head -n 5 || echo "Frontend not responding"
    
else
    echo "=========================================="
    echo "ERROR: Docker deployment failed!"
    echo "=========================================="
    exit 1
fi