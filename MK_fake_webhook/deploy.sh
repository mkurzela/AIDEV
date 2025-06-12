#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Create deployment directory on remote server
echo "Creating deployment directory..."
ssh -p 5022 azyl.ag3nts.org "mkdir -p ~/mk_fake_webhook"

# Copy files to server
echo "Copying files to server..."
scp -P 5022 -r dist package.json package-lock.json .env azyl.ag3nts.org:~/mk_fake_webhook/

# Install dependencies and start the application
echo "Setting up and starting the application..."
ssh -p 5022 azyl.ag3nts.org "cd ~/mk_fake_webhook && \
    npm install --production && \
    npm run prod"

echo "Deployment complete!" 