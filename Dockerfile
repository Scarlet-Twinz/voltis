FROM node:22-alpine

ENV CI=true
ENV NODE_ENV=production

RUN corepack enable
RUN corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps

RUN pnpm install --frozen-lockfile

ARG APP
ENV APP=${APP}

RUN pnpm --filter ${APP} build

CMD ["sh", "-c", "pnpm --filter ${APP} start:prod"]
