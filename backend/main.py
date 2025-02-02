import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from datetime import datetime

app = FastAPI()

# Allow requests from the Vite frontend (default port 5173)
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory where uploaded files and exported collages will be saved
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@app.get("/ping")
def ping():
    return {"message": "pong"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Save the uploaded file with a timestamp to avoid name collisions
    file_location = os.path.join(UPLOAD_DIR, f"{datetime.now().timestamp()}_{file.filename}")
    with open(file_location, "wb") as f:
        f.write(await file.read())
    return {"filename": file.filename, "saved_path": file_location}

# ... existing code ...

@app.post("/export")
async def export_collage(image_data: str = Form(...), format: str = Form("png")):
    """
    Expects a Base64-encoded image (data URL) of the collage.
    Saves the image to the UPLOAD_DIR and returns it as a FileResponse.
    """
    try:
        output_file = os.path.join(UPLOAD_DIR, f"collage_{datetime.now().timestamp()}.{format}")
        # Remove the header (e.g. "data:image/png;base64,") and decode the image
        import base64
        if "base64," in image_data:
            header, encoded = image_data.split("base64,", 1)
        else:
            encoded = image_data
            
        data = base64.b64decode(encoded)
        with open(output_file, "wb") as f:
            f.write(data)
        
        return FileResponse(
            output_file, 
            media_type=f"image/{format}", 
            filename=f"collage_{datetime.now().timestamp()}.{format}",
            headers={"Content-Disposition": f"attachment; filename=collage_{datetime.now().timestamp()}.{format}"}
        )
    except Exception as e:
        return {"error": str(e)}, 500

# ... existing code ...