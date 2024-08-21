MODELS = {
    "OpenAI": {
        "gpt-4o-2024-05-13": {"input": 5, "output": 15, "input_tokens": 128000, "output_tokens": 4096},
        "gpt-4o-2024-08-06": {"input": 5, "output": 15, "input_tokens": 128000, "output_tokens": 16384},
        "gpt-4o-mini-2024-07-18": {"input": 0.15, "output": 0.60, "input_tokens": 128000, "output_tokens": 16384}
    },
    "Anthropic": {
        "claude-3-5-sonnet-20240620": {"input": 3, "output": 15, "input_tokens": 200000, "output_tokens": 8192},
        "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25, "input_tokens": 200000, "output_tokens": 4096},
        "claude-3-opus-20240229": {"input": 15, "output": 75, "input_tokens": 200000, "output_tokens": 4096}
    },
    "Google": {
        "gemini-1.5-pro": {"input": 3.5, "output": 10.5, "input_tokens": 2097152, "output_tokens": 8192},
        "gemini-1.5-flash": {"input": 0.075, "output": 0.30, "input_tokens": 1048576, "output_tokens": 8192}
    }
}