#!/usr/bin/env python3
"""Render original, silent bilingual 64-second DSA explainers to site assets.

Requires Pillow, ffmpeg/libx264 and system Noto Sans Bengali. The website also
provides written explanations and a controllable step player beside each video.
"""

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT, FPS = 432, 768, 8
SEGMENT_SECONDS, SEGMENTS = 8, 8
FRAMES = FPS * SEGMENT_SECONDS * SEGMENTS
BG = (10, 16, 13)
CARD = (20, 30, 24)
WHITE = (237, 245, 239)
MUTED = (166, 184, 172)
GREEN = (87, 216, 146)
BORDER = (49, 69, 55)


def font(path, size):
    return ImageFont.truetype(path, size)


FONT_REG = font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
FONT_SMALL = font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
FONT_BOLD = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
FONT_BOLD_SMALL = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
FONT_BOLD_TINY = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 21)
FONT_NODE = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
FONT_BN = font("/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf", 20)


def mixed_runs(value):
    """Noto Bengali lacks Latin glyphs; render each script with its own font."""
    runs = []
    for char in value:
        bengali = "\u0980" <= char <= "\u09ff" or char in "।॥"
        if runs and runs[-1][0] == bengali:
            runs[-1] = (bengali, runs[-1][1] + char)
        else:
            runs.append((bengali, char))
    return runs


def mixed_width(draw, value):
    return sum(draw.textlength(part, font=FONT_BN if bengali else FONT_REG)
               for bengali, part in mixed_runs(value))


def mixed_text(draw, value, x, y, fill):
    for bengali, part in mixed_runs(value):
        face = FONT_BN if bengali else FONT_REG
        draw.text((x, y), part, font=face, fill=fill)
        x += draw.textlength(part, font=face)


def lines(draw, value, face, max_width, max_lines=3):
    words = value.split()
    out, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        width = mixed_width(draw, candidate) if face == FONT_BN else draw.textlength(candidate, font=face)
        if current and width > max_width:
            out.append(current)
            current = word
        else:
            current = candidate
    if current:
        out.append(current)
    return out[:max_lines]


def paragraph(draw, value, x, y, face, fill, max_width=570, max_lines=3, gap=6):
    for line in lines(draw, value, face, max_width, max_lines):
        if face == FONT_BN:
            mixed_text(draw, line, x, y, fill)
        else:
            draw.text((x, y), line, font=face, fill=fill)
        y += face.size + gap
    return y


def frame(lesson, number):
    segment = min(number // (FPS * SEGMENT_SECONDS), SEGMENTS - 1)
    within = (number % (FPS * SEGMENT_SECONDS)) / FPS
    progress = number / max(FRAMES - 1, 1)
    im = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(im)
    for x in range(0, WIDTH, 32):
        draw.line((x, 0, x, HEIGHT), fill=(14, 27, 19), width=1)
    for y in range(0, HEIGHT, 32):
        draw.line((0, y, WIDTH, y), fill=(14, 27, 19), width=1)
    glow_x = 30 + int(progress * 370)
    draw.ellipse((glow_x - 95, -130, glow_x + 95, 60), fill=(17, 38, 26))

    draw.rounded_rectangle((22, 24, 249, 54), 13, fill=(23, 54, 35), outline=(43, 112, 70))
    draw.text((34, 29), "CLOSE AI  /  DSA VISUALS", font=FONT_SMALL, fill=GREEN)
    draw.text((354, 30), f"{segment + 1:02d} / 08", font=FONT_SMALL, fill=MUTED)
    title = lesson["title"]
    title_face = next(face for face in (FONT_BOLD, FONT_BOLD_SMALL, FONT_BOLD_TINY)
                      if draw.textlength(title, font=face) <= 382)
    draw.text((24, 75), title, font=title_face, fill=WHITE)
    draw.line((24, 124, 408, 124), fill=BORDER, width=1)

    labels = ["START HERE", "THE SIMPLE IDEA", "ONE SMALL EXAMPLE", "STEP 1", "STEP 2", "STEP 3", "COMMON PATTERNS", "YOUR TURN"]
    draw.text((24, 143), labels[segment], font=FONT_SMALL, fill=GREEN)
    if segment == 0:
        en = "One topic. One concrete example. Follow the highlighted idea."
        bn = "একটি টপিক, একটি ছোট উদাহরণ। আলোকিত অংশ ধরে এগোও।"
    elif segment == 1:
        en, bn = lesson["concept"], lesson["conceptBn"]
    elif segment == 2:
        en, bn = lesson["example"], lesson["exampleBn"]
    elif segment in (3, 4, 5):
        step = lesson["steps"][segment - 3]
        en, bn = step["en"], step["bn"]
    elif segment == 6:
        en = "These patterns appear in real coding problems. Pick one to explore next."
        bn = "বাস্তব সমস্যায় এই কৌশলগুলো কাজে লাগে। এরপর একটি বেছে অনুশীলন করো।"
    else:
        en = "Pause, replay, then explain the example in your own words."
        bn = "থামাও, আবার দেখো, তারপর উদাহরণটি নিজের ভাষায় বোঝাও।"
    slide = int((1 - min(within / 0.6, 1)) * 18)
    en_y = paragraph(draw, en, 24, 183 + slide, FONT_REG, WHITE, max_width=384, max_lines=3, gap=10)
    paragraph(draw, bn, 24, max(en_y + 14, 289 + slide), FONT_BN, MUTED, max_width=384, max_lines=3, gap=8)

    if segment == 6:
        for index, label in enumerate(lesson["patterns"][:4]):
            row, col = divmod(index, 2)
            x, y = 24 + col * 194, 442 + row * 85
            draw.rounded_rectangle((x, y, x + 184, y + 72), 12, fill=CARD, outline=BORDER)
            paragraph(draw, label, x + 12, y + 12, FONT_SMALL, GREEN, max_width=160, max_lines=2)
    else:
        active = (segment - 3) % 4 if segment in (3, 4, 5) else (int(within * 1.3) % 4)
        for index, label in enumerate(lesson["visual"][:4]):
            x, y = 24, 419 + index * 72
            selected = index == active
            pulse = math.sin(within * math.pi * 1.8) * 3 if selected else 0
            draw.rounded_rectangle((x, y - pulse, x + 384, y + 60 - pulse), 13, fill=(28, 88, 51) if selected else CARD, outline=GREEN if selected else BORDER, width=2 if selected else 1)
            draw.rounded_rectangle((x + 12, y + 13 - pulse, x + 46, y + 47 - pulse), 8, fill=(49, 142, 80) if selected else (31, 47, 36))
            draw.text((x + 21, y + 19 - pulse), str(index + 1), font=FONT_SMALL, fill=WHITE)
            chunks = lines(draw, label, FONT_NODE, 314, 2)
            for row, part in enumerate(chunks):
                draw.text((x + 62, y + 10 + row * 24 - pulse), part, font=FONT_NODE, fill=WHITE if selected else MUTED)
            if index < 3:
                draw.line((x + 27, y + 61, x + 27, y + 71), fill=GREEN, width=2)

    draw.text((24, 718), "English +", font=FONT_SMALL, fill=MUTED)
    draw.text((95, 711), "বাংলা", font=FONT_BN, fill=MUTED)
    draw.text((164, 718), "•  Pause and replay any time", font=FONT_SMALL, fill=MUTED)
    draw.rounded_rectangle((24, 749, 408, 755), 2, fill=BORDER)
    draw.rounded_rectangle((24, 749, 24 + int(384 * progress), 755), 2, fill=GREEN)
    # Keep the timeline moving throughout; short soft cuts mark each chapter.
    fade = min(within / 0.32, (SEGMENT_SECONDS - within) / 0.32, 1.0)
    if fade < 1:
        im = Image.blend(Image.new("RGB", (WIDTH, HEIGHT), BG), im, max(0.3, fade))
    return im


def render(lesson, output_dir):
    video = output_dir / f'{lesson["id"]}.mp4'
    poster = output_dir / f'{lesson["id"]}.jpg'
    frame(lesson, 12).save(poster, quality=87, optimize=True)
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pixel_format", "rgb24", "-video_size", f"{WIDTH}x{HEIGHT}", "-framerate", str(FPS),
        "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
        "-pix_fmt", "yuv420p", "-threads", "1", "-movflags", "+faststart", "-t", "64", str(video),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for number in range(FRAMES):
            process.stdin.write(frame(lesson, number).tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"ffmpeg failed for {lesson['id']}")
    print(lesson["id"], video.stat().st_size, flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--id")
    parser.add_argument("--missing", action="store_true", help="render only lessons without both assets")
    parser.add_argument("--jobs", type=int, default=1, help="parallel rendering workers")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    lessons = json.loads(args.manifest.read_text())
    selected = [lesson for lesson in lessons if (not args.id or lesson["id"] == args.id) and
                (not args.missing or not (args.output / f'{lesson["id"]}.mp4').exists() or
                 not (args.output / f'{lesson["id"]}.jpg').exists())]
    if not selected:
        raise SystemExit("No matching lesson")
    if args.jobs < 1:
        raise SystemExit("--jobs must be positive")
    if args.jobs == 1:
        for lesson in selected:
            render(lesson, args.output)
    else:
        with ProcessPoolExecutor(max_workers=args.jobs) as pool:
            futures = [pool.submit(render, lesson, args.output) for lesson in selected]
            for future in as_completed(futures):
                future.result()


if __name__ == "__main__":
    main()
