MODELS = {
    "OpenAI": {
        "o1": {"input": 15, "output": 60, "input_tokens": 128000, "output_tokens": 32768},
        "o3-mini": {"input": 1.1, "output": 4.4, "input_tokens": 128000, "output_tokens": 32768},
        "gpt-4o": {"input": 5, "output": 15, "input_tokens": 128000, "output_tokens": 4096},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60, "input_tokens": 128000, "output_tokens": 16384}
    },
    "Anthropic": {
        "claude-3-5-sonnet-latest": {"input": 3, "output": 15, "input_tokens": 200000, "output_tokens": 8192},
        "claude-3-5-haiku-latest": {"input": 0.25, "output": 1.25, "input_tokens": 200000, "output_tokens": 4096},
        "claude-3-opus-latest": {"input": 15, "output": 75, "input_tokens": 200000, "output_tokens": 4096}
    },
    "Google": {
        "gemini-2.0-pro-exp-02-05": {"input": 3.50, "output": 10.50, "input_tokens": 2097152, "output_tokens": 8192},
        "gemini-2.0-flash-thinking-exp-01-21": {"input": 3.50, "output": 10.50, "input_tokens": 2097152, "output_tokens": 8192},
        "gemini-2.0-flash-exp": {"input": 3.50, "output": 10.50, "input_tokens": 2097152, "output_tokens": 8192}
    }
}