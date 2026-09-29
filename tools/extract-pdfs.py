#!/usr/bin/env python3
"""Dump each PDF in the project root to a plain-text file under tools/text/.

Blocks are sorted by page position so the code snippets land next to the
question that owns them, and the diagonal WATERMARK blocks are dropped.

Requires:  pip install pymupdf
Usage:     python tools/extract-pdfs.py
"""

import pymupdf
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(ROOT, 'tools', 'text')

WM = re.compile(r'(WATERMARK|RMARK\s+WA|ATERMARK|TERMARK|^MARK WATERMARK)', re.M)

def is_watermark(text):
    stripped = text.strip()
    if not stripped:
        return False
    hits = len(WM.findall(stripped))
    lines = [l for l in stripped.splitlines() if l.strip()]
    if not lines:
        return False
    return hits >= max(1, len(lines) // 3)

os.makedirs(OUTDIR, exist_ok=True)

for f in sorted(glob.glob(os.path.join(ROOT, '*.pdf'))):
    name = os.path.splitext(os.path.basename(f))[0]
    doc = pymupdf.open(f)
    out = []
    for i, page in enumerate(doc):
        blocks = []
        for b in page.get_text('blocks'):
            y0, x0, y1, x1, text = b[0], b[1], b[2], b[3], b[4]
            if is_watermark(text):
                continue
            if not text.strip():
                continue
            blocks.append((round(y0, 1), round(x0, 1), text))
        blocks.sort(key=lambda t: (t[0], t[1]))
        out.append(f'\n\n===== PAGE {i + 1} =====\n')
        for y, x, text in blocks:
            t = text.rstrip('\n')
            if t.strip() == 'python':
                continue
            out.append(t + '\n')
    path = os.path.join(OUTDIR, name + '.txt')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(''.join(out))
    print(path, doc.page_count, os.path.getsize(path))
