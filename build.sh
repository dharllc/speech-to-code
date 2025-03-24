#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting Speech-to-Code setup..."

# Create necessary directories
echo "Creating required directories..."
mkdir -p logs/chat_sessions

# Frontend setup
echo "Setting up frontend..."
cd frontend
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    echo "REACT_APP_OPENAI_API_KEY=your-openai-api-key" > .env
fi
echo "Installing frontend dependencies..."
npm install

# Backend setup
echo "Setting up backend..."
cd ../backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
echo "Activating virtual environment..."
source venv/bin/activate
echo "Installing backend dependencies..."
pip install -r requirements.txt
if [ ! -f .env ]; then
    echo "Creating backend .env file..."
    echo "OPENAI_API_KEY=your-openai-api-key" > .env
    echo "GOOGLE_API_KEY=your-google-api-key" >> .env
    echo "ANTHROPIC_API_KEY=your-anthropic-api-key" >> .env
    
    # Prompt for repository path
    read -p "Enter the path to your repositories: " repo_path
    echo "REPO_PATH=$repo_path" >> .env
else
    # Check if REPO_PATH exists in .env, if not, prompt for it
    if ! grep -q "REPO_PATH" .env; then
        read -p "Enter the path to your repositories: " repo_path
        echo "REPO_PATH=$repo_path" >> .env
    fi
fi

# Set proper permissions for logs directory
echo "Setting proper permissions for logs directory..."
chmod -R 755 ../logs

echo "Setup complete!"
echo "Please update the API keys in both frontend/.env and backend/.env files."
echo "To run the application:"
echo "1. Start the frontend: cd frontend && npm start"
echo "2. In a new terminal, start the backend: cd backend && source venv/bin/activate && uvicorn main:app --reload --log-level debug"