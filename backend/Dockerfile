# Use the official Node.js image from the Docker Hub as the base image
FROM node:20

# Create and set the working directory inside the container
WORKDIR /usr/src/app


# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the project dependencies
RUN npm install


# Copy the rest of the application files to the working directory
COPY . .

ENV PORT 4000
EXPOSE $PORT

# Command to run the application
CMD ["npm", "run", "dev"]
