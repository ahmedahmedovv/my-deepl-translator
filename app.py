from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv
import deepl
import os
from werkzeug.utils import secure_filename
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize DeepL translator
translator = deepl.Translator(os.getenv('DEEPL_API_KEY'))

# Add after existing configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'pptx', 'xlsx', 'html'}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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

@app.route('/translate-document', methods=['POST'])
def translate_document():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
            
        file = request.files['file']
        target_lang = request.form.get('target_lang', 'EN-US')
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': f'File type not supported. Allowed types: {ALLOWED_EXTENSIONS}'}), 400
            
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        output_path = os.path.join(app.config['UPLOAD_FOLDER'], f"translated_{filename}")
        
        print(f"Saving file to: {filepath}")
        file.save(filepath)
        
        try:
            # First, detect the source language using the text API
            # Read first few KB of the file for language detection
            with open(filepath, 'r', errors='ignore') as f:
                sample_text = f.read(1000)  # Read first 1000 characters
            
            # Detect source language
            source_lang_result = translator.translate_text(
                sample_text,
                target_lang='EN-US'  # Temporary target for detection
            )
            detected_lang = source_lang_result.detected_source_lang
            
            # Check if source and target languages are the same
            if detected_lang.upper() == target_lang.split('-')[0]:
                raise Exception(f"Source language ({detected_lang}) is the same as target language ({target_lang}). No translation needed.")
            
            print(f"Detected source language: {detected_lang}")
            print(f"Target language: {target_lang}")
            
            # Proceed with document translation
            translator.translate_document_from_filepath(
                filepath,
                output_path,
                target_lang=target_lang,
                source_lang=detected_lang,  # Specify detected source language
                formality='default'
            )
            
            print(f"Reading translated file from: {output_path}")
            with open(output_path, 'rb') as f:
                translated_content = f.read()
                
            return send_file(
                io.BytesIO(translated_content),
                as_attachment=True,
                download_name=f"translated_{filename}"
            )
                
        finally:
            # Cleanup files
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
                    print(f"Cleaned up original file: {filepath}")
                if os.path.exists(output_path):
                    os.remove(output_path)
                    print(f"Cleaned up translated file: {output_path}")
            except Exception as e:
                print(f"Error during cleanup: {str(e)}")
        
    except Exception as e:
        error_message = str(e)
        print(f"Translation error: {error_message}")
        return jsonify({
            'success': False,
            'error': error_message
        }), 400

if __name__ == '__main__':
    app.run(debug=True)
