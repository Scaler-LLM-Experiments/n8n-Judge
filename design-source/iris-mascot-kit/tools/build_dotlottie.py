#!/usr/bin/env python3
"""Package every mascot clip into a single dotLottie bundle.

Produces frontend/src/assets/mascot/companion.lottie — a zip with a v2 dotLottie
manifest and one animation entry per rig clip, ids matching the JSON basenames
(and the ClipName union in frontend/src/lib/mascotMachine.ts). The app swaps
states with dotLottie.loadAnimation(id) instead of fetching separate JSONs.

Run from the repo root after generate_mascot_animations.py + validation:
    python3 scripts/build_dotlottie.py
"""

import glob
import json
import os
import zipfile

SRC = "frontend/src/assets/mascot"
OUT = os.path.join(SRC, "companion.lottie")


def main() -> None:
    names = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(SRC, "*.json")))
    if not names:
        raise SystemExit("no clips found — run generate_mascot_animations.py first")
    # idle first: the player opens animations[0] regardless of activeAnimationId /
    # the animationId constructor option (verified against dotlottie-web 0.76), so
    # the bundle's first entry must be the state the mascot boots into.
    names.remove("idle")
    names.insert(0, "idle")

    # dotlottie-web's WASM core (v0.76) parses the v1 manifest shape; the v2
    # ("version":"2") shape loads but never fires `load` — verified empirically
    # against the real player in headless Chromium. Keep v1 until the dep is
    # upgraded AND the smoke test below is re-run against the new parser.
    manifest = {
        "activeAnimationId": "idle",
        "animations": [
            {"id": name, "loop": True, "speed": 1, "direction": 1, "mode": "normal"}
            for name in names
        ],
        "author": "ai-coding",
        "generator": "ai-coding mascot pipeline",
        "revision": 1,
        "version": "1.0",
    }

    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        zf.writestr("manifest.json", json.dumps(manifest, separators=(",", ":")))
        for name in names:
            with open(os.path.join(SRC, f"{name}.json")) as f:
                zf.writestr(f"animations/{name}.json", f.read())

    size = os.path.getsize(OUT)
    print(f"wrote {OUT}: {len(names)} animations, {size // 1024} KB")


if __name__ == "__main__":
    main()
