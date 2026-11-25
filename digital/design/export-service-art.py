import sys,base64,hashlib,json
from PIL import Image
from pathlib import Path
kind=sys.argv[1]
im=Image.open('render.png').convert('RGBA')
a=im.getchannel('A');bbox=a.getbbox()
assert bbox and a.getextrema()==(0,255)
im=im.crop(bbox)
for profile,width in [('desktop',960),('mobile',560)]:
    im2=im.copy();im2.thumbnail((width-40,int(width*.86)-40),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(im2.width+40,im2.height+40));out.paste(im2,(20,20))
    p=Path(f'{kind}-{profile}.webp');out.save(p,'WEBP',quality=88,method=6,alpha_quality=100)
    b=p.read_bytes();h=hashlib.sha256(b).hexdigest()
    print('SD_RENDER_META '+json.dumps({'name':p.name,'width':out.width,'height':out.height,'bytes':len(b),'sha256':h}))
    chunks=[base64.b64encode(b).decode()[i:i+12000] for i in range(0,len(base64.b64encode(b)),12000)]
    for i,c in enumerate(chunks):print(f'SD_RENDER_DATA {p.name} {i+1}/{len(chunks)} {c}')
