"""
Simple test server to verify FastAPI setup works
"""
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Buffr AI Test Server")

@app.get("/")
async def root():
    return {
        "message": "Buffr AI Test Server Running",
        "status": "success",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("Starting Buffr AI Test Server...")
    uvicorn.run("test_server:app", host="0.0.0.0", port=8000, reload=True)
