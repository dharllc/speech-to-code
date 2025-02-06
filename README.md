# 🎙️ Speech-to-Code

> Transform your voice into code with the power of AI 🚀

Speech-to-Code is a web application that leverages Large Language Models (LLMs) to convert spoken language into executable code. This project aims to streamline the code generation process by allowing developers to express their ideas verbally and have them translated into functional code.

## ✨ Key Features

### 🎯 Advanced Prompt Composer
- 🗣️ Combine speech, repository files, and manual text input
- 📊 Real-time audio visualization for voice input
- 🔍 Smart file suggestions based on context
- 👀 Preview and edit prompts before submission

### 🤖 Multi-Model Support
- 🔌 Integration with multiple LLM providers (OpenAI, Anthropic)
- ⚙️ Customizable model parameters
- 💰 Cost tracking and display
- ⚡ Model-specific optimizations

### 📁 Repository Integration
- 🌳 Interactive file viewer for repository navigation
- 🔗 Smart file combinations for context
- 📝 File-based suggestions
- 📊 Repository structure visualization

### 🎤 Transcription Management
- ⚡ Real-time speech-to-text conversion
- ✏️ Transcription editing and refinement
- 📈 Voice input visualization

### 💡 System Prompt Management
- 📝 Create and edit system prompts
- 📂 Organize prompts by category
- ⚡ Quick prompt selection
- 🔄 Version control for prompts

### 🎨 User Experience
- 🌓 Dark/Light mode toggle
- 📊 Two-column layout for better workflow
- 📱 Responsive design
- 📋 Copy-to-clipboard functionality

### ⚙️ Advanced Settings
- 🔑 Environment variable management
- 📂 Repository path configuration
- 🔒 API key management
- 🔌 Port configuration

## 🚀 Getting Started

### 📋 Prerequisites

Before you begin, ensure you have installed:
* 📦 [Node.js and npm](https://nodejs.org/en/download/) (latest version)
* 🐍 [Python](https://www.python.org/downloads/) (version 3.7 or later)
* 💻 A Windows/Linux/Mac machine with command line access

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dharllc/speech-to-code.git
   cd speech-to-code
   ```

2. **Make the build script executable**
   ```bash
   chmod +x build.sh
   ```

3. **Run the build script**
   ```bash
   ./build.sh
   ```
   The script will:
   - 📦 Install necessary dependencies
   - 🐍 Set up a Python virtual environment
   - 🔑 Create .env files with placeholders

4. **Configure Environment Variables**
   Navigate to the Settings page to configure:
   - OpenAI API Key
   - Google API Key
   - Anthropic API Key
   - Repository Path

## 🚀 Running the Application

1. **Configure ports** (optional)
   Edit `config.json` in the root directory:
   ```json
   {
       "frontend": {
           "port": 3000 
       },
       "backend": {
           "port": 8000 
       }
   }
   ```

2. **Start the frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Start the backend**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --log-level debug
   ```

Access the application at `http://localhost:3000` 🌐

## 📁 Project Structure

```
speech-to-code/
├── 🔧 backend/
│   ├── .env
│   ├── main.py
│   ├── llm_interaction.py
│   ├── model_config.py
│   ├── system_prompts.json
│   ├── context_maps/
│   └── utils/
├── 🎨 frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── services/
│       └── config/
├── 📝 logs/
└── 📄 README.md
```

## 🔧 Troubleshooting

If you encounter issues:
1. 🔑 Verify API keys in Settings
2. 📦 Check dependencies
3. 🚀 Ensure both servers are running

For detailed logs, check the console output of both servers.

## 🤝 Contributing

We welcome contributions! Check our issues page for current tasks or suggest new features.

## 📬 Feedback

Have suggestions? Email me at sachin@dharllc.com

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) 📜
