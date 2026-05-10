# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install && chmod +x node_modules/.bin/*
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the backend and serve
FROM node:18-slim
WORKDIR /app/backend

# Copy backend package.json and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
