#!/bin/bash
cd backend
export DATABASE_URL="postgresql://neondb_owner:npg_B7JHyg6PlIvX@ep-rough-frog-ad0dg5fe-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
export PORT=3001
export NODE_ENV=development

timeout 10s npx tsx src/index.ts &
PID=$!
sleep 8

if ps -p $PID > /dev/null; then
  echo "✅ Backend started successfully"
  kill $PID 2>/dev/null
  exit 0
else
  echo "❌ Backend failed to start"
  exit 1
fi
