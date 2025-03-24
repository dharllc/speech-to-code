#!/bin/bash

# Print a header to show the script is running
echo "Starting Speech-to-Code development environment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to read JSON values (requires jq)
get_json_value() {
    echo $(cat "$1" | jq -r "$2")
}

# Check if required commands exist
if ! command_exists osascript; then
    echo "Error: This script requires osascript (macOS) to run. It appears you're not on macOS."
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

if ! command_exists jq; then
    echo "Error: jq is not installed. Please install jq first (brew install jq)."
    exit 1
fi

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_FILE="$SCRIPT_DIR/config.json"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: config.json not found at: $CONFIG_FILE"
    exit 1
fi

# Read port numbers from config.json
FRONTEND_PORT=$(get_json_value "$CONFIG_FILE" ".frontend.port")
BACKEND_PORT=$(get_json_value "$CONFIG_FILE" ".backend.port")

echo "Configuration Information:"
echo "------------------------"
echo "Config file location: $CONFIG_FILE"
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port: $BACKEND_PORT"
echo "------------------------"

# Create a new terminal window and run frontend
osascript -e "
tell application \"Terminal\"
    # Create a new terminal window for frontend
    do script \"cd frontend && echo \\\"Installing npm packages...\\\" && npm install && echo \\\"Starting frontend server...\\\" && npm start\"
end tell
"

# Create a new terminal window and run backend
osascript -e "
tell application \"Terminal\"
    # Create a new terminal window for backend
    do script \"cd backend && source venv/bin/activate && echo \\\"Starting backend server...\\\" && uvicorn main:app --reload --port $BACKEND_PORT --log-level debug\"
end tell
"

echo "Development environment is starting up..."
echo "Frontend will be available at: http://localhost:$FRONTEND_PORT"
echo "Backend will be available at: http://localhost:$BACKEND_PORT"
echo "Check the newly opened terminal windows for detailed logs"

# Note about configuration
echo "To modify port settings, edit: $CONFIG_FILE" 