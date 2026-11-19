FROM node:22-alpine

RUN corepack enable

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/emulator/package.json apps/emulator/
RUN pnpm install --frozen-lockfile --filter emulator

COPY apps/emulator apps/emulator
RUN pnpm --filter emulator build

WORKDIR /repo/apps/emulator
CMD ["pnpm", "start"]
