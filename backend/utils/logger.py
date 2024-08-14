# backend/utils/logger.py

import json
import os
import time
import random
import string

def generate_job_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

def log_interaction(interaction_data, job_id=None):
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
    os.makedirs(logs_dir, exist_ok=True)

    if not job_id:
        job_id = generate_job_id()
    
    timestamp = time.strftime("%Y%m%d")
    filename = f"{job_id}_{timestamp}.json"
    filepath = os.path.join(logs_dir, filename)

    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            existing_data = json.load(f)
        existing_data.append(interaction_data)
        data_to_write = existing_data
    else:
        data_to_write = [interaction_data]

    with open(filepath, 'w') as f:
        json.dump(data_to_write, f, indent=2)

    return job_id, filepath