"""
Generate multi-resolution icons for Tabsed application across Desktop Tauri,
Browser Extensions, and Web Frontend from the master user-provided image.
"""

import os
import sys
from PIL import Image
import numpy as np
from collections import deque

SOURCE_PATH = r"C:/Users/Kurados/.gemini/antigravity/brain/dd105c9d-c973-41d1-bc30-efc105733c5c/.user_uploaded/media_1792915767924_e3142000.jpg"
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def extract_master_rgba(src_path: str) -> Image.Image:
    src = Image.open(src_path).convert("RGB")
    arr = np.array(src, dtype=np.float32)
    h, w, _ = arr.shape
    brightness = np.max(arr, axis=2)

    # Flood fill dark background from all 4 borders
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if brightness[0, x] < 14:
            q.append((0, x)); visited[0, x] = True
        if brightness[h-1, x] < 14:
            q.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if brightness[y, 0] < 14:
            q.append((y, 0)); visited[y, 0] = True
        if brightness[y, w-1] < 14:
            q.append((y, w-1)); visited[y, w-1] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if brightness[ny, nx] < 14:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Calculate smooth anti-aliased alpha
    alpha = np.zeros((h, w), dtype=np.float32)
    unvisited = ~visited
    ramp = np.clip((brightness - 10.0) / (200.0 - 10.0), 0.0, 1.0)
    alpha[unvisited] = ramp[unvisited]

    # De-fringe / un-premultiply RGB on edges to eliminate black edge halos
    rgb = arr.copy()
    edge_mask = (alpha > 0.04) & (alpha < 0.98)
    for c in range(3):
        rgb[edge_mask, c] = np.clip(rgb[edge_mask, c] / alpha[edge_mask], 0.0, 255.0)

    # For pixels where alpha is near 0, keep clean RGB
    zero_alpha = alpha <= 0.04
    alpha[zero_alpha] = 0.0
    rgb[zero_alpha] = 0.0

    rgba = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)
    master = Image.fromarray(rgba, "RGBA")
    return master

def generate_all_icons():
    print(f"Loading and extracting master image from {SOURCE_PATH}...")
    master = extract_master_rgba(SOURCE_PATH)
    print(f"Extracted master RGBA: size={master.size}")

    # Output directories
    tauri_icons_dir = os.path.join(ROOT_DIR, "src-tauri", "icons")
    ext_icons_dir = os.path.join(ROOT_DIR, "extension", "icons")
    public_dir = os.path.join(ROOT_DIR, "public")

    os.makedirs(tauri_icons_dir, exist_ok=True)
    os.makedirs(ext_icons_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    # 1. Desktop Tauri icons (src-tauri/icons/)
    # PNGs
    tauri_sizes = {
        "icon.png": 512,
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50,
    }

    for filename, sz in tauri_sizes.items():
        dst = os.path.join(tauri_icons_dir, filename)
        resized = master.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(dst, "PNG")
        print(f"  Generated {filename} ({sz}x{sz})")

    # Multi-resolution Windows icon.ico (16, 24, 32, 48, 64, 128, 256)
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_dst = os.path.join(tauri_icons_dir, "icon.ico")
    master.save(ico_dst, format="ICO", sizes=ico_sizes)
    print(f"  Generated icon.ico with sizes: {ico_sizes}")

    # macOS icon.icns (1024, 512, 256, 128, 64, 32, 16)
    icns_dst = os.path.join(tauri_icons_dir, "icon.icns")
    try:
        master.save(icns_dst, format="ICNS")
        print(f"  Generated icon.icns")
    except Exception as e:
        print(f"  Note: ICNS generation: {e}")

    # 2. Browser Extension icons (extension/icons/)
    # icon16.png, icon32.png, icon48.png, icon128.png
    ext_sizes = {
        "icon16.png": 16,
        "icon32.png": 32,
        "icon48.png": 48,
        "icon128.png": 128,
    }
    for filename, sz in ext_sizes.items():
        dst = os.path.join(ext_icons_dir, filename)
        resized = master.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(dst, "PNG")
        print(f"  Generated extension {filename} ({sz}x{sz})")

    # 3. Web frontend icons (public/)
    # favicon.ico, favicon.png, logo.png
    public_logo_dst = os.path.join(public_dir, "logo.png")
    master.resize((512, 512), Image.Resampling.LANCZOS).save(public_logo_dst, "PNG")
    print(f"  Generated public/logo.png (512x512)")

    public_fav_png = os.path.join(public_dir, "favicon.png")
    master.resize((32, 32), Image.Resampling.LANCZOS).save(public_fav_png, "PNG")
    print(f"  Generated public/favicon.png (32x32)")

    public_fav_ico = os.path.join(public_dir, "favicon.ico")
    web_ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)]
    master.save(public_fav_ico, format="ICO", sizes=web_ico_sizes)
    print(f"  Generated public/favicon.ico with sizes: {web_ico_sizes}")

    print("\nAll icon assets successfully created!")

if __name__ == "__main__":
    generate_all_icons()
