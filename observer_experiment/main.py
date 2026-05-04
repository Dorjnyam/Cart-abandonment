"""
Entry point — delegates to the ``observer`` package.

Run:
    python main.py
    uvicorn observer.main:app --host 0.0.0.0 --port 8001
"""

from observer.main import app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("observer.main:app", host="0.0.0.0", port=8001, reload=True)
