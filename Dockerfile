# n8n Judge — Railway deploy. Builds the Next.js app in apps/web from the
# npm-workspaces monorepo. The Railway service **Root Directory is the repo
# root** (where this file lives).
FROM node:22-bookworm-slim

# openssl + ca-certificates are required by Prisma's query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install all workspace deps (incl. dev — `next build` needs them).
# Lifecycle hooks run here: @judge/db -> `prisma generate`,
# @judge/web -> sync the dotLottie wasm into public/.
COPY . .
RUN npm ci --include=dev

# Build the Next.js production bundle.
RUN npm run build --workspace @judge/web

EXPOSE 3000
# apps/web `start` = `next start -p ${PORT:-3000}`; Railway injects PORT.
CMD ["npm", "run", "start", "--workspace", "@judge/web"]
