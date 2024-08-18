# backend/model_config.py

MODELS = {
    "OpenAI": {
        # "gpt-4o": {"input": 5, "output": 15},
        "gpt-4o-2024-05-13": {"input": 5, "output": 15},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60}
    },
    "Anthropic": {
        "claude-3-5-sonnet-20240620": {"input": 3, "output": 15},
        "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
        "claude-3-opus-20240229": {"input": 15, "output": 75}
    },
    "Google": {
        "gemini-1.5-pro": {"input": 3.5, "output": 10.5},
        "gemini-1.5-flash": {"input": 0.075, "output": 0.30}
    }
}
