FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build React app
# Uses REACT_APP_API_BASE_URL env var injected at build time
ENV REACT_APP_API_BASE_URL=
ENV GENERATE_SOURCEMAP=false
ENV INLINE_RUNTIME_CHUNK=false

RUN npm run build

# ── Production: serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built React assets
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
