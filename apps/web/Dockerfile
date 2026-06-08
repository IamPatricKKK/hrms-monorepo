FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.6 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --no-frozen-lockfile

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build shared trước
RUN pnpm --filter @hrms/shared build

EXPOSE 3000
CMD ["pnpm", "--filter", "@hrms/web", "dev"]
