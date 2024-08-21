add api keys in a .env file in the backend 

OPENAI_API_KEY=""
GOOGLE_API_KEY=""
ANTHROPIC_API_KEY="

add openai api key in a .env file in the frontend

OPENAI_API_KEY=""

to run the application, navigate to frontend and run

npm start

then navigate to the backend and run

source venv/bin/activate
uvicorn main:app --reload --log-level debug
