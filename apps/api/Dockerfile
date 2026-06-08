# Dev/prod single-stage Dockerfile cho NestJS API
FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.6 --activate

# Copy workspace manifests trước để cache dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --no-frozen-lockfile

# Copy source
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared trước - các app phụ thuộc vào dist/ của nó
RUN pnpm --filter @hrms/shared build

EXPOSE 4000
CMD ["pnpm", "--filter", "@hrms/api", "start:dev"]
