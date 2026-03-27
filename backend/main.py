# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Enable CORS so your local HTML file can talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class House(BaseModel):
    id: int
    title: str
    location: str
    price_usd: float
    sq_ft: float
    image_url: str
    description: str

# Example Data (In the next step, we'll replace this with a real scraper)
DATA_STORE = [
    {
        "id": 1,
        "title": "Renovated Machiya",
        "location": "Kyoto, Japan",
        "price_usd": 45000.00,
        "sq_ft": 1200.5,
        "image_url": "https://picsum.photos/600/400?random=1",
        "description": "A beautiful 2-story traditional house near the Gion district."
    },
    {
        "id": 2,
        "title": "Mountain View Retreat",
        "location": "Nagano, Japan",
        "price_usd": 15000.00,
        "sq_ft": 950.0,
        "image_url": "https://picsum.photos/600/400?random=2",
        "description": "Perfect for ski lovers. Cheap and structurally sound."
    }
]

@app.get("/api/houses", response_model=List[House])
async def get_all_houses():
    return DATA_STORE

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)