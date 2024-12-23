from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import deepl
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize DeepL translator
translator = deepl.Translator(os.getenv('DEEPL_API_KEY'))

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    try:
        data = request.json
        text = data.get('text', '')
        target_lang = data.get('target_lang', 'EN-US')
        
        result = translator.translate_text(text, target_lang=target_lang)
        
        detected_lang = result.detected_source_lang
        
        return jsonify({
            'success': True,
            'translated_text': result.text,
            'detected_language': detected_lang
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True)
