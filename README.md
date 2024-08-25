# Speech-to-Code

Speech-to-Code is an web application that leverages Large Language Models (LLMs) to convert spoken language into executable code. This project aims to streamline the code generation process by allowing developers to express their ideas verbally and have them translated into functional code.

## Prerequisites

Before you begin, ensure you have met the following requirements:
* You have installed the latest version of [Node.js and npm](https://nodejs.org/en/download/)
* You have installed [Python](https://www.python.org/downloads/) (version 3.7 or later)
* You have a Windows/Linux/Mac machine with command line access

## Installation

To install Speech-to-Code, follow these steps:

1. Clone the repository
   ```
   git clone https://github.com/dharllc/speech-to-code.git
   cd speech-to-code
   ```

2. Make the build script executable
   ```
   chmod +x build.sh
   ```

3. Run the build script
   ```
   ./build.sh
   ```
   This script will:
   - Install necessary dependencies for both frontend and backend
   - Set up a Python virtual environment
   - Create .env files with placeholders for API keys if they don't exist

4. Set up API keys
   - Navigate to the `frontend` directory and open the `.env` file
   - Replace the placeholder with your OpenAI API key:
     ```
     REACT_APP_OPENAI_API_KEY="your-openai-api-key"
     ```
   - Navigate to the `backend` directory and open the `.env` file
   - Replace the placeholders with your API keys:
     ```
     OPENAI_API_KEY="your-openai-api-key"
     GOOGLE_API_KEY="your-google-api-key"
     ANTHROPIC_API_KEY="your-anthropic-api-key"
     ```

## Running the Application

To run Speech-to-Code, follow these steps:

1. Start the frontend:
   ```
   cd frontend
   npm start
   ```

2. In a new terminal, start the backend:
   ```
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --log-level debug
   ```

The application should now be running. Access the frontend at `http://localhost:3000` in your web browser.

## Project Structure

```
speech-to-code/
├── backend/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   ├── .env
│   ├── .gitignore
│   ├── README.md
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
├── logs/
├── .gitattributes
├── .gitignore
├── package-lock.json
├── README.md
```

## Key Components

### Backend
- `main.py`: The main FastAPI application
- `llm_interaction.py`: Handles interactions with Language Learning Models
- `model_config.py`: Configuration for different language models
- `system_prompts.json`: Stores system prompts for LLM interactions

### Frontend
- `src/components/`: React components for the user interface
- `src/services/llmService.js`: Service for interacting with the backend LLM API
- `src/App.js`: Main React application component

## Troubleshooting

If you encounter any issues:
- Ensure all API keys are correctly set in the .env files
- Check that all dependencies are installed correctly
- Verify that both frontend and backend servers are running

For more detailed error messages, check the console output of both frontend and backend servers.

## Contributing

Contributions to Speech-to-Code are welcome. Please refer to the repository's issues page for current tasks or to suggest new features.

## License

This project uses the following license: [MIT License](https://opensource.org/licenses/MIT).