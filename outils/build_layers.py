# build_layers.py — turn the 7 Nano Banana images into aligned WebP layers.
# Input: src/*.jpg (1792x2400, same framing). Output: out/*.webp (720x960) + out/landmarks.json
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC, OUT = 'src', 'out'
OUT_SIZE = (720, 960)
WHITE_MIN = 232          # background: every channel above this value
OUTLINE_LUM = 60.0       # luminance of the dark outline, for edge un-matting

def load(name):
    return np.asarray(Image.open(f'{SRC}/{name}.jpg').convert('RGB')).astype(np.float64)

def background_mask(img):
    # Near-white regions connected to the image border
    white = img.min(2) > WHITE_MIN
    lab, _ = ndi.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    return np.isin(lab, list(border))

def unmatte(img, alpha, hole):
    # Edge pixels next to a removed white area get alpha from their lightness,
    # and their colour is recovered as if composited over white.
    near = ndi.binary_dilation(hole, iterations=3) & ~hole
    lum = img.mean(2)
    a = np.clip((255.0 - lum) / (255.0 - OUTLINE_LUM), 0.0, 1.0)
    alpha = alpha.copy()
    alpha[near] = np.minimum(alpha[near], a[near])
    out = img.copy()
    safe = np.maximum(alpha, 1e-3)[..., None]
    fixed = np.clip((img - (1.0 - alpha[..., None]) * 255.0) / safe, 0, 255)
    out[near] = fixed[near]
    return out, alpha

def save(img, alpha, mask, name):
    a = (alpha * mask * 255).round().astype(np.uint8)
    rgba = np.dstack([img.round().clip(0, 255).astype(np.uint8), a])
    Image.fromarray(rgba, 'RGBA').resize(OUT_SIZE, Image.LANCZOS).save(f'{OUT}/{name}.webp', quality=86, method=6)

ref = load('ref')
H, W = ref.shape[:2]
bg = background_mask(ref)
fig = ~bg

# --- Neck: skin-coloured component under the chin (also covers the V of the collar)
skin_ref = np.array([211, 139, 114])
skin = (np.abs(ref - skin_ref).sum(2) < 60) & fig
lab, _ = ndi.label(skin)
neck = lab == lab[1705, W // 2]
cols = np.arange(W)
cut = np.full(W, 1600)  # default split row outside the neck (ears, face sides)
has = neck.any(0)
top = np.where(has, np.argmax(neck, axis=0), 0)
for x in cols[has]:
    if top[x] > 1450:
        cut[x] = top[x]
nx = cols[has & (top > 1450)]
left, right = nx.min(), nx.max()
# Neck outline columns take the value of the nearest neck column
for x in range(left - 14, left):
    cut[x] = cut[left]
for x in range(right + 1, right + 15):
    cut[x] = cut[right]
cut = ndi.median_filter(cut, size=5)
rows = np.arange(H)[:, None]
head_region = rows < cut[None, :]

# --- Body: everything under the cut, plus the neck extended upward behind the head
body_alpha = np.ones((H, W))
body_img, body_alpha = unmatte(ref, body_alpha, bg)
body_mask = fig & ~head_region
outline_col = np.array([70.0, 50.0, 48.0])
neck_skin = np.median(ref[neck & (rows > 1700) & (rows < 1760)], axis=0)
ext_top = 1300
for x in range(left - 8, right + 9):
    y0, y1 = ext_top, cut[x]
    if y1 <= y0:
        continue
    edge = x < left + 2 or x > right - 2
    body_img[y0:y1, x] = outline_col if edge else neck_skin
    body_mask[y0:y1, x] = True
    body_alpha[y0:y1, x] = 1.0
save(body_img, body_alpha, body_mask, 'body')

# --- Head layers: same split, each from its own image
def head_layer(name, out_name, eye_holes=False):
    img = load(name)
    hb = background_mask(img)
    alpha = np.ones((H, W))
    img, alpha = unmatte(img, alpha, hb)
    mask = ~hb & head_region
    holes = np.zeros((H, W), bool)
    if eye_holes:
        white = (img.min(2) > 225) & mask
        lab2, n2 = ndi.label(white)
        sizes = ndi.sum(white, lab2, range(1, n2 + 1))
        for i in np.argsort(sizes)[::-1][:2]:
            holes |= lab2 == i + 1
        img, alpha = unmatte(img, alpha, holes)
        mask &= ~holes
    save(img, alpha, mask, out_name)
    return holes

holes = head_layer('blank', 'head-blank', eye_holes=True)
for src_name, out_name in [('closed', 'lids-closed'), ('bored', 'head-bored'),
                           ('yawn', 'head-yawn'), ('happy', 'head-happy')]:
    head_layer(src_name, out_name)

# --- Full static image for og:image and previews
static_alpha = np.ones((H, W))
static_img, static_alpha = unmatte(ref, static_alpha, bg)
save(static_img, static_alpha, fig, 'avatar-static')

# --- Crown accessory: golden cardboard pixels in the crown image, holes filled, outline added
crown = load('crown')
r, g, b = crown[..., 0], crown[..., 1], crown[..., 2]
gold = (r > 140) & (g > 105) & (b < 140) & (r - b > 45) & (rows < 760) & (rows > 280)
gold = ndi.binary_closing(gold, iterations=4)
gold = ndi.binary_fill_holes(gold)
lab3, n3 = ndi.label(gold)
sizes = ndi.sum(gold, lab3, range(1, n3 + 1))
gold = lab3 == (np.argmax(sizes) + 1)
crown_mask = ndi.binary_dilation(gold, iterations=7) & ~background_mask(crown)
crown_alpha = np.ones((H, W))
crown_img, crown_alpha = unmatte(crown, crown_alpha, background_mask(crown))
save(crown_img, crown_alpha, crown_mask, 'occasion-epiphanie')

# --- Landmarks for the CSS (percent of the canvas)
def box(m):
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max(), ys.max()

lab_h, _ = ndi.label(holes)
eyes = []
for i in (1, 2):
    x0, y0, x1, y1 = box(lab_h == i)
    eyes.append({'cx': (x0 + x1) / 2 / W * 100, 'cy': (y0 + y1) / 2 / H * 100,
                 'w': (x1 - x0 + 1) / W * 100, 'h': (y1 - y0 + 1) / H * 100})
eyes.sort(key=lambda e: e['cx'])
chin_y = cut[W // 2]
json.dump({'eyes': eyes, 'pivot': {'x': 50.0, 'y': chin_y / H * 100},
           'neck': {'left': int(left), 'right': int(right)}, 'iris_px': 97,
           'eye_w_px': eyes[0]['w'] * W / 100}, open(f'{OUT}/landmarks.json', 'w'), indent=2)
print(json.dumps({'eyes': eyes, 'pivot_y': chin_y / H * 100, 'neck': [int(left), int(right)]}, indent=1))
