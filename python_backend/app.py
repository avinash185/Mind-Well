import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

try:
    from pyngrok import ngrok
except Exception:
    ngrok = None

import google.generativeai as genai

load_dotenv()


def _strip_quotes(val):
    if not val:
        return val
    v = val.strip()
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    return v


API_KEY = _strip_quotes(os.getenv("GOOGLE_API_KEY") or os.getenv("VITE_GOOGLE_API_KEY"))
MODEL_NAME = _strip_quotes(os.getenv("GENAI_MODEL_NAME", "gemma-3-1b-it"))

try:
    from google.colab import userdata

    API_KEY = API_KEY or userdata.get('GOOGLE_API_KEY')
    if not os.getenv('NGROK_AUTH_TOKEN'):
        token = userdata.get('NGROK_AUTH_TOKEN')
        if token:
            os.environ['NGROK_AUTH_TOKEN'] = token
except Exception:
    pass

app = Flask(__name__)
CORS(app)
model = None
chat = None


def init_model():
    global model, chat
    if not API_KEY:
        print("Error: GOOGLE_API_KEY not set")
        model = None
        chat = None
        return
    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)
        chat = model.start_chat(history=[])
        print(f"Initialized model: {MODEL_NAME}")
    except Exception as e:
        print(f"Error initializing model '{MODEL_NAME}': {e}")
        model = None
        chat = None


@app.route('/health', methods=['GET'])
def health():
    status = 'OK' if model is not None else 'UNAVAILABLE'
    return jsonify({
        'status': status,
        'model': MODEL_NAME,
        'timestamp': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
    })


@app.route('/chat', methods=['POST'])
def handle_chat():
    global chat
    if not model or not chat:
        return jsonify({'response': 'Error: Chatbot model is not available.'}), 500
    data = request.json or {}
    user_query = data.get('message', '').strip()
    if not user_query:
        return jsonify({'response': 'Error: No message provided.'}), 400
    try:
        response = chat.send_message(user_query)
        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'response': f"An error occurred: {e}"}), 500


def start_ngrok_if_configured(port: int):
    if os.getenv('ENABLE_NGROK', 'false').lower() not in ('1', 'true', 'yes'):
        print("Ngrok disabled; set ENABLE_NGROK=true to enable.")
        return None
    if ngrok is None:
        print("pyngrok not installed; skipping ngrok tunnel.")
        return None
    token = os.getenv('NGROK_AUTH_TOKEN')
    if not token:
        print("NGROK_AUTH_TOKEN not set; skipping ngrok tunnel.")
        return None
    try:
        ngrok.set_auth_token(token)
        public_url = ngrok.connect(port)
        print(f" * Tunnel URL: {public_url}")
        return public_url
    except Exception as e:
        print(f"ngrok error: {e}")
        return None


if __name__ == '__main__':
    init_model()
    port = int(os.getenv('PY_AGENT_PORT') or os.getenv('PORT') or 5000)
    start_ngrok_if_configured(port)
    print(f"Starting Flask server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)