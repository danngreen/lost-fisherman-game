# Draws the app icon as pixel art (32x32) and scales it up with crisp pixels.
import sys
from PIL import Image, ImageDraw

S = 32
im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
px = im.load()

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
horizon = 19
for y in range(S):
    for x in range(S):
        if y < horizon:
            t = y / horizon
            c = lerp((10, 14, 40), (70, 50, 100), t ** 1.6)
        else:
            t = (y - horizon) / (S - horizon)
            c = lerp((40, 62, 104), (10, 26, 48), t)
            if ((x * 7 + y * 3) % 11 == 0) and y % 2 == 0:
                c = lerp(c, (140, 180, 220), 0.5)
        d = (bayer[y % 4][x % 4] / 16 - 0.5) * 10
        px[x, y] = (max(0, min(255, int(c[0] + d))), max(0, min(255, int(c[1] + d))), max(0, min(255, int(c[2] + d))), 255)

def put(x, y, col):
    if 0 <= x < S and 0 <= y < S:
        px[x, y] = col + (255,) if len(col) == 3 else col

# stars
for (x, y) in [(3, 3), (9, 6), (26, 4), (21, 9), (14, 2), (29, 12), (5, 11)]:
    put(x, y, (240, 236, 220))
# moon
for y in range(4, 10):
    for x in range(22, 28):
        if (x - 24.5) ** 2 + (y - 6.5) ** 2 < 7:
            put(x, y, (232, 238, 248))
put(23, 6, (200, 208, 224)); put(25, 8, (200, 208, 224))
# glowing lights under the water
for (cx, cy, col) in [(7, 25, (127, 247, 232)), (15, 28, (156, 255, 176)), (24, 26, (127, 247, 232))]:
    for y in range(cy - 2, cy + 3):
        for x in range(cx - 2, cx + 3):
            dd = abs(x - cx) + abs(y - cy)
            if dd <= 2:
                base = px[x, y]
                a = 0.75 if dd == 0 else 0.35 if dd == 1 else 0.15
                put(x, y, lerp(base[:3], col, a))
# boat hull
for x in range(9, 23):
    put(x, 19, (232, 224, 208))
for x in range(10, 22):
    put(x, 20, (138, 90, 52))
for x in range(11, 21):
    put(x, 21, (110, 72, 40))
# fisher in yellow
put(14, 18, (242, 194, 48)); put(15, 18, (242, 194, 48)); put(14, 17, (242, 194, 48)); put(15, 17, (242, 194, 48))
put(14, 16, (240, 196, 160)); put(15, 16, (240, 196, 160))
for x in range(13, 17):
    put(x, 15, (242, 194, 48))
put(14, 14, (242, 194, 48)); put(15, 14, (242, 194, 48))
# mast + sail
for y in range(8, 19):
    put(18, y, (90, 60, 34))
for y in range(9, 18):
    w = (y - 8) // 2 + 1
    for x in range(19, 19 + w):
        put(x, y, (239, 228, 198) if y != 13 else (181, 82, 59))
# lantern glow
put(22, 17, (255, 210, 122))

big = im.resize((1024, 1024), Image.NEAREST)
# rounded square mask like a macOS icon
mask = Image.new('L', (1024, 1024), 0)
ImageDraw.Draw(mask).rounded_rectangle((40, 40, 984, 984), radius=200, fill=255)
out = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
out.paste(big.crop((40, 40, 984, 984)).resize((944, 944), Image.NEAREST), (40, 40), mask.crop((40, 40, 984, 984)))
out.save(sys.argv[1])
