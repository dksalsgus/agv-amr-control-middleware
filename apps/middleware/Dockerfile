FROM node:22-alpine

RUN corepack enable

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/middleware/package.json apps/middleware/
RUN pnpm install --frozen-lockfile --filter middleware

COPY apps/middleware apps/middleware
RUN pnpm --filter middleware build

WORKDIR /repo/apps/middleware
EXPOSE 3000
CMD ["pnpm", "start:prod"]
