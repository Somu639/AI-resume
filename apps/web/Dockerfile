# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/resume-export/package.json packages/resume-export/
RUN npm install --workspace=@resumeai/web --include-workspace-root=false

FROM node:20-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY packages/resume-export ./packages/resume-export
WORKDIR /app/apps/web
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN useradd --user-group --create-home --shell /bin/false resumeai
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
USER resumeai
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
