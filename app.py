from flask import Flask, render_template, request, jsonify
import deepl
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
DEFAULT_API_KEY = os.getenv('DEEPL_API_KEY')

def get_translator(api_key=None):
    """Get a DeepL translator instance with the given API key or default key."""
    return deepl.Translator(api_key or DEFAULT_API_KEY)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/test-api-key', methods=['POST'])
def test_api_key():
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        
        if not api_key:
            return jsonify({'error': 'API key is required'}), 400
            
        # Test the API key by getting usage
        translator = deepl.Translator(api_key)
        translator.get_usage()
        
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api-usage')
def get_api_usage():
    try:
        # Get API key from header or use default
        api_key = request.headers.get('X-API-Key')
        translator = get_translator(api_key)
        
        usage = translator.get_usage()
        print("API Usage:", {
            'character_count': usage.character.count,
            'character_limit': usage.character.limit
        })
        return jsonify({
            'character_count': usage.character.count,
            'character_limit': usage.character.limit
        })
    except Exception as e:
        print(f"Error getting API usage: {e}")
        return jsonify({
            'character_count': 0,
            'character_limit': 500000
        }), 500

@app.route('/translate', methods=['POST'])
def translate():
    try:
        data = request.get_json()
        text = data.get('text')
        target_lang = data.get('target_lang')
        source_lang = data.get('source_lang')
        api_key = data.get('api_key')
        
        if not text or not target_lang:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Get translator with custom or default API key
        translator = get_translator(api_key)
        
        # Translate text
        if source_lang:
            result = translator.translate_text(text, target_lang=target_lang, source_lang=source_lang)
        else:
            result = translator.translate_text(text, target_lang=target_lang)

        # Get updated usage
        usage = translator.get_usage()
            
        return jsonify({
            'translated_text': str(result),
            'detected_source_lang': result.detected_source_lang,
            'character_count': usage.character.count,
            'character_limit': usage.character.limit
        })
    except Exception as e:
        print(f"Translation error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
