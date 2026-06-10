import base64
import io
import os
import random

import torch
from diffusers import StableDiffusionXLPipeline
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

API_SECRET = os.getenv("API_SECRET")
MODEL_ID   = os.getenv("MODEL_ID", "stabilityai/sdxl-turbo")

device = "mps" if torch.backends.mps.is_available() else "cpu"
dtype  = torch.float16 if device == "mps" else torch.float32

print("Loading model...")
pipe = StableDiffusionXLPipeline.from_pretrained(
    MODEL_ID, torch_dtype=dtype, local_files_only=True
).to(device)
print(f"Ready on {device}.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str | None = None
    num_inference_steps: int = 1
    guidance_scale: float = 0.0
    width: int = 1024
    height: int = 1024
    seed: int | None = None


@app.post("/generate")
def generate(req: GenerateRequest, request: Request):
    if API_SECRET:
        authorization = request.headers.get("authorization") or request.headers.get("Authorization")
        if authorization != f"Bearer {API_SECRET}":
            raise HTTPException(status_code=401, detail="Unauthorized")

    if req.width % 8 != 0 or req.height % 8 != 0:
        raise HTTPException(status_code=400, detail="Width and height must be divisible by 8")

    seed      = req.seed if req.seed is not None else random.randint(0, 2**32 - 1)
    generator = torch.Generator(device=device).manual_seed(seed)

    images = pipe(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        num_inference_steps=req.num_inference_steps,
        guidance_scale=req.guidance_scale,
        width=req.width,
        height=req.height,
        generator=generator,
    ).images

    buffer = io.BytesIO()
    images[0].save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode()

    return {"image": encoded, "seed": seed}
