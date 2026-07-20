#!/usr/bin/env python3
"""Generate the expressive mascot animation set from the idle.json rig.

Every state is hand-authored keyframe data applied onto a deep copy of
`frontend/src/assets/mascot/idle.json` with all tracks first reset to the
neutral rest pose. Only keyframes change — layers, shapes, colors, parenting
and canvas are byte-identical to the source rig.

Run from the repo root:  python3 scripts/generate_mascot_animations.py
"""

import copy
import json
import math
import os

SRC = "frontend/src/assets/mascot"

# Accent palette (rig v2): external story props are big and bright yellow so they read
# at mascot scale (Brilliant-style); states can tint them per-use (tears are blue).
YELLOW = [1, 0.8784313725490196, 0, 1]          # #FFE100
PROP_BLACK = [0.05, 0.05, 0.07, 1]


def _accent_layer(ind, name, shapes, p, parent=None):
    lyr = {
        "ddd": 0, "ind": ind, "ty": 4, "nm": name, "sr": 1,
        "ks": {
            "o": {"a": 0, "k": 0}, "r": {"a": 0, "k": 0},
            "p": {"a": 0, "k": p}, "a": {"a": 0, "k": [0, 0, 0]},
            "s": {"a": 0, "k": [100, 100, 100]},
        },
        "ao": 0, "ip": 0, "op": 180, "st": 0, "bm": 0, "shapes": shapes,
    }
    if parent is not None:
        lyr["parent"] = parent
    return lyr


def _star_shapes():
    return [
        {"ty": "sr", "sy": 1, "d": 1, "pt": {"a": 0, "k": 5}, "p": {"a": 0, "k": [0, 0]},
         "r": {"a": 0, "k": 0}, "ir": {"a": 0, "k": 15}, "is": {"a": 0, "k": 0},
         "or": {"a": 0, "k": 32}, "os": {"a": 0, "k": 0}, "nm": "star", "hd": False},
        {"ty": "fl", "c": {"a": 0, "k": list(YELLOW)}, "o": {"a": 0, "k": 100}, "r": 1,
         "nm": "fill", "hd": False},
    ]


def _prop_shapes():
    return [
        {"ty": "rc", "d": 1, "s": {"a": 0, "k": [68, 116]}, "p": {"a": 0, "k": [0, 0]},
         "r": {"a": 0, "k": 12}, "nm": "rect", "hd": False},
        {"ty": "fl", "c": {"a": 0, "k": list(PROP_BLACK)}, "o": {"a": 0, "k": 100}, "r": 1,
         "nm": "fill", "hd": False},
    ]


def upgrade_rig(doc):
    """Rig v2, idempotent: recolor StatusDot/PulseRing to yellow (ring stroke 10), and
    add three hidden prop layers rendered above everything — Star1/Star2 (world space)
    and Prop (a black slab parented to Root, e.g. the phone)."""
    names = {lyr["nm"] for lyr in doc["layers"]}
    for lyr in doc["layers"]:
        if lyr["nm"] == "StatusDot":
            for sh in lyr["shapes"]:
                if sh["ty"] == "fl":
                    sh["c"] = {"a": 0, "k": list(YELLOW)}
        if lyr["nm"] == "PulseRing":
            for sh in lyr["shapes"]:
                if sh["ty"] == "st":
                    sh["c"] = {"a": 0, "k": list(YELLOW)}
                    sh["w"] = {"a": 0, "k": 10}
    if "Star1" not in names:
        doc["layers"] = [
            _accent_layer(13, "Star1", _star_shapes(), [256, 120, 0]),
            _accent_layer(14, "Star2", _star_shapes(), [256, 120, 0]),
            _accent_layer(15, "Prop", _prop_shapes(), [256, 250, 0], parent=11),
        ] + doc["layers"]
    return doc


with open(os.path.join(SRC, "idle.json")) as _f:
    BASE = upgrade_rig(json.load(_f))

EO = {"x": [0.42], "y": [0]}
EI = {"x": [0.58], "y": [1]}

# Neutral rest pose for every animatable track: (layer, prop) -> static value.
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
    ("Star1", "o"): [0], ("Star1", "p"): [256, 120, 0], ("Star1", "s"): [100, 100, 100], ("Star1", "r"): [0],
    ("Star2", "o"): [0], ("Star2", "p"): [256, 120, 0], ("Star2", "s"): [100, 100, 100], ("Star2", "r"): [0],
    ("Prop", "o"): [0], ("Prop", "p"): [256, 250, 0], ("Prop", "s"): [100, 100, 100], ("Prop", "r"): [0],
    # Eye shape-group transforms
    ("Highlight", "p"): [13, -7], ("Highlight", "s"): [100, 100],
    ("Pupil", "p"): [0, 0], ("Pupil", "s"): [100, 100],
}

ARMS = ("Arm0", "Arm90", "Arm45", "Arm-45")
DIAGS = ("Arm45", "Arm-45")


def rnd(v):
    v = round(float(v), 3)
    return int(v) if v == int(v) else v


def keyframes(pairs):
    """pairs: [(t, [values...]), ...] -> Lottie animated property."""
    out = []
    for i, (t, v) in enumerate(pairs):
        kf = {"t": t, "s": [rnd(x) for x in v]}
        if i < len(pairs) - 1:
            kf["o"] = EO
            kf["i"] = EI
        out.append(kf)
    return {"a": 1, "k": out}


def norm(prop, v, dims3=True):
    if isinstance(v, (int, float)):
        return [v]
    v = list(v)
    if prop == "p" and len(v) == 2:
        v = [*v, 0]
    if prop == "s" and len(v) == 2 and dims3:
        v = [*v, 100]
    return v


def find_layer(doc, name):
    for lyr in doc["layers"]:
        if lyr["nm"] == name:
            return lyr
    raise KeyError(name)


def find_tr(doc, group):
    eye = find_layer(doc, "Eye")
    for g in eye["shapes"]:
        if g.get("nm") == group:
            for item in g["it"]:
                if item["ty"] == "tr":
                    return item
    raise KeyError(group)


def reset(doc):
    """Force every animatable track to the static rest pose."""
    for (name, prop), val in REST.items():
        if name in ("Highlight", "Pupil"):
            find_tr(doc, name)[prop] = {"a": 0, "k": list(val)}
        else:
            find_layer(doc, name)["ks"][prop] = {"a": 0, "k": list(val)}


def gaze_xy(dx, dy):
    """The living-eye formula: eyeball position + catchlight that tracks the gaze."""
    m = min(1.0, math.hypot(dx, dy))
    eye = [256 + dx * 17, 250 + dy * 14, 0]
    hl = [13 * (1 - m) + dx * 15, -7 * (1 - m) + dy * 15]
    return eye, hl


class Anim:
    def __init__(self, name, op, loop, accents=()):
        self.doc = copy.deepcopy(BASE)
        reset(self.doc)
        self.doc["nm"] = name
        self.doc["op"] = op
        for lyr in self.doc["layers"]:
            lyr["op"] = op
        self.name, self.op, self.loop = name, op, loop
        self.accents = set(accents)  # layer names allowed to become visible

    # -- track setters -----------------------------------------------------
    def set(self, layer, prop, pairs):
        vals = [(t, norm(prop, v)) for t, v in pairs]
        find_layer(self.doc, layer)["ks"][prop] = keyframes(vals)

    def stat(self, layer, prop, value):
        find_layer(self.doc, layer)["ks"][prop] = {"a": 0, "k": norm(prop, value)}

    def tr(self, group, prop, pairs):
        vals = [(t, norm(prop, v, dims3=False)) for t, v in pairs]
        find_tr(self.doc, group)[prop] = keyframes(vals)

    def tr_stat(self, group, prop, value):
        find_tr(self.doc, group)[prop] = {"a": 0, "k": norm(prop, value, dims3=False)}

    # -- semantic helpers ---------------------------------------------------
    def gaze(self, fixations):
        """fixations: [(t, dx, dy), ...]; writes Eye.p + Highlight.p together."""
        eye_k, hl_k = [], []
        for t, dx, dy in fixations:
            e, h = gaze_xy(dx, dy)
            eye_k.append((t, e))
            hl_k.append((t, h))
        self.set("Eye", "p", eye_k)
        self.tr("Highlight", "p", hl_k)

    def gaze_stat(self, dx, dy):
        e, h = gaze_xy(dx, dy)
        self.stat("Eye", "p", e)
        self.tr_stat("Highlight", "p", h)

    def lid(self, pairs):
        """pairs: [(t, closed_pct)] — 0 open, 100 closed."""
        self.set("Eyelid", "s", [(t, [100, v]) for t, v in pairs])

    def lid_stat(self, v):
        self.stat("Eyelid", "s", [100, v])

    def pupil(self, pairs):
        self.tr("Pupil", "s", [(t, [v, v]) for t, v in pairs])

    def hl(self, pairs):
        self.tr("Highlight", "s", [(t, [v, v]) for t, v in pairs])

    def tint(self, layer, rgb):
        """Per-state accent color override (e.g. blue tears). Accent layers only —
        they are invisible at seams/crossfades, so color variance never pops."""
        for sh in find_layer(self.doc, layer)["shapes"]:
            if sh["ty"] in ("fl", "st"):
                sh["c"] = {"a": 0, "k": [rgb[0], rgb[1], rgb[2], 1]}

    def write(self):
        path = os.path.join(SRC, f"{self.name}.json")
        with open(path, "w") as f:
            json.dump(self.doc, f, separators=(",", ":"))
        return path


def sine(base, amp, period, t0, t1, phase=0.0, step=None):
    """Sampled sine track (t, value) — period must divide (t1-t0) for loop seams."""
    step = step or max(4, period // 4)
    out = []
    t = t0
    while t <= t1:
        out.append((t, base + amp * math.sin(2 * math.pi * ((t - t0) / period) + phase)))
        t += step
    return out


REGISTRY = []


def state(name, op, loop, accents=()):
    def deco(fn):
        REGISTRY.append((name, op, loop, accents, fn))
        return fn
    return deco


# ===========================================================================
# EMOTIONS
# ===========================================================================

@state("excited", 96, loop=True)
def excited(a):
    # Two quick hops, second one bigger — arms fling up on the big one.
    a.set("Root", "p", [(0, (256, 250)), (8, (256, 256)), (16, (256, 222)), (26, (256, 252)),
                        (34, (256, 258)), (42, (256, 214)), (54, (256, 254)), (64, (256, 249)),
                        (76, (256, 251)), (96, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (8, (105, 93)), (16, (93, 110)), (26, (108, 91)),
                        (34, (107, 90)), (42, (91, 112)), (54, (109, 90)), (66, (97, 104)),
                        (78, (101, 99)), (96, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (34, 45), (44, 63), (60, 50), (78, 45), (96, 45)])
    a.set("Arm-45", "r", [(0, -45), (34, -45), (44, -63), (60, -50), (78, -45), (96, -45)])
    a.set("Arm45", "s", [(0, (100, 100)), (34, (100, 100)), (44, (100, 113)), (66, (100, 102)), (96, (100, 100))])
    a.set("Arm-45", "s", [(0, (100, 100)), (34, (100, 100)), (44, (100, 113)), (66, (100, 102)), (96, (100, 100))])
    a.set("Arm0", "s", [(0, (100, 100)), (42, (100, 109)), (62, (100, 100)), (96, (100, 100))])
    a.set("Arm90", "s", [(0, (100, 100)), (46, (100, 108)), (66, (100, 100)), (96, (100, 100))])
    a.gaze([(0, 0, 0), (12, 0, -0.45), (60, 0, -0.45), (72, 0, 0), (96, 0, 0)])
    a.pupil([(0, 100), (10, 114), (78, 114), (96, 100)])
    a.hl([(0, 100), (14, 118), (74, 118), (96, 100)])
    a.lid([(0, 0), (54, 0), (57, 100), (60, 0), (96, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (8, (104, 104)), (16, (82, 82)), (26, (106, 106)),
                          (34, (108, 108)), (42, (78, 78)), (54, (110, 110)), (68, (100, 100)), (96, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (16, 13), (26, 21), (42, 12), (54, 22), (68, 18), (96, 18)])


@state("sad", 132, loop=False, accents=("StatusDot",))
def sad(a):
    # Slow slump; a single blue tear rolls down and fades. Settles back to rest.
    a.set("Root", "p", [(0, (256, 250)), (20, (256, 257)), (66, (256, 259)), (104, (256, 252)), (132, (256, 250))])
    a.set("Root", "r", [(0, 0), (24, -3.5), (82, -3.5), (112, -1), (132, 0)])
    a.set("Face", "s", [(0, (100, 100)), (24, (105, 92)), (76, (105.5, 91.5)), (110, (101, 98.5)), (132, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (26, 62), (86, 62), (118, 50), (132, 45)])
    a.set("Arm-45", "r", [(0, -45), (26, -62), (86, -62), (118, -50), (132, -45)])
    a.set("Arm0", "s", [(0, (100, 100)), (26, (100, 93)), (92, (100, 93)), (132, (100, 100))])
    a.set("Arm90", "s", [(0, (100, 100)), (30, (100, 94)), (94, (100, 94)), (132, (100, 100))])
    a.gaze([(0, 0, 0), (18, -0.2, 0.85), (82, -0.2, 0.85), (98, 0.15, 0.7), (114, 0.15, 0.7), (128, 0, 0), (132, 0, 0)])
    a.pupil([(0, 100), (22, 90), (102, 90), (132, 100)])
    a.lid([(0, 0), (18, 38), (88, 38), (98, 55), (108, 30), (126, 0), (132, 0)])
    # the tear: appears at the eye's lower-left, slides down, fades — then home invisibly
    a.set("StatusDot", "o", [(0, 0), (30, 0), (40, 92), (62, 92), (80, 0), (132, 0)])
    a.set("StatusDot", "p", [(0, (256, 168)), (30, (234, 262)), (66, (234, 288)), (82, (234, 300)),
                             (98, (256, 168)), (132, (256, 168))])
    a.set("StatusDot", "s", [(0, (100, 100)), (28, (125, 125)), (82, (115, 150)), (98, (100, 100)), (132, (100, 100))])
    a.tint("StatusDot", (0.36, 0.62, 1))
    a.set("Shadow", "s", [(0, (100, 100)), (30, (96, 96)), (92, (96, 96)), (132, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (30, 16), (92, 16), (132, 18)])


@state("angry", 84, loop=True)
def angry(a):
    # Held compression + high-frequency vibrate; stiff low arms, narrowed eye.
    a.set("Face", "s", [(0, (106.5, 92.5)), (42, (108, 91)), (84, (106.5, 92.5))])
    p = [(0, (256, 254))]
    for i, t in enumerate(range(3, 81, 3)):
        p.append((t, (256 + (1.6 if i % 2 == 0 else -1.6), 254)))
    p.append((84, (256, 254)))
    a.set("Root", "p", p)
    r = [(0, 0)]
    for i, t in enumerate(range(6, 78, 6)):
        r.append((t, -0.9 if i % 2 == 0 else 0.9))
    r.append((84, 0))
    a.set("Root", "r", r)
    a.stat("Arm45", "r", 74)
    a.stat("Arm-45", "r", -74)
    a.stat("Arm45", "s", (108, 88))
    a.stat("Arm-45", "s", (108, 88))
    a.stat("Arm0", "s", (110, 90))
    a.stat("Arm90", "s", (104, 94))
    a.lid([(0, 46), (40, 46), (43, 100), (46, 46), (84, 46)])
    a.gaze_stat(0, -0.2)
    a.tr_stat("Pupil", "s", (92, 92))
    a.stat("Shadow", "s", (102, 102))
    a.stat("Shadow", "o", 19)


@state("surprised", 72, loop=False, accents=("PulseRing",))
def surprised(a):
    # Anticipation dip -> pop with a shock ring; cartoon pupil-shrink then dilate.
    a.set("Root", "p", [(0, (256, 250)), (6, (256, 257)), (12, (256, 224)), (34, (256, 228)),
                        (46, (256, 254)), (56, (256, 248)), (72, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (6, (104, 94)), (12, (90, 113)), (20, (93, 110)),
                        (40, (94, 109)), (50, (104, 95)), (60, (98, 102)), (72, (100, 100))])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (6, (100, 97)), (12, (100, 112)), (40, (100, 110)),
                         (56, (100, 98)), (72, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (6, 44), (12, 53), (40, 52), (72, 45)])
    a.set("Arm-45", "r", [(0, -45), (6, -44), (12, -53), (40, -52), (72, -45)])
    a.gaze([(0, 0, 0), (10, 0, -0.5), (38, 0, -0.5), (52, 0, -0.1), (72, 0, 0)])
    a.pupil([(0, 100), (6, 78), (30, 78), (42, 120), (60, 104), (72, 100)])
    a.hl([(0, 100), (12, 135), (40, 125), (72, 100)])
    a.lid([(0, 0), (46, 0), (49, 100), (53, 0), (72, 0)])
    a.set("PulseRing", "o", [(0, 0), (10, 0), (14, 65), (30, 0), (72, 0)])
    a.set("PulseRing", "s", [(0, (100, 100)), (10, (100, 100)), (30, (172, 172)), (48, (100, 100)), (72, (100, 100))])
    a.set("Shadow", "s", [(0, (100, 100)), (12, (80, 80)), (40, (84, 84)), (56, (104, 104)), (72, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (12, 12), (40, 13), (56, 21), (72, 18)])


@state("confused", 168, loop=True)
def confused(a):
    # Head tilts one way then the other while the eye searches; a little arm scratch.
    a.set("Root", "r", [(0, 0), (18, 7), (66, 7), (84, -5.5), (126, -5.5), (148, 0), (168, 0)])
    a.set("Root", "p", [(0, (256, 250)), (18, (253, 251)), (66, (253, 251)), (84, (259, 251)),
                        (126, (259, 251)), (148, (256, 250)), (168, (256, 250))])
    a.gaze([(0, 0, 0), (10, -0.7, 0.1), (40, -0.7, 0.1), (48, 0.6, 0), (74, 0.6, 0),
            (82, 0.7, -0.3), (108, 0.7, -0.3), (118, -0.5, -0.4), (140, -0.5, -0.4),
            (152, 0, 0), (168, 0, 0)])
    a.set("Arm45", "r", [(0, 45), (88, 45), (96, 51), (102, 45.5), (108, 51), (116, 45), (168, 45)])
    a.set("Arm45", "s", [(0, (100, 100)), (84, (100, 100)), (92, (96, 110)), (118, (96, 110)),
                         (128, (100, 100)), (168, (100, 100))])
    a.pupil([(0, 100), (90, 95), (130, 104), (168, 100)])
    a.lid([(0, 0), (44, 0), (47, 100), (50, 0), (110, 0), (114, 45), (122, 45), (128, 0), (168, 0)])
    a.set("Face", "s", [(0, (100, 100)), (84, (100.8, 99.2)), (168, (100, 100))])


@state("proud", 144, loop=True)
def proud(a):
    # Reworked: a living victory cycle — inflate tall as the arms sweep up into a
    # wide high V, rise onto tiptoes, then a "hmph" chest-pop with a proud smile-
    # squint and a highlight gleam, and a graceful exhale back down.
    a.set("Face", "s", [(0, (100, 100)), (28, (94, 109)), (58, (94, 109)), (64, (91, 113)),
                        (74, (95, 108)), (100, (94, 109)), (126, (100, 100)), (144, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (28, (256, 241)), (62, (256, 238)), (72, (256, 241)),
                        (104, (256, 240)), (130, (256, 249)), (144, (256, 250))])
    a.set("Root", "r", [(0, 0), (28, -3.5), (64, -5), (104, -4), (130, 0), (144, 0)])
    # arms sweep UP into a wide, held victory V (with a pop on the hmph beat)
    a.set("Arm45", "r", [(0, 45), (28, 26), (60, 26), (66, 22), (76, 27), (104, 26), (128, 45), (144, 45)])
    a.set("Arm-45", "r", [(0, -45), (28, -26), (60, -26), (66, -22), (76, -27), (104, -26), (128, -45), (144, -45)])
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (28, (104, 112)), (62, (104, 112)), (68, (106, 118)),
                         (78, (104, 113)), (104, (104, 112)), (128, (100, 100)), (144, (100, 100))])
    a.set("Arm0", "s", [(0, (100, 100)), (28, (96, 108)), (104, (96, 108)), (128, (100, 100)), (144, (100, 100))])
    a.set("Arm90", "s", [(0, (100, 100)), (28, (106, 94)), (104, (106, 94)), (128, (100, 100)), (144, (100, 100))])
    # proud smile-squint on the hmph, sparkle gleam, chin-up gaze
    a.lid([(0, 0), (58, 0), (64, 62), (86, 62), (94, 0), (144, 0)])
    a.gaze([(0, 0, 0), (24, 0, -0.35), (56, 0, -0.35), (62, 0, 0.08), (88, 0, 0.08),
            (96, -0.25, -0.3), (116, -0.25, -0.3), (132, 0, 0), (144, 0, 0)])
    a.pupil([(0, 100), (28, 106), (116, 106), (136, 100), (144, 100)])
    a.hl([(0, 100), (56, 108), (66, 138), (90, 110), (120, 108), (144, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (28, (94, 94)), (104, (93, 93)), (130, (100, 100)), (144, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (28, 15), (104, 15), (130, 18), (144, 18)])


@state("shy", 156, loop=True)
def shy(a):
    # Shrunk small, swaying, gaze hiding down-left with one brave glance at the viewer.
    a.set("Root", "s", [(0, (93, 93)), (78, (94.5, 94.5)), (156, (93, 93))])
    a.set("Root", "p", [(0, (254, 257)), (78, (258, 257.5)), (156, (254, 257))])
    a.set("Root", "r", [(0, -2), (78, 2.2), (156, -2)])
    a.stat("Arm45", "r", 34)
    a.stat("Arm-45", "r", -34)
    a.stat("Arm45", "s", (96, 93))
    a.stat("Arm-45", "s", (96, 93))
    a.stat("Arm0", "s", (96, 93))
    a.stat("Arm90", "s", (94, 92))
    a.gaze([(0, -0.75, 0.55), (58, -0.75, 0.55), (66, 0, 0.1), (84, 0, 0.1),
            (92, -0.75, 0.55), (148, -0.75, 0.55), (156, -0.75, 0.55)])
    a.lid([(0, 0), (86, 0), (90, 100), (94, 0), (156, 0)])
    a.tr_stat("Pupil", "s", (96, 96))
    a.set("Face", "s", [(0, (102, 97.5)), (78, (103, 96.5)), (156, (102, 97.5))])
    a.stat("Shadow", "s", (88, 88))
    a.stat("Shadow", "o", 15)


@state("sleepy", 264, loop=True, accents=("StatusDot",))
def sleepy(a):
    # Heavy breathing, drooping lids, a slow nod-off with a dream bubble — then the snap awake.
    a.set("Face", "s", [(0, (100, 100)), (40, (104, 96)), (80, (100.5, 99.5)), (120, (104.5, 95.5)),
                        (150, (101, 99.5)), (200, (103, 97)), (208, (99, 102)), (224, (101, 99)),
                        (264, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (40, (256, 253)), (80, (256, 250.5)), (120, (256, 254)),
                        (150, (256, 252)), (200, (256, 262)), (208, (256, 247)), (216, (256, 251)),
                        (264, (256, 250))])
    a.set("Root", "r", [(0, 0), (140, 1), (200, 7.5), (208, -1.5), (216, 0.5), (264, 0)])
    a.lid([(0, 42), (40, 55), (80, 48), (120, 62), (150, 58), (200, 92), (206, 96), (210, 10),
           (224, 30), (264, 42)])
    a.gaze([(0, 0, 0.35), (120, 0, 0.5), (200, 0.15, 0.8), (210, 0, -0.1), (228, 0, 0.2), (264, 0, 0.35)])
    a.pupil([(0, 97), (200, 94), (210, 108), (230, 100), (264, 97)])
    a.set("Arm45", "r", [(0, 49), (200, 55), (210, 47), (264, 49)])
    a.set("Arm-45", "r", [(0, -49), (200, -55), (210, -47), (264, -49)])
    a.set("Arm0", "s", [(0, (100, 96)), (200, (100, 92)), (212, (100, 99)), (264, (100, 96))])
    a.set("Arm90", "s", [(0, (100, 96)), (200, (100, 92)), (212, (100, 99)), (264, (100, 96))])
    a.set("StatusDot", "o", [(0, 0), (150, 0), (162, 90), (196, 90), (206, 0), (264, 0)])
    a.set("StatusDot", "p", [(0, (302, 152)), (150, (302, 152)), (170, (312, 136)), (185, (318, 124)),
                             (200, (326, 108)), (206, (330, 102)), (222, (302, 152)), (264, (302, 152))])
    a.set("StatusDot", "s", [(0, (90, 90)), (160, (90, 90)), (200, (150, 150)), (222, (90, 90)), (264, (90, 90))])
    a.set("Shadow", "s", [(0, (100, 100)), (120, (103, 103)), (200, (105, 105)), (212, (99, 99)), (264, (100, 100))])


@state("love", 112, loop=True, accents=("PulseRing",))
def love(a):
    # A ba-bump heartbeat squash x2 with a soft pulse ring; dilated dreamy eye, hugging arms.
    a.set("Face", "s", [(0, (100, 100)), (8, (105, 95.5)), (14, (101, 99)), (20, (106.5, 94)),
                        (32, (100, 100)), (56, (100, 100)), (64, (105, 95.5)), (70, (101, 99)),
                        (76, (106.5, 94)), (88, (100, 100)), (112, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (28, (256, 247)), (56, (256, 250)), (84, (256, 247)), (112, (256, 250))])
    a.set("Root", "r", [(0, -1.5), (56, 1.5), (112, -1.5)])
    a.set("PulseRing", "o", [(0, 0), (6, 0), (10, 38), (26, 0), (60, 0), (66, 38), (82, 0), (112, 0)])
    a.set("PulseRing", "s", [(0, (100, 100)), (6, (98, 98)), (26, (124, 124)), (58, (98, 98)),
                             (82, (124, 124)), (100, (100, 100)), (112, (100, 100))])
    a.set("Arm45", "r", [(0, 31), (56, 28), (112, 31)])
    a.set("Arm-45", "r", [(0, -31), (56, -28), (112, -31)])
    a.stat("Arm45", "s", (98, 96))
    a.stat("Arm-45", "s", (98, 96))
    a.stat("Arm0", "s", (100, 97))
    a.stat("Arm90", "s", (102, 97))
    a.gaze([(0, -0.2, -0.3), (48, -0.2, -0.3), (60, 0.2, -0.25), (100, 0.2, -0.25),
            (108, -0.2, -0.3), (112, -0.2, -0.3)])
    a.tr_stat("Pupil", "s", (110, 110))
    a.hl([(0, 112), (8, 126), (20, 130), (34, 112), (64, 126), (76, 130), (90, 112), (112, 112)])
    a.lid([(0, 0), (44, 0), (48, 100), (53, 0), (112, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (28, (98, 98)), (56, (100, 100)), (84, (98, 98)), (112, (100, 100))])


@state("celebrate", 120, loop=True, accents=("PulseRing", "Star1", "Star2"))
def celebrate(a):
    # One big joyful jump per loop: arms thrown wide in the air, ring-burst on landing.
    a.set("Root", "p", [(0, (256, 250)), (12, (256, 260)), (20, (256, 204)), (28, (256, 200)),
                        (36, (256, 208)), (46, (256, 256)), (58, (256, 244)), (68, (256, 252)),
                        (80, (256, 250)), (120, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (12, (108, 90)), (20, (88, 115)), (36, (96, 106)),
                        (46, (113, 87)), (58, (96, 106)), (68, (103, 97)), (84, (100, 100)),
                        (120, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (12, 42), (20, 72), (40, 70), (52, 48), (70, 45), (120, 45)])
    a.set("Arm-45", "r", [(0, -45), (12, -42), (20, -72), (40, -70), (52, -48), (70, -45), (120, -45)])
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (12, (100, 92)), (20, (100, 118)), (44, (100, 115)),
                         (58, (100, 100)), (120, (100, 100))])
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (12, (100, 92)), (22, (100, 112)), (44, (100, 108)),
                         (60, (100, 100)), (120, (100, 100))])
    a.set("PulseRing", "o", [(0, 0), (38, 0), (44, 55), (60, 0), (120, 0)])
    a.set("PulseRing", "s", [(0, (100, 100)), (38, (100, 100)), (60, (168, 168)), (72, (100, 100)),
                             (120, (100, 100))])
    # confetti stars fling out of the landing, spinning, and fade at their apex
    a.set("Star1", "p", [(0, (256, 240)), (40, (256, 240)), (72, (128, 112)), (120, (128, 112))])
    a.set("Star1", "o", [(0, 0), (40, 0), (46, 85), (74, 0), (120, 0)])
    a.set("Star1", "s", [(0, (40, 40)), (40, (40, 40)), (60, (135, 135)), (76, (90, 90)), (120, (40, 40))])
    a.set("Star1", "r", [(0, 0), (40, 0), (76, 240), (120, 240)])
    a.set("Star2", "p", [(0, (256, 240)), (40, (256, 240)), (72, (388, 100)), (120, (388, 100))])
    a.set("Star2", "o", [(0, 0), (42, 0), (48, 85), (76, 0), (120, 0)])
    a.set("Star2", "s", [(0, (40, 40)), (42, (40, 40)), (62, (120, 120)), (78, (80, 80)), (120, (40, 40))])
    a.set("Star2", "r", [(0, 0), (42, 0), (78, -220), (120, -220)])
    a.lid([(0, 0), (14, 0), (20, 60), (42, 60), (48, 0), (74, 0), (77, 100), (80, 0), (120, 0)])
    a.gaze([(0, 0, 0), (10, 0, 0.3), (18, 0, -0.2), (42, 0, -0.2), (52, 0, 0), (120, 0, 0)])
    a.pupil([(0, 100), (46, 100), (50, 115), (66, 100), (120, 100)])
    a.hl([(0, 100), (20, 130), (44, 110), (60, 100), (120, 100)])
    a.set("Shadow", "s", [(0, (102, 102)), (12, (106, 106)), (20, (70, 70)), (36, (66, 66)),
                          (46, (116, 116)), (58, (96, 96)), (68, (104, 104)), (84, (100, 100)),
                          (120, (102, 102))])
    a.set("Shadow", "o", [(0, 19), (20, 10), (36, 9), (46, 24), (68, 20), (84, 18), (120, 19)])


# ===========================================================================
# ICONS & GESTURES
# ===========================================================================

@state("icon-clock", 192, loop=True, accents=("PulseRing",))
def icon_clock(a):
    # Diagonals fold away; Arm0 sweeps a full minute-hand turn while Arm90 creeps as the
    # hour hand; the PulseRing becomes the clock bezel; eye sleeps until the seam.
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (14, (0, 0)), (164, (0, 0)), (178, (100, 100)), (192, (100, 100))])
    a.set("Arm0", "s", [(0, (100, 100)), (14, (15, 72)), (164, (15, 72)), (178, (100, 100)), (192, (100, 100))])
    a.set("Arm0", "r", [(0, 0), (14, 0), (50, 90), (86, 180), (122, 270), (158, 360), (192, 360)])
    a.set("Arm90", "s", [(0, (100, 100)), (14, (15, 52)), (164, (15, 52)), (178, (100, 100)), (192, (100, 100))])
    a.set("Arm90", "r", [(0, 90), (14, 90), (158, 120), (178, 90), (192, 90)])
    a.set("PulseRing", "o", [(0, 0), (14, 0), (24, 45), (152, 45), (166, 0), (192, 0)])
    a.set("PulseRing", "s", [(0, (92, 92)), (14, (92, 92)), (24, (100, 100)), (152, (100, 100)),
                             (166, (92, 92)), (192, (92, 92))])
    a.lid([(0, 0), (8, 0), (14, 100), (160, 100), (168, 0), (192, 0)])
    a.gaze([(0, 0, 0), (160, 0, 0), (174, 0.5, -0.1), (182, 0.5, -0.1), (188, 0, 0), (192, 0, 0)])
    a.set("Root", "r", [(0, 0), (14, 0), (26, 1.2), (50, -1.2), (74, 1.2), (98, -1.2), (122, 1.2),
                        (146, -1.2), (160, 0), (192, 0)])
    a.set("Face", "s", [(0, (100, 100)), (90, (101, 99)), (192, (100, 100))])


@state("icon-check", 84, loop=False, accents=("Star1",))
def icon_check(a):
    # Two arms swing into a big checkmark (vertex peeking below the box), a proud pop,
    # then the eye returns with a happy glance at its own work.
    a.set("Arm45", "r", [(0, 45), (8, 45), (18, 38), (62, 38), (74, 45), (84, 45)])
    a.set("Arm45", "s", [(0, (100, 100)), (8, (100, 94)), (18, (92, 72)), (62, (92, 72)),
                         (74, (100, 100)), (84, (100, 100))])
    a.set("Arm45", "p", [(0, (256, 250)), (8, (256, 250)), (18, (308, 214)), (62, (308, 214)),
                         (74, (256, 250)), (84, (256, 250))])
    a.set("Arm-45", "r", [(0, -45), (8, -45), (18, -42), (62, -42), (74, -45), (84, -45)])
    a.set("Arm-45", "s", [(0, (100, 100)), (8, (100, 94)), (18, (92, 40)), (62, (92, 40)),
                          (74, (100, 100)), (84, (100, 100))])
    a.set("Arm-45", "p", [(0, (256, 250)), (8, (256, 250)), (18, (194, 261)), (62, (194, 261)),
                          (74, (256, 250)), (84, (256, 250))])
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (8, (100, 94)), (16, (0, 0)), (64, (0, 0)),
                         (76, (100, 100)), (84, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (8, (256, 254)), (18, (256, 247)), (24, (256, 243)),
                        (32, (256, 251)), (40, (256, 250)), (84, (256, 250))])
    a.set("Root", "r", [(0, 0), (18, 3), (62, 3), (74, 0), (84, 0)])
    a.set("Face", "s", [(0, (100, 100)), (8, (104, 95)), (18, (96, 106)), (30, (102, 98)),
                        (40, (100, 100)), (84, (100, 100))])
    a.lid([(0, 0), (6, 0), (12, 100), (58, 100), (64, 0), (84, 0)])
    a.gaze([(0, 0, 0), (58, 0, 0), (66, 0.35, -0.35), (74, 0.35, -0.35), (80, 0, 0), (84, 0, 0)])
    a.pupil([(0, 100), (62, 100), (66, 116), (78, 100), (84, 100)])
    a.hl([(0, 100), (62, 100), (66, 128), (80, 100), (84, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (8, (103, 103)), (24, (92, 92)), (40, (100, 100)), (84, (100, 100))])
    # sparkle at the check's tip the moment it lands
    a.stat("Star1", "p", (382, 112))
    a.set("Star1", "o", [(0, 0), (20, 0), (26, 90), (46, 90), (56, 0), (84, 0)])
    a.set("Star1", "s", [(0, (20, 20)), (20, (20, 20)), (30, (130, 130)), (40, (100, 100)),
                         (50, (115, 115)), (60, (20, 20)), (84, (20, 20))])
    a.set("Star1", "r", [(0, 0), (20, 0), (56, 120), (84, 120)])


@state("icon-cross", 66, loop=False)
def icon_cross(a):
    # A hard SNAP into a clean X — impact shake, a firm hold, then a composed return.
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (6, (100, 95)), (11, (0, 0)), (46, (0, 0)),
                         (52, (104, 104)), (58, (100, 100)), (66, (100, 100))])
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (6, (100, 95)), (11, (116, 124)), (16, (110, 117)),
                         (32, (110, 117)), (36, (112, 120)), (42, (110, 117)), (56, (100, 100)),
                         (66, (100, 100))])
    a.set("Root", "r", [(0, 0), (6, 0), (11, -2.5), (15, 2), (19, -1), (23, 0), (66, 0)])
    a.set("Root", "p", [(0, (256, 250)), (6, (256, 253)), (11, (256, 247)), (17, (256, 251)),
                        (23, (256, 250)), (66, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (6, (103, 96)), (11, (95, 106)), (18, (101, 99)),
                        (26, (100, 100)), (66, (100, 100))])
    a.lid([(0, 0), (4, 0), (9, 100), (44, 100), (50, 0), (66, 0)])
    a.gaze([(0, 0, 0), (44, 0, 0), (52, 0, 0.15), (58, 0, 0.15), (64, 0, 0), (66, 0, 0)])
    a.pupil([(0, 100), (48, 100), (52, 94), (62, 100), (66, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (11, (104, 104)), (20, (100, 100)), (66, (100, 100))])


@state("icon-arrow", 144, loop=True)
def icon_arrow(a):
    # Shaft + chevron form a right-pointing arrow that nudges "go, go, go";
    # the eye reopens and stares hard right along the arrow (highlight fully tracking).
    a.set("Arm0", "s", [(0, (100, 100)), (14, (0, 0)), (126, (0, 0)), (138, (100, 100)), (144, (100, 100))])
    a.set("Arm90", "s", [(0, (100, 100)), (14, (52, 80)), (126, (52, 80)), (138, (100, 100)), (144, (100, 100))])
    a.set("Arm45", "s", [(0, (100, 100)), (14, (52, 30)), (126, (52, 30)), (138, (100, 100)), (144, (100, 100))])
    a.set("Arm45", "p", [(0, (256, 250)), (14, (352, 286)), (126, (352, 286)), (138, (256, 250)), (144, (256, 250))])
    a.set("Arm-45", "s", [(0, (100, 100)), (14, (52, 30)), (126, (52, 30)), (138, (100, 100)), (144, (100, 100))])
    a.set("Arm-45", "p", [(0, (256, 250)), (14, (352, 214)), (126, (352, 214)), (138, (256, 250)), (144, (256, 250))])
    a.set("Root", "p", [(0, (256, 250)), (14, (256, 250)), (28, (265, 250)), (40, (257, 250)),
                        (56, (265, 250)), (68, (257, 250)), (84, (265, 250)), (98, (256, 250)),
                        (144, (256, 250))])
    a.set("Root", "r", [(0, 0), (14, 0), (28, 2), (40, 0), (56, 2), (68, 0), (84, 2), (98, 0), (144, 0)])
    a.lid([(0, 0), (6, 0), (12, 100), (20, 100), (26, 0), (144, 0)])
    a.gaze([(0, 0, 0), (12, 0, 0), (26, 0, 0), (34, 0.7, 0), (102, 0.7, 0), (120, 0.3, 0),
            (134, 0, 0), (144, 0, 0)])
    a.set("Face", "s", [(0, (100, 100)), (28, (102, 98.5)), (40, (100, 100)), (56, (102, 98.5)),
                        (68, (100, 100)), (84, (102, 98.5)), (98, (100, 100)), (144, (100, 100))])


@state("icon-loading", 120, loop=True)
def icon_loading(a):
    # The arm cluster compacts and spins one full mechanical turn; the eye stays calm.
    for arm, base in (("Arm0", 0), ("Arm90", 90), ("Arm45", 45), ("Arm-45", -45)):
        a.set(arm, "s", [(0, (100, 100)), (12, (58, 52)), (104, (58, 52)), (116, (100, 100)), (120, (100, 100))])
        a.set(arm, "r", [(0, base), (12, base), (35, base + 90), (58, base + 180), (81, base + 270),
                         (104, base + 360), (120, base + 360)])
    a.set("Face", "s", [(0, (100, 100)), (60, (101, 98.8)), (120, (100, 100))])
    a.gaze([(0, 0, 0), (36, 0, 0), (44, 0.12, 0.08), (78, 0.12, 0.08), (92, 0, 0), (120, 0, 0)])
    a.lid([(0, 0), (62, 0), (66, 100), (70, 0), (120, 0)])


@state("icon-star", 144, loop=True)
def icon_star(a):
    # All four arms thin into an eight-point star that twinkles (alternating ray lengths)
    # and sways; the eye returns after the morph and admires the sparkle.
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (12, (55, 108)), (40, (55, 86)), (68, (55, 108)),
                         (96, (55, 86)), (124, (55, 108)), (140, (100, 100)), (144, (100, 100))])
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (12, (55, 86)), (40, (55, 108)), (68, (55, 86)),
                         (96, (55, 108)), (124, (55, 86)), (140, (100, 100)), (144, (100, 100))])
    for arm, base in (("Arm0", 0), ("Arm90", 90), ("Arm45", 45), ("Arm-45", -45)):
        a.set(arm, "r", [(0, base), (12, base), (68, base + 22), (124, base), (144, base)])
    a.hl([(0, 100), (26, 135), (40, 105), (54, 135), (68, 105), (82, 135), (96, 105),
          (110, 135), (124, 100), (144, 100)])
    a.tr_stat("Pupil", "s", (104, 104))
    a.lid([(0, 0), (4, 0), (10, 100), (16, 100), (22, 0), (144, 0)])
    a.gaze([(0, 0, 0), (22, 0, 0), (30, -0.4, -0.35), (60, -0.4, -0.35), (72, 0.45, -0.35),
            (104, 0.45, -0.35), (116, 0, 0), (144, 0, 0)])
    a.set("Face", "s", [(0, (100, 100)), (72, (99, 101)), (144, (100, 100))])


@state("icon-plus", 132, loop=True)
def icon_plus(a):
    # Diagonals fold away; the orthogonal pair becomes a bold plus that gently breathes.
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (12, (0, 0)), (118, (0, 0)), (130, (100, 100)), (132, (100, 100))])
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (12, (97, 86)), (44, (104, 92)), (76, (97, 86)),
                         (108, (104, 92)), (120, (97, 86)), (130, (100, 100)), (132, (100, 100))])
    a.set("Face", "s", [(0, (100, 100)), (44, (101.5, 98.5)), (76, (99, 101)), (108, (101.5, 98.5)),
                        (132, (100, 100))])
    a.set("Root", "r", [(0, 0), (44, 1.5), (108, -1.5), (132, 0)])
    a.lid([(0, 0), (4, 0), (10, 100), (16, 100), (22, 0), (68, 0), (71, 100), (74, 0), (132, 0)])
    a.gaze([(0, 0, 0), (22, 0, 0), (30, 0.2, -0.2), (62, 0.2, -0.2), (74, -0.25, -0.15),
            (102, -0.25, -0.15), (114, 0, 0), (132, 0, 0)])
    a.tr_stat("Pupil", "s", (102, 102))


@state("icon-heart", 108, loop=False, accents=("PulseRing",))
def icon_heart(a):
    # All four arms curve inward into a heart silhouette around the face; two warm pulses
    # with a soft ring, then a gentle unfold back to rest.
    def arm_morph(arm, r0, r1, p1, s1):
        a.set(arm, "r", [(0, r0), (16, r1), (56, r1), (62, r1), (88, r1), (102, r0), (108, r0)])
        a.set(arm, "p", [(0, (256, 250)), (16, p1), (88, p1), (102, (256, 250)), (108, (256, 250))])
        a.set(arm, "s", [(0, (100, 100)), (16, s1), (30, (s1[0] * 1.06, s1[1] * 1.06)),
                         (40, s1), (54, (s1[0] * 1.06, s1[1] * 1.06)), (64, s1),
                         (88, s1), (102, (100, 100)), (108, (100, 100))])
    arm_morph("Arm45", 45, 35, (296, 278), (90, 44))    # right V stroke
    arm_morph("Arm-45", -45, -35, (216, 278), (90, 44))  # left V stroke
    arm_morph("Arm0", 0, -30, (220, 194), (90, 38))      # left lobe
    arm_morph("Arm90", 90, 30, (292, 194), (90, 38))     # right lobe
    a.set("PulseRing", "o", [(0, 0), (26, 0), (32, 30), (44, 0), (50, 0), (56, 30), (70, 0), (108, 0)])
    a.set("PulseRing", "s", [(0, (100, 100)), (26, (100, 100)), (44, (120, 120)), (50, (100, 100)),
                             (70, (120, 120)), (84, (100, 100)), (108, (100, 100))])
    a.set("Face", "s", [(0, (100, 100)), (16, (100, 100)), (30, (103, 97)), (40, (100, 100)),
                        (54, (103, 97)), (66, (100, 100)), (108, (100, 100))])
    a.set("Root", "r", [(0, 0), (30, 1.5), (66, -1.5), (90, 0), (108, 0)])
    a.lid([(0, 0), (4, 0), (12, 100), (24, 100), (30, 14), (84, 14), (92, 0), (108, 0)])
    a.gaze([(0, 0, 0), (24, 0, 0), (32, 0, -0.35), (78, 0, -0.35), (92, 0, -0.1), (100, 0, 0), (108, 0, 0)])
    a.pupil([(0, 100), (26, 100), (34, 112), (84, 112), (100, 100), (108, 100)])
    a.hl([(0, 100), (26, 100), (34, 124), (84, 124), (100, 100), (108, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (30, (98, 98)), (66, (100, 100)), (108, (100, 100))])


@state("gesture-wave", 120, loop=True)
def gesture_wave(a):
    # Arm45 raises and waves three times while the body leans in; eyes on the viewer.
    a.set("Arm45", "r", [(0, 45), (10, 52), (22, 76), (34, 50), (46, 76), (58, 50), (70, 76),
                         (82, 52), (94, 45), (120, 45)])
    a.set("Arm45", "s", [(0, (100, 100)), (10, (94, 116)), (88, (94, 116)), (104, (100, 100)), (120, (100, 100))])
    a.set("Arm-45", "r", [(0, -45), (14, -49), (82, -49), (100, -45), (120, -45)])
    a.set("Root", "r", [(0, 0), (14, 3), (82, 3), (100, 0), (120, 0)])
    a.set("Root", "p", [(0, (256, 250)), (14, (259, 250)), (82, (259, 250)), (100, (256, 250)), (120, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (10, (99, 101.5)), (22, (101, 99)), (34, (99, 101.5)),
                        (46, (101, 99)), (58, (99, 101.5)), (70, (101, 99)), (88, (100, 100)),
                        (120, (100, 100))])
    a.gaze([(0, 0, 0), (8, 0.15, -0.25), (84, 0.15, -0.25), (96, 0, 0), (120, 0, 0)])
    a.tr_stat("Pupil", "s", (106, 106))
    a.lid([(0, 0), (60, 0), (63, 100), (66, 0), (120, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (14, (97, 97)), (82, (97, 97)), (100, (100, 100)), (120, (100, 100))])


@state("gesture-point", 96, loop=False)
def gesture_point(a):
    # The eye leads: it darts up-right FIRST, then the arm extends to point; the gaze
    # lingers on the target and returns last — textbook staging.
    a.gaze([(0, 0, 0), (8, 0.8, -0.5), (78, 0.8, -0.5), (90, 0, 0), (96, 0, 0)])
    a.set("Arm45", "s", [(0, (100, 100)), (10, (100, 96)), (22, (88, 132)), (26, (88, 138)),
                         (30, (88, 132)), (66, (88, 132)), (82, (100, 100)), (96, (100, 100))])
    a.set("Arm45", "p", [(0, (256, 250)), (10, (256, 250)), (22, (274, 234)), (26, (279, 229)),
                         (30, (276, 232)), (66, (276, 232)), (82, (256, 250)), (96, (256, 250))])
    a.set("Arm45", "r", [(0, 45), (10, 45), (22, 40), (66, 40), (78, 47), (86, 45), (96, 45)])
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (10, (100, 96)), (22, (100, 90)), (66, (100, 90)),
                         (82, (100, 100)), (96, (100, 100))])
    a.set("Arm-45", "r", [(0, -45), (10, -45), (22, -52), (66, -52), (82, -45), (96, -45)])
    a.set("Root", "r", [(0, 0), (10, -2), (22, 4), (66, 4), (84, 0), (96, 0)])
    a.set("Root", "p", [(0, (256, 250)), (10, (256, 254)), (22, (263, 249)), (66, (263, 249)),
                        (84, (256, 250)), (96, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (10, (102, 97)), (20, (97, 104)), (30, (100, 100)), (96, (100, 100))])
    a.pupil([(0, 100), (22, 108), (68, 108), (86, 100), (96, 100)])
    a.hl([(0, 100), (22, 115), (68, 115), (86, 100), (96, 100)])
    a.lid([(0, 0), (82, 0), (85, 100), (88, 0), (96, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (10, (102, 102)), (22, (98, 98)), (70, (98, 98)),
                          (88, (100, 100)), (96, (100, 100))])


# ===========================================================================
# MOTION / PERSONALITY
# ===========================================================================

@state("nod-yes", 96, loop=True)
def nod_yes(a):
    # Two nods (first bigger), squash-led, then a beat of warm eye contact.
    a.set("Root", "p", [(0, (256, 250)), (10, (256, 244)), (20, (256, 262)), (30, (256, 246)),
                        (40, (256, 258)), (50, (256, 248)), (58, (256, 250)), (96, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (10, (98, 103)), (20, (104, 95.5)), (30, (98.5, 102)),
                        (40, (103, 96.5)), (50, (99, 101)), (58, (100, 100)), (96, (100, 100))])
    a.gaze([(0, 0, 0), (10, 0, -0.3), (20, 0, 0.5), (30, 0, -0.2), (40, 0, 0.4), (50, 0, 0), (96, 0, 0)])
    a.pupil([(0, 100), (16, 104), (56, 104), (70, 100), (96, 100)])
    a.lid([(0, 0), (66, 0), (69, 100), (72, 0), (96, 0)])
    a.set("Arm0", "s", [(0, (100, 100)), (14, (100, 97)), (22, (100, 103)), (32, (100, 98)),
                        (42, (100, 102)), (52, (100, 99)), (60, (100, 100)), (96, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (14, 43), (24, 47), (34, 43.5), (44, 46), (54, 45), (96, 45)])
    a.set("Arm-45", "r", [(0, -45), (14, -43), (24, -47), (34, -43.5), (44, -46), (54, -45), (96, -45)])
    a.set("Shadow", "s", [(0, (100, 100)), (20, (103, 103)), (30, (99, 99)), (40, (102, 102)),
                          (52, (100, 100)), (96, (100, 100))])


@state("shake-no", 108, loop=True)
def shake_no(a):
    # Three diminishing head-shakes; the gaze counter-rotates to stay locked on the viewer,
    # arms drag behind the body with follow-through.
    a.set("Root", "r", [(0, 0), (10, -8), (22, 8), (34, -6), (46, 5), (56, -2.5), (64, 0), (108, 0)])
    a.gaze([(0, 0, 0), (10, 0.35, 0), (22, -0.35, 0), (34, 0.28, 0), (46, -0.22, 0),
            (56, 0.1, 0), (64, 0, 0), (108, 0, 0)])
    a.set("Arm45", "r", [(0, 45), (13, 41), (25, 49), (37, 42), (49, 47.5), (59, 44), (68, 45), (108, 45)])
    a.set("Arm-45", "r", [(0, -45), (13, -49), (25, -41), (37, -48), (49, -42.5), (59, -46), (68, -45), (108, -45)])
    a.set("Arm0", "r", [(0, 0), (13, -2.5), (25, 2.5), (37, -2), (49, 1.5), (62, 0), (108, 0)])
    a.set("Face", "s", [(0, (100, 100)), (8, (101.5, 98.5)), (56, (101.5, 98.5)), (66, (100, 100)),
                        (108, (100, 100))])
    a.lid([(0, 0), (78, 0), (81, 100), (84, 0), (108, 0)])
    a.pupil([(0, 100), (10, 96), (58, 96), (68, 100), (108, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (10, (102, 102)), (22, (102, 102)), (64, (100, 100)),
                          (108, (100, 100))])


@state("bounce", 72, loop=True)
def bounce(a):
    # One clean metronomic bounce cycle — pure weight, zen expression, arms lagging.
    a.set("Root", "p", [(0, (256, 250)), (10, (256, 260)), (16, (256, 236)), (28, (256, 212)),
                        (40, (256, 240)), (46, (256, 258)), (58, (256, 248)), (72, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (10, (108, 90)), (16, (92, 111)), (28, (97, 104)),
                        (40, (94, 108)), (46, (111, 88)), (58, (98, 102)), (72, (100, 100))])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (12, (100, 95)), (20, (100, 106)), (46, (100, 94)),
                         (56, (100, 103)), (72, (100, 100))])
    a.gaze([(0, 0, 0), (10, 0, 0.35), (18, 0, -0.3), (30, 0, -0.1), (44, 0, 0.4),
            (54, 0, -0.1), (64, 0, 0), (72, 0, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (10, (106, 106)), (28, (74, 74)), (46, (112, 112)),
                          (58, (100, 100)), (72, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (10, 21), (28, 11), (46, 23), (58, 18), (72, 18)])


@state("spin", 108, loop=True)
def spin(a):
    # Wind-up the opposite way, one full 360 with centrifugal arm fling, overshoot the
    # stop, wobble the gaze back to steady — then a beat of rest.
    a.set("Root", "r", [(0, 0), (14, -14), (24, 96), (32, 206), (40, 306), (46, 346),
                        (52, 366), (60, 360), (108, 360)])
    a.set("Root", "p", [(0, (256, 250)), (14, (256, 248)), (30, (256, 238)), (46, (256, 252)),
                        (56, (256, 249)), (64, (256, 250)), (108, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (14, (104, 96)), (30, (96, 105)), (52, (96, 105)),
                        (60, (104, 97)), (70, (100, 100)), (108, (100, 100))])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (12, (98, 94)), (20, (96, 108)), (46, (96, 108)),
                         (58, (101, 102)), (66, (100, 100)), (108, (100, 100))])
    a.lid([(0, 0), (10, 0), (14, 100), (46, 100), (52, 0), (84, 0), (87, 100), (90, 0), (108, 0)])
    a.gaze([(0, 0, 0), (8, -0.6, 0), (14, -0.6, 0), (46, -0.6, 0), (52, 0.3, 0),
            (58, -0.25, 0.1), (64, 0.12, 0), (72, 0, 0), (108, 0, 0)])
    a.pupil([(0, 100), (50, 100), (54, 112), (74, 100), (108, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (14, (98, 98)), (30, (88, 88)), (46, (104, 104)),
                          (60, (100, 100)), (108, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (30, 14), (46, 20), (60, 18), (108, 18)])


@state("wobble", 104, loop=True)
def wobble(a):
    # Side-to-side jelly: rotation sways, the squash flips at the extremes, arms and
    # gaze pendulum behind with a 4-frame lag.
    a.set("Root", "r", [(0, 0), (13, 6), (39, -6), (65, 6), (91, -6), (104, 0)])
    a.set("Root", "p", [(0, (256, 250)), (13, (259, 251)), (39, (253, 251)), (65, (259, 251)),
                        (91, (253, 251)), (104, (256, 250))])
    a.set("Face", "s", [(0, (98, 102.5)), (13, (103, 97)), (26, (98, 102.5)), (39, (103, 97)),
                        (52, (98, 102.5)), (65, (103, 97)), (78, (98, 102.5)), (91, (103, 97)),
                        (104, (98, 102.5))])
    a.set("Arm45", "r", [(0, 45), (17, 48.5), (43, 41.5), (69, 48.5), (95, 41.5), (104, 45)])
    a.set("Arm-45", "r", [(0, -45), (17, -41.5), (43, -48.5), (69, -41.5), (95, -48.5), (104, -45)])
    a.gaze([(0, 0, 0), (13, -0.4, 0.05), (39, 0.4, 0.05), (65, -0.4, 0.05), (91, 0.4, 0.05), (104, 0, 0)])
    a.tr_stat("Pupil", "s", (102, 102))
    a.lid([(0, 0), (50, 0), (53, 100), (56, 0), (104, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (13, (103, 103)), (26, (100, 100)), (39, (103, 103)),
                          (52, (100, 100)), (65, (103, 103)), (78, (100, 100)), (91, (103, 103)),
                          (104, (100, 100))])


@state("stretch", 120, loop=False)
def stretch(a):
    # A big yawn-stretch: deep squash, rise tall-and-wide with a muscle tremble at the
    # peak, flop back with overshoot, contented settle.
    a.set("Face", "s", [(0, (100, 100)), (18, (107, 90)), (40, (93, 113)),
                        (44, (93, 113)), (47, (93.7, 112.3)), (50, (92.5, 113.7)), (53, (93.7, 112.3)),
                        (56, (92.5, 113.7)), (60, (93, 113)),
                        (74, (106, 94)), (86, (98, 102)), (96, (100, 100)), (120, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (18, (256, 259)), (40, (256, 234)), (60, (256, 233)),
                        (74, (256, 254)), (88, (256, 249)), (98, (256, 250)), (120, (256, 250))])
    a.set("Root", "r", [(0, 0), (18, -1), (40, 2.5), (60, 3), (78, 0), (120, 0)])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (18, (98, 92)), (40, (95, 116)), (60, (95, 117)),
                         (76, (101, 103)), (86, (100, 100)), (120, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (18, 43), (40, 55), (60, 56), (80, 45), (120, 45)])
    a.set("Arm-45", "r", [(0, -45), (18, -43), (40, -55), (60, -56), (80, -45), (120, -45)])
    a.lid([(0, 0), (14, 40), (26, 100), (66, 100), (74, 30), (80, 0), (98, 0), (103, 35),
           (110, 0), (120, 0)])
    a.gaze([(0, 0, 0), (12, 0, 0.3), (70, 0, 0.3), (82, 0.2, 0.1), (96, 0.2, 0.1),
            (108, 0, 0), (120, 0, 0)])
    a.pupil([(0, 100), (14, 95), (78, 95), (96, 100), (120, 100)])
    a.hl([(0, 100), (80, 100), (92, 118), (110, 100), (120, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (18, (104, 104)), (40, (93, 93)), (60, (92, 92)),
                          (74, (104, 104)), (96, (100, 100)), (120, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (18, 20), (40, 15), (74, 20), (96, 18), (120, 18)])


@state("peek", 168, loop=True)
def peek(a):
    # Ducks down small behind its own arm cluster, one wary half-lid peek left then right,
    # then pops back up with an overshoot and a relieved blink.
    a.set("Face", "s", [(0, (100, 100)), (14, (66, 62)), (44, (66, 62)), (56, (76, 74)),
                        (84, (76, 74)), (92, (104, 105)), (100, (100, 100)),
                        (128, (100.8, 99.2)), (156, (100, 100)), (168, (100, 100))])
    a.set("Face", "p", [(0, (256, 250)), (14, (256, 284)), (30, (256, 286)), (44, (256, 284)),
                        (56, (250, 270)), (84, (250, 270)), (92, (256, 248)), (100, (256, 250)),
                        (168, (256, 250))])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (14, (118, 102)), (86, (118, 102)), (96, (100, 100)),
                         (168, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (14, 38), (86, 38), (96, 45), (168, 45)])
    a.set("Arm-45", "r", [(0, -45), (14, -38), (86, -38), (96, -45), (168, -45)])
    a.lid([(0, 0), (10, 100), (44, 100), (52, 45), (84, 45), (92, 0), (102, 0), (105, 100),
           (108, 0), (168, 0)])
    a.gaze([(0, 0, 0), (10, 0, 0.3), (44, 0, 0.3), (52, -0.85, -0.2), (62, -0.85, -0.2),
            (68, 0.75, -0.15), (82, 0.75, -0.15), (92, 0, 0), (128, 0, 0), (136, 0.3, 0),
            (148, 0.3, 0), (156, 0, 0), (168, 0, 0)])
    a.pupil([(0, 100), (48, 92), (84, 92), (94, 108), (110, 100), (168, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (14, (92, 92)), (86, (92, 92)), (94, (104, 104)),
                          (102, (100, 100)), (168, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (14, 15), (86, 15), (94, 20), (102, 18), (168, 18)])


@state("float", 192, loop=True)
def float_(a):
    # Weightless hover: two uneven rises, slow drifting gaze (no saccades), arms swaying
    # on staggered phases, the shadow breathing inversely with altitude.
    a.set("Root", "p", [(0, (256, 242)), (48, (256, 230)), (96, (256, 243)), (144, (256, 229)),
                        (192, (256, 242))])
    a.set("Root", "r", [(0, -2), (96, 2.5), (192, -2)])
    a.set("Arm0", "s", [(t, (100, v)) for t, v in sine(103, 3, 96, 0, 192, phase=0, step=24)])
    a.set("Arm90", "s", [(t, (100, v)) for t, v in sine(103, 3, 96, 0, 192, phase=math.pi / 2, step=24)])
    a.set("Arm45", "r", [(t, v) for t, v in sine(45, 4, 96, 0, 192, phase=math.pi, step=24)])
    a.set("Arm-45", "r", [(t, v) for t, v in sine(-45, 4, 96, 0, 192, phase=0, step=24)])
    a.gaze([(0, 0.35, -0.25), (48, -0.1, -0.4), (96, -0.4, 0.1), (144, 0.1, 0.25), (192, 0.35, -0.25)])
    a.tr_stat("Pupil", "s", (103, 103))
    a.lid([(0, 0), (100, 0), (106, 100), (114, 0), (192, 0)])
    a.set("Face", "s", [(0, (100, 100)), (48, (101, 99)), (96, (100, 100)), (144, (101, 99)),
                        (192, (100, 100))])
    a.set("Shadow", "s", [(0, (86, 86)), (48, (80, 80)), (96, (87, 87)), (144, (79, 79)), (192, (86, 86))])
    a.set("Shadow", "o", [(0, 13), (48, 11), (96, 13), (144, 11), (192, 13)])


@state("dizzy", 132, loop=True, accents=("Star1", "Star2"))
def dizzy(a):
    # Woozy circles: the body sways in an orbit while the eye ROLLS a continuous loop,
    # and two big yellow stars circle the head in counter-phase, spinning as they go.
    cyc = 44
    root_p, root_r, gaze_k, face_s = [], [], [], []
    s1_p, s2_p = [], []
    for t in range(0, 133, 11):
        th = 2 * math.pi * t / cyc
        root_p.append((t, (256 + 8 * math.sin(th), 250 + 5 * math.cos(th))))
        root_r.append((t, 5 * math.cos(th)))
        gaze_k.append((t, 0.8 * math.sin(th + math.pi), 0.8 * math.cos(th + math.pi)))
        face_s.append((t, (100 + 1.5 * math.sin(th), 100 - 1.5 * math.sin(th))))
        orbit = 2 * math.pi * t / 132  # one revolution per loop, stately
        s1_p.append((t, (256 + 96 * math.sin(orbit), 116 + 26 * math.cos(orbit))))
        s2_p.append((t, (256 - 96 * math.sin(orbit), 116 - 26 * math.cos(orbit))))
    a.set("Root", "p", root_p)
    a.set("Root", "r", root_r)
    a.gaze(gaze_k)
    a.set("Face", "s", face_s)
    a.tr_stat("Pupil", "s", (90, 90))
    a.lid([(0, 38), (66, 46), (132, 38)])
    for star, path, spin in (("Star1", s1_p, 360), ("Star2", s2_p, -360)):
        a.set(star, "p", path)
        a.set(star, "o", [(0, 0), (10, 95), (120, 95), (132, 0)])
        a.set(star, "r", [(0, 0), (132, spin)])
        a.stat(star, "s", (105, 105))
    a.set("Arm45", "r", [(t, v) for t, v in sine(45, 3.5, cyc, 0, 132, phase=math.pi / 3, step=11)])
    a.set("Arm-45", "r", [(t, v) for t, v in sine(-45, 3.5, cyc, 0, 132, phase=-math.pi / 3, step=11)])
    a.set("Shadow", "s", [(t, (v, v)) for t, v in sine(100, 3, cyc, 0, 132, phase=0, step=11)])

@state("jump", 104, loop=False)
def jump(a):
    # THE weight showcase: eye leads up, deep crouch, explosive stretch launch, hang time,
    # accelerating fall, heavy squash impact (shadow spreads), rebound, settle.
    a.gaze([(0, 0, 0), (6, 0, 0.3), (12, 0, 0.3), (17, 0, -0.6), (30, 0, -0.5),
            (42, 0, 0.35), (56, 0, 0.2), (64, 0, 0), (104, 0, 0)])
    a.set("Root", "p", [(0, (256, 250)), (6, (256, 252)), (20, (256, 264)), (27, (256, 192)),
                        (36, (256, 186)), (44, (256, 204)), (54, (256, 252)), (58, (256, 262)),
                        (70, (256, 246)), (80, (256, 252)), (90, (256, 250)), (104, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (6, (102, 98)), (20, (110, 86)), (27, (87, 118)),
                        (36, (97, 104)), (52, (94, 110)), (58, (115, 84)), (70, (96, 107)),
                        (80, (102, 98)), (90, (100, 100)), (104, (100, 100))])
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (20, (102, 88)), (30, (98, 108)), (44, (98, 106)),
                         (58, (103, 94)), (72, (99, 102)), (84, (100, 100)), (104, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (20, 42), (34, 54), (52, 50), (58, 58), (72, 47), (84, 45), (104, 45)])
    a.set("Arm-45", "r", [(0, -45), (20, -42), (34, -54), (52, -50), (58, -58), (72, -47), (84, -45), (104, -45)])
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (20, (102, 88)), (30, (98, 106)), (58, (103, 94)),
                         (72, (99, 102)), (84, (100, 100)), (104, (100, 100))])
    a.lid([(0, 0), (54, 0), (58, 55), (66, 0), (86, 0), (89, 100), (92, 0), (104, 0)])
    a.pupil([(0, 100), (17, 106), (36, 106), (58, 92), (72, 100), (104, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (20, (105, 105)), (27, (60, 60)), (36, (56, 56)),
                          (48, (78, 78)), (58, (118, 118)), (70, (98, 98)), (84, (100, 100)),
                          (104, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (20, 21), (36, 9), (58, 26), (70, 17), (84, 18), (104, 18)])


# ===========================================================================
# WAVE 2 — activities, entrances, motion, dance, loading, extra emotions
# (spliced into generate_mascot_animations.py before main())
# ===========================================================================

@state("idle", 540, loop=True)
def idle_v4(a):
    # Nine seconds of quiet life with NO short-cycle repetition: an irregular hover,
    # uneven breaths, a slow drifting gaze with exactly one curious glance, blinks at
    # natural (non-metric) times, and one tiny arm stretch two-thirds through.
    a.set("Root", "p", [(0, (256, 248)), (90, (256, 244)), (200, (256, 247)), (300, (256, 243.5)),
                        (420, (256, 246.5)), (540, (256, 248))])
    a.set("Root", "r", [(0, 0), (110, 1), (250, -0.7), (400, 0.5), (540, 0)])
    a.set("Face", "s", [(0, (100, 100)), (70, (100.9, 99.1)), (150, (100, 100)), (240, (100.6, 99.4)),
                        (330, (100, 100)), (430, (101, 99)), (540, (100, 100))])
    a.set("Arm0", "s", [(t, (100, v)) for t, v in sine(100.5, 1.5, 135, 0, 540, phase=0, step=45)])
    a.set("Arm45", "r", [(t, v) for t, v in sine(45, 1.2, 135, 0, 540, phase=math.pi, step=45)])
    a.set("Arm-45", "r", [(t, v) for t, v in sine(-45, 1.2, 135, 0, 540, phase=0, step=45)])
    a.set("Arm90", "s", [(0, (100, 100)), (370, (100, 100)), (390, (100, 103.5)), (412, (100, 100)),
                         (540, (100, 100))])
    a.gaze([(0, 0.1, 0.05), (70, -0.1, 0.1), (150, -0.14, -0.06), (230, 0.02, -0.1),
            (252, 0.02, -0.1), (258, 0.42, -0.12), (300, 0.42, -0.12), (308, 0.05, -0.05),
            (390, 0.14, 0.04), (470, -0.06, 0.1), (540, 0.1, 0.05)])
    a.lid([(0, 0), (128, 0), (131, 100), (134, 0), (348, 0), (351, 100), (354, 0),
           (466, 0), (469, 100), (472, 0), (476, 100), (479, 0), (540, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (90, (97, 97)), (200, (99, 99)), (300, (96.5, 96.5)),
                          (420, (99, 99)), (540, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (90, 16), (300, 15.5), (420, 17), (540, 18)])

# ---------------------------------------------------------------------------
# ACTIVITIES
# ---------------------------------------------------------------------------

@state("writing", 168, loop=True)
def writing(a):
    # Head bowed to the page; the pen-arm scribbles in bursts while the eye writes
    # lines left-to-right with carriage returns, pausing mid-loop to think.
    a.stat("Root", "r", 4)
    a.set("Root", "p", [(0, (256, 252)), (84, (256, 254)), (168, (256, 252))])
    a.stat("Arm-45", "s", (92, 112))
    a.stat("Arm-45", "p", (252, 252))
    jig = [(0, -45)]
    for i, t in enumerate(range(8, 57, 5)):
        jig.append((t, -45 + (3.5 if i % 2 == 0 else -3.5)))
    jig += [(60, -45), (86, -45)]
    for i, t in enumerate(range(90, 149, 5)):
        jig.append((t, -45 + (3.5 if i % 2 == 0 else -3.5)))
    jig += [(152, -45), (168, -45)]
    a.set("Arm-45", "r", jig)
    a.stat("Arm45", "r", 52)
    a.stat("Arm0", "s", (100, 96))
    a.gaze([(0, -0.5, 0.55), (20, 0.4, 0.55), (24, -0.5, 0.6), (44, 0.4, 0.6), (48, -0.5, 0.65),
            (56, 0.1, 0.65), (64, 0.3, -0.45), (84, 0.3, -0.45), (92, -0.5, 0.55),
            (112, 0.4, 0.55), (116, -0.5, 0.6), (136, 0.4, 0.6), (140, -0.5, 0.65),
            (150, 0.1, 0.6), (160, -0.5, 0.55), (168, -0.5, 0.55)])
    a.lid([(0, 0), (72, 0), (75, 100), (78, 0), (168, 0)])
    a.set("Face", "s", [(0, (100, 100)), (64, (99, 101.5)), (88, (100, 100)), (168, (100, 100))])


@state("phone", 192, loop=True, accents=("Prop",))
def phone(a):
    # A real black phone (the Prop layer) held up-right beside the face; one short
    # raised arm "holds" it. Scroll-flick saccades, a wobble, and a chuckle at f118.
    a.stat("Prop", "o", 94)
    a.set("Prop", "r", [(0, 12), (60, 13.5), (120, 10.8), (192, 12)])
    a.set("Prop", "p", [(0, (338, 216)), (96, (338, 219)), (192, (338, 216))])
    a.stat("Prop", "s", (122, 122))
    a.stat("Arm45", "r", 28)
    a.stat("Arm45", "s", (105, 55))
    a.stat("Arm-45", "s", (100, 96))
    a.stat("Arm0", "s", (100, 97))
    a.stat("Arm90", "s", (100, 97))
    a.stat("Root", "r", 3)
    scroll = []
    for k in range(4):
        b = k * 44
        scroll += [(b, 0.75, -0.28), (b + 26, 0.75, -0.28), (b + 32, 0.75, 0.05), (b + 40, 0.75, -0.25)]
    scroll += [(180, 0.75, -0.28), (192, 0.75, -0.28)]
    a.gaze(scroll)
    a.pupil([(0, 100), (116, 100), (122, 112), (150, 104), (192, 100)])
    a.set("Face", "s", [(0, (100, 100)), (118, (100, 100)), (124, (103, 97.5)), (130, (99, 101)),
                        (138, (100, 100)), (192, (100, 100))])
    a.lid([(0, 0), (88, 0), (91, 100), (94, 0), (192, 0)])

@state("coding", 144, loop=True)
def coding(a):
    # Diagonals become two bracket-bars flanking the face; typing bob, code-scanning
    # saccades, an up-glance to think — then the build passes at f116.
    a.stat("Arm45", "r", 14)
    a.stat("Arm45", "p", (344, 250))
    a.stat("Arm-45", "r", -14)
    a.stat("Arm-45", "p", (168, 250))
    a.stat("Arm0", "s", (0, 0))
    a.stat("Arm90", "s", (0, 0))
    a.set("Arm45", "s", [(0, (52, 56)), (48, (52, 59)), (96, (52, 56)), (112, (52, 56)),
                         (118, (52, 62)), (126, (52, 56)), (144, (52, 56))])
    a.set("Arm-45", "s", [(0, (52, 56)), (24, (52, 59)), (72, (52, 56)), (112, (52, 56)),
                          (118, (52, 62)), (126, (52, 56)), (144, (52, 56))])
    a.set("Root", "p", [(t, (256, v)) for t, v in sine(250, 1.5, 16, 0, 144, phase=0, step=8)])
    a.gaze([(0, -0.6, 0.1), (10, 0.45, 0.1), (14, -0.6, 0.3), (26, 0.5, 0.3), (30, -0.6, 0.5),
            (42, 0.5, 0.5), (48, -0.55, 0.15), (58, 0.4, 0.15), (66, 0, -0.35), (82, 0, -0.35),
            (88, -0.6, 0.3), (100, 0.5, 0.3), (106, -0.6, 0.5), (114, 0.4, 0.5),
            (120, 0, -0.1), (132, 0, -0.1), (138, -0.6, 0.1), (144, -0.6, 0.1)])
    a.pupil([(0, 100), (114, 100), (120, 112), (134, 100), (144, 100)])
    a.hl([(0, 100), (114, 100), (120, 128), (136, 100), (144, 100)])
    a.lid([(0, 0), (98, 0), (101, 100), (104, 0), (144, 0)])


@state("searching", 156, loop=True)
def searching(a):
    # Active hunting: lean left and scan, swing right and scan, check up top. Big
    # bright pupil throughout — distinct from confused's tilt-and-wonder.
    a.set("Root", "p", [(0, (256, 250)), (18, (244, 251)), (58, (244, 251)), (76, (268, 251)),
                        (116, (268, 251)), (134, (256, 248)), (156, (256, 250))])
    a.set("Root", "r", [(0, 0), (18, -7), (58, -7), (76, 7), (116, 7), (134, 0), (156, 0)])
    a.gaze([(0, 0, 0), (18, -0.85, -0.1), (40, -0.75, 0.35), (58, -0.8, 0), (76, 0.85, -0.1),
            (98, 0.75, 0.35), (116, 0.8, 0), (128, 0, -0.6), (144, 0, -0.6), (152, 0, 0), (156, 0, 0)])
    a.tr_stat("Pupil", "s", (118, 118))
    a.hl([(0, 112), (78, 118), (156, 112)])
    a.lid([(0, 0), (66, 0), (69, 100), (72, 0), (156, 0)])
    a.set("Arm45", "r", [(0, 45), (22, 42), (76, 48), (134, 45), (156, 45)])
    a.set("Arm-45", "r", [(0, -45), (22, -48), (76, -42), (134, -45), (156, -45)])
    a.set("Shadow", "s", [(0, (100, 100)), (18, (97, 97)), (76, (97, 97)), (134, (100, 100)), (156, (100, 100))])


@state("juggling", 144, loop=True, accents=("StatusDot",))
def juggling(a):
    # A ball arcs left→right→left in real parabolas; the hands pump on toss and
    # catch, and the eye TRACKS the ball the whole way.
    xs = [180, 205, 230, 256, 282, 307, 332]
    path, gaze_k = [], []
    for i, x in enumerate(xs):                       # left -> right, t 0..72
        y = 60 + 0.04155 * (x - 256) ** 2
        path.append((i * 12, (x, y)))
    for i, x in enumerate(reversed(xs[:-1])):        # right -> left, t 84..144
        y = 60 + 0.04155 * (x - 256) ** 2
        path.append((84 + i * 12, (x, y)))
    for t, (x, y) in path:
        gaze_k.append((t, max(-1, min(1, (x - 256) / 110)), max(-1, min(1, (y - 250) / 160))))
    a.set("StatusDot", "p", path)
    a.set("StatusDot", "o", [(0, 0), (6, 95), (136, 95), (144, 0)])
    a.stat("StatusDot", "s", (220, 220))
    a.gaze(gaze_k)
    a.set("Arm-45", "s", [(0, (100, 100)), (5, (100, 110)), (12, (100, 100)), (130, (100, 100)),
                          (137, (100, 109)), (144, (100, 100))])
    a.set("Arm45", "s", [(0, (100, 100)), (66, (100, 100)), (73, (100, 110)), (80, (100, 100)),
                         (144, (100, 100))])
    a.set("Root", "p", [(0, (252, 250)), (36, (256, 249)), (72, (260, 250)), (108, (256, 249)),
                        (144, (252, 250))])
    a.set("Face", "s", [(0, (100, 100)), (36, (99, 101.5)), (72, (100, 100)), (108, (99, 101.5)),
                        (144, (100, 100))])


@state("presenting", 132, loop=True)
def presenting(a):
    # One arm extends to the side and sweeps over the content; gaze alternates
    # between the content and the viewer, with a blink on eye contact.
    a.set("Arm90", "s", [(0, (100, 100)), (12, (92, 124)), (108, (92, 124)), (124, (100, 100)),
                         (132, (100, 100))])
    a.set("Arm90", "p", [(0, (256, 250)), (12, (284, 246)), (108, (284, 246)), (124, (256, 250)),
                         (132, (256, 250))])
    a.set("Arm90", "r", [(0, 90), (12, 90), (36, 76), (58, 90), (84, 104), (108, 90), (132, 90)])
    a.set("Face", "s", [(0, (100, 100)), (12, (98, 103)), (108, (98, 103)), (124, (100, 100)),
                        (132, (100, 100))])
    a.set("Root", "r", [(0, 0), (14, -2), (106, -2), (122, 0), (132, 0)])
    a.gaze([(0, 0, 0), (12, 0.85, 0), (56, 0.85, 0), (64, 0, 0), (96, 0, 0),
            (104, 0.85, 0.1), (118, 0.85, 0.1), (126, 0, 0), (132, 0, 0)])
    a.lid([(0, 0), (68, 0), (71, 100), (74, 0), (132, 0)])
    a.tr_stat("Pupil", "s", (104, 104))


@state("workout", 132, loop=True)
def workout(a):
    # Curls: left arm, right arm, then both — effort squash on each lift, a squint,
    # and a whew-exhale at the end of the set.
    a.set("Arm-45", "s", [(0, (100, 100)), (8, (106, 100)), (18, (106, 128)), (24, (106, 128)),
                          (38, (100, 100)), (86, (100, 100)), (94, (104, 122)), (108, (100, 100)),
                          (132, (100, 100))])
    a.set("Arm45", "s", [(0, (100, 100)), (46, (100, 100)), (54, (106, 100)), (64, (106, 128)),
                         (70, (106, 128)), (82, (100, 100)), (86, (100, 100)), (94, (104, 122)),
                         (108, (100, 100)), (132, (100, 100))])
    a.set("Face", "s", [(0, (100, 100)), (18, (103, 96.5)), (34, (100, 100)), (64, (103, 96.5)),
                        (80, (100, 100)), (94, (104, 96)), (106, (98, 103)), (118, (100, 100)),
                        (132, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (18, (256, 253)), (34, (256, 250)), (64, (256, 253)),
                        (80, (256, 250)), (94, (256, 254)), (106, (256, 248)), (118, (256, 250)),
                        (132, (256, 250))])
    a.lid([(0, 0), (12, 35), (28, 35), (40, 0), (58, 35), (74, 35), (84, 0), (90, 40),
           (104, 40), (112, 0), (132, 0)])
    a.gaze([(0, 0, 0), (14, -0.4, -0.3), (30, -0.4, -0.3), (44, 0, 0), (60, 0.4, -0.3),
            (76, 0.4, -0.3), (88, 0, -0.2), (104, 0, -0.2), (116, 0, 0), (132, 0, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (18, (103, 103)), (34, (100, 100)), (64, (103, 103)),
                          (80, (100, 100)), (94, (104, 104)), (112, (100, 100)), (132, (100, 100))])


@state("sneeze", 96, loop=False)
def sneeze(a):
    # Ahh... ahh... CHOO! Tickle build with fluttering lids, tip back, whip forward
    # into a squash burst, recoil wobble, sniffly recovery.
    a.set("Face", "s", [(0, (100, 100)), (12, (99, 101)), (24, (97, 105)), (30, (95, 107)),
                        (34, (112, 86)), (42, (96, 105)), (50, (104, 97)), (58, (99, 101)),
                        (72, (101, 99)), (96, (100, 100))])
    a.set("Root", "r", [(0, 0), (14, -3), (30, -7), (34, 9), (42, 4), (50, 6), (58, 2),
                        (72, 1), (96, 0)])
    a.set("Root", "p", [(0, (256, 250)), (30, (256, 244)), (34, (256, 258)), (44, (256, 250)),
                        (96, (256, 250))])
    a.lid([(0, 0), (10, 40), (14, 10), (20, 55), (24, 20), (30, 80), (34, 100), (46, 100),
           (54, 30), (70, 45), (84, 20), (92, 0), (96, 0)])
    a.gaze([(0, 0, 0), (12, 0.2, -0.3), (20, -0.2, -0.4), (30, 0, -0.55), (36, 0, 0.5),
            (50, 0, 0.35), (66, 0, 0.15), (84, 0, 0), (96, 0, 0)])
    a.set("Arm45", "r", [(0, 45), (30, 40), (34, 56), (44, 47), (56, 45), (96, 45)])
    a.set("Arm-45", "r", [(0, -45), (30, -40), (34, -56), (44, -47), (56, -45), (96, -45)])
    a.set("Arm0", "s", [(0, (100, 100)), (30, (100, 104)), (34, (102, 94)), (46, (100, 100)), (96, (100, 100))])
    a.pupil([(0, 100), (26, 92), (34, 115), (52, 100), (96, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (34, (106, 106)), (46, (100, 100)), (96, (100, 100))])


# ---------------------------------------------------------------------------
# ENTRANCES / EXITS
# ---------------------------------------------------------------------------

@state("hello", 150, loop=False)
def hello(a):
    # The arms spell "HI" first (H = three rects, I = one), the letters take a bow,
    # then they fold into the starburst as the face blooms in — and it waves.
    # Arm0 = H left post, Arm-45 = H right post, Arm90 = H crossbar, Arm45 = I.
    a.set("Face", "s", [(0, (0, 0)), (60, (0, 0)), (72, (112, 112)), (80, (100, 100)), (150, (100, 100))])
    a.set("Shadow", "o", [(0, 0), (58, 0), (78, 18), (150, 18)])
    a.set("Shadow", "s", [(0, (60, 60)), (58, (60, 60)), (78, (104, 104)), (86, (100, 100)), (150, (100, 100))])
    # letter pops (staggered, with overshoot), a little bounce, then fold to rest
    a.set("Arm0", "s", [(0, (0, 0)), (4, (0, 0)), (9, (60, 66)), (12, (55, 60)), (58, (55, 60)),
                        (76, (100, 100)), (150, (100, 100))])
    a.set("Arm0", "p", [(0, (158, 250)), (28, (158, 250)), (33, (158, 241)), (38, (158, 250)),
                        (58, (158, 250)), (76, (256, 250)), (150, (256, 250))])
    a.set("Arm-45", "s", [(0, (0, 0)), (6, (0, 0)), (11, (60, 66)), (14, (55, 60)), (58, (55, 60)),
                          (76, (100, 100)), (150, (100, 100))])
    a.set("Arm-45", "p", [(0, (226, 250)), (32, (226, 250)), (37, (226, 241)), (42, (226, 250)),
                          (58, (226, 250)), (76, (256, 250)), (150, (256, 250))])
    a.set("Arm-45", "r", [(0, 0), (58, 0), (76, -45), (150, -45)])
    a.set("Arm90", "s", [(0, (0, 0)), (8, (0, 0)), (13, (55, 27)), (16, (50, 24)), (58, (50, 24)),
                         (76, (100, 100)), (150, (100, 100))])
    a.set("Arm90", "p", [(0, (192, 250)), (30, (192, 250)), (35, (192, 242)), (40, (192, 250)),
                         (58, (192, 250)), (76, (256, 250)), (150, (256, 250))])
    a.set("Arm45", "s", [(0, (0, 0)), (12, (0, 0)), (17, (60, 66)), (20, (55, 60)), (58, (55, 60)),
                         (76, (100, 100)), (88, (100, 100)), (96, (94, 112)), (124, (94, 112)),
                         (134, (100, 100)), (150, (100, 100))])
    a.set("Arm45", "p", [(0, (332, 250)), (36, (332, 250)), (41, (332, 241)), (46, (332, 250)),
                         (58, (332, 250)), (76, (256, 250)), (150, (256, 250))])
    a.set("Arm45", "r", [(0, 0), (58, 0), (76, 45), (88, 45), (96, 52), (104, 72), (112, 50),
                         (120, 70), (130, 45), (150, 45)])
    # the wave + greeting face
    a.gaze([(0, 0, 0), (74, 0, 0), (82, 0, -0.15), (128, 0, -0.15), (140, 0, 0), (150, 0, 0)])
    a.pupil([(0, 100), (74, 100), (82, 108), (134, 108), (146, 100), (150, 100)])
    a.hl([(0, 100), (74, 100), (84, 122), (136, 100), (150, 100)])
    a.lid([(0, 0), (108, 0), (111, 100), (114, 0), (150, 0)])
    a.set("Root", "r", [(0, 0), (88, 0), (98, 3), (128, 3), (140, 0), (150, 0)])


@state("enter", 78, loop=False)
def enter(a):
    # Spawn: drops in from above while scaling up, lands with a big squash and a
    # double settle, then looks around — hello, world.
    a.set("Root", "s", [(0, (0, 0)), (10, (90, 90)), (18, (100, 100)), (78, (100, 100))])
    a.set("Root", "p", [(0, (256, 120)), (16, (256, 258)), (26, (256, 242)), (36, (256, 253)),
                        (46, (256, 249)), (56, (256, 250)), (78, (256, 250))])
    a.set("Face", "s", [(0, (96, 106)), (14, (94, 110)), (18, (113, 86)), (28, (95, 107)),
                        (38, (104, 97)), (48, (99, 101)), (58, (100, 100)), (78, (100, 100))])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 108)), (16, (100, 108)), (22, (102, 94)), (32, (99, 103)),
                         (42, (100, 100)), (78, (100, 100))])
    a.set("Shadow", "o", [(0, 4), (16, 22), (26, 18), (78, 18)])
    a.set("Shadow", "s", [(0, (56, 56)), (16, (112, 112)), (26, (98, 98)), (36, (102, 102)),
                          (46, (100, 100)), (78, (100, 100))])
    a.gaze([(0, 0, 0.4), (16, 0, 0.4), (26, 0, 0), (36, -0.55, 0), (50, -0.55, 0),
            (56, 0.55, 0), (68, 0.55, 0), (74, 0, 0), (78, 0, 0)])
    a.lid([(0, 30), (14, 30), (20, 0), (60, 0), (63, 100), (66, 0), (78, 0)])
    a.pupil([(0, 96), (18, 96), (26, 108), (44, 100), (78, 100)])


@state("exit", 66, loop=False)
def exit_(a):
    # Sign-off: a quick wave, a deep crouch, then it leaps up and shrinks away.
    # (Ends hidden — the one state that does not settle to rest.)
    a.set("Arm45", "r", [(0, 45), (4, 52), (10, 72), (16, 52), (22, 70), (28, 45), (66, 45)])
    a.set("Arm45", "s", [(0, (100, 100)), (6, (95, 112)), (24, (95, 112)), (30, (100, 100)), (66, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (30, (256, 250)), (40, (256, 262)), (48, (256, 170)),
                        (58, (256, 90)), (66, (256, 70))])
    a.set("Root", "s", [(0, (100, 100)), (40, (100, 100)), (48, (78, 78)), (58, (24, 24)), (66, (0, 0))])
    a.set("Face", "s", [(0, (100, 100)), (40, (110, 88)), (46, (88, 116)), (56, (94, 108)), (66, (96, 104))])
    a.gaze([(0, 0, 0), (26, 0, 0), (36, 0, 0.3), (44, 0, -0.6), (58, 0, -0.6), (66, 0, -0.6)])
    a.lid([(0, 0), (16, 0), (19, 100), (22, 0), (44, 60), (66, 60)])
    a.set("Shadow", "o", [(0, 18), (40, 21), (48, 10), (58, 3), (66, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (40, (105, 105)), (48, (74, 74)), (58, (56, 56)), (66, (48, 48))])


# ---------------------------------------------------------------------------
# MOTION
# ---------------------------------------------------------------------------

@state("fly", 120, loop=True)
def fly(a):
    # Superhero cruise: leaned into the wind, trailing arms fluttering, wind-squint,
    # the shadow far below and small.
    a.stat("Root", "r", -14)
    a.set("Root", "p", [(0, (256, 244)), (30, (250, 238)), (60, (256, 246)), (90, (262, 238)),
                        (120, (256, 244))])
    a.stat("Arm0", "s", (95, 90))
    a.stat("Arm90", "s", (90, 112))
    a.stat("Arm45", "r", 58)
    a.stat("Arm-45", "r", -58)
    a.set("Arm45", "s", [(t, (92, v)) for t, v in sine(106, 3, 24, 0, 120, phase=0, step=12)])
    a.set("Arm-45", "s", [(t, (92, v)) for t, v in sine(106, 3, 24, 0, 120, phase=math.pi, step=12)])
    a.gaze([(0, 0.7, -0.1), (48, 0.7, -0.1), (58, 0.4, 0.25), (84, 0.4, 0.25), (96, 0.7, -0.1),
            (120, 0.7, -0.1)])
    a.lid([(0, 0), (52, 0), (56, 100), (60, 0), (120, 0)])
    a.hl([(0, 115), (60, 122), (120, 115)])
    a.set("Shadow", "s", [(t, (v, v)) for t, v in sine(70, 4, 60, 0, 120, phase=0, step=15)])
    a.stat("Shadow", "o", 10)
    a.set("Face", "s", [(0, (97, 103)), (60, (98, 102)), (120, (97, 103))])


@state("swim", 144, loop=True, accents=("StatusDot",))
def swim(a):
    # Breaststroke: pull → glide → recover, twice per loop, with a bubble rising
    # during the first glide.
    r45, r_45, px, fs = [], [], [], []
    for k in range(2):
        b = k * 72
        r45 += [(b, 45), (b + 16, 82), (b + 48, 82), (b + 72, 45)]
        r_45 += [(b, -45), (b + 16, -82), (b + 48, -82), (b + 72, -45)]
        px += [(b, (256, 250)), (b + 16, (270, 249)), (b + 48, (258, 250)), (b + 72, (256, 250))]
        fs += [(b, (102, 98)), (b + 16, (97, 104)), (b + 48, (98, 103)), (b + 72, (102, 98))]
    a.set("Arm45", "r", r45)
    a.set("Arm-45", "r", r_45)
    a.set("Root", "p", px)
    a.set("Face", "s", fs)
    a.stat("Root", "r", -6)
    a.set("Arm45", "s", [(0, (100, 105)), (16, (100, 92)), (48, (100, 92)), (72, (100, 105)),
                         (88, (100, 92)), (120, (100, 92)), (144, (100, 105))])
    a.set("Arm-45", "s", [(0, (100, 105)), (16, (100, 92)), (48, (100, 92)), (72, (100, 105)),
                          (88, (100, 92)), (120, (100, 92)), (144, (100, 105))])
    a.set("StatusDot", "o", [(0, 0), (20, 0), (28, 85), (44, 0), (144, 0)])
    a.set("StatusDot", "p", [(0, (298, 236)), (20, (298, 236)), (46, (326, 180)), (60, (298, 236)),
                             (144, (298, 236))])
    a.stat("StatusDot", "s", (95, 95))
    a.tint("StatusDot", (0.66, 0.85, 1))
    a.lid_stat(38)
    a.gaze([(0, 0.6, -0.15), (72, 0.65, -0.1), (144, 0.6, -0.15)])
    a.stat("Shadow", "o", 12)
    a.stat("Shadow", "s", (88, 88))


@state("run", 96, loop=True)
def run(a):
    # Full sprint facing right: pumping diagonal arms in anti-phase, a double-step
    # bob, the whole body leaning into it.
    a.stat("Root", "r", 9)
    a.set("Root", "p", [(t, (256 + 3 * math.sin(2 * math.pi * t / 48), v))
                        for t, v in sine(248, 5, 24, 0, 96, phase=0, step=6)])
    a.set("Arm45", "r", [(0, 31), (12, 59), (24, 31), (36, 59), (48, 31), (60, 59), (72, 31),
                         (84, 59), (96, 31)])
    a.set("Arm-45", "r", [(0, -59), (12, -31), (24, -59), (36, -31), (48, -59), (60, -31),
                          (72, -59), (84, -31), (96, -59)])
    a.set("Arm0", "s", [(t, (100, v)) for t, v in sine(100, 6, 24, 0, 96, phase=0, step=6)])
    a.set("Arm90", "s", [(t, (100, v)) for t, v in sine(100, 6, 24, 0, 96, phase=math.pi, step=6)])
    a.set("Face", "s", [(t, (200 - v, v)) for t, v in sine(100, 2, 12, 0, 96, phase=0, step=6)])
    a.gaze([(0, 0.85, 0), (44, 0.85, 0), (56, 0.85, -0.15), (76, 0.85, 0), (96, 0.85, 0)])
    a.lid([(0, 0), (58, 0), (61, 100), (64, 0), (96, 0)])
    a.set("Shadow", "s", [(t, (v, v)) for t, v in sine(100, 5, 24, 0, 96, phase=math.pi, step=6)])


@state("ball", 112, loop=True)
def ball(a):
    # Tucks its arms away, closes its eye, and becomes a bouncing ball — one big
    # bounce, one small, real fall acceleration — then unfolds.
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (8, (0, 0)), (88, (0, 0)), (98, (100, 100)), (112, (100, 100))])
    a.lid([(0, 0), (6, 100), (92, 100), (98, 0), (112, 0)])
    a.set("Root", "p", [(0, (256, 250)), (8, (256, 250)), (18, (256, 262)), (28, (256, 176)),
                        (36, (256, 168)), (46, (256, 246)), (50, (256, 262)), (60, (256, 206)),
                        (66, (256, 212)), (76, (256, 252)), (82, (256, 256)), (90, (256, 250)),
                        (112, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (18, (110, 88)), (28, (90, 112)), (36, (97, 103)),
                        (48, (94, 108)), (50, (117, 82)), (60, (93, 108)), (70, (96, 105)),
                        (76, (111, 89)), (84, (98, 102)), (92, (100, 100)), (112, (100, 100))])
    a.set("Shadow", "s", [(0, (100, 100)), (18, (106, 106)), (36, (66, 66)), (50, (116, 116)),
                          (60, (86, 86)), (76, (108, 108)), (88, (100, 100)), (112, (100, 100))])
    a.set("Shadow", "o", [(0, 18), (18, 21), (36, 10), (50, 24), (60, 14), (76, 21), (88, 18), (112, 18)])
    a.gaze([(0, 0, 0), (96, 0, 0), (102, 0.3, -0.2), (108, 0, 0), (112, 0, 0)])
    a.pupil([(0, 100), (94, 100), (100, 112), (110, 100), (112, 100)])


@state("zoom", 108, loop=True)
def zoom(a):
    # Wind-up, DASH right with a horizontal smear, skid stop, glance back, dash home,
    # wobble to a stop — and a beat to breathe.
    a.set("Root", "p", [(0, (256, 250)), (8, (247, 252)), (14, (245, 252)), (20, (330, 250)),
                        (28, (334, 251)), (44, (334, 250)), (50, (256, 250)), (56, (252, 251)),
                        (62, (257, 250)), (68, (256, 250)), (108, (256, 250))])
    a.set("Root", "r", [(0, 0), (10, -7), (16, -8), (22, 6), (30, 0), (46, 0), (52, -6),
                        (60, 2), (66, 0), (108, 0)])
    a.set("Face", "s", [(0, (100, 100)), (12, (106, 94)), (17, (130, 80)), (22, (86, 112)),
                        (28, (112, 91)), (36, (100, 100)), (47, (128, 82)), (54, (88, 110)),
                        (60, (106, 95)), (68, (100, 100)), (108, (100, 100))])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (16, (100, 96)), (19, (112, 90)), (26, (98, 102)),
                         (34, (100, 100)), (46, (112, 92)), (56, (98, 102)), (64, (100, 100)),
                         (108, (100, 100))])
    a.set("Shadow", "p", [(0, (256, 350)), (14, (250, 350)), (20, (330, 350)), (44, (332, 350)),
                          (50, (256, 350)), (62, (256, 350)), (108, (256, 350))])
    a.gaze([(0, 0, 0), (8, 0.8, 0), (14, 0.8, 0), (24, 0.3, 0), (34, -0.75, 0.1), (44, -0.75, 0.1),
            (52, -0.3, 0), (60, 0, 0), (108, 0, 0)])
    a.lid([(0, 0), (15, 40), (24, 0), (46, 40), (56, 0), (84, 0), (87, 100), (90, 0), (108, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (17, (90, 90)), (24, (104, 104)), (34, (100, 100)),
                          (47, (92, 92)), (58, (100, 100)), (108, (100, 100))])


@state("spring", 104, loop=True)
def spring(a):
    # A slinky coil: deep compression, release upward, then anchored diminishing
    # boing-boing-boing overshoots. No airtime — pure coil physics.
    a.set("Root", "p", [(0, (256, 250)), (20, (256, 266)), (26, (256, 214)), (36, (256, 258)),
                        (44, (256, 232)), (52, (256, 254)), (60, (256, 242)), (68, (256, 251)),
                        (76, (256, 250)), (104, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (20, (118, 80)), (26, (82, 124)), (36, (112, 88)),
                        (44, (90, 111)), (52, (107, 93)), (60, (95, 105)), (68, (102, 98)),
                        (76, (100, 100)), (104, (100, 100))])
    for arm in ARMS:
        a.set(arm, "s", [(0, (100, 100)), (20, (105, 85)), (26, (96, 112)), (36, (103, 92)),
                         (44, (98, 106)), (52, (102, 96)), (60, (99, 102)), (70, (100, 100)),
                         (104, (100, 100))])
    a.gaze([(0, 0, 0), (16, 0, 0.4), (26, 0, -0.4), (36, 0, 0.3), (46, 0, -0.2), (56, 0, 0.15),
            (66, 0, 0), (104, 0, 0)])
    a.lid([(0, 0), (18, 55), (28, 0), (90, 0), (93, 100), (96, 0), (104, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (20, (108, 108)), (26, (90, 90)), (36, (104, 104)),
                          (48, (97, 97)), (60, (101, 101)), (72, (100, 100)), (104, (100, 100))])


@state("gravity-flip", 132, loop=True)
def gravity_flip(a):
    # Hops, flips 180 mid-air, "lands" on its head, hangs out upside down blinking,
    # then flips back. Rotations resolve mod 360 at the seam.
    a.set("Root", "r", [(0, 0), (12, 0), (24, 180), (32, 180), (64, 180), (76, 360), (86, 360),
                        (132, 360)])
    a.set("Root", "p", [(0, (256, 250)), (12, (256, 260)), (18, (256, 196)), (24, (256, 188)),
                        (32, (256, 252)), (40, (256, 248)), (64, (256, 249)), (70, (256, 196)),
                        (76, (256, 188)), (84, (256, 252)), (92, (256, 248)), (100, (256, 250)),
                        (132, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (12, (107, 91)), (18, (92, 110)), (32, (109, 90)),
                        (42, (98, 102)), (50, (100, 100)), (64, (105, 94)), (70, (92, 110)),
                        (84, (109, 90)), (94, (98, 102)), (102, (100, 100)), (132, (100, 100))])
    a.lid([(0, 0), (14, 100), (30, 100), (36, 0), (48, 0), (51, 100), (54, 0), (66, 100),
           (86, 100), (92, 0), (132, 0)])
    a.gaze([(0, 0, 0), (36, 0, 0), (42, -0.5, 0.3), (56, 0.5, 0.3), (62, 0, 0), (94, 0, 0),
            (100, 0, -0.2), (112, 0, 0), (132, 0, 0)])
    a.set("Arm45", "r", [(0, 45), (12, 42), (20, 52), (32, 45), (64, 45), (72, 52), (84, 45), (132, 45)])
    a.set("Arm-45", "r", [(0, -45), (12, -42), (20, -52), (32, -45), (64, -45), (72, -52), (84, -45), (132, -45)])
    a.set("Shadow", "s", [(0, (100, 100)), (12, (104, 104)), (22, (76, 76)), (32, (108, 108)),
                          (44, (100, 100)), (64, (100, 100)), (72, (76, 76)), (84, (108, 108)),
                          (96, (100, 100)), (132, (100, 100))])


# ---------------------------------------------------------------------------
# DANCE
# ---------------------------------------------------------------------------

@state("dance", 128, loop=True)
def dance(a):
    # Two-bar groove: side-step left, center, right, center — arms alternating,
    # a bounce on every beat, half-lid cool.
    a.set("Root", "p", [(0, (256, 250)), (8, (244, 254)), (16, (244, 248)), (24, (256, 254)),
                        (32, (256, 248)), (40, (268, 254)), (48, (268, 248)), (56, (256, 254)),
                        (64, (256, 248)), (72, (244, 254)), (80, (244, 246)), (88, (256, 253)),
                        (96, (256, 247)), (104, (268, 253)), (112, (268, 247)), (120, (256, 252)),
                        (128, (256, 250))])
    a.set("Root", "r", [(0, 0), (8, -5), (24, 0), (40, 5), (56, 0), (72, -5), (88, 0), (104, 5),
                        (120, 0), (128, 0)])
    a.set("Face", "s", [(t, (200 - v, v)) for t, v in sine(100, 2.5, 16, 0, 128, phase=0, step=8)])
    a.set("Arm45", "r", [(0, 45), (8, 30), (24, 58), (40, 30), (56, 58), (72, 30), (88, 58),
                         (104, 30), (120, 45), (128, 45)])
    a.set("Arm-45", "r", [(0, -45), (8, -58), (24, -30), (40, -58), (56, -30), (72, -58),
                          (88, -30), (104, -58), (120, -45), (128, -45)])
    a.set("Arm0", "s", [(t, (100, v)) for t, v in sine(100, 4, 32, 0, 128, phase=0, step=8)])
    a.set("Arm90", "s", [(t, (100, v)) for t, v in sine(100, 4, 32, 0, 128, phase=math.pi, step=8)])
    a.gaze([(0, 0, 0), (8, -0.35, 0.1), (40, 0.35, 0.1), (72, -0.35, 0.1), (104, 0.35, 0.1),
            (124, 0, 0), (128, 0, 0)])
    a.lid_stat(0)
    a.set("Shadow", "s", [(t, (v, v)) for t, v in sine(101, 3, 16, 0, 128, phase=math.pi, step=8)])


@state("disco", 128, loop=True)
def disco(a):
    # Point up-right to the beat, then swap: point up-left. Rocking hips, cool
    # half-lids, gaze following the pointing hand.
    a.set("Arm45", "r", [(0, 45), (8, 38), (56, 38), (68, 45), (128, 45)])
    a.set("Arm45", "s", [(0, (100, 100)), (8, (90, 125)), (16, (90, 113)), (24, (90, 125)),
                         (32, (90, 113)), (40, (90, 125)), (48, (90, 113)), (56, (90, 122)),
                         (68, (100, 100)), (128, (100, 100))])
    a.set("Arm45", "p", [(0, (256, 250)), (8, (270, 240)), (56, (270, 240)), (68, (256, 250)),
                         (128, (256, 250))])
    a.set("Arm-45", "r", [(0, -45), (64, -45), (72, -38), (120, -38), (128, -45)])
    a.set("Arm-45", "s", [(0, (100, 100)), (64, (100, 100)), (72, (90, 125)), (80, (90, 113)),
                          (88, (90, 125)), (96, (90, 113)), (104, (90, 125)), (112, (90, 113)),
                          (120, (90, 122)), (128, (100, 100))])
    a.set("Arm-45", "p", [(0, (256, 250)), (64, (256, 250)), (72, (242, 240)), (120, (242, 240)),
                          (128, (256, 250))])
    a.set("Root", "r", [(t, v) for t, v in sine(0, 7, 32, 0, 128, phase=0, step=8)])
    a.set("Root", "p", [(t, (256 + 5 * math.sin(2 * math.pi * t / 32), 250 + 2 * math.sin(2 * math.pi * t / 16)))
                        for t in range(0, 129, 8)])
    a.gaze([(0, 0, 0), (10, 0.5, -0.5), (56, 0.5, -0.5), (66, 0, 0.1), (74, -0.5, -0.5),
            (118, -0.5, -0.5), (126, 0, 0), (128, 0, 0)])
    a.lid_stat(40)
    a.tr_stat("Pupil", "s", (105, 105))


@state("clap", 96, loop=True, accents=("PulseRing",))
def clap(a):
    # Hands up, two big claps per loop — the diagonal tips converge overhead and a
    # ring ping marks each impact. Bounces along with it.
    a.set("Arm45", "r", [(0, 45), (10, 40), (20, 16), (30, 42), (40, 16), (52, 45), (96, 45)])
    a.set("Arm-45", "r", [(0, -45), (10, -40), (20, -16), (30, -42), (40, -16), (52, -45), (96, -45)])
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (10, (96, 112)), (44, (96, 112)), (56, (100, 100)),
                         (96, (100, 100))])
    a.set("PulseRing", "o", [(0, 0), (18, 0), (22, 45), (34, 0), (38, 0), (42, 45), (54, 0), (96, 0)])
    a.set("PulseRing", "s", [(0, (100, 100)), (18, (96, 96)), (34, (128, 128)), (38, (96, 96)),
                             (54, (128, 128)), (70, (100, 100)), (96, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (10, (256, 254)), (20, (256, 246)), (30, (256, 253)),
                        (40, (256, 246)), (52, (256, 252)), (64, (256, 250)), (96, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (20, (98, 103)), (30, (102, 97.5)), (40, (98, 103)),
                        (52, (100, 100)), (96, (100, 100))])
    a.gaze([(0, 0, 0), (12, 0, -0.4), (44, 0, -0.4), (56, 0, 0), (96, 0, 0)])
    a.lid([(0, 0), (16, 45), (46, 45), (56, 0), (78, 0), (81, 100), (84, 0), (96, 0)])
    a.tr_stat("Pupil", "s", (106, 106))


@state("conduct", 144, loop=True)
def conduct(a):
    # Maestro: the baton arm draws a 3/4 waltz pattern — strong downbeat, lift,
    # side — eye closed in bliss, opening for a peek in bar three.
    r = []
    for k in range(3):
        b = k * 48
        r += [(b, 45), (b + 8, 26), (b + 22, 58), (b + 36, 38), (b + 48, 45)]
    a.set("Arm45", "r", r)
    a.stat("Arm45", "s", (94, 116))
    a.set("Root", "r", [(t, v) for t, v in sine(0, 3, 48, 0, 144, phase=0, step=12)])
    a.set("Face", "s", [(0, (100, 100)), (36, (99, 101.5)), (72, (100, 100)), (108, (99, 101.5)),
                        (144, (100, 100))])
    a.set("Arm-45", "r", [(t, v) for t, v in sine(-45, 2.5, 48, 0, 144, phase=math.pi, step=12)])
    a.lid([(0, 78), (88, 78), (96, 30), (120, 30), (132, 78), (144, 78)])
    a.gaze([(0, 0, 0.1), (92, 0, 0.1), (100, 0.4, -0.3), (118, 0.4, -0.3), (130, 0, 0.1),
            (144, 0, 0.1)])
    a.set("Root", "p", [(0, (256, 250)), (24, (256, 248)), (48, (256, 250)), (72, (256, 248)),
                        (96, (256, 250)), (120, (256, 248)), (144, (256, 250))])


# ---------------------------------------------------------------------------
# LOADING / SYSTEM
# ---------------------------------------------------------------------------

@state("loading-dots", 140, loop=True)
def loading_dots(a):
    # Three arms become the classic three dots pulsing in a wave below; the fourth
    # hides. The eye follows the wave back and forth.
    a.set("Arm-45", "s", [(0, (100, 100)), (12, (0, 0)), (124, (0, 0)), (136, (100, 100)), (140, (100, 100))])
    dots = (("Arm0", 196, 24), ("Arm90", 256, 36), ("Arm45", 316, 48))
    for arm, x, peak in dots:
        s = [(0, (100, 100)), (12, (20, 7))]
        p = [(0, (256, 250)), (12, (x, 322))]
        for c in range(3):
            t = peak + c * 36
            if t + 8 <= 124:
                s += [(t - 8, (20, 7)), (t, (30, 11)), (t + 8, (20, 7))]
                p += [(t - 8, (x, 322)), (t, (x, 310)), (t + 8, (x, 322))]
        s += [(124, (20, 7)), (136, (100, 100)), (140, (100, 100))]
        p += [(124, (x, 322)), (136, (256, 250)), (140, (256, 250))]
        a.set(arm, "s", s)
        a.set(arm, "p", p)
    a.set("Arm45", "r", [(0, 45), (12, 0), (124, 0), (136, 45), (140, 45)])
    a.gaze([(0, 0, 0), (12, 0, 0), (24, -0.5, 0.75), (36, 0, 0.8), (48, 0.5, 0.75),
            (60, -0.5, 0.75), (72, 0, 0.8), (84, 0.5, 0.75), (96, -0.5, 0.75), (108, 0, 0.8),
            (120, 0.5, 0.75), (132, 0, 0), (140, 0, 0)])
    a.lid_stat(0)
    a.set("Face", "s", [(0, (100, 100)), (70, (101, 99)), (140, (100, 100))])


@state("loading-orbit", 144, loop=True, accents=("StatusDot",))
def loading_orbit(a):
    # A satellite dot orbits the whole mascot on a wide ellipse (clear of every arm);
    # the calm eye tracks it around the full revolution.
    path, gz = [], []
    for t in range(0, 145, 12):
        th = 2 * math.pi * t / 144
        path.append((t, (256 + 190 * math.sin(th), 250 + 175 * math.cos(th))))
        gz.append((t, 0.75 * math.sin(th), 0.75 * math.cos(th)))
    a.set("StatusDot", "p", path)
    a.set("StatusDot", "o", [(0, 0), (8, 95), (136, 95), (144, 0)])
    a.stat("StatusDot", "s", (150, 150))
    a.gaze(gz)
    a.tr_stat("Pupil", "s", (105, 105))
    a.lid_stat(10)
    a.set("Face", "s", [(0, (100, 100)), (72, (101, 98.8)), (144, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (72, (256, 248)), (144, (256, 250))])


@state("loading-pulse", 120, loop=True, accents=("PulseRing",))
def loading_pulse(a):
    # Sonar: two slow expanding pings; between them the eye opens and sweeps like a
    # scanner, then re-shutters. Cool and systematic — no heartbeat here.
    a.set("PulseRing", "o", [(0, 0), (12, 0), (16, 48), (40, 0), (58, 0), (62, 48), (86, 0), (120, 0)])
    a.set("PulseRing", "s", [(0, (94, 94)), (12, (94, 94)), (40, (152, 152)), (58, (94, 94)),
                             (86, (152, 152)), (104, (94, 94)), (120, (94, 94))])
    a.lid([(0, 55), (18, 55), (26, 0), (52, 0), (60, 55), (66, 55), (74, 0), (100, 0),
           (108, 55), (120, 55)])
    a.gaze([(0, 0, 0), (26, -0.5, 0), (50, 0.5, 0), (58, 0, 0), (74, 0.5, 0), (98, -0.5, 0),
            (108, 0, 0), (120, 0, 0)])
    a.stat("Arm45", "r", 42)
    a.stat("Arm-45", "r", -42)
    a.stat("Arm45", "s", (96, 94))
    a.stat("Arm-45", "s", (96, 94))
    a.set("Face", "s", [(0, (100, 100)), (60, (100.8, 99.2)), (120, (100, 100))])
    a.tr_stat("Pupil", "s", (96, 96))


@state("loading-bar", 138, loop=True)
def loading_bar(a):
    # Arm90 becomes a progress bar under the mascot, filling with realistic stalls;
    # the gaze rides the bar's tip, gets annoyed at the stall, and celebrates 100%.
    a.set("Arm90", "p", [(0, (256, 250)), (10, (256, 62)), (116, (256, 62)), (128, (256, 250)),
                         (138, (256, 250))])
    a.set("Arm90", "s", [(0, (100, 100)), (10, (30, 6)), (30, (30, 42)), (44, (30, 46)),
                         (70, (30, 52)), (86, (30, 88)), (96, (30, 100)), (116, (30, 100)),
                         (128, (100, 100)), (138, (100, 100))])
    a.gaze([(0, 0, 0), (12, -0.2, -0.75), (30, 0.15, -0.75), (48, 0.2, -0.75), (54, 0, 0.25),
            (66, 0, 0.25), (72, 0.25, -0.75), (86, 0.6, -0.75), (96, 0.8, -0.75), (100, 0, -0.2),
            (120, 0, -0.2), (130, 0, 0), (138, 0, 0)])
    a.lid([(0, 0), (52, 0), (56, 38), (68, 38), (72, 0), (138, 0)])
    a.set("Root", "p", [(0, (256, 250)), (96, (256, 250)), (102, (256, 238)), (110, (256, 252)),
                        (116, (256, 250)), (138, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (96, (100, 100)), (102, (96, 106)), (110, (103, 97)),
                        (118, (100, 100)), (138, (100, 100))])
    a.pupil([(0, 100), (96, 100), (102, 114), (122, 100), (138, 100)])
    a.hl([(0, 100), (96, 100), (104, 128), (124, 100), (138, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (100, (100, 100)), (104, (92, 92)), (112, (103, 103)),
                          (120, (100, 100)), (138, (100, 100))])


@state("impatient", 132, loop=True)
def impatient(a):
    # Foot-tap (well, arm-tap), a full eye-roll, then a long deflating sigh.
    a.stat("Arm45", "r", 68)
    a.stat("Arm-45", "r", -68)
    a.stat("Arm45", "s", (104, 92))
    a.stat("Arm-45", "s", (104, 92))
    tap = [(0, (100, 100))]
    for k in range(6):
        b = 6 + k * 12
        tap += [(b, (100, 105)), (b + 6, (100, 100))]
    tap += [(96, (100, 100)), (132, (100, 100))]
    a.set("Arm0", "s", tap)
    a.gaze([(0, 0, 0.1), (56, 0, 0.1), (62, 0.5, -0.5), (68, 0, -0.75), (74, -0.5, -0.5),
            (80, 0, 0.1), (112, 0, 0.1), (132, 0, 0.1)])
    a.lid([(0, 35), (58, 35), (64, 45), (78, 45), (86, 35), (92, 35), (104, 60), (124, 38),
           (132, 35)])
    a.set("Face", "s", [(0, (101, 99)), (88, (101, 99)), (96, (98, 103)), (114, (104, 96)),
                        (128, (101, 99)), (132, (101, 99))])
    a.set("Root", "p", [(0, (256, 251)), (92, (256, 251)), (100, (256, 247)), (118, (256, 254)),
                        (130, (256, 251)), (132, (256, 251))])
    a.tr_stat("Pupil", "s", (95, 95))


@state("processing", 140, loop=True)
def processing(a):
    # Gearbox: the compacted arm cluster ratchets 45° at a time — snap, hold, snap —
    # while the eye ticks the opposite way like an escapement.
    for arm, base in (("Arm0", 0), ("Arm90", 90), ("Arm45", 45), ("Arm-45", -45)):
        a.set(arm, "s", [(0, (100, 100)), (10, (70, 70)), (128, (70, 70)), (138, (100, 100)),
                         (140, (100, 100))])
        r = [(0, base), (10, base)]
        for k in range(8):
            r += [(12 + k * 15, base + (k + 1) * 45), (25 + k * 15, base + (k + 1) * 45)]
        r += [(140, base + 360)]
        a.set(arm, "r", r)
    tick = [(0, 0, 0), (10, 0.4, 0.1)]
    for k in range(8):
        d = 0.4 if k % 2 else -0.4
        tick += [(14 + k * 15, d, 0.1), (25 + k * 15, d, 0.1)]
    tick += [(134, 0, 0), (140, 0, 0)]
    a.gaze(tick)
    a.lid_stat(0)
    a.set("Face", "s", [(0, (100, 100)), (70, (100.8, 99.2)), (140, (100, 100))])


# ---------------------------------------------------------------------------
# EMOTIONS II
# ---------------------------------------------------------------------------

@state("laughing", 108, loop=True)
def laughing(a):
    # Ha-ha-ha — three belly bounces leaning further back each time, laugh-squint,
    # a big inhale, and one residual chuckle before it starts again.
    a.set("Face", "s", [(0, (100, 100)), (8, (108, 90)), (14, (96, 106)), (20, (108, 90)),
                        (26, (96, 106)), (32, (109, 89)), (38, (96, 106)), (46, (102, 98)),
                        (58, (98, 103)), (70, (100, 100)), (80, (103, 97)), (88, (99, 101)),
                        (108, (100, 100))])
    a.set("Root", "r", [(0, 0), (10, -2.5), (24, -4.5), (38, -6), (54, -2), (70, 0), (108, 0)])
    a.set("Root", "p", [(0, (256, 250)), (8, (256, 254)), (14, (256, 247)), (20, (256, 254)),
                        (26, (256, 247)), (32, (256, 255)), (40, (256, 248)), (52, (256, 250)),
                        (80, (256, 252)), (90, (256, 250)), (108, (256, 250))])
    a.lid([(0, 0), (8, 75), (44, 75), (56, 20), (70, 0), (78, 55), (88, 0), (108, 0)])
    a.gaze([(0, 0, 0), (8, 0, -0.2), (44, 0, -0.2), (60, 0, 0), (108, 0, 0)])
    a.tr_stat("Pupil", "s", (108, 108))
    for arm in DIAGS:
        a.set(arm, "s", [(t, (100, v)) for t, v in sine(102, 4, 12, 0, 108, phase=0, step=6)])
    a.set("Shadow", "s", [(0, (100, 100)), (8, (103, 103)), (20, (103, 103)), (40, (104, 104)),
                          (60, (100, 100)), (108, (100, 100))])


@state("crying", 132, loop=True, accents=("StatusDot",))
def crying(a):
    # Ongoing sobs (distinct from sad's one-time slump): rhythmic double-hics, heavy
    # lids, quivering drooped arms, a tear each cycle.
    a.set("Face", "s", [(0, (102, 97)), (10, (105, 94)), (16, (102, 97)), (22, (105.5, 93.5)),
                        (34, (102, 97)), (64, (102, 97)), (72, (105, 94)), (78, (102, 97)),
                        (84, (105.5, 93.5)), (96, (102, 97)), (132, (102, 97))])
    a.set("Root", "p", [(0, (255, 256)), (12, (257, 256)), (24, (255, 257)), (66, (255, 256)),
                        (74, (257, 256)), (86, (255, 257)), (110, (255, 256)), (132, (255, 256))])
    a.lid([(0, 62), (44, 62), (50, 78), (60, 62), (106, 62), (112, 78), (122, 62), (132, 62)])
    a.gaze_stat(0, 0.7)
    a.tr_stat("Pupil", "s", (88, 88))
    a.set("Arm45", "r", [(t, v) for t, v in sine(60, 2, 22, 0, 132, phase=0, step=11)])
    a.set("Arm-45", "r", [(t, v) for t, v in sine(-60, 2, 22, 0, 132, phase=math.pi, step=11)])
    a.stat("Arm0", "s", (100, 93))
    a.stat("Arm90", "s", (100, 93))
    a.set("StatusDot", "o", [(0, 0), (24, 0), (32, 90), (48, 90), (58, 0), (76, 0), (84, 90),
                             (100, 90), (110, 0), (132, 0)])
    a.set("StatusDot", "p", [(0, (238, 262)), (24, (238, 262)), (56, (238, 298)), (62, (238, 262)),
                             (76, (274, 262)), (108, (274, 298)), (116, (238, 262)), (132, (238, 262))])
    a.stat("StatusDot", "s", (120, 120))
    a.tint("StatusDot", (0.36, 0.62, 1))
    a.stat("Shadow", "s", (97, 97))


@state("nervous", 126, loop=True, accents=("StatusDot",))
def nervous(a):
    # Trembling, darting corner-glances, a gulp, and a sweat drop sliding from the
    # temple. Lid flutter throughout.
    p = [(0, (256, 251))]
    for i, t in enumerate(range(6, 121, 6)):
        p.append((t, (256 + (1.1 if i % 2 == 0 else -1.1), 251)))
    p.append((126, (256, 251)))
    a.set("Root", "p", p)
    a.gaze([(0, 0, 0), (8, -0.6, 0.2), (24, -0.6, 0.2), (30, 0.6, 0.15), (46, 0.6, 0.15),
            (52, -0.3, -0.3), (64, -0.3, -0.3), (70, 0.5, 0.25), (88, 0.5, 0.25),
            (94, -0.55, 0.1), (112, -0.55, 0.1), (120, 0, 0), (126, 0, 0)])
    a.lid([(0, 0), (14, 28), (26, 0), (40, 28), (54, 0), (58, 0), (62, 45), (66, 0), (84, 28),
           (100, 0), (114, 28), (126, 0)])
    a.tr_stat("Pupil", "s", (92, 92))
    a.set("Face", "s", [(0, (100, 100)), (56, (100, 100)), (60, (99, 103)), (66, (101.5, 98)),
                        (72, (100, 100)), (126, (100, 100))])
    a.set("Arm45", "r", [(t, v) for t, v in sine(48, 3, 18, 0, 126, phase=0, step=9)])
    a.set("Arm-45", "r", [(t, v) for t, v in sine(-48, 3, 18, 0, 126, phase=math.pi, step=9)])
    a.set("StatusDot", "o", [(0, 0), (66, 0), (74, 90), (92, 90), (102, 0), (126, 0)])
    a.set("StatusDot", "p", [(0, (300, 198)), (66, (300, 198)), (98, (306, 234)), (110, (300, 198)),
                             (126, (300, 198))])
    a.stat("StatusDot", "s", (110, 110))
    a.tint("StatusDot", (0.36, 0.62, 1))


@state("smug", 120, loop=True)
def smug(a):
    # Half-lid, sustained sideways look, a slow tilt, one dismissive arm-flick —
    # and a highlight that gleams across the pupil.
    a.lid([(0, 45), (36, 45), (44, 52), (84, 45), (120, 45)])
    a.gaze([(0, 0.5, 0.15), (36, 0.5, 0.15), (52, 0.55, 0.1), (100, 0.5, 0.15), (120, 0.5, 0.15)])
    a.set("Root", "r", [(0, 0), (24, 5), (72, 5), (96, 0), (120, 0)])
    a.set("Root", "p", [(0, (256, 250)), (40, (256, 250)), (48, (256, 246)), (58, (256, 251)),
                        (66, (256, 250)), (120, (256, 250))])
    a.set("Arm45", "r", [(0, 45), (38, 45), (43, 62), (50, 42), (56, 45), (120, 45)])
    a.set("Arm45", "s", [(0, (100, 100)), (38, (100, 100)), (43, (96, 110)), (54, (100, 100)),
                         (120, (100, 100))])
    a.hl([(0, 100), (30, 100), (54, 120), (84, 100), (120, 100)])
    a.set("Face", "s", [(0, (99, 102)), (60, (98, 103)), (120, (99, 102))])
    a.tr_stat("Pupil", "s", (100, 100))


@state("scared", 114, loop=True)
def scared(a):
    # Shrunk and trembling, pin-prick pupil whipping between threats, arms pulled
    # in, one flinch-duck with a lid slam mid-loop.
    a.stat("Root", "s", (96, 96))
    p = [(0, (256, 252))]
    for i, t in enumerate(range(4, 53, 4)):
        p.append((t, (256 + (1.2 if i % 2 == 0 else -1.2), 252)))
    p += [(58, (256, 260)), (70, (256, 252))]
    for i, t in enumerate(range(74, 111, 4)):
        p.append((t, (256 + (1.2 if i % 2 == 0 else -1.2), 252)))
    p.append((114, (256, 252)))
    a.set("Root", "p", p)
    a.tr_stat("Pupil", "s", (74, 74))
    a.gaze([(0, 0, 0), (6, 0.7, -0.1), (20, 0.7, -0.1), (26, -0.7, 0.1), (40, -0.7, 0.1),
            (46, 0.4, 0.3), (54, 0.4, 0.3), (62, 0, 0.4), (72, 0, 0), (80, -0.6, -0.2),
            (94, -0.6, -0.2), (100, 0.5, 0), (108, 0.5, 0), (114, 0, 0)])
    a.lid([(0, 0), (54, 0), (58, 90), (66, 90), (72, 0), (114, 0)])
    a.stat("Arm45", "r", 30)
    a.stat("Arm-45", "r", -30)
    a.stat("Arm45", "s", (95, 92))
    a.stat("Arm-45", "s", (95, 92))
    a.set("Face", "s", [(0, (100, 100)), (56, (100, 100)), (60, (104, 95)), (68, (100, 100)),
                        (114, (100, 100))])
    a.stat("Shadow", "s", (96, 96))


@state("bored", 168, loop=True)
def bored(a):
    # Slumping by degrees, aimless drifting gaze, an arm twiddling slow circles,
    # two long sighs that reset the posture.
    a.set("Root", "p", [(0, (256, 250)), (56, (256, 255)), (64, (256, 251)), (76, (256, 252)),
                        (126, (256, 256)), (136, (256, 251)), (156, (256, 250)), (168, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (52, (103, 96)), (60, (98, 103)), (72, (101, 99)),
                        (120, (104, 95.5)), (130, (98, 103)), (142, (100, 100)), (168, (100, 100))])
    a.lid([(0, 55), (50, 68), (60, 50), (110, 70), (130, 52), (150, 60), (168, 55)])
    a.gaze([(0, 0.3, 0.3), (36, -0.2, 0.45), (72, -0.5, 0.2), (108, 0.1, 0.5), (140, 0.45, 0.35),
            (168, 0.3, 0.3)])
    a.set("Arm0", "r", [(0, 0), (16, 7), (32, 0), (48, -7), (64, 0), (80, 7), (96, 0),
                        (112, -7), (128, 0), (144, 7), (160, 0), (168, 0)])
    a.tr_stat("Pupil", "s", (94, 94))
    a.stat("Arm45", "r", 52)
    a.stat("Arm-45", "r", -52)
    a.set("Shadow", "s", [(0, (100, 100)), (56, (102, 102)), (76, (100, 100)), (126, (103, 103)),
                          (146, (100, 100)), (168, (100, 100))])


@state("mind-blown", 108, loop=False, accents=("PulseRing", "Star1", "Star2"))
def mind_blown(a):
    # Frozen stare, pupil shrinking... BOOM — ring blast, arms flung, recoil — then
    # a woozy dilated reel and a shake-it-off recovery.
    a.pupil([(0, 100), (6, 100), (16, 70), (22, 70), (28, 130), (56, 130), (78, 100), (108, 100)])
    a.set("PulseRing", "o", [(0, 0), (18, 0), (22, 70), (44, 0), (108, 0)])
    a.set("PulseRing", "s", [(0, (100, 100)), (18, (100, 100)), (44, (185, 185)), (64, (100, 100)),
                             (108, (100, 100))])
    for arm in DIAGS:
        a.set(arm, "s", [(0, (100, 100)), (16, (100, 97)), (24, (108, 118)), (44, (106, 114)),
                         (66, (100, 102)), (80, (100, 100)), (108, (100, 100))])
    a.set("Arm45", "r", [(0, 45), (16, 44), (24, 58), (48, 56), (72, 45), (108, 45)])
    a.set("Arm-45", "r", [(0, -45), (16, -44), (24, -58), (48, -56), (72, -45), (108, -45)])
    a.set("Arm0", "s", [(0, (100, 100)), (16, (100, 97)), (24, (104, 112)), (52, (102, 108)),
                        (72, (100, 100)), (108, (100, 100))])
    a.set("Arm90", "s", [(0, (100, 100)), (16, (100, 97)), (24, (104, 112)), (52, (102, 108)),
                         (72, (100, 100)), (108, (100, 100))])
    a.set("Face", "s", [(0, (100, 100)), (16, (101, 99)), (24, (90, 112)), (36, (95, 107)),
                        (52, (97, 104)), (68, (102, 98)), (80, (100, 100)), (108, (100, 100))])
    a.set("Root", "r", [(0, 0), (22, 0), (26, -3), (32, 2.5), (38, -1.5), (44, 0), (78, 0),
                        (84, -4), (90, 4), (96, 0), (108, 0)])
    a.set("Root", "p", [(0, (256, 250)), (22, (256, 250)), (26, (256, 256)), (36, (256, 247)),
                        (46, (256, 251)), (56, (256, 250)), (108, (256, 250))])
    a.gaze([(0, 0, 0), (48, 0, 0), (54, 0.3, -0.2), (62, -0.3, 0.2), (70, 0.15, -0.1),
            (78, 0, 0), (108, 0, 0)])
    a.lid([(0, 0), (94, 0), (97, 100), (100, 0), (108, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (24, (104, 104)), (40, (100, 100)), (108, (100, 100))])
    a.set("Star1", "p", [(0, (256, 180)), (20, (256, 180)), (52, (96, 96)), (108, (96, 96))])
    a.set("Star1", "o", [(0, 0), (20, 0), (25, 90), (54, 0), (108, 0)])
    a.set("Star1", "s", [(0, (30, 30)), (20, (30, 30)), (40, (150, 150)), (56, (100, 100)), (108, (30, 30))])
    a.set("Star1", "r", [(0, 0), (20, 0), (56, 300), (108, 300)])
    a.set("Star2", "p", [(0, (256, 180)), (22, (256, 180)), (54, (416, 110)), (108, (416, 110))])
    a.set("Star2", "o", [(0, 0), (22, 0), (27, 90), (56, 0), (108, 0)])
    a.set("Star2", "s", [(0, (30, 30)), (22, (30, 30)), (42, (140, 140)), (58, (95, 95)), (108, (30, 30))])
    a.set("Star2", "r", [(0, 0), (22, 0), (58, -280), (108, -280)])


@state("bow", 96, loop=False)
def bow(a):
    # A dignified bow: straighten tall, fold forward and down with lowered lids and
    # swept-back arms, hold, rise with a slight overshoot, warm look to the viewer.
    a.set("Root", "p", [(0, (256, 250)), (12, (256, 246)), (30, (256, 262)), (56, (256, 262)),
                        (72, (256, 247)), (80, (256, 251)), (88, (256, 250)), (96, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (12, (98, 103)), (30, (103, 95)), (56, (103, 95)),
                        (72, (98, 103)), (84, (100, 100)), (96, (100, 100))])
    a.set("Face", "p", [(0, (256, 250)), (12, (256, 248)), (30, (256, 262)), (56, (256, 262)),
                        (72, (256, 249)), (84, (256, 250)), (96, (256, 250))])
    a.set("Arm45", "r", [(0, 45), (12, 44), (30, 60), (56, 60), (74, 45), (96, 45)])
    a.set("Arm-45", "r", [(0, -45), (12, -44), (30, -60), (56, -60), (74, -45), (96, -45)])
    a.set("Arm0", "s", [(0, (100, 100)), (30, (100, 94)), (56, (100, 94)), (74, (100, 100)), (96, (100, 100))])
    a.lid([(0, 0), (14, 0), (30, 70), (56, 70), (70, 0), (96, 0)])
    a.gaze([(0, 0, 0), (14, 0, 0.2), (30, 0, 0.7), (56, 0, 0.7), (72, 0, -0.1), (82, 0, 0),
            (96, 0, 0)])
    a.hl([(0, 100), (70, 100), (80, 120), (92, 100), (96, 100)])
    a.set("Shadow", "s", [(0, (100, 100)), (30, (103, 103)), (56, (103, 103)), (74, (100, 100)),
                          (96, (100, 100))])


@state("alert", 90, loop=False, accents=("StatusDot",))
def alert(a):
    # Heads up! A startle hop, an exclamation dot double-blinking above the head,
    # quick left-right threat scan, then a stand-down exhale.
    a.set("Root", "p", [(0, (256, 250)), (6, (256, 252)), (12, (256, 234)), (20, (256, 252)),
                        (26, (256, 249)), (58, (256, 249)), (70, (256, 252)), (82, (256, 250)),
                        (90, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (6, (103, 96)), (12, (92, 110)), (22, (98, 103)),
                        (30, (100, 100)), (60, (100, 100)), (70, (103, 97)), (82, (100, 100)),
                        (90, (100, 100))])
    a.set("StatusDot", "o", [(0, 0), (12, 0), (16, 100), (30, 100), (34, 35), (40, 100), (52, 100),
                             (60, 0), (90, 0)])
    a.set("StatusDot", "p", [(0, (256, 168)), (8, (256, 52)), (62, (256, 52)), (74, (256, 168)),
                             (90, (256, 168))])
    a.set("StatusDot", "s", [(0, (100, 100)), (12, (60, 60)), (18, (200, 200)), (24, (175, 175)),
                             (56, (175, 175)), (64, (100, 100)), (90, (100, 100))])
    a.pupil([(0, 100), (8, 70), (48, 70), (66, 100), (90, 100)])
    a.gaze([(0, 0, 0), (10, 0, -0.4), (22, 0, -0.4), (28, -0.65, 0), (40, -0.65, 0),
            (46, 0.65, 0), (56, 0.65, 0), (64, 0, 0), (90, 0, 0)])
    a.lid([(0, 0), (74, 0), (77, 100), (80, 0), (90, 0)])
    a.stat("Arm45", "r", 52)
    a.stat("Arm-45", "r", -52)
    a.set("Arm0", "s", [(0, (100, 100)), (12, (102, 106)), (60, (102, 106)), (74, (100, 100)),
                        (90, (100, 100))])
    a.set("Arm90", "s", [(0, (100, 100)), (12, (102, 106)), (60, (102, 106)), (74, (100, 100)),
                         (90, (100, 100))])
    a.set("Shadow", "s", [(0, (100, 100)), (12, (82, 82)), (20, (104, 104)), (30, (100, 100)),
                          (90, (100, 100))])


@state("sleeping", 240, loop=True, accents=("StatusDot",))
def sleeping(a):
    # Fully asleep (sleepy is *fighting* it; this one lost): tilted, deflated, huge
    # slow breaths, a Z-bubble each cycle, one little dream-twitch.
    a.stat("Root", "r", 8)
    a.set("Root", "p", [(0, (256, 254)), (60, (256, 257)), (120, (256, 254)), (180, (256, 257)),
                        (240, (256, 254))])
    a.set("Face", "s", [(0, (105, 94)), (60, (98, 103)), (120, (105, 94)), (180, (98, 103)),
                        (240, (105, 94))])
    a.lid_stat(92)
    a.gaze_stat(0, 0.3)
    a.set("Arm45", "r", [(0, 62), (126, 62), (132, 58), (138, 62), (240, 62)])
    a.stat("Arm-45", "r", -62)
    a.stat("Arm45", "s", (100, 88))
    a.stat("Arm-45", "s", (100, 88))
    a.stat("Arm0", "s", (100, 92))
    a.stat("Arm90", "s", (100, 92))
    zp = []
    for k in range(2):
        b = k * 120
        zp += [(b, (302, 148)), (b + 30, (302, 148)), (b + 60, (318, 116)), (b + 90, (334, 86)),
               (b + 108, (340, 74))]
    zp += [(240, (302, 148))]
    a.set("StatusDot", "p", zp)
    zo = []
    for k in range(2):
        b = k * 120
        zo += [(b, 0), (b + 30, 0), (b + 44, 90), (b + 90, 90), (b + 106, 0)]
    zo += [(240, 0)]
    a.set("StatusDot", "o", zo)
    a.set("StatusDot", "s", [(0, (90, 90)), (108, (165, 165)), (120, (90, 90)), (228, (165, 165)),
                             (240, (90, 90))])
    a.set("Shadow", "s", [(0, (103, 103)), (60, (100, 100)), (120, (103, 103)), (180, (100, 100)),
                          (240, (103, 103))])


@state("stargaze", 216, loop=True, accents=("Star1", "Star2"))
def stargaze(a):
    # Leaning back watching REAL stars: big yellow five-pointers twinkle at three sky
    # points (scale-pulse + slow turn) while the huge soft pupil follows. Pure wonder.
    a.stat("Root", "r", -5)
    a.set("Root", "p", [(0, (256, 252)), (108, (256, 250)), (216, (256, 252))])
    a.gaze([(0, -0.5, -0.8), (58, -0.5, -0.8), (68, 0.1, -0.9), (128, 0.1, -0.9),
            (138, 0.6, -0.75), (196, 0.6, -0.75), (208, -0.5, -0.8), (216, -0.5, -0.8)])
    a.tr_stat("Pupil", "s", (118, 118))
    a.hl([(0, 118), (108, 126), (216, 118)])
    a.lid([(0, 0), (60, 0), (64, 100), (69, 0), (130, 0), (134, 100), (139, 0), (216, 0)])
    # Star1 takes fixations 1 and 3, Star2 takes fixation 2 — each twinkles big
    a.set("Star1", "p", [(0, (168, 82)), (60, (168, 82)), (70, (352, 92)), (216, (352, 92))])
    a.set("Star1", "o", [(0, 0), (12, 100), (30, 60), (48, 100), (58, 0), (140, 0), (150, 100),
                         (168, 60), (186, 100), (198, 0), (216, 0)])
    a.set("Star1", "s", [(0, (80, 80)), (30, (135, 135)), (56, (85, 85)), (140, (80, 80)),
                         (168, (135, 135)), (198, (80, 80)), (216, (80, 80))])
    a.set("Star1", "r", [(0, 0), (216, 60)])
    a.stat("Star2", "p", (268, 58))
    a.set("Star2", "o", [(0, 0), (70, 0), (80, 100), (100, 60), (118, 100), (130, 0), (216, 0)])
    a.set("Star2", "s", [(0, (80, 80)), (70, (80, 80)), (100, (140, 140)), (130, (85, 85)),
                         (216, (80, 80))])
    a.set("Star2", "r", [(0, 0), (216, -45)])
    a.stat("Arm45", "r", 50)
    a.stat("Arm-45", "r", -50)
    a.set("Face", "s", [(0, (99, 102)), (108, (100.5, 99.5)), (216, (99, 102))])

@state("hiccup", 96, loop=False)
def hiccup(a):
    # Three involuntary hics — big, medium, tiny — each a sudden hop-squash with a
    # startled blink, then a wary "is it over?" relief exhale.
    a.set("Root", "p", [(0, (256, 250)), (10, (256, 250)), (13, (256, 240)), (19, (256, 253)),
                        (24, (256, 250)), (42, (256, 250)), (45, (256, 243)), (51, (256, 252)),
                        (56, (256, 250)), (68, (256, 250)), (71, (256, 246)), (76, (256, 251)),
                        (81, (256, 250)), (96, (256, 250))])
    a.set("Face", "s", [(0, (100, 100)), (10, (100, 100)), (13, (94, 108)), (19, (106, 94)),
                        (26, (100, 100)), (42, (100, 100)), (45, (95, 106)), (51, (104, 96)),
                        (58, (100, 100)), (68, (100, 100)), (71, (97, 104)), (76, (102, 98)),
                        (82, (100, 100)), (88, (99, 102)), (96, (100, 100))])
    a.lid([(0, 0), (11, 0), (14, 60), (20, 0), (26, 0), (29, 100), (32, 0), (43, 0), (46, 55),
           (52, 0), (58, 35), (66, 35), (69, 50), (75, 0), (84, 0), (96, 0)])
    a.pupil([(0, 100), (12, 100), (15, 115), (24, 100), (44, 100), (47, 112), (54, 100),
             (70, 108), (80, 100), (96, 100)])
    a.gaze([(0, 0, 0), (12, 0, 0), (15, 0, -0.4), (24, 0, 0), (34, -0.3, 0), (42, -0.3, 0),
            (46, 0, -0.35), (54, 0, 0), (62, 0.3, 0), (68, 0.3, 0), (72, 0, -0.25),
            (80, 0, 0), (96, 0, 0)])
    a.set("Arm45", "r", [(0, 45), (12, 45), (14, 49), (22, 45), (44, 45), (46, 48), (54, 45),
                         (70, 47), (78, 45), (96, 45)])
    a.set("Arm-45", "r", [(0, -45), (12, -45), (14, -49), (22, -45), (44, -45), (46, -48),
                          (54, -45), (70, -47), (78, -45), (96, -45)])
    a.set("Shadow", "s", [(0, (100, 100)), (13, (94, 94)), (20, (103, 103)), (26, (100, 100)),
                          (45, (96, 96)), (52, (102, 102)), (58, (100, 100)), (71, (97, 97)),
                          (78, (100, 100)), (96, (100, 100))])




# --- conversational beat-gesture composer (speaking variants) ---------------------
ARM_REST_R = {"Arm0": 0, "Arm90": 90, "Arm45": 45, "Arm-45": -45}


def talk(a, op, beats, lean=1.5, bob=2.0):
    """Compose a speaking loop from beat gestures. beats: [(t, arm, kind, amp)].
    Kinds: raise (lift + lengthen), pulse2 (double pop), sweep (arcing swing),
    spread (Arm90 opens wide, Arm0 counters), vpulse (vertical-arm nod),
    both (both diagonals raise together). All four arms get work.
    Emits arm r/s plus a beat-synced talk-bob (Root.p / Face.s)."""
    r_keys = {arm: [(0, rest)] for arm, rest in ARM_REST_R.items()}
    s_keys = {arm: [(0, (100, 100))] for arm in ARM_REST_R}
    bob_times = []

    def sgn(arm):
        return -1 if arm in ("Arm45", "Arm0") else 1

    for t, arm, kind, amp in beats:
        if kind == "raise":
            d = 14 * amp * sgn(arm)
            r_keys[arm] += [(t, ARM_REST_R[arm]), (t + 12, ARM_REST_R[arm] + d),
                            (t + 26, ARM_REST_R[arm] + d * 0.85), (t + 40, ARM_REST_R[arm])]
            s_keys[arm] += [(t, (100, 100)), (t + 12, (97, 100 + 17 * amp)),
                            (t + 26, (98, 100 + 13 * amp)), (t + 40, (100, 100))]
            bob_times.append(t + 12)
        elif kind == "pulse2":
            d = 7 * amp * sgn(arm)
            r_keys[arm] += [(t, ARM_REST_R[arm]), (t + 8, ARM_REST_R[arm] + d),
                            (t + 15, ARM_REST_R[arm] + d * 0.3), (t + 22, ARM_REST_R[arm] + d),
                            (t + 32, ARM_REST_R[arm])]
            s_keys[arm] += [(t, (100, 100)), (t + 8, (98, 100 + 11 * amp)), (t + 15, (100, 102)),
                            (t + 22, (98, 100 + 11 * amp)), (t + 32, (100, 100))]
            bob_times += [t + 8, t + 22]
        elif kind == "sweep":
            d = 16 * amp * sgn(arm)
            r_keys[arm] += [(t, ARM_REST_R[arm]), (t + 18, ARM_REST_R[arm] + d),
                            (t + 36, ARM_REST_R[arm] - d * 0.35), (t + 50, ARM_REST_R[arm])]
            s_keys[arm] += [(t, (100, 100)), (t + 18, (98, 100 + 9 * amp)),
                            (t + 36, (99, 100 + 6 * amp)), (t + 50, (100, 100))]
            bob_times.append(t + 18)
        elif kind == "spread":
            s_keys["Arm90"] += [(t, (100, 100)), (t + 16, (103, 100 + 16 * amp)),
                                (t + 30, (102, 100 + 12 * amp)), (t + 44, (100, 100))]
            s_keys["Arm0"] += [(t, (100, 100)), (t + 16, (100, 100 + 5 * amp)), (t + 44, (100, 100))]
            bob_times.append(t + 16)
        elif kind == "vpulse":
            s_keys["Arm0"] += [(t, (100, 100)), (t + 10, (99, 100 + 9 * amp)),
                               (t + 20, (100, 101)), (t + 30, (100, 100))]
            bob_times.append(t + 10)
        elif kind == "both":
            for da in ("Arm45", "Arm-45"):
                d = 14 * amp * sgn(da)
                r_keys[da] += [(t, ARM_REST_R[da]), (t + 12, ARM_REST_R[da] + d),
                               (t + 28, ARM_REST_R[da] + d * 0.8), (t + 42, ARM_REST_R[da])]
                s_keys[da] += [(t, (100, 100)), (t + 12, (97, 100 + 15 * amp)),
                               (t + 28, (98, 100 + 12 * amp)), (t + 42, (100, 100))]
            bob_times.append(t + 12)

    for arm in ARM_REST_R:
        rk = sorted(r_keys[arm]) + [(op, ARM_REST_R[arm])]
        sk = sorted(s_keys[arm]) + [(op, (100, 100))]
        if len(rk) > 2:
            a.set(arm, "r", rk)
        if len(sk) > 2:
            a.set(arm, "s", sk)
    # beat-synced talk-bob and squash tick
    pk = [(0, (256, 250))]
    fk = [(0, (100, 100))]
    for bt in sorted(set(bob_times)):
        pk += [(bt - 6, (256, 250)), (bt, (256, 250 + bob)), (bt + 10, (256, 250))]
        fk += [(bt - 6, (100, 100)), (bt, (100 + bob * 0.6, 100 - bob * 0.6)), (bt + 10, (100, 100))]
    a.set("Root", "p", pk + [(op, (256, 250))])
    a.set("Face", "s", fk + [(op, (100, 100))])
    a.set("Root", "r", [(0, 0), (30, lean), (op - 40, lean * 0.6), (op, 0)])


@state("speaking", 540, loop=True)
def speaking_explainer(a):
    # Variant 1, "the explainer": nine seconds, three measured phrases with real
    # breaths between; every arm gets a turn. Eye calmly on the listener.
    talk(a, 540, [
        (30, "Arm45", "raise", 1.0), (85, "Arm90", "spread", 1.0), (140, "Arm-45", "sweep", 1.0),
        # breath
        (235, "Arm45", "pulse2", 1.0), (290, "Arm0", "vpulse", 1.0), (335, "Arm90", "spread", 1.2),
        # breath
        (415, "Arm-45", "raise", 1.1), (465, "Arm45", "sweep", 0.9),
    ])
    a.gaze([(0, 0, 0), (90, 0, 0), (97, 0.18, -0.1), (140, 0.18, -0.1), (148, 0, 0),
            (330, 0, 0), (338, -0.14, -0.08), (382, -0.14, -0.08), (390, 0, 0), (540, 0, 0)])
    a.pupil([(0, 102), (92, 102), (100, 108), (150, 102), (332, 102), (340, 108), (392, 102),
             (540, 102)])
    a.lid([(0, 0), (188, 0), (191, 100), (194, 0), (398, 0), (401, 100), (404, 0), (540, 0)])


@state("speaking-2", 540, loop=True)
def speaking_enumerator(a):
    # Variant 2, "the enumerator": counting points off — brisk alternating raises with
    # tidy pauses, a vertical-arm nod, and one wide spread as the summary.
    talk(a, 540, [
        (35, "Arm45", "raise", 0.9), (100, "Arm-45", "raise", 0.9), (165, "Arm45", "raise", 1.0),
        (228, "Arm0", "vpulse", 1.1),
        # breath
        (320, "Arm-45", "pulse2", 1.0), (378, "Arm45", "pulse2", 1.0),
        (445, "Arm90", "spread", 1.3),
    ], lean=1.2, bob=2.4)
    a.gaze([(0, 0, 0), (222, 0, 0), (230, 0.15, -0.14), (268, 0.15, -0.14), (276, 0, 0),
            (438, 0, 0), (446, -0.1, -0.1), (488, -0.1, -0.1), (496, 0, 0), (540, 0, 0)])
    a.pupil([(0, 102), (440, 102), (450, 110), (500, 102), (540, 102)])
    a.lid([(0, 0), (140, 0), (143, 100), (146, 0), (296, 0), (299, 100), (302, 0),
           (508, 0), (511, 100), (514, 0), (540, 0)])


@state("speaking-3", 540, loop=True)
def speaking_storyteller(a):
    # Variant 3, "the storyteller": flowing arcs instead of beats — long sweeps, a
    # gentle continuous sway, dreamier dilated eye, unhurried everywhere.
    talk(a, 540, [
        (50, "Arm45", "sweep", 1.1), (145, "Arm-45", "sweep", 1.1), (240, "Arm90", "spread", 1.0),
        (330, "Arm45", "sweep", 0.9), (420, "Arm-45", "sweep", 1.0), (485, "Arm0", "vpulse", 0.8),
    ], lean=2.0, bob=1.4)
    a.set("Root", "r", [(t, v) for t, v in sine(1.2, 2, 180, 0, 540, phase=0, step=45)])
    a.gaze([(0, 0, 0), (120, 0.1, -0.06), (250, -0.1, -0.04), (380, 0.08, 0.05), (540, 0, 0)])
    a.tr_stat("Pupil", "s", (106, 106))
    a.hl([(0, 106), (270, 112), (540, 106)])
    a.lid([(0, 0), (168, 0), (171, 100), (174, 0), (388, 0), (391, 100), (394, 0), (540, 0)])


@state("speaking-4", 540, loop=True)
def speaking_emphatic(a):
    # Variant 4, "the emphatic": bigger energy — both diagonals rising together on the
    # strong points, a deeper lean-in, harder bob. For lines that matter.
    talk(a, 540, [
        (35, "both", "both", 1.1), (120, "Arm90", "spread", 1.2), (190, "Arm45", "pulse2", 1.2),
        # breath
        (285, "both", "both", 1.3), (365, "Arm0", "vpulse", 1.2), (430, "Arm-45", "pulse2", 1.1),
        (490, "Arm90", "spread", 1.0),
    ], lean=2.5, bob=3.0)
    a.gaze([(0, 0, 0), (30, 0, -0.08), (110, 0, -0.08), (118, 0.16, -0.12), (168, 0.16, -0.12),
            (176, 0, 0), (278, 0, -0.1), (352, 0, -0.1), (360, 0, 0), (540, 0, 0)])
    a.pupil([(0, 104), (32, 110), (200, 104), (282, 110), (400, 104), (540, 104)])
    a.lid([(0, 0), (218, 0), (221, 100), (224, 0), (456, 0), (459, 100), (462, 0), (540, 0)])

# ---------------------------------------------------------------------------
# INTERACTIVITY (hover / press)
# ---------------------------------------------------------------------------

@state("attentive", 120, loop=True)
def attentive(a):
    # Hover response: perks up instantly — leans toward the viewer, arms lifted,
    # big bright pupil locked on you, a curious micro-tilt and one eager double-blink.
    a.set("Root", "p", [(0, (256, 246)), (30, (256, 244)), (60, (256, 246)), (90, (256, 244)),
                        (120, (256, 246))])
    a.set("Root", "r", [(0, 0), (30, 2), (66, -2), (100, 1), (120, 0)])
    a.set("Face", "s", [(0, (98, 103)), (60, (97, 104)), (120, (98, 103))])
    a.stat("Arm45", "r", 40)
    a.stat("Arm-45", "r", -40)
    a.set("Arm45", "s", [(0, (100, 104)), (60, (100, 107)), (120, (100, 104))])
    a.set("Arm-45", "s", [(0, (100, 104)), (60, (100, 107)), (120, (100, 104))])
    a.set("Arm0", "s", [(0, (100, 103)), (60, (100, 105)), (120, (100, 103))])
    a.gaze([(0, 0, 0), (46, 0, 0), (52, 0.15, -0.1), (72, 0.15, -0.1), (78, 0, 0), (120, 0, 0)])
    a.tr_stat("Pupil", "s", (112, 112))
    a.hl([(0, 115), (60, 122), (120, 115)])
    a.lid([(0, 0), (56, 0), (59, 100), (62, 0), (66, 100), (69, 0), (120, 0)])
    a.set("Shadow", "s", [(0, (97, 97)), (60, (96, 96)), (120, (97, 97))])
    a.stat("Shadow", "o", 17)


@state("boop", 66, loop=False, accents=("Star1",))
def boop(a):
    # Press response: an instant poke-squash with eyes squeezed shut, then a springy
    # overshoot rebound, a delighted wide-pupil sparkle, and a quick settle.
    a.set("Face", "s", [(0, (100, 100)), (4, (113, 85)), (12, (91, 111)), (20, (105, 96)),
                        (28, (98, 102)), (36, (100, 100)), (66, (100, 100))])
    a.set("Root", "p", [(0, (256, 250)), (4, (256, 257)), (12, (256, 244)), (20, (256, 252)),
                        (28, (256, 249)), (36, (256, 250)), (66, (256, 250))])
    a.set("Arm45", "r", [(0, 45), (4, 40), (12, 56), (22, 42), (32, 45), (66, 45)])
    a.set("Arm-45", "r", [(0, -45), (4, -40), (12, -56), (22, -42), (32, -45), (66, -45)])
    for arm in ("Arm0", "Arm90"):
        a.set(arm, "s", [(0, (100, 100)), (4, (103, 94)), (12, (98, 106)), (22, (101, 98)),
                         (32, (100, 100)), (66, (100, 100))])
    a.lid([(0, 0), (3, 100), (14, 100), (20, 0), (44, 0), (47, 100), (50, 0), (66, 0)])
    a.pupil([(0, 100), (16, 100), (22, 118), (46, 118), (58, 100), (66, 100)])
    a.hl([(0, 100), (16, 100), (24, 130), (48, 118), (60, 100), (66, 100)])
    a.gaze([(0, 0, 0), (18, 0, 0), (24, 0, -0.15), (44, 0, -0.15), (54, 0, 0), (66, 0, 0)])
    a.set("Shadow", "s", [(0, (100, 100)), (4, (105, 105)), (12, (96, 96)), (22, (101, 101)),
                          (32, (100, 100)), (66, (100, 100))])
    a.set("Star1", "p", [(0, (300, 190)), (10, (300, 190)), (32, (346, 128)), (66, (346, 128))])
    a.set("Star1", "o", [(0, 0), (10, 0), (15, 85), (36, 0), (66, 0)])
    a.set("Star1", "s", [(0, (25, 25)), (10, (25, 25)), (24, (110, 110)), (38, (70, 70)), (66, (25, 25))])
    a.set("Star1", "r", [(0, 0), (10, 0), (38, 160), (66, 160)])


# ===========================================================================

ORIGINALS = ("correct", "wrong", "thinking")


def main():
    # keep the hand-edited originals on the same rig (hidden accent layers + yellow)
    for name in ORIGINALS:
        path = os.path.join(SRC, f"{name}.json")
        with open(path) as f:
            doc = upgrade_rig(json.load(f))
        for lyr in doc["layers"]:
            if lyr["nm"] in ("Star1", "Star2", "Prop"):
                lyr["op"] = doc["op"]
        with open(path, "w") as f:
            json.dump(doc, f, separators=(",", ":"))
    written = []
    for name, op, loop, accents, fn in REGISTRY:
        anim = Anim(name, op, loop, accents)
        fn(anim)
        written.append(anim.write())
    print(f"wrote {len(written)} files")
    for p in written:
        print(" ", p)


if __name__ == "__main__":
    main()
