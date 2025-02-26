import webbrowser
import os
import time
from app import app

# Start the Flask app in a background thread
import threading
threading.Thread(target=lambda: app.run(port=8080)).start()

# Give the server a moment to start
time.sleep(1.5)

# Open the browser to the app
webbrowser.open('http://127.0.0.1:8080/')

# Keep the script running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Shutting down...")
