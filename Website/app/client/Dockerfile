# FROM nginx:alpine

# # Copy all frontend files to nginx html directory
# COPY . /usr/share/nginx/html/

# # Copy custom nginx configuration for frontend
# COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]

# ---------------------------
# Stage 1: Build with Vite
# ---------------------------
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first (for better cache)
COPY package*.json ./

# Install dependencies (this includes Vite and Three.js)
RUN npm ci

# Copy all client source code
# Copy Vite config (repo root) so build uses the same configuration
COPY vite.config.js /app/vite.config.js

# Copy client source code into the image at /app/app/client
# (vite.config resolves path relative to its file: path.resolve(__dirname, 'app/client'))
COPY ./app/client/ /app/app/client/

# Build for production (Vite bundles Three.js and all modules)
RUN npm run build


# ---------------------------
# Stage 2: Serve with Nginx
# ---------------------------
FROM nginx:alpine

# Copy the built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy your custom Nginx config from the repo path
# (we use repo root as build context so the file lives at ./app/client/nginx-frontend.conf)
COPY app/client/nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
