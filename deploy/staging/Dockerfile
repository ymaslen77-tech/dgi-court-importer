# Private staging application image. Reproducible pinned dependencies.
# Compiles after its isolated database passes health checks (Payload may need DB during build).
FROM node:22-bookworm-slim
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && \
    useradd --system --uid 10001 --create-home dgi && \
    mkdir -p /app/apps/cms/media && \
    chown -R dgi:dgi /app
USER dgi
