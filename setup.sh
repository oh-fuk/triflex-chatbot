#!/bin/bash
echo "Setting up Chatbot..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo ""
echo "Done! Edit .env and add your GEMINI_API_KEY"
echo "Then run: source venv/bin/activate && python app.py"
