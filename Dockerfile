# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Set build-time arguments (to be passed by Easypanel during docker build if configured)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_OPENAI_API_KEY
ARG VITE_SUPABASE_PROJECT_ID

# Set environment variables for Vite compiler (Vite injects them at build time)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Build the React application
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for React Router routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
