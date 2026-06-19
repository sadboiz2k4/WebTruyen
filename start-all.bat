@echo off
echo Installing/checking Python dependencies...
"C:\Users\Admin\AppData\Local\Programs\Python\Python311\python.exe" -m pip install -q Pillow ImageHash pymysql flask flask-cors requests numpy sentence-transformers transformers torch timm
echo Dependencies ready.

echo Starting AI Service...
start "AI Service" "C:\Users\Admin\AppData\Local\Programs\Python\Python311\python.exe" "c:\Users\Admin\Desktop\WebTruyen\AIService\app.py"

echo Waiting for AI Service to load all models (90s)...
timeout /t 90 /nobreak

echo Indexing all existing text chapters into kho...
curl -s -X POST http://localhost:5000/index-all

echo Indexing all existing image chapters into kho...
curl -s -X POST http://localhost:5000/index-all-images

echo.
echo Starting Backend...
start "Backend" cmd /k "cd /d c:\Users\Admin\Desktop\WebTruyen\BackEnd && mvn spring-boot:run"

echo.
echo Both services starting.
echo AI Service: http://localhost:5000
echo Backend:    http://localhost:8080
echo Frontend:   http://localhost:5173
pause
