# ---------------------------
# 1) Build Stage
# ---------------------------
FROM node:24-slim AS builder

WORKDIR /app

ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG NODE_OPTIONS="--max-old-space-size=4096"
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ENV DATABASE_URL=${DATABASE_URL}

# Prisma needs openssl
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

# Install all dependencies (includes Prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source
COPY . .


# Generate Prisma Client (requires DATABASE_URL)
RUN npx prisma generate

# Build the Nuxt app
RUN NODE_OPTIONS=${NODE_OPTIONS} BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} BETTER_AUTH_URL=${BETTER_AUTH_URL} npm run build


# ---------------------------
# 2) Runtime Stage
# ---------------------------
FROM node:24-slim

WORKDIR /app

ARG APP_VERSION=dev
ARG APP_COMMIT=local
ARG APP_CHANNEL=local
ARG APP_DEPLOYED_AT=unknown
ARG APP_IMAGE_TAG=unknown

# Set runtime environment variables
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV PORT=3000
ENV NUXT_PUBLIC_APP_VERSION=${APP_VERSION}
ENV NUXT_PUBLIC_APP_COMMIT=${APP_COMMIT}
ENV NUXT_PUBLIC_APP_CHANNEL=${APP_CHANNEL}
ENV NUXT_PUBLIC_APP_DEPLOYED_AT=${APP_DEPLOYED_AT}
ENV NUXT_PUBLIC_APP_IMAGE_TAG=${APP_IMAGE_TAG}

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install openssl for Prisma runtime usage
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

# Copy only necessary artifacts from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/generated ./generated

# Make sure the appuser owns everything<
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start:migrate"]
