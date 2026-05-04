@echo off

set CONDA=C:\Users\dell\anaconda3\condabin\conda.bat

echo Starting services...

:: Backend services
start cmd /k "call %CONDA% activate django && cd main_service && python manage.py runserver"

start cmd /k "call %CONDA% activate django && cd feature\feature_svc && python main.py"

start cmd /k "call %CONDA% activate django && cd observer_experiment && python main.py"

start cmd /k "call %CONDA% activate django && cd session\session && uvicorn app.main:app --host 0.0.0.0 --port 8002"

start cmd /k "call %CONDA% activate django && cd ml && uvicorn app.main:app --host 0.0.0.0 --port 8004"

:: Frontend
start cmd /k "cd cart_analytic && npm run dev -- --port 3001"

start cmd /k "cd sneaker-store && npm run dev:host"

echo All services started
pause