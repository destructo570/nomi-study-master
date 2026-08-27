import json
import re
import statistics
import sys
from collections import Counter

import fitz

PAGE_NUM_RE = re.compile(
    r"^\s*(?:page\s+)?\d+(?:\s*(?:of|/)\s*\d+)?\s*$",
    re.IGNORECASE,
)
SENTENCE_END_RE = re.compile(r"[.!?:][\"')\]]?\s*$")
LIST_START_RE = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s+")
BOLD_FLAG = 16


def extract_page(page):
    raw = page.get_text("dict")
    blocks = []
    font_sizes = []

    for b in raw.get("blocks", []):
        if b.get("type") != 0:
            continue
        lines_data = []
        for line in b.get("lines", []):
            spans = line.get("spans", [])
            if not spans:
                continue
            text = "".join(s.get("text", "") for s in spans)
            if not text.strip():
                continue
            sizes = [s.get("size", 0) for s in spans if s.get("text", "").strip()]
            flags = [s.get("flags", 0) for s in spans]
            avg_size = statistics.mean(sizes) if sizes else 0
            is_bold = any(f & BOLD_FLAG for f in flags)
            lines_data.append(
                {
                    "text": text,
                    "size": avg_size,
                    "bold": is_bold,
                    "bbox": line.get("bbox"),
                }
            )
            if avg_size > 0:
                font_sizes.append(avg_size)
        if lines_data:
            blocks.append({"lines": lines_data, "bbox": b.get("bbox")})

    median_size = statistics.median(font_sizes) if font_sizes else 0
    return blocks, median_size


def merge_lines(lines):
    out = []
    for i, line in enumerate(lines):
        text = line["text"].rstrip()
        if not text:
            continue
        if not out:
            out.append(text)
            continue
        prev = out[-1]
        if (
            prev.endswith("-")
            and len(prev) >= 2
            and prev[-2].isalpha()
            and prev[-2].islower()
            and text[:1].isalpha()
            and text[:1].islower()
        ):
            out[-1] = prev[:-1] + text
            continue
        if LIST_START_RE.match(text):
            out.append(text)
            continue
        if SENTENCE_END_RE.search(prev):
            out.append(text)
            continue
        out[-1] = prev + " " + text.lstrip()
    return "\n".join(out)


def classify(lines, heading_threshold):
    if not lines:
        return None
    avg = statistics.mean(l["size"] for l in lines)
    if heading_threshold and avg >= heading_threshold and len(lines) <= 3:
        return "heading"
    if (
        len(lines) == 1
        and lines[0]["bold"]
        and len(lines[0]["text"].strip()) < 100
        and not SENTENCE_END_RE.search(lines[0]["text"].rstrip())
    ):
        return "heading"
    return "paragraph"


def detect_repeated_edges(raw_pages):
    if len(raw_pages) < 3:
        return set()
    firsts = []
    lasts = []
    for rp in raw_pages:
        blocks = rp["blocks"]
        if not blocks:
            continue
        if blocks[0]["lines"]:
            firsts.append(blocks[0]["lines"][0]["text"].strip())
        if blocks[-1]["lines"]:
            lasts.append(blocks[-1]["lines"][-1]["text"].strip())
    threshold = max(3, int(len(raw_pages) * 0.6))
    repeated = set()
    for counter in (Counter(firsts), Counter(lasts)):
        for text, count in counter.items():
            if text and count >= threshold:
                repeated.add(text)
    return repeated


def process(path):
    doc = fitz.open(path)
    page_count = doc.page_count

    if page_count == 0:
        doc.close()
        return {"pageCount": 0, "needsOCR": False, "pages": []}

    raw_pages = []
    total_chars = 0
    for page in doc:
        blocks, median_size = extract_page(page)
        raw_pages.append({"blocks": blocks, "median_size": median_size})
        for b in blocks:
            for l in b["lines"]:
                total_chars += len(l["text"].strip())

    if total_chars < 50:
        doc.close()
        return {"pageCount": page_count, "needsOCR": True, "pages": []}

    repeated = detect_repeated_edges(raw_pages)

    pages_out = []
    for i, rp in enumerate(raw_pages):
        page_num = i + 1
        out_blocks = []
        median_size = rp["median_size"]
        threshold = median_size * 1.2 if median_size else 0
        block_count = len(rp["blocks"])

        for bidx, block in enumerate(rp["blocks"]):
            is_edge = bidx == 0 or bidx == block_count - 1
            kept = []
            for line in block["lines"]:
                txt = line["text"].strip()
                if not txt:
                    continue
                if is_edge and PAGE_NUM_RE.match(txt):
                    continue
                if txt in repeated:
                    continue
                kept.append(line)

            if not kept:
                continue

            block_type = classify(kept, threshold)
            if block_type is None:
                continue

            text = merge_lines(kept).strip()
            if not text:
                continue

            out_blocks.append(
                {
                    "type": block_type,
                    "text": text,
                    "bbox": list(block["bbox"]) if block["bbox"] else None,
                }
            )

        pages_out.append({"page": page_num, "blocks": out_blocks})

    doc.close()
    return {"pageCount": page_count, "needsOCR": False, "pages": pages_out}


def main():
    if len(sys.argv) != 2:
        print("usage: pdf_parser.py <path>", file=sys.stderr)
        sys.exit(2)
    try:
        result = process(sys.argv[1])
    except Exception as exc:
        print(f"pdf_parser: {exc}", file=sys.stderr)
        sys.exit(1)
    json.dump(result, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
