import os
import logging
from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv

app = Flask(__name__)

# Setup Logging Configuration
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Fetch the API key from environment variables
API_KEY = os.getenv("NVIDIA_API_KEY")

if not API_KEY:
    logging.error("No NVIDIA API key found. Please set the NVIDIA_API_KEY environment variable.")
    raise ValueError("No NVIDIA API key found. Please set the NVIDIA_API_KEY environment variable.")

# Initialize the OpenAI client with NVIDIA's API endpoint
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=API_KEY
)

@app.route('/', methods=['GET'])
def home():
    logging.info("Home page accessed.")
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    prompt = data.get('prompt', '').strip()
    logging.info(f"Received prompt: {prompt}")

    if not prompt:
        logging.warning("No prompt provided in the request.")
        return jsonify({'response': 'No prompt provided.'}), 400

    try:
        # Create a completion using NVIDIA's API
        completion = client.chat.completions.create(
            model="nvidia/llama-3.1-nemotron-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            top_p=1,
            max_tokens=1024,
            stream=False
        )
        logging.info("Received response from NVIDIA API.")

        # Extract the generated text
        generated_text = completion.choices[0].message.content.strip()
        
        logging.info("Generated text extracted successfully.")
        return jsonify({'response': generated_text})

    except Exception as e:
        # Log the error for debugging purposes
        logging.error(f"Error generating response: {e}")
        return jsonify({'response': 'An error occurred while generating the response.'}), 500

if __name__ == '__main__':
    app.run(debug=True) 