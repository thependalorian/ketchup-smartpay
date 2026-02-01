#!/bin/bash

# Buffr Payment Companion - Fineract Setup Script
# This script sets up Apache Fineract for local development with Buffr integration

echo "🏦 Setting up Apache Fineract for Buffr Payment Companion..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Navigate to Fineract directory
cd "$(dirname "$0")"

echo "📦 Starting MariaDB database..."
# Start MariaDB container
docker run --name fineract-mariadb -d \
    -p 3306:3306 \
    -e MARIADB_ROOT_PASSWORD=mysql \
    -e MARIADB_DATABASE=fineract_tenants \
    -e MARIADB_USER=fineract \
    -e MARIADB_PASSWORD=fineract \
    mariadb:11.5.2

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

echo "🔧 Creating Fineract databases..."
# Create databases
./gradlew createDB -PdbName=fineract_tenants || echo "Database already exists"
./gradlew createDB -PdbName=fineract_default || echo "Database already exists"

echo "🚀 Building and starting Fineract..."
# Build and run Fineract
./gradlew :fineract-provider:jibDockerBuild -x test

# Start Fineract with Docker Compose
echo "🐳 Starting Fineract with Docker Compose..."
docker-compose -f docker-compose-development.yml up -d

echo "⏳ Waiting for Fineract to start..."
# Wait for Fineract to be ready
timeout=300  # 5 minutes
counter=0
while [ $counter -lt $timeout ]; do
    if curl -k -s https://localhost:8443/fineract-provider/actuator/health | grep -q '"status":"UP"'; then
        echo "✅ Fineract is ready!"
        break
    fi
    echo "Waiting for Fineract to start... ($counter/$timeout)"
    sleep 5
    counter=$((counter + 5))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Fineract failed to start within timeout period"
    exit 1
fi

echo "🎉 Fineract setup complete!"
echo ""
echo "📋 Fineract URLs:"
echo "   API: https://localhost:8443/fineract-provider/"
echo "   Health Check: https://localhost:8443/fineract-provider/actuator/health"
echo "   Community App: http://localhost:9090/?baseApiUrl=https://localhost:8443/fineract-provider&tenantIdentifier=default"
echo ""
echo "🔐 Default Credentials:"
echo "   Username: mifos"
echo "   Password: password"
echo ""
echo "⚠️  Important: Accept the self-signed SSL certificate at https://localhost:8443 in your browser"
echo ""
echo "🛑 To stop Fineract:"
echo "   docker-compose -f docker-compose-development.yml down"
echo "   docker rm -f fineract-mariadb"
