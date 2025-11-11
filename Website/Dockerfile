# Use an LTS Node image
FROM node:20-alpine

# Install sqlite CLI (handy for debugging) and bash
RUN apk add --no-cache sqlite bash

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install deps (no dev deps in production image; keep if you need build tools)
RUN npm ci --omit=dev

# Copy the rest
COPY . .

# Environment
ENV NODE_ENV=production
# Default port your Express app listens on
ENV PORT=3000

# Start the server
CMD ["node", "server/routes/app.js"]
