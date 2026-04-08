# Description: Multi-stage Dockerfile for Node.js (Fastify + pnpm + Prisma)

# Base stage with Node + pnpm setup
FROM node:20-alpine AS base

# Set pnpm home path
ENV PNPM_HOME="/pnpm"

# Add pnpm to PATH
ENV PATH="$PNPM_HOME:$PATH"

# Enable corepack to use pnpm
RUN corepack enable

# Set working directory
WORKDIR /app


# Dependencies stage (install all deps)
FROM base AS deps

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using lockfile
RUN pnpm install --frozen-lockfile


# Build stage (compile TypeScript + Prisma)
FROM deps AS build

# Copy TypeScript config
COPY tsconfig.json ./

# Copy Prisma schema
COPY prisma ./prisma

# Copy generated files (if any)
COPY generated ./generated

# Copy source code
COPY src ./src

# Generate Prisma client
RUN pnpm prisma:generate

# Build project (ts → js)
RUN pnpm build


# Production stage (lightweight final image)
FROM base AS production

# Set production environment
ENV NODE_ENV=production

# Copy dependency files again
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built output from build stage
COPY --from=build /app/dist ./dist

# Copy generated Prisma client
COPY --from=build /app/generated ./generated

# Copy Prisma schema/migrations
COPY --from=build /app/prisma ./prisma

# Expose app port
EXPOSE 5000

# Start the application
CMD ["pnpm", "start"]