# backend/utils/screenshot.py

import os
from PIL import ImageGrab

def capture_screenshot(path='localhost'):
    try:
        if path == 'localhost':
            screenshot = ImageGrab.grab()
        else:
            screenshot = ImageGrab.grab(all_screens=True)
        
        # Save screenshot to a temporary file
        temp_path = os.path.join(os.getcwd(), 'temp_screenshot.png')
        screenshot.save(temp_path)
        
        # Read the file and return as base64
        with open(temp_path, 'rb') as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Remove the temporary file
        os.remove(temp_path)
        
        return encoded_string
    except Exception as e:
        print(f"Error capturing screenshot: {str(e)}")
        return None