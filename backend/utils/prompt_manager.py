import json
import os

PROMPTS_FILE = "prompts.json"

def get_prompts_file_path():
    return os.path.join(os.path.dirname(__file__), "..", PROMPTS_FILE)

def load_prompts():
    file_path = get_prompts_file_path()
    if not os.path.exists(file_path):
        return {
            "intent_understanding": {"prompts": [], "default": None},
            "code_generation": {"prompts": [], "default": None},
            "implementation_planning": {"prompts": [], "default": None},
            "assessment": {"prompts": [], "default": None}
        }
    with open(file_path, 'r') as f:
        return json.load(f)

def save_prompts(prompts):
    with open(get_prompts_file_path(), 'w') as f:
        json.dump(prompts, f, indent=2)

def add_prompt(category, prompt):
    prompts = load_prompts()
    prompt_id = max([p['id'] for p in prompts[category]['prompts']] + [0]) + 1
    new_prompt = {"id": prompt_id, "content": prompt}
    prompts[category]['prompts'].append(new_prompt)
    save_prompts(prompts)
    return new_prompt

def update_prompt(category, prompt_id, new_content):
    prompts = load_prompts()
    for prompt in prompts[category]['prompts']:
        if prompt['id'] == prompt_id:
            prompt['content'] = new_content
            save_prompts(prompts)
            return prompt
    return None

def delete_prompt(category, prompt_id):
    prompts = load_prompts()
    prompts[category]['prompts'] = [p for p in prompts[category]['prompts'] if p['id'] != prompt_id]
    if prompts[category]['default'] == prompt_id:
        prompts[category]['default'] = None
    save_prompts(prompts)

def set_default_prompt(category, prompt_id):
    prompts = load_prompts()
    if any(p['id'] == prompt_id for p in prompts[category]['prompts']):
        prompts[category]['default'] = prompt_id
        save_prompts(prompts)
        return True
    return False