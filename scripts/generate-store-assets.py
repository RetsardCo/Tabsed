import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

out_dir = r"C:\Users\Kurados\.gemini\antigravity\scratch\Tabsed\store-assets\submission-v2"
os.makedirs(out_dir, exist_ok=True)

uploaded = r"C:\Users\Kurados\.gemini\antigravity\brain\dd105c9d-c973-41d1-bc30-efc105733c5c\.user_uploaded"
icon_path = r"C:\Users\Kurados\.gemini\antigravity\scratch\Tabsed\public\logo.png"

font_bold = r"C:\Windows\Fonts\segoeuib.ttf"
font_semi = r"C:\Windows\Fonts\segoeuisb.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeuisb.ttf") else font_bold
font_reg = r"C:\Windows\Fonts\segoeui.ttf"

img_ext_raw = Image.open(os.path.join(uploaded, "media_1793519615155_95d47170.png")).convert("RGBA")
img_dark_raw = Image.open(os.path.join(uploaded, "media_1793519640320_bf065d1b.png")).convert("RGBA")
img_light_raw = Image.open(os.path.join(uploaded, "media_1793519640336_588ef0be.png")).convert("RGBA")
img_chrome_raw = Image.open(os.path.join(uploaded, "media_1793519640351_f734182d.png")).convert("RGBA")
img_inspect_raw = Image.open(os.path.join(uploaded, "media_1793519640360_5ff08394.png")).convert("RGBA")
icon_raw = Image.open(icon_path).convert("RGBA")

def make_background(w, h, glow_points=None):
    base = Image.new("RGB", (w, h), (9, 13, 22))
    d = ImageDraw.Draw(base)
    
    if glow_points:
        for (gx, gy, radius, color) in glow_points:
            for r in range(radius, 0, -max(1, radius // 25)):
                alpha = int(color[3] * (1.0 - (r / radius) ** 1.5))
                c = (min(255, 9 + int(color[0] * alpha / 255)),
                     min(255, 13 + int(color[1] * alpha / 255)),
                     min(255, 22 + int(color[2] * alpha / 255)))
                d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=c)
    return base

def draw_framed_window(canvas, content_img, x, y, win_w, win_h, title="Tabsed - Local Vault", radius=12, dark_titlebar=True):
    shadow_pad = 18
    shadow_img = Image.new("RGBA", (win_w + shadow_pad * 2, win_h + shadow_pad * 2), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_img)
    sd.rounded_rectangle([shadow_pad, shadow_pad, shadow_pad + win_w, shadow_pad + win_h],
                         radius=radius + 2, fill=(0, 0, 0, 150))
    shadow_blur = shadow_img.filter(ImageFilter.GaussianBlur(14))
    canvas.paste(shadow_blur, (x - shadow_pad, y - shadow_pad), shadow_blur)
    
    win = Image.new("RGBA", (win_w, win_h), (0, 0, 0, 0))
    wd = ImageDraw.Draw(win)
    
    bg_fill = (15, 23, 42, 255) if dark_titlebar else (248, 250, 252, 255)
    border_col = (51, 65, 85, 255) if dark_titlebar else (203, 213, 225, 255)
    wd.rounded_rectangle([0, 0, win_w - 1, win_h - 1], radius=radius, fill=bg_fill, outline=border_col, width=1)
    
    tb_h = 32
    tb_fill = (22, 30, 48, 255) if dark_titlebar else (226, 232, 240, 255)
    wd.rounded_rectangle([0, 0, win_w - 1, tb_h], radius=radius, fill=tb_fill)
    wd.rectangle([0, tb_h - 8, win_w - 1, tb_h], fill=tb_fill)
    line_col = (45, 55, 72, 255) if dark_titlebar else (203, 213, 225, 255)
    wd.line([(0, tb_h), (win_w - 1, tb_h)], fill=line_col, width=1)
    
    wd.ellipse([14, 11, 24, 21], fill=(239, 68, 68, 255))
    wd.ellipse([30, 11, 40, 21], fill=(245, 158, 11, 255))
    wd.ellipse([46, 11, 56, 21], fill=(16, 185, 129, 255))
    
    ft = ImageFont.truetype(font_semi, 12)
    t_color = (148, 163, 184, 255) if dark_titlebar else (71, 85, 105, 255)
    wd.text((win_w // 2, 16), title, font=ft, fill=t_color, anchor="mm")
    
    avail_w = win_w - 2
    avail_h = win_h - tb_h - 1
    scaled_content = content_img.resize((avail_w, avail_h), Image.Resampling.LANCZOS)
    win.paste(scaled_content, (1, tb_h + 1))
    
    canvas.paste(win, (x, y), win)

def draw_pill_badge(draw, x, y, text, font, bg_col, text_col, border_col=None, pad_x=12, pad_y=5):
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w = tw + pad_x * 2
    h = th + pad_y * 2
    draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=bg_col, outline=border_col, width=1)
    draw.text((x + w // 2, y + h // 2), text, font=font, fill=text_col, anchor="mm")
    return w, h

# ==========================================
# 1. SMALL PROMOTIONAL TILE (440 x 280)
# ==========================================
print("Generating small promotional tile (440x280)...")
w_sp, h_sp = 440, 280
im_sp = make_background(w_sp, h_sp, [(220, 75, 130, (56, 189, 248, 50))])
dsp = ImageDraw.Draw(im_sp)

# Logo
ico_sp = icon_raw.resize((80, 80), Image.Resampling.LANCZOS)
im_sp.paste(ico_sp, (220 - 40, 32), ico_sp)

# Title & subtitle
f_s_t = ImageFont.truetype(font_bold, 24)
f_s_sub = ImageFont.truetype(font_reg, 13)
f_s_badge = ImageFont.truetype(font_bold, 11)

dsp.text((220, 134), "Tabsed", font=f_s_t, fill=(255, 255, 255), anchor="mt")
dsp.text((220, 166), "Visual Tab & Session Manager", font=f_s_sub, fill=(148, 163, 184), anchor="mt")

# Badge
b_text = "100% LOCAL-FIRST VAULT"
b_box = f_s_badge.getbbox(b_text)
bw = (b_box[2] - b_box[0]) + 20
bh = 24
bx = 220 - bw // 2
by = 205
dsp.rounded_rectangle([bx, by, bx + bw, by + bh], radius=12, fill=(18, 30, 50), outline=(56, 189, 248), width=1)
dsp.text((220, by + bh // 2), b_text, font=f_s_badge, fill=(56, 189, 248), anchor="mm")

im_sp.save(os.path.join(out_dir, "small-promo-440x280.png"), "PNG")

# ==========================================
# 2. LARGE PROMOTIONAL TILE (1400 x 560)
# ==========================================
print("Generating large promotional tile (1400x560)...")
lw, lh = 1400, 560
im_lp = make_background(lw, lh, [
    (260, 260, 320, (56, 189, 248, 45)),
    (1100, 280, 350, (30, 58, 138, 45))
])
dlp = ImageDraw.Draw(im_lp)

# Left column: Brand & Messaging
ico_lp = icon_raw.resize((105, 105), Image.Resampling.LANCZOS)
im_lp.paste(ico_lp, (70, 75), ico_lp)

f_lp_t = ImageFont.truetype(font_bold, 44)
f_lp_tag = ImageFont.truetype(font_bold, 20)
f_lp_desc = ImageFont.truetype(font_reg, 15)
f_lp_badge = ImageFont.truetype(font_semi, 12)

dlp.text((70, 195), "Tabsed", font=f_lp_t, fill=(255, 255, 255))
dlp.text((70, 254), "Visual Tab & Session Vault for Microsoft Edge", font=f_lp_tag, fill=(56, 189, 248))
dlp.text((70, 290), "Thoughtfully put tabs away without losing context.\nInstant one-click capture with high-resolution screenshot previews\nand strictly zero cloud telemetry.", font=f_lp_desc, fill=(148, 163, 184))

# Badges
badges = ["100% Local-First", "Visual Website Previews", "Native IPC Sync", "Open Source"]
bx = 70
by = 385
for b in badges:
    bw, bh = draw_pill_badge(dlp, bx, by, b, f_lp_badge, (20, 32, 54), (224, 242, 254), (56, 189, 248), pad_x=12, pad_y=6)
    bx += bw + 12

# Right side: Composite of framed Desktop App + Floating Extension Popup
app_w, app_h = 670, 395
draw_framed_window(im_lp, img_dark_raw, 680, 75, app_w, app_h, title="Tabsed - Visual Tab Vault")

# Floating Extension Popup on top-left of app window
pop_w = 260
pop_h = int(img_ext_raw.height * (pop_w / img_ext_raw.width))
scaled_pop = img_ext_raw.resize((pop_w, pop_h), Image.Resampling.LANCZOS)

pop_x = 630
pop_y = 175

# Shadow for popup
s_pad = 16
s_box = Image.new("RGBA", (pop_w + s_pad*2, pop_h + s_pad*2), (0, 0, 0, 0))
ImageDraw.Draw(s_box).rounded_rectangle([s_pad, s_pad, s_pad+pop_w, s_pad+pop_h], radius=16, fill=(0, 0, 0, 190))
s_blur = s_box.filter(ImageFilter.GaussianBlur(12))
im_lp.paste(s_blur, (pop_x - s_pad, pop_y - s_pad), s_blur)

# Border for popup
pop_framed = Image.new("RGBA", (pop_w, pop_h), (0, 0, 0, 0))
pfd = ImageDraw.Draw(pop_framed)
pfd.rounded_rectangle([0, 0, pop_w-1, pop_h-1], radius=14, outline=(56, 189, 248), width=2)
pop_framed.paste(scaled_pop, (0, 0), scaled_pop)
im_lp.paste(pop_framed, (pop_x, pop_y), pop_framed)

im_lp.save(os.path.join(out_dir, "large-promo-1400x560.png"), "PNG")

# ==========================================
# SCREENSHOT HELPER
# ==========================================
def create_store_screenshot(title_text, subtitle_text, content_builder, out_filename):
    sw, sh = 1280, 800
    im = make_background(sw, sh, [
        (sw // 2, 80, 300, (56, 189, 248, 35)),
        (sw - 200, sh - 150, 350, (30, 58, 138, 30))
    ])
    d = ImageDraw.Draw(im)
    
    f_title = ImageFont.truetype(font_bold, 28)
    f_sub = ImageFont.truetype(font_reg, 15)
    
    d.text((sw // 2, 36), title_text, font=f_title, fill=(255, 255, 255), anchor="mt")
    d.text((sw // 2, 74), subtitle_text, font=f_sub, fill=(148, 163, 184), anchor="mt")
    
    content_builder(im, d, sw, sh)
    
    im.save(os.path.join(out_dir, out_filename), "PNG")
    print(f"Created {out_filename}")

# ==========================================
# 3. SCREENSHOT 1: Extension Popup (1280 x 800)
# ==========================================
def build_screenshot_1(im, d, sw, sh):
    # Left side: Extension Popup
    pop_w = 420
    pop_h = int(img_ext_raw.height * (pop_w / img_ext_raw.width))
    scaled_pop = img_ext_raw.resize((pop_w, pop_h), Image.Resampling.LANCZOS)
    
    px = 110
    py = 170
    
    # Shadow
    s_pad = 20
    s_box = Image.new("RGBA", (pop_w + s_pad*2, pop_h + s_pad*2), (0, 0, 0, 0))
    ImageDraw.Draw(s_box).rounded_rectangle([s_pad, s_pad, s_pad+pop_w, s_pad+pop_h], radius=18, fill=(0, 0, 0, 200))
    s_blur = s_box.filter(ImageFilter.GaussianBlur(16))
    im.paste(s_blur, (px - s_pad, py - s_pad), s_blur)
    
    # Border
    p_card = Image.new("RGBA", (pop_w, pop_h), (0, 0, 0, 0))
    p_card.paste(scaled_pop, (0, 0), scaled_pop)
    ImageDraw.Draw(p_card).rounded_rectangle([0, 0, pop_w-1, pop_h-1], radius=16, outline=(56, 189, 248), width=2)
    im.paste(p_card, (px, py), p_card)
    
    # Right side: Feature Cards
    fx = 590
    fy = 170
    card_w = 580
    card_h = 105
    
    features = [
        ("1-Click Tab & Session Saving", "Save the active tab, selected tabs, or all 120+ window tabs with full URLs and titles.", "1"),
        ("Automatic Visual Previews", "Captures high-resolution website thumbnails so you recognize saved articles instantly.", "2"),
        ("Collection Routing", "Organize saved tabs straight into Inbox, Deep Research, or custom project folders.", "3"),
        ("Memory Relief with Auto-Close", "Safely close tabs after saving to free up Edge system memory while preserving your state.", "4")
    ]
    
    f_ch = ImageFont.truetype(font_bold, 17)
    f_cd = ImageFont.truetype(font_reg, 14)
    f_num = ImageFont.truetype(font_bold, 15)
    
    for i, (title, desc, num) in enumerate(features):
        cy = fy + i * (card_h + 16)
        # Background card
        d.rounded_rectangle([fx, cy, fx + card_w, cy + card_h], radius=12, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
        
        # Number badge
        d.rounded_rectangle([fx + 18, cy + 20, fx + 58, cy + 60], radius=10, fill=(22, 38, 66), outline=(56, 189, 248), width=1)
        d.text((fx + 38, cy + 40), num, font=f_num, fill=(56, 189, 248), anchor="mm")
        
        # Text
        d.text((fx + 76, cy + 24), title, font=f_ch, fill=(255, 255, 255))
        d.text((fx + 76, cy + 54), desc, font=f_cd, fill=(148, 163, 184))

create_store_screenshot(
    "One-Click Tab & Session Capture for Microsoft Edge",
    "Save single tabs, selected groups, or entire 120+ tab windows directly into your private local vault",
    build_screenshot_1,
    "screenshot-1-1280x800.png"
)

# ==========================================
# 4. SCREENSHOT 2: Visual Tab Vault (Dark Mode)
# ==========================================
def build_screenshot_2(im, d, sw, sh):
    win_w = 1140
    win_h = 600
    wx = (sw - win_w) // 2
    wy = 120
    draw_framed_window(im, img_dark_raw, wx, wy, win_w, win_h, title="Tabsed - All Tabs (Dark Mode)")
    
    # Bottom feature pills
    pills = ["Clean Card Grid", "Visual Website Thumbnails", "Card Notes at a Glance", "Customizable Columns"]
    f_p = ImageFont.truetype(font_semi, 13)
    total_w = 0
    pads = []
    for p in pills:
        b = f_p.getbbox(p)
        bw = (b[2] - b[0]) + 28
        pads.append(bw)
        total_w += bw
    total_w += (len(pills) - 1) * 14
    
    start_x = (sw - total_w) // 2
    py = 745
    for i, p in enumerate(pills):
        bw, bh = draw_pill_badge(d, start_x, py, p, f_p, (18, 30, 52), (224, 242, 254), (56, 189, 248), pad_x=14, pad_y=6)
        start_x += bw + 14

create_store_screenshot(
    "Visual Tab Vault with Real Website Screenshots",
    "Recognize saved tabs instantly by visual website thumbnails instead of guessing by URLs alone",
    build_screenshot_2,
    "screenshot-2-1280x800.png"
)

# ==========================================
# 5. SCREENSHOT 3: Focused Tab Inspector Modal
# ==========================================
def build_screenshot_3(im, d, sw, sh):
    win_w = 1140
    win_h = 600
    wx = (sw - win_w) // 2
    wy = 120
    draw_framed_window(im, img_inspect_raw, wx, wy, win_w, win_h, title="Tabsed - Tab Inspector & Website Preview")
    
    pills = ["Zero Layout Reflow", "Full-Resolution Preview", "Instant 1-Click Restore", "Markdown Notes & Tags"]
    f_p = ImageFont.truetype(font_semi, 13)
    total_w = 0
    for p in pills:
        b = f_p.getbbox(p)
        total_w += (b[2] - b[0]) + 28
    total_w += (len(pills) - 1) * 14
    
    start_x = (sw - total_w) // 2
    py = 745
    for p in pills:
        bw, bh = draw_pill_badge(d, start_x, py, p, f_p, (18, 30, 52), (224, 242, 254), (56, 189, 248), pad_x=14, pad_y=6)
        start_x += bw + 14

create_store_screenshot(
    "Distraction-Free Foreground Tab Inspector",
    "Inspect full-size website snapshots, manage tags, and write personal notes with zero layout shifting",
    build_screenshot_3,
    "screenshot-3-1280x800.png"
)

# ==========================================
# 6. SCREENSHOT 4: Light Mode Theme
# ==========================================
def build_screenshot_4(im, d, sw, sh):
    win_w = 1140
    win_h = 600
    wx = (sw - win_w) // 2
    wy = 120
    draw_framed_window(im, img_light_raw, wx, wy, win_w, win_h, title="Tabsed - All Tabs (Light Mode)", dark_titlebar=False)
    
    pills = ["High Contrast Light Mode", "Fluid Frosted Glass", "Windows Mica Aesthetic", "Fast Keyboard Navigation"]
    f_p = ImageFont.truetype(font_semi, 13)
    total_w = 0
    for p in pills:
        b = f_p.getbbox(p)
        total_w += (b[2] - b[0]) + 28
    total_w += (len(pills) - 1) * 14
    
    start_x = (sw - total_w) // 2
    py = 745
    for p in pills:
        bw, bh = draw_pill_badge(d, start_x, py, p, f_p, (18, 30, 52), (224, 242, 254), (56, 189, 248), pad_x=14, pad_y=6)
        start_x += bw + 14

create_store_screenshot(
    "Thoughtfully Crafted Light & Dark Themes",
    "High-contrast typography, fluid frosted glass, and Windows Mica styling that feels right at home on your PC",
    build_screenshot_4,
    "screenshot-4-1280x800.png"
)

# ==========================================
# 7. SCREENSHOT 5: Multi-Browser & Collections
# ==========================================
def build_screenshot_5(im, d, sw, sh):
    win_w = 1140
    win_h = 600
    wx = (sw - win_w) // 2
    wy = 120
    draw_framed_window(im, img_chrome_raw, wx, wy, win_w, win_h, title="Tabsed - Multi-Browser Workspaces")
    
    pills = ["Edge, Chrome & Firefox", "Drag to Group Tabs", "Project Collections", "Trash & 30-Day Recovery"]
    f_p = ImageFont.truetype(font_semi, 13)
    total_w = 0
    for p in pills:
        b = f_p.getbbox(p)
        total_w += (b[2] - b[0]) + 28
    total_w += (len(pills) - 1) * 14
    
    start_x = (sw - total_w) // 2
    py = 745
    for p in pills:
        bw, bh = draw_pill_badge(d, start_x, py, p, f_p, (18, 30, 52), (224, 242, 254), (56, 189, 248), pad_x=14, pad_y=6)
        start_x += bw + 14

create_store_screenshot(
    "Multi-Browser Management & Custom Collections",
    "Organize tabs across Edge, Chrome, and Firefox into drag-and-drop groups, tags, and project workspaces",
    build_screenshot_5,
    "screenshot-5-1280x800.png"
)

# ==========================================
# 8. SCREENSHOT 6: 100% Local-First & Zero Telemetry
# ==========================================
def build_screenshot_6(im, d, sw, sh):
    # Left side: Framed Extension Popup
    pop_w = 380
    pop_h = int(img_ext_raw.height * (pop_w / img_ext_raw.width))
    scaled_pop = img_ext_raw.resize((pop_w, pop_h), Image.Resampling.LANCZOS)
    
    px = 110
    py = 180
    
    s_pad = 18
    s_box = Image.new("RGBA", (pop_w + s_pad*2, pop_h + s_pad*2), (0, 0, 0, 0))
    ImageDraw.Draw(s_box).rounded_rectangle([s_pad, s_pad, s_pad+pop_w, s_pad+pop_h], radius=18, fill=(0, 0, 0, 200))
    s_blur = s_box.filter(ImageFilter.GaussianBlur(14))
    im.paste(s_blur, (px - s_pad, py - s_pad), s_blur)
    
    p_card = Image.new("RGBA", (pop_w, pop_h), (0, 0, 0, 0))
    p_card.paste(scaled_pop, (0, 0), scaled_pop)
    ImageDraw.Draw(p_card).rounded_rectangle([0, 0, pop_w-1, pop_h-1], radius=16, outline=(16, 185, 129), width=2)
    im.paste(p_card, (px, py), p_card)
    
    # Right side: Security & Architecture Cards
    fx = 550
    fy = 170
    card_w = 620
    card_h = 105
    
    pillars = [
        ("Zero Remote Servers & Analytics", "No remote tracking endpoints, no Google Analytics, no third-party ads. Your data never leaves your device.", "1"),
        ("Local Standard Input/Output IPC", "Communicates securely between Edge and the Tabsed desktop vault via standard input/output pipes on localhost.", "2"),
        ("Automatic Sensitive Token Redaction", "Query strings containing tokens, api keys, or passwords are automatically redacted before saving.", "3"),
        ("AES-256 Vault Encryption & Open Source", "Optionally encrypt your entire vault with AES-256-GCM. 100% open-source under MIT & Apache 2.0.", "4")
    ]
    
    f_ch = ImageFont.truetype(font_bold, 17)
    f_cd = ImageFont.truetype(font_reg, 14)
    f_num = ImageFont.truetype(font_bold, 15)
    
    for i, (title, desc, num) in enumerate(pillars):
        cy = fy + i * (card_h + 16)
        d.rounded_rectangle([fx, cy, fx + card_w, cy + card_h], radius=12, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
        
        # Green shield accent
        d.rounded_rectangle([fx + 18, cy + 20, fx + 58, cy + 60], radius=10, fill=(18, 45, 38), outline=(16, 185, 129), width=1)
        d.text((fx + 38, cy + 40), num, font=f_num, fill=(16, 185, 129), anchor="mm")
        
        d.text((fx + 76, cy + 24), title, font=f_ch, fill=(255, 255, 255))
        d.text((fx + 76, cy + 54), desc, font=f_cd, fill=(148, 163, 184))

create_store_screenshot(
    "100% Local-First Privacy & Zero Telemetry",
    "Your browsing history and saved tabs never leave your machine. No cloud servers, no tracking, no ads.",
    build_screenshot_6,
    "screenshot-6-1280x800.png"
)

print("All store assets successfully created in:", out_dir)
