#!/usr/bin/env python3
"""Validate the mascot animation set against the rig contract.

Checks, per file:
  (a) parses as JSON, correct canvas/framerate/version
  (b) 12 layers with ind/parent/type/shape-structure identical to idle.json
      (colors, shape sizes, layer order) — only keyframes may differ
  (c) PulseRing/StatusDot opacity is 0 everywhere, EXCEPT whitelisted accent
      states, where opacity must still be 0 at t0 and t_op (appears & vanishes)
  (d) loops: every animated track's value at t0 == value at t_op
      (rotation compared mod 360); one-shots: first AND last keyframe of every
      animated track equal the neutral rest pose
  (e) the eye highlight's screen position moves with the gaze (span check)
"""

import json
import math
import os
import sys

SRC = "frontend/src/assets/mascot"
with open(os.path.join(SRC, "idle.json")) as _f:
    IDLE = json.load(_f)

LOOPS = {"excited", "angry", "confused", "proud", "shy", "sleepy", "love", "celebrate",
         "icon-clock", "icon-arrow", "icon-loading", "icon-star", "icon-plus",
         "gesture-wave", "nod-yes", "shake-no", "bounce", "spin", "wobble", "peek",
         "float", "dizzy",
         # wave 2
         "idle", "writing", "phone", "coding", "searching", "juggling", "presenting",
         "workout", "fly", "swim", "run", "ball", "zoom", "spring", "gravity-flip",
         "dance", "disco", "clap", "conduct", "loading-dots", "loading-orbit",
         "loading-pulse", "loading-bar", "impatient", "processing", "laughing",
         "crying", "nervous", "smug", "scared", "bored", "sleeping", "stargaze",
         "attentive", "speaking", "speaking-2", "speaking-3", "speaking-4"}
ONESHOTS = {"sad", "surprised", "icon-check", "icon-cross", "icon-heart",
            "gesture-point", "stretch", "jump",
            # wave 2
            "sneeze", "hello", "enter", "exit", "mind-blown", "bow", "alert", "hiccup", "boop"}
# Entrances start hidden (skip the start-at-rest check); exits end hidden (skip the end check).
ENTRANCES = {"hello", "enter"}
EXITS = {"exit"}
# States allowed to briefly reveal a hidden layer (must still be invisible at both ends).
ACCENTS = {
    "sad": {"StatusDot"}, "sleepy": {"StatusDot"},
    "dizzy": {"Star1", "Star2"}, "stargaze": {"Star1", "Star2"},
    "surprised": {"PulseRing"}, "love": {"PulseRing"},
    "celebrate": {"PulseRing", "Star1", "Star2"},
    "icon-clock": {"PulseRing"}, "icon-heart": {"PulseRing"},
    "icon-check": {"Star1"}, "boop": {"Star1"}, "phone": {"Prop"},
    "juggling": {"StatusDot"}, "swim": {"StatusDot"}, "crying": {"StatusDot"},
    "nervous": {"StatusDot"}, "sleeping": {"StatusDot"},
    "alert": {"StatusDot"}, "loading-orbit": {"StatusDot"},
    "loading-pulse": {"PulseRing"},
    "mind-blown": {"PulseRing", "Star1", "Star2"}, "clap": {"PulseRing"},
}

# The five accent/prop layers: hidden by default; states may tint them per-use (tears
# are blue) and their p/s/r tracks are exempt from seam/rest checks — they are only
# ever visible mid-state, and opacity rules below guarantee invisibility at the edges
# (or an explicitly held prop, e.g. the phone).
ACCENT_LAYERS = ("PulseRing", "StatusDot", "Star1", "Star2", "Prop")

REST = {
    ("StatusDot", "o"): [0], ("StatusDot", "p"): [256, 168, 0], ("StatusDot", "s"): [100, 100, 100],
    ("Eyelid", "s"): [100, 0],
    ("Eye", "p"): [256, 250, 0],
    ("Body", "p"): [256, 250, 0], ("Body", "s"): [100, 100, 100],
    ("PulseRing", "o"): [0], ("PulseRing", "s"): [100, 100, 100], ("PulseRing", "p"): [256, 250, 0],
    ("Arm0", "r"): [0], ("Arm90", "r"): [90], ("Arm45", "r"): [45], ("Arm-45", "r"): [-45],
    ("Arm0", "s"): [100, 100, 100], ("Arm90", "s"): [100, 100, 100],
    ("Arm45", "s"): [100, 100, 100], ("Arm-45", "s"): [100, 100, 100],
    ("Arm0", "p"): [256, 250, 0], ("Arm90", "p"): [256, 250, 0],
    ("Arm45", "p"): [256, 250, 0], ("Arm-45", "p"): [256, 250, 0],
    ("Face", "p"): [256, 250, 0], ("Face", "r"): [0], ("Face", "s"): [100, 100, 100],
    ("Root", "p"): [256, 250, 0], ("Root", "r"): [0], ("Root", "s"): [100, 100, 100],
    ("Shadow", "s"): [100, 100, 100], ("Shadow", "o"): [18], ("Shadow", "p"): [256, 350, 0],
    ("Star1", "o"): [0], ("Star2", "o"): [0], ("Prop", "o"): [0],
    ("Highlight", "p"): [13, -7], ("Highlight", "s"): [100, 100],
    ("Pupil", "p"): [0, 0], ("Pupil", "s"): [100, 100],
}


def strip_anim(node, drop_colors=False):
    """Return shape structure with all animatable transform values normalized out.
    drop_colors also removes fill/stroke colors (accent layers may be tinted per state)."""
    if isinstance(node, dict):
        if node.get("ty") == "tr":
            return {"ty": "tr"}
        if drop_colors and node.get("ty") in ("fl", "st") and "c" in node:
            node = {k: v for k, v in node.items() if k != "c"}
        return {k: strip_anim(v, drop_colors) for k, v in node.items()}
    if isinstance(node, list):
        return [strip_anim(x, drop_colors) for x in node]
    return node


def close(a, b, tol=0.05, is_rot=False):
    a = a if isinstance(a, list) else [a]
    b = b if isinstance(b, list) else [b]
    if len(a) != len(b):
        # allow trailing dims (e.g. [100,0] vs [100,0,100])
        n = min(len(a), len(b))
        a, b = a[:n], b[:n]
    for x, y in zip(a, b, strict=False):
        d = abs(x - y)
        if is_rot:
            d = min(d % 360, 360 - (d % 360))
        if d > tol:
            return False
    return True


def tracks_of(doc):
    """Yield (label, prop_name, prop_dict) for every animatable track."""
    for lyr in doc["layers"]:
        for prop in ("o", "r", "p", "s"):
            if prop in lyr["ks"]:
                yield f"{lyr['nm']}.{prop}", prop, lyr["ks"][prop]
        if lyr["nm"] == "Eye":
            for g in lyr["shapes"]:
                if g.get("nm") in ("Highlight", "Pupil"):
                    for item in g["it"]:
                        if item["ty"] == "tr":
                            for prop in ("p", "s"):
                                yield f"{g['nm']}.{prop}", prop, item[prop]


def sample(prop, t):
    """Value of a property at time t (nearest keyframe interpolation is enough for seams)."""
    if not prop["a"]:
        return prop["k"]
    ks = prop["k"]
    if t <= ks[0]["t"]:
        return ks[0]["s"]
    if t >= ks[-1]["t"]:
        return ks[-1]["s"]
    for i in range(len(ks) - 1):
        if ks[i]["t"] <= t <= ks[i + 1]["t"]:
            return ks[i]["s"] if t - ks[i]["t"] <= ks[i + 1]["t"] - t else ks[i + 1]["s"]
    return ks[-1]["s"]


def check(name):
    errors, notes = [], []
    with open(os.path.join(SRC, f"{name}.json")) as f:
        doc = json.load(f)

    # (a) header
    for k, v in (("v", "5.7.4"), ("fr", 60), ("w", 512), ("h", 512), ("ip", 0)):
        if doc.get(k) != v:
            errors.append(f"header {k}={doc.get(k)!r} != {v!r}")
    op = doc["op"]

    # (b) structure identical to idle
    if len(doc["layers"]) != len(IDLE["layers"]):
        errors.append(f"{len(doc['layers'])} layers != {len(IDLE['layers'])}")
    for got, ref in zip(doc["layers"], IDLE["layers"], strict=False):
        for field in ("ind", "parent", "ty", "nm"):
            if got.get(field) != ref.get(field):
                errors.append(f"layer {ref['nm']}: {field} {got.get(field)} != {ref.get(field)}")
        tintable = ref["nm"] in ACCENT_LAYERS
        if strip_anim(got.get("shapes", []), tintable) != strip_anim(ref.get("shapes", []), tintable):
            errors.append(f"layer {ref['nm']}: shape structure/colors differ from idle")

    # (c) hidden layers
    for lname in ACCENT_LAYERS:
        lyr = next(x for x in doc["layers"] if x["nm"] == lname)
        o = lyr["ks"]["o"]
        allowed = lname in ACCENTS.get(name, set())
        if not o["a"]:
            if o["k"] != 0 and o["k"] != [0] and not allowed:
                errors.append(f"{lname}.o static {o['k']} != 0 (not an accent state)")
        else:
            if not allowed:
                errors.append(f"{lname}.o animated but {name} is not an accent state")
            first, last = o["k"][0]["s"], o["k"][-1]["s"]
            if not close(first, [0]) or not close(last, [0]):
                errors.append(f"{lname}.o does not start+end at 0 ({first} .. {last})")

    # (d) seams / rest pose
    label_rest = dict(REST)
    for label, prop, p in tracks_of(doc):
        if not p["a"]:
            continue
        if label.split(".")[0] in ACCENT_LAYERS and prop != "o":
            continue
        ks = p["k"]
        is_rot = prop == "r"
        v0, v1 = ks[0]["s"], ks[-1]["s"]
        t0, t1 = ks[0]["t"], ks[-1]["t"]
        if t0 != 0:
            notes.append(f"{label}: first key at t={t0} (holds {v0} before)")
        if t1 != op:
            # value holds after the last keyframe, so seam compares v(op)=v1 vs v(0)=v0 anyway
            pass
        if name in LOOPS:
            if not close(v0, v1, is_rot=is_rot):
                errors.append(f"loop seam broken on {label}: t0={v0} vs t_op={v1}")
        else:
            lname = label.split(".")[0]
            rest = label_rest.get((lname, prop))
            if rest is not None:
                if name not in ENTRANCES and not close(v0, rest, is_rot=is_rot):
                    errors.append(f"one-shot {label} does not START at rest: {v0} != {rest}")
                if name not in EXITS and not close(v1, rest, is_rot=is_rot):
                    errors.append(f"one-shot {label} does not END at rest: {v1} != {rest}")

    # (e) living-highlight check: at every gaze keyframe the highlight must satisfy the
    # rig formula hl = [13*(1-m)+dx*15, -7*(1-m)+dy*15] for the gaze (dx,dy) at that time,
    # so the catchlight always travels with (and leans into) the gaze — never frozen.
    eye_layer = next(x for x in doc["layers"] if x["nm"] == "Eye")
    eye_p = eye_layer["ks"]["p"]
    hl_p = None
    for g in eye_layer["shapes"]:
        if g.get("nm") == "Highlight":
            hl_p = next(item for item in g["it"] if item["ty"] == "tr")["p"]
    if eye_p["a"]:
        ts = sorted({kf["t"] for kf in eye_p["k"]} |
                    ({kf["t"] for kf in hl_p["k"]} if hl_p["a"] else set()))
        eye_span, worst = 0.0, 0.0
        for t in ts:
            e, h = sample(eye_p, t), sample(hl_p, t)
            dx, dy = (e[0] - 256) / 17.0, (e[1] - 250) / 14.0
            eye_span = max(eye_span, math.hypot(e[0] - 256, e[1] - 250))
            m = min(1.0, math.hypot(dx, dy))
            exp = (13 * (1 - m) + dx * 15, -7 * (1 - m) + dy * 15)
            worst = max(worst, math.hypot(h[0] - exp[0], h[1] - exp[1]))
        if worst > 1.5:
            errors.append(f"highlight deviates {worst:.1f}px from the gaze-tracking formula")
        notes.append(f"gaze span {eye_span:.1f}px, highlight tracks gaze (max dev {worst:.2f}px)")
        # pupil containment: |eye offset| must stay <= 20px
        if eye_span > 20.5:
            errors.append(f"gaze amplitude {eye_span:.1f}px exceeds 20px pupil-containment limit")

    return op, errors, notes


def main():
    names = sorted(LOOPS | ONESHOTS)
    assert len(names) == 77, len(names)
    failed = 0
    for name in names:
        op, errors, notes = check(name)
        kind = "loop " if name in LOOPS else "1shot"
        status = "OK " if not errors else "FAIL"
        note = "; ".join(n for n in notes if "span" in n)
        print(f"{status} {name:<15} {kind} op={op:<4} {note}")
        for e in errors:
            failed += 1
            print(f"     !! {e}")
    print(f"\n{len(names) - sum(1 for n in names if check(n)[1])} clean" if failed == 0 else f"\n{failed} errors")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
