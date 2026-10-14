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
from dsa_storyboards import STORIES, validate as validate_storyboards

WIDTH, HEIGHT, FPS = 432, 768, 24
SEGMENT_SECONDS, SEGMENTS = 8, 8
FRAMES = FPS * SEGMENT_SECONDS * SEGMENTS
BG = (3, 6, 12)
CARD = (14, 22, 38)
WHITE = (241, 246, 255)
MUTED = (166, 185, 212)
BLUE = (74, 169, 255)
AMBER = (255, 193, 91)
CREAM = (239, 230, 211)
INK = (26, 32, 43)
BORDER = (47, 67, 96)


def font(path, size):
    return ImageFont.truetype(path, size)


FONT_REG = font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
FONT_CONCEPT = font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
FONT_SMALL = font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
FONT_BOLD = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
FONT_BOLD_SMALL = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
FONT_BOLD_TINY = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 21)
FONT_NODE = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
FONT_BN = font("/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf", 20)
FONT_MONO = font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 15)


def make_background():
    base = Image.new("RGBA", (WIDTH, HEIGHT), (*BG, 255))
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    paint = ImageDraw.Draw(glow)
    for center, color, maximum in [((110, 520), (26, 77, 177), 28), ((350, 545), (94, 39, 158), 24)]:
        for radius in range(330, 10, -12):
            strength = int(maximum * (1-radius/350)**1.7)
            paint.ellipse((center[0]-radius, center[1]-radius, center[0]+radius, center[1]+radius), fill=(*color, strength))
    base = Image.alpha_composite(base, glow).convert("RGB")
    grid = ImageDraw.Draw(base)
    for x in range(0, WIDTH, 32):grid.line((x, 0, x, HEIGHT), fill=(17, 27, 45), width=1)
    for y in range(0, HEIGHT, 32):grid.line((0, y, WIDTH, y), fill=(17, 27, 45), width=1)
    return base


BACKGROUND = make_background()


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


def centered(draw, value, x, y, face, fill):
    draw.text((x - draw.textlength(str(value), font=face) / 2, y), str(value), font=face, fill=fill)


def arrow(draw, start, end, color=BLUE, width=3):
    x1, y1 = start
    x2, y2 = end
    draw.line((x1, y1, x2, y2), fill=color, width=width)
    angle = math.atan2(y2-y1, x2-x1)
    for side in (-0.52, 0.52):
        draw.line((x2, y2, x2 - 10*math.cos(angle+side), y2 - 10*math.sin(angle+side)), fill=color, width=width)


def ease(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def lerp(start, end, progress):
    return start + (end - start) * progress


def previous_slot(values, previous_values, index, used):
    """Keep the same card in view when an array is reordered."""
    for old_index, old_value in enumerate(previous_values):
        if old_index not in used and old_value == values[index]:
            used.add(old_index)
            return old_index
    return None


def node(draw, label, center, active=False, done=False, size=48, phase=0):
    x, y = center
    if size < 7:
        return
    if active:
        halo = 5 + 2*math.sin(phase*3)
        draw.rounded_rectangle((x-size/2-halo,y-size/2-halo,x+size/2+halo,y+size/2+halo),11,
                               outline=(108, 73, 36),width=2)
    fill = CREAM if not done else (197, 227, 232)
    outline = AMBER if active else (112, 205, 218) if done else (149, 142, 135)
    draw.rounded_rectangle((x-size/2, y-size/2, x+size/2, y+size/2), 9, fill=fill, outline=outline, width=3 if active else 1)
    if size < 28:
        return
    value = str(label)
    face = FONT_NODE if draw.textlength(value, font=FONT_NODE) < size-6 else FONT_SMALL
    centered(draw, value, x, y-face.size/2-2, face, INK)


def draw_two_sum(draw, beat, within, previous, segment):
    """A worked hash-map example: cards, moving index, and an evolving notebook."""
    values, selected, _, _ = beat
    prior_selected = previous[1] if previous else []
    active = selected[-1] if selected else -1
    old_active = prior_selected[-1] if prior_selected else -1
    transition = ease(within / 1.4)
    draw.rounded_rectangle((36, 243, 112, 266), 8, fill=(46, 33, 23), outline=(138, 87, 38))
    draw.text((46, 247), "TARGET 9", font=FONT_SMALL, fill=AMBER)
    draw.text((40, 284), "NUMBERS", font=FONT_SMALL, fill=MUTED)
    positions = [(69 + i * 63, 365) for i in range(len(values))]
    for i, value in enumerate(values):
        is_answer = len(selected) > 1 and i in selected
        reveal = ease((within - i*0.55) / 0.75) if segment == 0 else 1
        node(draw, value, (positions[i][0], lerp(310, positions[i][1], reveal)),
             i == active or is_answer, False, 52*reveal, within)
        if reveal > 0.8:
            centered(draw, i, positions[i][0], 403, FONT_SMALL, MUTED)
    if active >= 0:
        from_x = positions[old_active][0] if 0 <= old_active < len(values) else positions[active][0]
        pointer_x = lerp(from_x, positions[active][0], transition)
        draw.rounded_rectangle((pointer_x-11, 425, pointer_x+11, 445), 5, fill=(255, 155, 43))
        centered(draw, "i", pointer_x, 426, FONT_SMALL, INK)
        arrow(draw, (pointer_x, 424), (pointer_x, 400), AMBER, 2)
        needed = 9 - values[active]
        draw.rounded_rectangle((pointer_x-29, 299, pointer_x+29, 323), 5, fill=(50, 35, 23), outline=(170, 104, 40))
        centered(draw, f"need {needed}", pointer_x, 303, FONT_SMALL, AMBER)
    draw.rounded_rectangle((320, 281, 394, 454), 8, fill=CREAM)
    draw.text((328, 290), "SEEN", font=FONT_SMALL, fill=INK)
    draw.text((327, 310), "val : idx", font=FONT_SMALL, fill=(90, 85, 78))
    draw.line((326, 332, 388, 332), fill=(168, 157, 141))
    entries = [] if active < 0 else [(2, 0)]
    for row, (value, index) in enumerate(entries):
        y = 342 + row * 31
        reveal = ease((within - 0.7) / 0.8) if row == len(entries)-1 and len(selected) == 1 else 1
        draw.rounded_rectangle((326, y+10*(1-reveal), 389, y+25+10*(1-reveal)), 3,
                               fill=(185, 222, 209) if value == needed else CREAM)
        draw.text((330, y+10*(1-reveal)), f"{value} -> {index}", font=FONT_SMALL, fill=INK)
    if len(selected) > 1:
        left, right = positions[selected[0]][0], positions[selected[1]][0]
        span = ease((within-0.7)/1.3)
        draw.line((left, 338, lerp(left, right, span), 338), fill=(91, 232, 211), width=3)
        centered(draw, "2 + 7 = 9", (left+right)/2, 269, FONT_NODE, (111, 239, 217))


def draw_story(draw, story, beat, within, next_beat=None, segment=0, previous=None, story_id=""):
    values, selected, done, _ = beat
    active, completed = set(selected), set(done)
    kind = story["kind"]
    draw.rounded_rectangle((22, 222, 410, 514), 19, fill=(8, 14, 27), outline=(43, 88, 159), width=2)
    draw.rounded_rectangle((37,497,395,502),2,fill=BORDER)
    draw.rounded_rectangle((37,497,37+358*(within/SEGMENT_SECONDS),502),2,fill=BLUE)
    if story_id == "pattern-two-sum":
        draw_two_sum(draw, beat, within, previous, segment)
        return
    if kind in ("line", "bars", "text", "linked", "queue", "dp"):
        count = len(values)
        cell = min(54, 350 / max(count, 1) - 5)
        gap = min(10, (354 - count*cell) / max(count-1, 1)) if count > 1 else 0
        left = 216 - (count*cell + (count-1)*gap)/2 + cell/2
        centers = [(left + i*(cell+gap), 370) for i in range(count)]
        old_values = previous[0] if previous else values
        old_count = len(old_values)
        old_cell = min(54, 350 / max(old_count, 1) - 5)
        old_gap = min(10, (354 - old_count*old_cell) / max(old_count-1, 1)) if old_count > 1 else 0
        old_left = 216 - (old_count*old_cell + (old_count-1)*old_gap)/2 + old_cell/2
        old_centers = [(old_left + i*(old_cell+old_gap), 370) for i in range(old_count)]
        used = set()
        matches = [previous_slot(values, old_values, i, used) for i in range(count)]
        travel = ease(within / 1.8)

        def card_position(i):
            old_i = matches[i]
            old_x = old_centers[old_i][0] if old_i is not None else centers[i][0] + 45
            old_y = old_centers[old_i][1] if old_i is not None else 310
            if segment == 0:
                reveal=ease((within-i*0.45)/0.7)
                return (centers[i][0], lerp(310,centers[i][1],reveal))
            return (lerp(old_x, centers[i][0], travel), lerp(old_y, centers[i][1], travel))

        def card_size(i):
            if segment == 0:
                return cell*ease((within-i*0.45)/0.7)
            return cell if matches[i] is not None else max(1, cell * travel)
        if kind == "bars":
            for i, value in enumerate(values):
                old_i = matches[i]
                old_x = old_centers[old_i][0] if old_i is not None else centers[i][0]
                x = lerp(old_x, centers[i][0], travel)
                changing = abs(old_x-centers[i][0]) > 1
                lift = -30*math.sin(travel*math.pi) if changing else -3*math.sin(within*3) if i in active else 0
                height = max(30, abs(int(value))*21)
                if segment == 0:
                    height *= ease((within-i*0.45)/0.8)
                draw.rounded_rectangle((x-cell/2, 430-height+lift, x+cell/2, 430+lift), 7,
                    fill=(43, 152, 238) if i in active else (35, 82, 146) if i in completed else (29, 43, 69))
                if segment != 0 or within > i*0.45+0.5:
                    centered(draw, value, x, 445+lift, FONT_NODE, WHITE)
            if len(selected) >= 2 and all(i < len(values) for i in selected[:2]):
                a,b=selected[:2]
                operation=f"{values[a]}  {'>' if values[a]>values[b] else '<='}  {values[b]}"
                centered(draw,operation,216,278,FONT_NODE,AMBER)
        elif kind == "linked":
            for i in range(count-1):
                arrow(draw, (centers[i][0]+cell/2, 370), (centers[i+1][0]-cell/2-4, 370), (96, 163, 234), 2)
            for i, value in enumerate(values):node(draw, value, card_position(i), i in active, i in completed, card_size(i),within)
            centered(draw, "HEAD", centers[0][0], 296, FONT_SMALL, BLUE)
            centered(draw, "NULL", centers[-1][0], 446, FONT_SMALL, MUTED)
            if selected:
                old_selected=previous[1] if previous else []
                old_index=old_selected[0] if old_selected and old_selected[0]<len(old_centers) else selected[0]
                current_index=selected[0] if selected[0]<len(centers) else 0
                x=lerp(old_centers[old_index][0],centers[current_index][0],travel)
                arrow(draw,(x,309),(x,337),AMBER,2)
                centered(draw,"CUR",x,288,FONT_SMALL,AMBER)
            if story["edges"]:
                arrow(draw, (centers[-1][0], 400), (centers[1][0], 400), AMBER, 2)
        elif kind == "queue":
            for i, value in enumerate(values):node(draw, value, card_position(i), i in active, i in completed, card_size(i),within)
            arrow(draw, (centers[0][0], 283), (centers[0][0], 335), BLUE, 2)
            centered(draw, "FRONT", centers[0][0], 262, FONT_SMALL, BLUE)
            centered(draw, "BACK", centers[-1][0], 434, FONT_SMALL, MUTED)
        else:
            if kind == "text" and story["aux"]:
                aux = story["aux"]
                offset = 2 if selected and min(selected) >= 2 else 0
                old_selected = previous[1] if previous else []
                old_offset = 2 if old_selected and min(old_selected) >= 2 else 0
                shown_offset = old_offset + (offset-old_offset)*min(1,within/1.8)
                for i, char in enumerate(aux):
                    target = offset+i
                    if target < len(centers):
                        x=centers[0][0]+(shown_offset+i)*(cell+gap)
                        node(draw, char, (x, 447), target in active, False, cell-7,within)
                draw.text((35, 428), "P", font=FONT_SMALL, fill=BLUE)
            for i, value in enumerate(values):
                shown=value
                if kind=="dp" and previous and i in active and i<len(previous[0]):
                    old=previous[0][i]
                    if isinstance(old,(int,float)) and isinstance(value,(int,float)):
                        shown=round(old+(value-old)*min(1,within/1.6))
                if matches[i] is None and i < len(old_values) and old_values[i] != value:
                    # The old result visibly leaves the box as the new result arrives.
                    if within < 1.4:
                        node(draw, old_values[i], (centers[i][0], 370-45*ease(within/1.4)), False, False,
                             max(1, cell*(1-ease(within/1.4))), within)
                node(draw, shown, card_position(i), i in active, i in completed, card_size(i),within)
            if kind == "dp":
                for i in range(2, count):
                    if i in active:
                        arrow(draw, (centers[i-2][0], 322), (centers[i][0]-8, 335), BLUE, 2)
                        arrow(draw, (centers[i-1][0], 319), (centers[i][0]+8, 335), BLUE, 2)
            for i in active:
                if i < len(centers):
                    centered(draw, str(i), centers[i][0], 293, FONT_SMALL, BLUE)
            focused=[centers[i][0] for i in selected if i<len(centers)]
            if focused:
                old_selected=previous[1] if previous else []
                from_x=old_centers[old_selected[0]][0] if old_selected and old_selected[0]<len(old_centers) else focused[0]
                marker=lerp(from_x, focused[0], travel)
                if len(focused)>1:
                    marker=lerp(marker, focused[-1], ease((within-2)/5))
                arrow(draw,(marker,306),(marker,330),AMBER,2)
        if kind == "text":draw.text((33, 338), "TEXT", font=FONT_SMALL, fill=MUTED)
        if kind == "dp":draw.text((33, 338), "DP", font=FONT_SMALL, fill=MUTED)
    elif kind in ("tree", "graph", "trie"):
        positions = ([(216,274),(113,350),(319,350),(69,439),(157,439),(272,439),(365,439)]
                     if kind != "graph" else [(216,275),(103,350),(329,350),(65,445),(158,445),(350,445)])
        edges = story["edges"] or [(0,1),(0,2),(1,3),(1,4),(2,5),(2,6)]
        for edge_index,(a,b) in enumerate(edges):
            if a < len(values) and b < len(values):
                colored = a in completed and (b in completed or b in active)
                arrow(draw, positions[a], positions[b], BLUE if colored else BORDER, 2)
                if kind=="graph" and edge_index<len(story["aux"]):
                    mx=(positions[a][0]+positions[b][0])/2
                    my=(positions[a][1]+positions[b][1])/2
                    draw.rounded_rectangle((mx-10,my-10,mx+10,my+10),5,fill=BG,outline=BORDER)
                    centered(draw,story["aux"][edge_index],mx,my-8,FONT_SMALL,WHITE)
        for i,value in enumerate(values):
            if i < len(positions):
                appearing = previous is not None and i >= len(previous[0])
                reveal = ease((within-i*0.4)/0.8) if segment == 0 else ease(within/1.5) if appearing else 1
                size = (56 if kind != "trie" else 45) * reveal
                origin = positions[i-1] if i and appearing else positions[i]
                center = (lerp(origin[0], positions[i][0], reveal),
                          lerp(origin[1], positions[i][1], reveal))
                node(draw,value,center,i in active,i in completed,size,within)
        if previous and previous[1] and active:
            old_index, new_index = previous[1][-1], selected[-1]
            if old_index < len(positions) and new_index < len(positions):
                point=(lerp(positions[old_index][0], positions[new_index][0], ease(within/2)),
                       lerp(positions[old_index][1], positions[new_index][1], ease(within/2)))
                draw.ellipse((point[0]-6,point[1]-6,point[0]+6,point[1]+6),fill=AMBER)
    elif kind == "stack":
        if story["aux"]:
            for i, char in enumerate(story["aux"]):
                centered(draw, char, 149+i*45, 245, FONT_NODE, BLUE if i==max(0,min(segment-1,3)) else MUTED)
        draw.rectangle((133, 277, 136, 476), fill=BORDER)
        draw.rectangle((296, 277, 299, 476), fill=BORDER)
        for i,value in enumerate(values):
            x,y=216,448-i*55
            entering=previous is not None and i >= len(previous[0])
            reveal=ease((within-i*0.45)/0.7) if segment == 0 else ease(within/1.5) if entering else 1
            node(draw,value,(x,lerp(255,y,reveal) if entering or segment == 0 else y),i in active,i in completed,
                 46*reveal,within)
        if previous and len(previous[0])>len(values) and within<1.5:
            old=previous[0][-1]
            old_y=448-(len(previous[0])-1)*55
            node(draw,old,(216,lerp(old_y,240,ease(within/1.5))),False,False,46*(1-ease(within/1.5)),within)
        arrow(draw,(348,340),(348,282),BLUE,2)
        centered(draw,"TOP",347,349,FONT_SMALL,BLUE)
    elif kind == "map":
        for i,value in enumerate(values[:5]):
            y=263+i*49
            appearing=previous is not None and i >= len(previous[0])
            reveal=ease((within-i*0.5)/0.75) if segment == 0 else ease(within/1.5) if appearing else 1
            x=lerp(106,56,reveal) if appearing or segment == 0 else 56
            draw.rounded_rectangle((x,y,x+320,y+41),9,fill=(59,45,30) if i in active else CARD,
                                   outline=AMBER if i in active else BORDER,width=2 if i in active else 1)
            draw.text((x+17,y+10),str(value)[:28],font=FONT_NODE,fill=WHITE if i in active else MUTED)
        if selected:
            old_active = previous[1][-1] if previous and previous[1] else selected[-1]
            pointer_y = lerp(283+old_active*49,283+selected[-1]*49,ease(within/1.8))
            arrow(draw,(39,pointer_y),(53,pointer_y),AMBER,2)
    elif kind == "grid":
        rows=len(values);cols=max(map(len,values))
        width=min(64,315/cols);left=216-cols*width/2;top=282
        for r,row in enumerate(values):
            for c,value in enumerate(row):
                index=r*cols+c
                shown=value
                if previous and index in active and r<len(previous[0]) and c<len(previous[0][r]):
                    old=previous[0][r][c]
                    if isinstance(old,(int,float)) and isinstance(value,(int,float)):
                        shown=round(old+(value-old)*min(1,within/1.6))
                reveal=ease((within-index*0.18)/0.55) if segment == 0 else 1
                node(draw,shown,(left+c*width+width/2,top+r*63),index in active,index in completed,(width-8)*reveal,within)
        if previous and previous[1] and selected:
            old_index,new_index=previous[1][-1],selected[-1]
            if old_index < rows*cols and new_index < rows*cols:
                sx=left+(old_index%cols)*width+width/2;sy=top+(old_index//cols)*63
                ex=left+(new_index%cols)*width+width/2;ey=top+(new_index//cols)*63
                t=ease(within/1.6)
                draw.ellipse((lerp(sx,ex,t)-5,lerp(sy,ey,t)-5,lerp(sx,ex,t)+5,lerp(sy,ey,t)+5),fill=AMBER)
    elif kind == "interval":
        draw.line((54,454,383,454),fill=MUTED,width=2)
        for tick in range(1,8):
            x=54+tick*41
            centered(draw,tick,x,465,FONT_SMALL,MUTED)
        old_selected=previous[1] if previous else []
        old_start=previous[0][old_selected[0]][0] if old_selected and old_selected[0]<len(previous[0]) else 1
        new_start=values[selected[0]][0] if selected and selected[0]<len(values) else old_start
        sweep_x=54+lerp(old_start,new_start,ease(within/2))*41
        draw.line((sweep_x,263,sweep_x,456),fill=AMBER,width=2)
        centered(draw,"NOW",sweep_x,242,FONT_SMALL,AMBER)
        for i,(start,end) in enumerate(values):
            y=275+i*48
            left=54+start*41;right=54+end*41
            if segment == 0:
                right=lerp(left,right,ease((within-i*0.45)/0.8))
            draw.rounded_rectangle((left,y,right,y+31),7,fill=(40,127,218) if i in active or i in completed else CARD,
                                   outline=BLUE if i in active else BORDER,width=2 if i in active else 1)
            if right-left>25:
                centered(draw,chr(65+i), (left+right)/2,y+5,FONT_NODE,WHITE)
    elif kind == "bits":
        for row,value in enumerate(values):
            y=280+row*62
            for i,char in enumerate(str(value)):
                x=126+i*53
                reveal=ease((within-(row*4+i)*0.18)/0.55) if segment == 0 else 1
                node(draw,char,(x,y),i in active,i in completed,43*reveal,within)
            draw.text((41,y-10),["A", "B", "OUT"][row],font=FONT_SMALL,fill=BLUE if row==2 else MUTED)
        if selected:
            old_selected=previous[1] if previous else []
            old=old_selected[0] if old_selected else selected[0]
            column=lerp(126+old*53,126+selected[0]*53,ease(within/1.5))
            arrow(draw,(column,307),(column,385),AMBER,2)


def frame(lesson, number):
    segment = min(number // (FPS * SEGMENT_SECONDS), SEGMENTS - 1)
    within = (number % (FPS * SEGMENT_SECONDS)) / FPS
    progress = number / max(FRAMES - 1, 1)
    story = STORIES[lesson["id"]]
    beats = story["beats"]
    if segment == 0:
        beat = (story["initial"], [], [], "Watch the example change, one action at a time.")
    elif segment <= 4:
        beat = beats[segment-1]
    elif segment == 5:
        beat = beats[min(int(within/2),3)]
    else:
        beat = beats[-1]
    im = BACKGROUND.copy()
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((22, 22, 188, 50), 12, fill=(24, 72, 153), outline=(66, 139, 229))
    draw.text((34, 27), "CLOSE AI  /  DSA", font=FONT_SMALL, fill=WHITE)
    draw.text((347, 27), f"{segment+1:02d} / 08", font=FONT_SMALL, fill=MUTED)
    title = lesson["title"]
    title_face = next((face for face in (FONT_BOLD,FONT_BOLD_SMALL,FONT_BOLD_TINY) if draw.textlength(title,font=face)<=382),FONT_BOLD_TINY)
    draw.text((24, 73), title, font=title_face, fill=WHITE)
    draw.line((24, 118, 408, 118), fill=BORDER, width=1)
    heading = "WORKED EXAMPLE" if segment==0 else "REPLAY THE STEPS" if segment==5 else "THE KEY IDEA" if segment==6 else "TRY IT YOURSELF" if segment==7 else f"ACTION {segment} OF 4"
    draw.text((24, 132), heading, font=FONT_SMALL, fill=AMBER)
    concept = lesson["concept"]
    paragraph(draw, concept, 24, 151, FONT_CONCEPT, WHITE, max_width=384,max_lines=3,gap=2)
    following = beats[segment] if 1<=segment<4 else None
    previous = beats[segment-2] if 2<=segment<=4 else (story["initial"],[],[],"") if segment==1 else None
    visual_time = within
    if segment == 5:
        replay_index = min(int(within/2),3)
        previous = beats[replay_index-1] if replay_index else (story["initial"],[],[],"")
        visual_time = (within % 2)*4
    draw_story(draw,story,beat,visual_time,following,segment,previous,lesson["id"])
    # A changing pseudocode strip ties the visual action to a repeatable rule.
    draw.rounded_rectangle((22,526,410,626),11,fill=(11,19,33),outline=BORDER)
    draw.text((35,537),"TRACE / WHAT CHANGED",font=FONT_SMALL,fill=MUTED)
    for i, storyboard_beat in enumerate(beats):
        label = storyboard_beat[3]
        x,y=36,559+i*16
        selected=(i==max(0,min(segment-1,3))) if segment!=5 else i==min(int(within/2),3)
        draw.text((x,y),f"{i+1}. {label[:36]}",font=FONT_MONO,fill=BLUE if selected else MUTED)
    note = beat[3]
    if segment==6:note="Why it works: "+concept
    elif segment==7:note="Pause and predict the next action. Then replay."
    paragraph(draw,note,24,642,FONT_REG,WHITE,max_width=384,max_lines=2,gap=4)
    paragraph(draw,lesson["conceptBn"],24,693,FONT_BN,MUTED,max_width=384,max_lines=2,gap=3)
    draw.rounded_rectangle((24,749,408,755),2,fill=BORDER)
    draw.rounded_rectangle((24,749,24+int(384*progress),755),2,fill=BLUE)
    return im


def render(lesson, output_dir):
    video = output_dir / f'{lesson["id"]}.mp4'
    poster = output_dir / f'{lesson["id"]}.jpg'
    video_tmp = output_dir / f'.{lesson["id"]}.rendering.mp4'
    poster_tmp = output_dir / f'.{lesson["id"]}.rendering.jpg'
    frame(lesson, 11 * FPS).save(poster_tmp, quality=87, optimize=True)
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pixel_format", "rgb24", "-video_size", f"{WIDTH}x{HEIGHT}", "-framerate", str(FPS),
        "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
        "-pix_fmt", "yuv420p", "-threads", "1", "-movflags", "+faststart", "-t", "64", str(video_tmp),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for number in range(FRAMES):
            process.stdin.write(frame(lesson, number).tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        video_tmp.unlink(missing_ok=True)
        poster_tmp.unlink(missing_ok=True)
        raise RuntimeError(f"ffmpeg failed for {lesson['id']}")
    video_tmp.replace(video)
    poster_tmp.replace(poster)
    print(lesson["id"], video.stat().st_size, flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--id", action="append", help="render a specific lesson; repeat for several lessons")
    parser.add_argument("--missing", action="store_true", help="render only lessons without both assets")
    parser.add_argument("--jobs", type=int, default=1, help="parallel rendering workers")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    lessons = json.loads(args.manifest.read_text())
    validate_storyboards([lesson["id"] for lesson in lessons])
    selected = [lesson for lesson in lessons if (not args.id or lesson["id"] in args.id) and
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
