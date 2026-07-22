# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/resume-export/package.json packages/resume-export/
RUN npm install --workspace=@resumeai/api --include-workspace-root=false

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/resume-export ./packages/resume-export
WORKDIR /app/apps/api
RUN npx prisma generate && npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN useradd --user-group --create-home --shell /bin/false resumeai
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json
USER resumeai
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
