MODELS = {
    "OpenAI": {
        "o3": {"input": 10, "output": 40, "input_tokens": 200000, "output_tokens": 100000},
        "o4-mini": {"input": 1.1, "output": 4.4, "input_tokens": 200000, "output_tokens": 100000},
        "gpt-4.1": {"input": 2, "output": 8, "input_tokens": 1047576, "output_tokens": 32768},
        "gpt-4.1-mini": {"input": 0.4, "output": 1.6, "input_tokens": 1047576, "output_tokens": 32768},
        "gpt-4.1-nano": {"input": 0.1, "output": 0.4, "input_tokens": 1047576, "output_tokens": 32768}
    },
    "Anthropic": {
        "claude-3-7-sonnet-latest": {"input": 3, "output": 15, "input_tokens": 200000, "output_tokens": 8192},
        "claude-3-5-sonnet-latest": {"input": 3, "output": 15, "input_tokens": 200000, "output_tokens": 8192},
        "claude-3-5-haiku-latest": {"input": 0.25, "output": 1.25, "input_tokens": 200000, "output_tokens": 4096},
        "claude-3-opus-latest": {"input": 15, "output": 75, "input_tokens": 200000, "output_tokens": 4096}
    },
    "Google": {
        "gemini-2.5-pro-exp-03-25": {"input": 0, "output": 0, "input_tokens": 1000000, "output_tokens": 64000},
        "gemini-2.0-flash": {"input": 0.1, "output": 0.4, "input_tokens": 1048576, "output_tokens": 8192}
    },
    "XAI": {
        "grok-2-1212": {"input": 2.00, "output": 10.00, "input_tokens": 128000, "output_tokens": 32768}
    }
}