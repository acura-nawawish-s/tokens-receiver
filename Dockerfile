# Stage 1: Build
# Use a smaller base image
FROM node:20-alpine as build

# Set the working directory in the container to /app
WORKDIR /app

# Copy the package.json and package-lock.json (if available) files into the container at /app
COPY package*.json ./

# Install dependencies and build your app (if necessary)
RUN npm install

# Copy the rest of your app's source code into the container
COPY . .

# Stage 2: Runtime
# Use a smaller base image for the runtime stage
FROM node:20-alpine

# Set the working directory in the container to /app
WORKDIR /app

# Copy only the build artifacts from the previous stage
COPY --from=build /app .

# Make port 80 available to the world outside this container
EXPOSE 80

# Define the command to run your app
CMD ["node", "index.js"]

