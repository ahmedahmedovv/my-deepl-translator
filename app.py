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
        # Debug: Print received files
        print("Received files:", request.files)
        print("Received form data:", request.form)

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
            print(f"File size: {os.path.getsize(filepath)} bytes")
            print(f"Attempting to translate file: {filepath}")
            
            # Create input and output paths
            input_document = filepath
            output_document = output_path
            
            try:
                # Translate the document
                translator.translate_document_from_filepath(
                    input_document,
                    output_document,
                    target_lang=target_lang,
                    formality='default'
                )
                
                print(f"Reading translated file from: {output_document}")
                with open(output_document, 'rb') as f:
                    translated_content = f.read()
                    
                return send_file(
                    io.BytesIO(translated_content),
                    as_attachment=True,
                    download_name=f"translated_{filename}"
                )
                
            except deepl.DocumentTranslationException as e:
                print(f"DeepL API error: {str(e)}")
                raise
            except Exception as e:
                print(f"Unexpected error during translation: {str(e)}")
                raise
                
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
        error_message = f"Translation error: {str(e)}"
        print(error_message)
        return jsonify({
            'success': False,
            'error': error_message
        }), 400

if __name__ == '__main__':
    app.run(debug=True)
