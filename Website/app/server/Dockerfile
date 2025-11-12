# FROM node:22-slim

# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --production

# # Copy application code
# COPY . .

# # Expose backend port
# EXPOSE 3000

# # Start the application
# CMD ["node", "server/routes/app.js"]

FROM node:22-slim

WORKDIR /app

# Copy package files from root
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy entire server directory
COPY server/ ./app/server/

# Expose backend port
EXPOSE 3000

# Start the application
CMD ["node", "server/routes/app.js"]