from flask import Flask, render_template, request, jsonify, send_file
import deepl
import os
from dotenv import load_dotenv
import time
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
DEFAULT_API_KEY = os.getenv('DEEPL_API_KEY')
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'docx', 'doc', 'pptx', 'xlsx', 'pdf', 'htm', 'html', 'txt', 'xlf', 'xliff', 'srt'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def get_translator(api_key=None):
    """Get a DeepL translator instance with the given API key or default key."""
    return deepl.Translator(api_key or DEFAULT_API_KEY)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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

@app.route('/upload-document', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not supported'}), 400

        target_lang = request.form.get('target_lang')
        source_lang = request.form.get('source_lang')
        api_key = request.form.get('api_key') or DEFAULT_API_KEY
        
        if not target_lang:
            return jsonify({'error': 'Target language is required'}), 400

        translator = get_translator(api_key)
        
        # Save input file temporarily
        input_filename = secure_filename(file.filename)
        input_filepath = os.path.join(app.config['UPLOAD_FOLDER'], input_filename)
        file.save(input_filepath)
        
        # Create output filepath
        output_filename = f"translated_{input_filename}"
        output_filepath = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
        
        try:
            # Translate document
            with open(input_filepath, 'rb') as in_file, \
                 open(output_filepath, 'wb') as out_file:
                translator.translate_document(
                    in_file,
                    out_file,
                    target_lang=target_lang,
                    source_lang=source_lang if source_lang else None
                )
            
            # Return translated file
            response = send_file(
                output_filepath,
                as_attachment=True,
                download_name=output_filename
            )
            
            # Clean up files after sending
            @response.call_on_close
            def cleanup():
                # Clean up both input and output files
                if os.path.exists(input_filepath):
                    os.remove(input_filepath)
                if os.path.exists(output_filepath):
                    os.remove(output_filepath)
                    
            return response
            
        finally:
            # Ensure cleanup happens even if sending file fails
            if os.path.exists(input_filepath):
                os.remove(input_filepath)
            
    except Exception as e:
        print(f"Document translation error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
