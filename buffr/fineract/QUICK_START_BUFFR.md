# Fineract Quick Start Guide for Buffr

**Quick setup guide to get Fineract running for Buffr integration**

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Using Setup Script (Recommended)

```bash
cd buffr/fineract
chmod +x setup-fineract-buffr.sh
./setup-fineract-buffr.sh
```

This script will:
1. ✅ Start MariaDB/PostgreSQL database
2. ✅ Create required databases
3. ✅ Build Fineract
4. ✅ Start Fineract with Docker Compose
5. ✅ Wait for Fineract to be ready

### Option 2: Docker Compose (PostgreSQL)

```bash
cd buffr/fineract

# Start PostgreSQL and Fineract
docker-compose -f docker-compose-postgresql.yml up -d

# Wait for services to start (30-60 seconds)
# Check logs
docker-compose -f docker-compose-postgresql.yml logs -f fineract
```

### Option 3: Development Mode (Full Stack)

```bash
cd buffr/fineract

# Start with observability (Loki, Prometheus, Grafana)
docker-compose -f docker-compose-development.yml up -d
```

---

## ✅ Verify Installation

### 1. Check Health

```bash
curl -k https://localhost:8443/fineract-provider/actuator/health
```

**Expected Response**:
```json
{
  "status": "UP"
}
```

### 2. Test API Authentication

```bash
# Create base64 auth header
AUTH=$(echo -n "mifos:password" | base64)

# Test API call
curl -k -X GET \
  https://localhost:8443/fineract-provider/api/v1/clients \
  -H "Authorization: Basic $AUTH" \
  -H "Fineract-Platform-TenantId: default"
```

**Expected Response**: `[]` (empty array if no clients exist)

### 3. Access Swagger UI

Open in browser:
```
https://localhost:8443/fineract-provider/swagger-ui/index.html
```

**Note**: Accept the self-signed SSL certificate warning

---

## 🔧 Configuration

### Environment Variables

**File**: `buffr/.env.local`

```bash
# Fineract API Configuration
FINERACT_API_URL=https://localhost:8443/fineract-provider/api/v1
FINERACT_USERNAME=mifos
FINERACT_PASSWORD=password
FINERACT_TENANT_ID=default
```

### Database Configuration

**File**: `fineract/config/docker/env/fineract-postgresql.env`

```bash
FINERACT_HIKARI_JDBC_URL=jdbc:postgresql://db:5432/fineract_tenants
FINERACT_HIKARI_USERNAME=postgres
FINERACT_HIKARI_PASSWORD=skdcnwauicn2ucnaecasdsajdnizucawencascdca
```

---

## 📋 Default Credentials

| Service | Username | Password | Notes |
|---------|----------|----------|-------|
| **Fineract API** | `mifos` | `password` | Basic Auth |
| **PostgreSQL** | `postgres` | `skdcnwauicn2ucnaecasdsajdnizucawencascdca` | Database user |
| **Tenant ID** | `default` | - | Required header |

**⚠️ IMPORTANT**: Change these passwords in production!

---

## 🔗 Integration with Buffr

### 1. Update Buffr Environment

Add to `buffr/.env.local`:

```bash
FINERACT_API_URL=https://localhost:8443/fineract-provider/api/v1
FINERACT_USERNAME=mifos
FINERACT_PASSWORD=password
FINERACT_TENANT_ID=default
```

### 2. Test Buffr Integration

```bash
# Create a test client
curl -X POST http://localhost:3000/api/fineract/clients \
  -H "Authorization: Bearer <buffr-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Test",
    "lastname": "User",
    "mobileNo": "+264811234567",
    "externalId": "test_user_123"
  }'
```

### 3. Verify in Fineract

```bash
# Check client was created
curl -k -X GET \
  https://localhost:8443/fineract-provider/api/v1/clients?externalId=test_user_123 \
  -H "Authorization: Basic $(echo -n 'mifos:password' | base64)" \
  -H "Fineract-Platform-TenantId: default"
```

---

## 🛑 Stop Fineract

```bash
# Stop Docker Compose services
docker-compose -f docker-compose-postgresql.yml down

# Or stop development stack
docker-compose -f docker-compose-development.yml down

# Remove database container (if using setup script)
docker rm -f fineract-mariadb
```

---

## 🐛 Troubleshooting

### Issue: Port 8443 Already in Use

```bash
# Find process using port 8443
lsof -i :8443

# Kill process
kill -9 <PID>
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database exists
docker exec -it <postgres-container> psql -U postgres -l | grep fineract
```

### Issue: Fineract Won't Start

```bash
# Check logs
docker-compose -f docker-compose-postgresql.yml logs fineract

# Check health
curl -k https://localhost:8443/fineract-provider/actuator/health
```

### Issue: SSL Certificate Error

**Solution**: Use `-k` flag with curl or accept certificate in browser:
```
https://localhost:8443
```

---

## 📚 Next Steps

1. ✅ Fineract is running
2. ✅ Test API authentication
3. ✅ Configure Buffr environment variables
4. ✅ Test Buffr integration endpoints
5. 📖 Read full integration guide: `FINERACT_BUFFR_INTEGRATION.md`

---

## 🔗 Useful Links

- **Fineract API**: https://localhost:8443/fineract-provider/api/v1
- **Swagger UI**: https://localhost:8443/fineract-provider/swagger-ui/index.html
- **Health Check**: https://localhost:8443/fineract-provider/actuator/health
- **Full Integration Guide**: `FINERACT_BUFFR_INTEGRATION.md`

---

**Last Updated**: 2026-01-23
