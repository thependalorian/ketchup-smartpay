# Railway backend: single CJS bundle (vercel-entry.cjs), no ESM resolution issues.
# Root Directory must be empty so Railway uses this Dockerfile.
# See RAILWAY_DEPLOY.md.

FROM node:18-alpine
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared ./shared
COPY backend ./backend
COPY packages ./packages
COPY apps ./apps
COPY turbo.json tsconfig.base.json tsconfig.node.json ./

RUN pnpm install --frozen-lockfile
RUN cd backend && pnpm run build:vercel

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "railway-start.cjs"]
