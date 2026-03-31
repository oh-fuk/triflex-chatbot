@echo off
echo Setting up Chatbot...
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
echo.
echo Done! Now edit .env and add your GEMINI_API_KEY
echo Then run: venv\Scripts\activate ^&^& python app.py
pause
