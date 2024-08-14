# Speech-to-Code

Speech-to-Code is an advanced AI-assisted code development tool that leverages Large Language Models (LLMs) to streamline the process of understanding user intent, planning code changes, generating code, and assessing code quality.

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Key Components](#key-components)
4. [Installation](#installation)
5. [Usage](#usage)
6. [API Documentation](#api-documentation)
7. [Frontend Structure](#frontend-structure)
8. [Backend Structure](#backend-structure)
9. [Workflow](#workflow)
10. [Configuration](#configuration)
11. [Contributing](#contributing)
12. [License](#license)

## Project Overview

Speech-to-Code is designed to facilitate the process of converting natural language instructions into functional code. It employs a multi-stage workflow that includes intent understanding, code planning, code generation, quality assessment, file modification, environment management, and light verification.

## System Architecture

The application is built using a React frontend and a FastAPI backend, with integration to OpenAI's language models for natural language processing and code generation tasks.

- Frontend: React.js
- Backend: Python with FastAPI
- AI Integration: OpenAI API
- Database: Local JSON storage for prompts and configurations

## Key Components

1. **LLM Interaction**: Manages the communication with the AI model for various stages of the code generation process.
2. **Repository Management**: Handles file operations, directory structure, and version control integration.
3. **Prompt Management**: Allows creation, editing, and management of system prompts for different stages of the process.
4. **Code Generation Pipeline**: Orchestrates the multi-stage process from intent understanding to code implementation.
5. **Quality Assessment**: Evaluates generated code for correctness, efficiency, and adherence to best practices.
6. **Environment Management**: Handles dependency installation and service restarts as needed.

## Installation

[Include installation instructions here]

## Usage

[Include basic usage instructions here]

## API Documentation

### Backend Endpoints

- `/tree`: Get the repository structure
- `/file_content`: Retrieve content of a specific file
- `/prompts`: CRUD operations for system prompts
- `/llm_completion`: Generate LLM completions
- `/intent_understanding`: Analyze user intent
- `/code_planning`: Generate code modification plans
- `/code_generation`: Generate code based on plans
- `/quality_assessment`: Assess the quality of generated code
- `/file_modification`: Apply code changes to files
- `/environment_management`: Manage environment changes
- `/light_verification`: Perform basic verification of changes

[Include more detailed API documentation here]

## Frontend Structure

- `App.js`: Main application component with routing
- `LLMInteraction.js`: Manages the multi-stage LLM interaction process
- `WorkflowContext.js`: Provides state management for the LLM workflow
- `components/`: Various UI components for different stages of the process
- `services/`: API interaction services

## Backend Structure

- `main.py`: FastAPI application setup and route definitions
- `utils/`:
  - `api_routes.py`: Implementation of non-LLM API routes
  - `llm_services.py`: LLM-related API implementations
  - `prompt_manager.py`: Manages system prompts
  - `tree_structure.py`: Handles repository structure operations

## Workflow

1. Intent Understanding
2. Code Planning
3. Code Generation
4. Quality Assessment
5. File Modification
6. Environment Management
7. Light Verification

Each stage in the workflow is managed by the LLM Interaction component, which coordinates with the backend services to process user input, generate code, and apply changes.

## Configuration

- Environment variables: Set up in `.env` files for both frontend and backend
- OpenAI API key: Required for LLM interactions
- Quality threshold: Configurable threshold for code quality assessment

## Contributing

[Include contribution guidelines here]

## License

[Include license information here]