#!/usr/bin/env python3
"""Prepare local, reviewable production derivatives; originals are immutable."""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageDraw
import base64, hashlib, json, math

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "assets"
OUT = ROOT / "art-output"
OUT.mkdir(parents=True, exist_ok=True)
NAMES = {
    "optical-core": "concept-a-optical-foundry.webp",
    "titanium-fold": "concept-b-precision-editorial.webp",
    "connected-core": "concept-c-living-systems.webp",
    "product-layers": "concept-d-product-gallery.webp",
    "spectral-prism": "concept-e-prismatic-studio.webp",
}
def alpha_mass(a):
    return sum(i * n for i, n in enumerate(a.histogram()))
def clean_alpha(im):
    a = im.getchannel("A")
    low = a.point(lambda x: 0 if x <= 5 else x)
    # Remove isolated single-pixel fringe only, preserve broad transparent glass.
    nearby = low.filter(ImageFilter.MedianFilter(3)).point(lambda x: 255 if x else 0)
    cleaned = ImageChops.multiply(low, nearby)
    loss = (alpha_mass(a) - alpha_mass(cleaned)) / max(1, alpha_mass(a))
    if loss > .003:
        cleaned = low
        loss = (alpha_mass(a) - alpha_mass(cleaned)) / max(1, alpha_mass(a))
    if loss > .003:
        cleaned, loss = a, 0
    im.putalpha(cleaned)
    return im, loss
def derivative(im, width):
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("Empty image")
    crop = im.crop(bbox)
    pad = max(16, round(width * .025))
    scale = min(1, (width - pad * 2) / crop.width)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(size, Image.Resampling.LANCZOS)
    padded = Image.new("RGBA", (size[0]+2*pad, size[1]+2*pad))
    padded.paste(crop, (pad,pad))
    return padded
def edge_max(a):
    w,h=a.size
    return max(a.crop(box).getextrema()[1] for box in [(0,0,w,8),(0,h-8,w,h),(0,0,8,h),(w-8,0,w,h)])
def log_bytes(name, data):
    encoded = base64.b64encode(data).decode("ascii")
    chunks = [encoded[i:i+12000] for i in range(0,len(encoded),12000)]
    for i, chunk in enumerate(chunks):
        print(f"SD_ART_DATA {name} {i+1}/{len(chunks)} {chunk}", flush=True)

def main():
    records=[]
    board=Image.new("RGB",(1600,5*260),(248,249,252))
    draw=ImageDraw.Draw(board)
    for row,(key,source) in enumerate(NAMES.items()):
        original=Image.open(SRC/source).convert("RGBA")
        before=original.size
        im,loss=clean_alpha(original.copy())
        for tag,width in [("desktop",1440),("mobile",820)]:
            prepared=derivative(im,width)
            name=f"{key}-{tag}.webp"
            target=OUT/name
            prepared.save(target,"WEBP",quality=86,method=6,alpha_quality=100,exact=True)
            check=Image.open(target).convert("RGBA")
            alpha=check.getchannel("A")
            assert check.width<=width and edge_max(alpha)==0 and alpha.getextrema()[0]==0 and alpha.getextrema()[1]>0
            data=target.read_bytes()
            records.append({"file":name,"source":source,"original_size":before,"size":list(check.size),"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest(),"edge_alpha_max":edge_max(alpha),"alpha_mass_removed_fraction":round(loss,7)})
            log_bytes(name,data)
        art=Image.open(OUT/f"{key}-desktop.webp").convert("RGBA")
        art.thumbnail((750,214),Image.Resampling.LANCZOS)
        y=row*260
        for col,bg in enumerate([(248,249,252),(32,40,59)]):
            tile=Image.new("RGBA",(800,260),bg+(255,))
            tile.alpha_composite(art,((800-art.width)//2,(260-art.height)//2))
            board.paste(tile.convert("RGB"),(800*col,y))
            draw.text((800*col+16,y+10),key,fill=(42,52,70) if col==0 else (245,247,250))
    board.save(OUT/"alpha-comparison.png",optimize=True)
    manifest={"method":"conservative alpha fringe clean, crop, transparent padding, Lanczos resize; unchanged originals","files":records}
    (OUT/"manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
    print("SD_ART_MANIFEST "+json.dumps(manifest,separators=(",",":")),flush=True)
if __name__=="__main__":
    main()
