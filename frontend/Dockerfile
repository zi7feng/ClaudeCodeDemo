# Simple nginx container - expects pre-built files in ./dist
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy pre-built files (run 'npm run build' locally first)
COPY dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
