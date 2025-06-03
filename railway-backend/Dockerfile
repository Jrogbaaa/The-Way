# Use the official Node.js 18 runtime as the base image
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 theway

# Change ownership of the app directory to the nodejs user
USER theway

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the application
CMD ["node", "index.js"] 