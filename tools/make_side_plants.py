#!/usr/bin/env python3
"""Generate the pixel-art plant PNGs for the side tunnel.

Each sprite is drawn at art resolution; the site displays them at 2x with
image-rendering: pixelated, so one art pixel = 2 screen pixels — the same
on-screen pixel size as the chicken and duck sprites (16px art at 32px).
All sprites have their attachment stem at the bottom, so rotating them
+90 degrees on the left and -90 degrees on the right puts stems outside.

Usage: python3 tools/make_side_plants.py
Output: static/images/plants/*.png
"""

import math
import os
import tempfile

from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "..", "static", "images", "plants")

# ---------------------------------------------------------------- helpers


def canvas(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def px(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), c)


def rect(im, x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px(im, xx, yy, c)


def hline(im, x0, x1, y, c):
    for x in range(min(x0, x1), max(x0, x1) + 1):
        px(im, x, y, c)


def vline(im, x, y0, y1, c):
    for y in range(min(y0, y1), max(y0, y1) + 1):
        px(im, x, y, c)


def line(im, x0, y0, x1, y1, c):
    dx, dy = abs(x1 - x0), abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        px(im, x0, y0, c)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x0 += sx
        if e2 < dx:
            err += dx
            y0 += sy


def ellipse(im, cx, cy, rx, ry, c):
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if rx == 0 or ry == 0:
                continue
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                px(im, x, y, c)


def erase(im, cx, cy, rx, ry):
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if rx == 0 or ry == 0:
                continue
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                px(im, x, y, (0, 0, 0, 0))


def lens(im, cx, y0, y1, maxw, c, serrate=False, pow=0.7, peak=0.5):
    """Pointed oval: widest at `peak` of its length, tips at both ends."""
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, y1 - y0)
        seg = min(t / peak, (1 - t) / (1 - peak))
        hw = round((maxw / 2) * (math.sin(math.pi * seg / 2) ** pow))
        hline(im, cx - hw, cx + hw, y, c)
        if serrate and 0 < y - y0 < y1 - y0 and y % 3 == 0 and hw > 1:
            px(im, cx - hw - 1, y, c)
            px(im, cx + hw + 1, y, c)


def outline(im, c):
    """1px outline: fill empty pixels that touch a filled pixel."""
    w, h = im.size
    src = im.copy()
    for y in range(h):
        for x in range(w):
            if src.getpixel((x, y))[3] != 0:
                continue
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and src.getpixel((nx, ny))[3] != 0:
                    px(im, x, y, c)
                    break


def rot_paste(base, spr, angle, x, y):
    r = spr.rotate(angle, expand=True, resample=Image.NEAREST)
    base.alpha_composite(r, (x, y))


# ---------------------------------------------------------------- palette

LEAF = (94, 140, 90)        # 5E8C5A
LEAF_D = (62, 107, 69)      # 3E6B45
LEAF_L = (127, 176, 105)    # 7FB069
LEAF_O = (38, 66, 44)       # outline
KALE = (110, 139, 110)      # 6E8B6E
KALE_D = (79, 107, 82)      # 4F6B52
KALE_L = (143, 169, 143)    # 8FA98F
KALE_RIB = (169, 194, 159)  # A9C29F
KALE_O = (47, 66, 50)
SQUASH = (94, 148, 80)      # 5E9450
SQUASH_D = (62, 107, 69)
SQUASH_L = (127, 176, 105)
SQUASH_O = (40, 74, 42)
BEAN = (122, 155, 109)      # 7A9B6D
BEAN_D = (92, 122, 84)      # 5C7A54
BEAN_L = (157, 184, 143)    # 9DB88F
BEAN_O = (56, 80, 60)
POD = (111, 160, 117)       # 6FA075
POD_D = (74, 120, 86)       # 4A7856
POD_O = (42, 74, 52)
RED = (214, 69, 60)         # D6453C
RED_D = (168, 58, 46)       # A83A2E
RED_L = (226, 115, 91)      # E2735B
RED_O = (110, 36, 28)
ORANGE = (224, 123, 42)     # E07B2A
ORANGE_D = (184, 94, 27)    # B85E1B
ORANGE_L = (240, 160, 90)   # F0A05A
ORANGE_O = (122, 62, 18)
YELLOW = (245, 197, 66)     # F5C542
YELLOW_D = (232, 161, 63)   # E8A13F
YELLOW_O = (138, 106, 30)
WHITE = (251, 247, 236)     # FBF7EC
WHITE_S = (228, 217, 196)   # E4D9C4
WHITE_O = (138, 133, 120)
BROWN = (110, 78, 51)       # 6E4E33
BROWN_D = (92, 66, 50)      # 5C4232
SEED = (243, 217, 164)      # F3D9A4
BLACK = (43, 43, 43)        # 2B2B2B
PINK = (242, 216, 220)      # F2D8DC


# ---------------------------------------------------------------- sprites


def apple_leaf():
    im = canvas(44, 44)
    lens(im, 22, 1, 42, 24, LEAF, serrate=True, pow=1.15)
    vline(im, 22, 5, 40, LEAF_D)
    line(im, 22, 16, 15, 11, LEAF_D)
    line(im, 22, 21, 29, 16, LEAF_D)
    line(im, 22, 26, 15, 21, LEAF_D)
    line(im, 22, 31, 29, 26, LEAF_D)
    rect(im, 20, 42, 4, 2, BROWN)
    outline(im, LEAF_O)
    return im


def apple_blossom():
    im = canvas(32, 32)
    cx, cy = 16, 13
    for i in range(5):
        a = math.radians(90 + i * 72)
        px_, py_ = cx + 7 * math.cos(a), cy - 7 * math.sin(a)
        ellipse(im, round(px_), round(py_), 5, 5, WHITE)
    ellipse(im, cx, cy, 4, 3, YELLOW)
    px(im, 14, 12, YELLOW_D)
    px(im, 18, 14, YELLOW_D)
    px(im, 5, 6, PINK)
    px(im, 25, 15, PINK)
    line(im, 16, 22, 16, 28, BEAN_D)
    outline(im, WHITE_O)
    return im


def apple_fruit():
    im = canvas(32, 36)
    ellipse(im, 16, 21, 13, 11, RED)
    rect(im, 13, 10, 6, 2, RED_D)
    rect(im, 15, 4, 2, 5, BROWN)
    leaflet = canvas(10, 5)
    ellipse(leaflet, 5, 2, 4, 2, LEAF)
    hline(leaflet, 3, 7, 2, LEAF_D)
    rot_paste(im, leaflet, -20, 17, 3)
    rect(im, 7, 16, 3, 5, RED_L)
    outline(im, RED_O)
    # attachment (stem) must sit at the canvas bottom, like the leaves
    im = im.transpose(Image.FLIP_TOP_BOTTOM)
    return im


def apple_branch():
    im = canvas(36, 50)
    rect(im, 16, 0, 3, 20, BROWN_D)
    line(im, 17, 20, 9, 34, BROWN_D)
    line(im, 19, 20, 27, 32, BROWN_D)
    line(im, 9, 34, 5, 42, BROWN)
    line(im, 27, 32, 31, 40, BROWN)
    line(im, 18, 26, 25, 30, BROWN)
    rect(im, 4, 42, 2, 2, BROWN)
    rect(im, 31, 40, 2, 2, BROWN)
    rect(im, 25, 30, 2, 2, BROWN)
    outline(im, (40, 28, 20))
    # the attachment end (thick stem) is drawn at the top; flip it down so it
    # matches every other sprite (stem toward the edge after rotation)
    im = im.transpose(Image.FLIP_TOP_BOTTOM)
    return im


def bean_leaf():
    # broad bean: two pairs of large fleshy leaflets + big terminal one
    im = canvas(56, 50)
    BL = (112, 148, 124)
    BL_D = (80, 112, 94)
    vline(im, 27, 36, 49, BL_D)
    vline(im, 28, 36, 49, BL_D)
    ellipse(im, 27, 9, 11, 9, BL)
    vline(im, 27, 12, 17, BL_D)
    line(im, 27, 15, 21, 12, BL_D)
    line(im, 27, 15, 33, 12, BL_D)
    lf = canvas(21, 12)
    ellipse(lf, 10, 6, 9, 5, BL)
    line(lf, 2, 6, 19, 6, BL_D)
    line(lf, 7, 3, 5, 8, BL_D)
    line(lf, 13, 3, 15, 8, BL_D)
    lfm = lf.transpose(Image.FLIP_LEFT_RIGHT)
    rot_paste(im, lf, -26, 0, 15)
    rot_paste(im, lfm, 26, 35, 15)
    lf2 = canvas(19, 11)
    ellipse(lf2, 9, 5, 8, 4, BL)
    line(lf2, 2, 5, 17, 5, BL_D)
    lf2m = lf2.transpose(Image.FLIP_LEFT_RIGHT)
    rot_paste(im, lf2, -18, 2, 28)
    rot_paste(im, lf2m, 18, 36, 28)
    outline(im, BEAN_O)
    return im


def bean_flower():
    im = canvas(28, 32)
    ellipse(im, 14, 11, 9, 7, WHITE)
    rect(im, 11, 12, 6, 4, (74, 53, 80))
    rect(im, 12, 15, 4, 2, (44, 30, 52))
    px(im, 10, 12, WHITE_S)
    px(im, 18, 11, WHITE_S)
    line(im, 13, 19, 13, 29, BEAN_D)
    line(im, 7, 22, 10, 23, BEAN)
    outline(im, WHITE_O)
    return im


def bean_pod():
    im = canvas(30, 46)
    lens(im, 15, 2, 42, 20, POD)
    for y in (8, 14, 20, 26, 32, 37):
        px(im, 12, y, POD_D)
        px(im, 17, y + 3, POD_D)
    rect(im, 13, 0, 4, 3, BEAN_D)
    px(im, 14, 42, POD_D)
    px(im, 15, 43, POD_D)
    outline(im, POD_O)
    im = im.transpose(Image.FLIP_TOP_BOTTOM)
    return im


def straw_leaf():
    im = canvas(44, 42)
    # top leaflet: obovate (widest near the tip), sawtooth edges, veins
    lens(im, 22, 1, 17, 20, LEAF, serrate=True, peak=0.62)
    vline(im, 22, 3, 14, LEAF_D)
    for y in (5, 8, 11):
        line(im, 22, y, 17, y + 3, LEAF_D)
        line(im, 22, y, 27, y + 3, LEAF_D)
    ellipse(im, 22, 10, 5, 3, LEAF_L)
    lf = canvas(17, 10)
    lens(lf, 8, 0, 8, 15, LEAF, serrate=True, peak=0.62)
    line(lf, 2, 4, 15, 4, LEAF_D)
    line(lf, 8, 3, 4, 6, LEAF_D)
    line(lf, 11, 3, 14, 6, LEAF_D)
    ellipse(lf, 9, 5, 4, 2, LEAF_L)
    lfm = lf.transpose(Image.FLIP_LEFT_RIGHT)
    rot_paste(im, lf, 46, 0, 16)
    rot_paste(im, lfm, -46, 27, 16)
    line(im, 22, 16, 22, 27, LEAF_D)
    line(im, 12, 21, 19, 28, LEAF_D)
    line(im, 32, 21, 25, 28, LEAF_D)
    line(im, 22, 27, 22, 37, BEAN_D)
    outline(im, LEAF_O)
    return im


def straw_flower():
    im = canvas(28, 28)
    cx, cy = 14, 10
    for i in range(5):
        a = math.radians(90 + i * 72)
        px_, py_ = cx + 6 * math.cos(a), cy - 6 * math.sin(a)
        ellipse(im, round(px_), round(py_), 4, 4, WHITE)
    ellipse(im, cx, cy, 4, 3, YELLOW)
    px(im, 13, 9, YELLOW_D)
    line(im, 14, 16, 14, 26, BEAN_D)
    hline(im, 10, 12, 19, LEAF)
    outline(im, WHITE_O)
    return im


def strawberry():
    im = canvas(30, 36)
    rows = [(6, 18), (8, 22), (10, 24), (12, 24), (14, 24), (16, 22),
            (18, 20), (20, 16), (22, 12), (24, 9), (26, 5), (28, 2)]
    for y, w in rows:
        hline(im, 15 - w // 2, 15 + w // 2, y, RED)
    rect(im, 9, 6, 12, 2, (0, 0, 0, 0))
    # calyx
    rect(im, 8, 4, 14, 3, POD_D)
    for x in range(8, 22, 4):
        px(im, x, 7, POD_D)
        px(im, x + 1, 8, POD_D)
    rect(im, 14, 0, 2, 4, BEAN_D)
    # seeds
    for sx, sy in ((10, 10), (15, 9), (20, 11), (8, 14), (13, 13),
                   (18, 16), (22, 15), (11, 18), (16, 19), (20, 20),
                   (13, 22), (17, 23), (15, 26)):
        rect(im, sx, sy, 1, 2, SEED)
    outline(im, RED_O)
    im = im.transpose(Image.FLIP_TOP_BOTTOM)
    return im


def tomato_leaf():
    # pinnate compound leaf: rachis, big serrated tip, 3 shrinking leaflet pairs
    im = canvas(58, 50)
    T = (79, 130, 86)
    TD = (53, 96, 62)
    vline(im, 29, 12, 49, TD)
    lens(im, 29, 1, 15, 17, T, serrate=True)
    vline(im, 29, 3, 13, TD)
    lf1 = canvas(16, 7)
    lens(lf1, 8, 0, 6, 14, T, serrate=True, peak=0.6)
    line(lf1, 1, 3, 15, 3, TD)
    lf2 = canvas(13, 6)
    lens(lf2, 6, 0, 5, 11, T, serrate=True, peak=0.6)
    line(lf2, 1, 2, 12, 2, TD)
    lf3 = canvas(10, 5)
    lens(lf3, 5, 0, 4, 8, T, serrate=True, peak=0.6)
    line(lf3, 1, 2, 9, 2, TD)
    lf1m = lf1.transpose(Image.FLIP_LEFT_RIGHT)
    rot_paste(im, lf1, 40, 30, 18)
    rot_paste(im, lf1m, -40, 13, 18)
    lf2m = lf2.transpose(Image.FLIP_LEFT_RIGHT)
    rot_paste(im, lf2, 32, 31, 27)
    rot_paste(im, lf2m, -32, 16, 27)
    lf3m = lf3.transpose(Image.FLIP_LEFT_RIGHT)
    rot_paste(im, lf3, 26, 32, 35)
    rot_paste(im, lf3m, -26, 17, 35)
    outline(im, (36, 62, 40))
    return im


def tomato_flower():
    im = canvas(26, 26)
    cx, cy = 13, 10
    for i in range(5):
        a = math.radians(90 + i * 72)
        line(im, cx, cy,
             round(cx + 9 * math.cos(a)), round(cy - 9 * math.sin(a)),
             YELLOW)
        px(im, round(cx + 9 * math.cos(a)), round(cy - 9 * math.sin(a)), YELLOW)
    ellipse(im, cx, cy, 3, 2, YELLOW_D)
    line(im, 13, 14, 13, 24, (62, 107, 69))
    outline(im, YELLOW_O)
    return im


def kale():
    im = canvas(64, 56)
    ellipse(im, 32, 24, 26, 18, KALE)
    bumps = [(10, 12), (22, 6), (40, 5), (52, 12), (56, 24), (50, 36),
             (36, 42), (20, 40), (8, 34), (5, 22)]
    for bx, by in bumps:
        ellipse(im, bx, by, 5, 4, KALE)
    notches = [(16, 4), (32, 3), (47, 6), (58, 18), (44, 40), (24, 44), (4, 28)]
    for nx, ny in notches:
        erase(im, nx, ny, 3, 2)
    rect(im, 30, 10, 3, 30, KALE_RIB)
    line(im, 31, 18, 16, 26, KALE_D)
    line(im, 33, 20, 46, 28, KALE_D)
    line(im, 32, 26, 20, 34, KALE_D)
    line(im, 33, 28, 44, 34, KALE_D)
    ellipse(im, 22, 20, 5, 3, KALE_D)
    ellipse(im, 42, 22, 5, 3, KALE_D)
    rect(im, 30, 40, 3, 10, KALE_RIB)
    outline(im, KALE_O)
    return im


def limb(im, bx, by, angle_deg, length, halfw, c, peak=0.55):
    """Rounded pointed limb (lobe/leaflet) from (bx,by) at an angle:
    0 degrees points straight down, positive angles swing toward +x."""
    a = math.radians(angle_deg)
    dx, dy = math.sin(a), math.cos(a)
    steps = max(8, int(length * 1.6))
    for i in range(steps + 1):
        t = i / steps
        seg = min(t / peak, (1 - t) / (1 - peak))
        hw = max(1, round(halfw * (math.sin(math.pi * seg / 2) ** 0.8)))
        ellipse(im, round(bx + dx * t * length), round(by + dy * t * length), hw, hw, c)


def squash_leaf():
    # palmate leaf: the silhouette is a sum-of-gaussians lobe envelope around
    # the base point, so lobes and their sinuses fall out of one fill pass
    im = canvas(84, 76)
    bx, by = 41, 8
    lobes = [(0, 56, 20), (-42, 40, 15), (42, 40, 15), (-78, 22, 11), (78, 22, 11)]
    for y in range(by, 76):
        for x in range(6, 78):
            dx, dy = x - bx, y - by
            dist = math.hypot(dx, dy)
            if dist < 2 or dist > 62:
                continue
            ang = math.degrees(math.atan2(dx, dy))
            env = 0.0
            for a0, length, spread in lobes:
                d = (ang - a0) / (spread * 1.05)
                env += length * math.exp(-d * d)
            env = min(max(env, 28 - dist * 0.14), 60)
            # organic edge: a touch of deterministic jitter on the rim
            wobble = ((x * 7 + y * 13) % 5 - 2) * 0.9
            if dist <= env + wobble and abs(dx) <= env * 0.9 + 4:
                im.putpixel((x, y), SQUASH)
    # palmate veins reaching into each lobe
    for a0, length, spread in lobes:
        a = math.radians(a0)
        line(im, bx, by + 3, round(bx + math.sin(a) * length * 0.72),
             round(by + math.cos(a) * length * 0.72), SQUASH_D)
        for f in (0.36, 0.56):
            vx = round(bx + math.sin(a) * length * f)
            vy = round(by + math.cos(a) * length * f)
            line(im, vx, vy, vx - 4, vy + 2, SQUASH_D)
            line(im, vx, vy, vx + 4, vy + 2, SQUASH_D)
    erase(im, bx - 3, by - 4, 3, 5)  # heart notch
    rect(im, bx - 3, by - 1, 6, 9, BEAN_D)
    for fx, fy in ((16, 18), (62, 22), (26, 36), (56, 40), (38, 52)):
        for yy in range(fy, fy + 3):
            for xx in range(fx, fx + 4):
                if im.getpixel((xx, yy)) == SQUASH:
                    im.putpixel((xx, yy), SQUASH_L)
    outline(im, SQUASH_O)
    # flip so the attachment notch sits at the stem end
    im = im.transpose(Image.FLIP_TOP_BOTTOM)
    return im


def squash_tendril():
    # coiled tendril: a thin spiral with a short lead-in stalk
    im = canvas(26, 26)
    pts = []
    for i in range(44):
        t = i / 43
        a = t * 3.5 * math.pi
        r = 1.2 + t * 6.5
        pts.append((9 + r * math.cos(a), 13 + r * math.sin(a)))
    line(im, 2, 24, pts[0][0].__round__(), pts[0][1].__round__(), SQUASH_D)
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        line(im, round(x0), round(y0), round(x1), round(y1), SQUASH_D)
    outline(im, SQUASH_O)
    return im


def squash_flower():
    im = canvas(38, 42)
    ellipse(im, 19, 12, 16, 9, YELLOW)
    rect(im, 6, 10, 26, 4, YELLOW)
    for x in (10, 15, 20, 25):
        vline(im, x, 2, 9, YELLOW_D)
    ellipse(im, 19, 12, 10, 5, YELLOW_D)
    for y in range(20, 31):
        w = max(2, 8 - (y - 20) // 3)
        hline(im, 19 - w // 2, 19 + w // 2, y, YELLOW)
    vline(im, 17, 20, 30, YELLOW_D)
    line(im, 19, 31, 19, 38, (92, 122, 84))
    outline(im, YELLOW_O)
    return im


def pumpkin():
    im = canvas(42, 38)
    ellipse(im, 21, 22, 19, 14, ORANGE)
    for rx in (11, 21, 31):
        for y in range(8, 37):
            if im.getpixel((rx, y))[3] != 0 and im.getpixel((rx, y)) != ORANGE_D:
                px(im, rx, y, ORANGE_D)
    rect(im, 19, 2, 4, 7, (92, 107, 69))
    px(im, 23, 3, (74, 120, 86))
    px(im, 24, 4, (74, 120, 86))
    rect(im, 8, 14, 3, 4, ORANGE_L)
    rect(im, 9, 18, 2, 2, ORANGE_L)
    outline(im, ORANGE_O)
    im = im.transpose(Image.FLIP_TOP_BOTTOM)
    return im


def tomato():
    im = canvas(30, 30)
    ellipse(im, 15, 17, 13, 11, RED)
    rect(im, 12, 6, 6, 2, RED_D)
    for a, b in ((11, 5), (15, 4), (19, 5), (8, 7), (22, 7)):
        line(im, 15, 6, a, b, POD_D)
    rect(im, 14, 2, 2, 4, (62, 107, 69))
    rect(im, 7, 12, 3, 4, RED_L)
    outline(im, RED_O)
    im = im.transpose(Image.FLIP_TOP_BOTTOM)
    return im


# ---------------------------------------------------------------- main

def pine_needles():
    im = canvas(28, 26)
    P = (74, 118, 90)
    PD = (52, 88, 68)
    bx, by = 14, 24
    for i, (ang, ln) in enumerate([(-48, 21), (-24, 23), (0, 24), (24, 23), (48, 21)]):
        a = math.radians(ang)
        col = P if i % 2 == 0 else PD
        bend = 2.4 if i < 2 else (-2.4 if i > 2 else 0)
        prev = (bx, by)
        for k in range(1, 13):
            t = k / 12
            x = bx + math.sin(a) * t * ln + math.sin(t * math.pi) * bend
            y = by - math.cos(a) * t * ln
            line(im, prev[0], prev[1], round(x), round(y), col)
            prev = (round(x), round(y))
    px(im, bx, by, PD)
    return im


def pinecone():
    im = canvas(16, 20)
    PC = (120, 88, 58)
    PCD = (92, 66, 42)
    for y in range(20):
        for x in range(16):
            dx, dy = x - 7.5, (y - 9.5) / 1.25
            if dx * dx + dy * dy <= 36:
                px(im, x, y, PC)
    for o in range(-14, 22, 4):
        for y in range(20):
            for x in range(16):
                dx, dy = x - 7.5, (y - 9.5) / 1.25
                if dx * dx + dy * dy <= 30 and (x - y == o or x + y == o + 4):
                    px(im, x, y, PCD)
    vline(im, 7, 0, 3, (74, 118, 90))
    vline(im, 8, 0, 2, (74, 118, 90))
    outline(im, (70, 50, 34))
    return im


def basket():
    im = canvas(116, 66)
    # chains from the top of the page down to the rim
    for cx in (22, 94):
        vline(im, cx, 0, 26, (128, 130, 138))
        vline(im, cx + 1, 0, 26, (94, 96, 104))
    # soil dome sitting proud of the rim
    ellipse(im, 58, 20, 45, 7, (56, 40, 28))
    for x in (30, 46, 66, 82):
        px(im, x, 17, (74, 56, 40))
    # woven bowl: half-ellipse rows in alternating wicker bands
    RIM, H = 28, 36
    bands = [(150, 112, 66), (128, 94, 54), (106, 76, 42), (128, 94, 54)]
    for y in range(RIM, RIM + H):
        t = (y - RIM) / (H - 1)
        halfw = round(50 * math.sqrt(max(0.0, 1 - t * t)))
        if halfw < 1:
            continue
        col = bands[((y - RIM) // 5) % 4]
        for x in range(58 - halfw, 58 + halfw):
            px(im, x, y, col)
    # vertical weave ribs
    for y in range(RIM, RIM + H):
        t = (y - RIM) / (H - 1)
        halfw = round(50 * math.sqrt(max(0.0, 1 - t * t)))
        if halfw < 1:
            continue
        for x in range(58 - halfw, 58 + halfw, 8):
            px(im, x, y, (96, 68, 38))
    # rim band + highlight
    hline(im, 8, 108, RIM, (94, 64, 34))
    hline(im, 8, 108, RIM - 1, (170, 132, 80))
    outline(im, (74, 52, 34))
    return im


SPRITES = {
    "apple-leaf": apple_leaf,
    "apple-blossom": apple_blossom,
    "apple-fruit": apple_fruit,
    "apple-branch": apple_branch,
    "bean-leaf": bean_leaf,
    "bean-flower": bean_flower,
    "bean-pod": bean_pod,
    "strawberry-leaf": straw_leaf,
    "strawberry-flower": straw_flower,
    "strawberry": strawberry,
    "tomato-leaf": tomato_leaf,
    "tomato-flower": tomato_flower,
    "kale": kale,
    "squash-leaf": squash_leaf,
    "squash-tendril": squash_tendril,
    "squash-flower": squash_flower,
    "pumpkin": pumpkin,
    "tomato-fruit": tomato,
    "pine-needles": pine_needles,
    "pinecone": pinecone,
    "basket": basket,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in SPRITES.items():
        im = fn()
        im.save(os.path.join(OUT, f"{name}.png"))
        print(f"  {name}.png  {im.width}x{im.height}")

    # contact sheet at 2x (display scale) on the day-mode cream background
    names = list(SPRITES.keys())
    cols = 6
    cell_w, cell_h = 160, 150
    rows = (len(names) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell_w, rows * cell_h), (247, 241, 227, 255))
    for i, name in enumerate(names):
        im = Image.open(os.path.join(OUT, f"{name}.png"))
        im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
        x = (i % cols) * cell_w + (cell_w - im.width) // 2
        y = (i // cols) * cell_h + (cell_h - im.height) // 2
        sheet.alpha_composite(im, (max(0, x), max(0, y)))
    sheet_path = os.path.join(tempfile.gettempdir(), "maisy-land-plants.png")
    sheet.save(sheet_path)
    print(f"sheet: {os.path.abspath(sheet_path)}")


if __name__ == "__main__":
    main()
