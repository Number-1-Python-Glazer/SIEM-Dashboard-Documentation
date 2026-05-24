#!/usr/bin/env python3
"""Generate dio-guide.js with explicit 32x48 pixel arrays for every animation frame."""
from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "shared" / "dio-guide.js"
W, H = 32, 48


def blank() -> list[list[str | None]]:
    return [[None for _ in range(W)] for _ in range(H)]


def rect(
    grid: list[list[str | None]],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    key: str,
) -> None:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= y < H and 0 <= x < W:
                grid[y][x] = key


def apply_outline(grid: list[list[str | None]]) -> None:
    """Draw OUTLINE on empty neighbours adjacent to filled pixels."""
    snapshot = [row[:] for row in grid]
    for y in range(H):
        for x in range(W):
            if snapshot[y][x] is None:
                continue
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W:
                    if grid[ny][nx] is None:
                        grid[ny][nx] = "OUTLINE"
                elif grid[y][x] != "OUTLINE":
                    # Edge pixels get outline drawn inward if possible
                    if 0 <= ny < H and 0 <= nx < W and grid[ny][nx] is None:
                        grid[ny][nx] = "OUTLINE"


def draw_dio_pose(
    offset_x: int = 0,
    offset_y: int = 0,
    mouth: int = 0,
    eyes_wide: bool = False,
    eyes_glow: bool = False,
    arm_point: bool = False,
    arm_up: bool = False,
    arm_spread: bool = False,
    crouch: int = 0,
    cape_side: int = 0,
    chest_expand: int = 0,
    weight_left: bool = False,
    head_back: bool = False,
    motion_lines: int = 0,
) -> list[list[str | None]]:
    """Draw JoJo Dio at 32x48 — massive hair, heart gem, purple coat, anime jawline."""
    g = blank()
    ox, oy = offset_x, offset_y

    # --- Hair: side volume + rear crown (face draws on top — no floating dome) ---
    rect(g, 11 + ox, 1 + oy, 20 + ox, 2 + oy, "HAIR_MID")
    rect(g, 10 + ox, 2 + oy, 21 + ox, 4 + oy, "HAIR_BRIGHT")
    rect(g, 9 + ox, 3 + oy, 22 + ox, 6 + oy, "HAIR_MID")
    rect(g, 5 + ox, 5 + oy, 10 + ox, 16 + oy, "HAIR_MID")
    rect(g, 21 + ox, 5 + oy, 26 + ox, 16 + oy, "HAIR_MID")
    rect(g, 6 + ox, 7 + oy, 11 + ox, 18 + oy, "HAIR_DARK")
    rect(g, 20 + ox, 7 + oy, 25 + ox, 18 + oy, "HAIR_DARK")
    rect(g, 12 + ox, 8 + oy, 19 + ox, 9 + oy, "HAIR_MID")
    rect(g, 13 + ox, 9 + oy, 18 + ox, 10 + oy, "HAIR_BRIGHT")
    if head_back:
        rect(g, 8 + ox, 0 + oy, 23 + ox, 7 + oy, "HAIR_BRIGHT")

    # --- Heart headband + 2x2 green gem ---
    band_y = 11 + oy
    rect(g, 10 + ox, band_y, 21 + ox, band_y, "BAND_GOLD")
    rect(g, 14 + ox, band_y - 1, 17 + ox, band_y + 1, "GEM_GREEN")
    rect(g, 15 + ox, band_y, 16 + ox, band_y, "GEM_DARK")

    # --- Face / jawline ---
    face_top = 12 + oy
    rect(g, 12 + ox, face_top, 19 + ox, face_top + 1, "SKIN")
    rect(g, 11 + ox, face_top + 2, 20 + ox, face_top + 6, "SKIN")
    rect(g, 11 + ox, face_top + 7, 20 + ox, face_top + 8, "SKIN")
    rect(g, 12 + ox, face_top + 9, 19 + ox, face_top + 9, "SKIN")
    rect(g, 13 + ox, face_top + 10, 18 + ox, face_top + 10, "SKIN")
    # Jawline shadows
    rect(g, 11 + ox, face_top + 7, 11 + ox, face_top + 9, "SKIN_SHADOW")
    rect(g, 20 + ox, face_top + 7, 20 + ox, face_top + 9, "SKIN_SHADOW")
    rect(g, 12 + ox, face_top + 9, 12 + ox, face_top + 10, "SKIN_DARK")
    rect(g, 19 + ox, face_top + 9, 19 + ox, face_top + 10, "SKIN_DARK")
    rect(g, 11 + ox, face_top + 4, 11 + ox, face_top + 6, "SKIN_SHADOW")
    rect(g, 20 + ox, face_top + 5, 20 + ox, face_top + 6, "SKIN_SHADOW")

    # --- Eyes ---
    brow = face_top + 3
    eye = face_top + 4
    eye_key = "EYE_BRIGHT" if eyes_glow else "EYE_PURPLE"
    if eyes_wide:
        rect(g, 12 + ox, brow, 14 + ox, brow, "OUTLINE")
        rect(g, 17 + ox, brow, 19 + ox, brow, "OUTLINE")
        rect(g, 12 + ox, eye, 14 + ox, eye + 1, "EYE_WHITE")
        rect(g, 17 + ox, eye, 19 + ox, eye + 1, "EYE_WHITE")
        rect(g, 13 + ox, eye, 13 + ox, eye, eye_key)
        rect(g, 18 + ox, eye, 18 + ox, eye, eye_key)
    else:
        rect(g, 12 + ox, brow, 14 + ox, brow, "OUTLINE")
        rect(g, 17 + ox, brow, 19 + ox, brow, "OUTLINE")
        rect(g, 13 + ox, eye, 14 + ox, eye, "EYE_WHITE")
        rect(g, 13 + ox, eye, 13 + ox, eye, eye_key)
        rect(g, 18 + ox, eye, 19 + ox, eye, "EYE_WHITE")
        rect(g, 18 + ox, eye, 18 + ox, eye, eye_key)

    # --- Mouth (0-5 talk states) ---
    my = face_top + 8
    if mouth == 0:
        rect(g, 14 + ox, my, 17 + ox, my, "LIP_DARK")
        rect(g, 17 + ox, my - 1, 17 + ox, my - 1, "LIP_DARK")  # smirk
    elif mouth == 1:
        rect(g, 14 + ox, my, 17 + ox, my, "LIP_DARK")
        rect(g, 15 + ox, my, 16 + ox, my, "TOOTH")
    elif mouth == 2:
        rect(g, 13 + ox, my - 1, 18 + ox, my + 1, "LIP_DARK")
        rect(g, 14 + ox, my, 17 + ox, my, "TOOTH")
        rect(g, 15 + ox, my + 1, 16 + ox, my + 1, "TONGUE")
    elif mouth == 3:
        rect(g, 14 + ox, my, 17 + ox, my + 1, "LIP_DARK")
        rect(g, 15 + ox, my, 16 + ox, my, "TOOTH")
        rect(g, 13 + ox, face_top + 3, 14 + ox, face_top + 3, "OUTLINE")
        rect(g, 18 + ox, face_top + 3, 19 + ox, face_top + 3, "OUTLINE")
    elif mouth == 4:
        rect(g, 14 + ox, my, 17 + ox, my, "LIP_DARK")
        rect(g, 15 + ox, my, 16 + ox, my, "TOOTH")
    else:
        rect(g, 14 + ox, my, 17 + ox, my, "LIP_DARK")
        rect(g, 14 + ox, my - 1, 14 + ox, my - 1, "LIP_DARK")

    # --- Neck ---
    neck_y = face_top + 11 + crouch // 2
    rect(g, 14 + ox, neck_y, 17 + ox, neck_y + 1, "SKIN")

    # --- Coat / torso (broad shoulders) ---
    chest = neck_y + 2 + crouch
    shoulder_w = 1 + chest_expand
    rect(g, 7 + ox - shoulder_w, chest, 24 + ox + shoulder_w, chest + 12 + crouch, "COAT_MID")
    rect(g, 8 + ox, chest + 1, 23 + ox, chest + 11 + crouch, "COAT_DARK")
    rect(g, 7 + ox - shoulder_w, chest, 24 + ox + shoulder_w, chest, "GOLD_TRIM")
    rect(g, 7 + ox - shoulder_w, chest, 7 + ox - shoulder_w, chest + 2, "GOLD_BRIGHT")
    rect(g, 24 + ox + shoulder_w, chest, 24 + ox + shoulder_w, chest + 2, "GOLD_BRIGHT")
    rect(g, 13 + ox, chest, 18 + ox, chest + 3, "GOLD_TRIM")
    rect(g, 14 + ox, chest + 1, 17 + ox, chest + 8 + crouch, "SHIRT")
    rect(g, 10 + ox, chest + 2, 12 + ox, chest + 8 + crouch, "COAT_LIGHT")
    rect(g, 19 + ox, chest + 2, 21 + ox, chest + 8 + crouch, "COAT_LIGHT")

    # Cape
    if cape_side <= 0:
        rect(g, 4 + ox, chest + 2, 6 + ox, chest + 14 + crouch, "COAT_DARK")
    if cape_side >= 0:
        rect(g, 25 + ox, chest + 2, 27 + ox, chest + 14 + crouch, "COAT_DARK")

    # --- Arms ---
    if arm_spread:
        rect(g, 2 + ox, chest + 1, 6 + ox, chest + 5, "COAT_MID")
        rect(g, 25 + ox, chest + 1, 29 + ox, chest + 5, "COAT_MID")
        rect(g, 1 + ox, chest + 2, 2 + ox, chest + 4, "SKIN")
        rect(g, 29 + ox, chest + 2, 30 + ox, chest + 4, "SKIN")
    elif arm_point:
        rect(g, 22 + ox, chest + 1, 30 + ox, chest + 4, "COAT_MID")
        rect(g, 30 + ox, chest + 1, 31 + ox, chest + 2, "SKIN")
        rect(g, 10 + ox, chest + 3, 14 + ox, chest + 6, "COAT_MID")
        rect(g, 5 + ox, chest + 5, 8 + ox, chest + 12 + crouch, "COAT_MID")
    elif arm_up:
        rect(g, 4 + ox, chest - 2, 8 + ox, chest + 4, "COAT_MID")
        rect(g, 23 + ox, chest - 4, 27 + ox, chest + 2, "COAT_MID")
        rect(g, 24 + ox, chest - 5, 26 + ox, chest - 3, "SKIN")
    else:
        arm_raise = 2 if weight_left else 0
        rect(g, 5 + ox, chest + 4 - arm_raise, 8 + ox, chest + 13 + crouch, "COAT_MID")
        rect(g, 23 + ox, chest + 4, 26 + ox, chest + 13 + crouch, "COAT_MID")

    # --- Legs ---
    ly = chest + 13 + crouch
    if crouch >= 2:
        rect(g, 10 + ox, ly, 14 + ox, 47 + oy, "COAT_DARK")
        rect(g, 17 + ox, ly, 21 + ox, 47 + oy, "COAT_DARK")
    elif crouch == 1:
        rect(g, 10 + ox, ly, 13 + ox, 47 + oy, "COAT_DARK")
        rect(g, 18 + ox, ly, 21 + ox, 47 + oy, "COAT_DARK")
    else:
        rect(g, 11 + ox, ly, 14 + ox, 47 + oy, "COAT_DARK")
        rect(g, 17 + ox, ly, 20 + ox, 47 + oy, "COAT_DARK")

    # Motion lines (dodge)
    if motion_lines:
        streak_y = chest + 5 + oy
        length = motion_lines * 3
        for i in range(length):
            x = max(0, 2 - i + ox)
            if 0 <= streak_y < H and 0 <= x < W:
                g[streak_y][x] = "HAIR_MID"
            if motion_lines > 1 and 0 <= streak_y + 2 < H:
                g[streak_y + 2][max(0, 1 - i + ox)] = "HAIR_MID"
            if motion_lines > 2 and 0 <= streak_y + 4 < H:
                g[streak_y + 4][max(0, ox - i)] = "HAIR_MID"

    apply_outline(g)
    return g


def draw_walk_frame(step: int) -> list[list[str | None]]:
    leg = step % 4
    cape = -1 if step < 4 else 1
    bounce = -1 if step % 2 else 0
    g = draw_dio_pose(offset_y=bounce, cape_side=cape, offset_x=1 if step % 2 else 0)
    ly = 38 + bounce
    if leg == 0:
        rect(g, 9, ly, 13, 47, "COAT_DARK")
        rect(g, 18, ly - 1, 21, 46, "COAT_DARK")
    elif leg == 1:
        rect(g, 10, ly - 1, 14, 47, "COAT_DARK")
        rect(g, 17, ly, 20, 45, "COAT_DARK")
    elif leg == 2:
        rect(g, 11, ly, 14, 47, "COAT_DARK")
        rect(g, 17, ly - 1, 22, 47, "COAT_DARK")
    else:
        rect(g, 9, ly - 1, 12, 46, "COAT_DARK")
        rect(g, 18, ly, 22, 47, "COAT_DARK")
    if step < 4:
        rect(g, 3, 32, 5, 44, "COAT_DARK")
    else:
        rect(g, 26, 32, 28, 44, "COAT_DARK")
    apply_outline(g)
    return g


def draw_dodge_frame(step: int) -> list[list[str | None]]:
    if step == 0:
        return draw_dio_pose(eyes_wide=True)
    if step == 1:
        return draw_dio_pose(crouch=2, eyes_wide=True)
    if step == 2:
        return draw_dio_pose(offset_y=-3, crouch=1, arm_up=True, eyes_wide=True)
    if step == 3:
        return draw_dio_pose(offset_y=-5, arm_up=True, cape_side=1, eyes_wide=True)
    if step == 4:
        return draw_dio_pose(offset_x=3, offset_y=-3, arm_up=True, motion_lines=1)
    if step == 5:
        return draw_dio_pose(offset_x=6, offset_y=-2, arm_point=True, motion_lines=3)
    # Frame 6: flash — 4 HAIR_BRIGHT pixels where Dio was
    g = blank()
    rect(g, 14, 20, 15, 21, "HAIR_BRIGHT")
    return g


def draw_za_frame(step: int) -> list[list[str | None]]:
    if step == 0:
        return draw_dio_pose(arm_spread=True, cape_side=-1)
    if step == 1:
        g = draw_dio_pose(offset_y=-2, arm_spread=True, offset_x=2)
        rect(g, 9, 1, 22, 5, "HAIR_BRIGHT")
        apply_outline(g)
        return g
    if step == 2:
        return draw_dio_pose(offset_y=-3, head_back=True, arm_spread=True)
    if step == 3:
        return draw_dio_pose(arm_point=True, arm_up=True, eyes_glow=True, cape_side=1)
    if step == 4:
        g = draw_dio_pose(eyes_glow=True)
        cx, cy = 16, 24
        for dx, dy in ((0, -6), (0, 6), (6, 0), (-6, 0), (4, -4), (-4, -4), (4, 4), (-4, 4)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < W and 0 <= ny < H:
                g[ny][nx] = "GOLD_BRIGHT"
        return g
    return draw_dio_pose(chest_expand=0)


def grid_to_js_rows(grid: list[list[str | None]], indent: str = "    ") -> str:
    """One palette key per line inside each row array."""
    lines: list[str] = []
    for row in grid:
        lines.append(f"{indent}[")
        for cell in row:
            if cell is None:
                lines.append(f"{indent}  null,")
            else:
                lines.append(f"{indent}  '{cell}',")
        lines.append(f"{indent}],")
    return "\n".join(lines)


def build_frames() -> dict[str, list[list[list[str | None]]]]:
    frames: dict[str, list[list[list[str | None]]]] = {}

    frames["IDLE_FRAMES"] = [
        draw_dio_pose(),
        draw_dio_pose(chest_expand=1, offset_x=1),
        draw_dio_pose(),
        draw_dio_pose(weight_left=True, offset_x=-1, cape_side=-1),
    ]

    frames["WALK_FRAMES"] = [draw_walk_frame(i) for i in range(8)]

    frames["POINT_FRAMES"] = [
        draw_dio_pose(arm_point=False),
        draw_dio_pose(arm_point=True),
        draw_dio_pose(arm_point=True, cape_side=1),
        draw_dio_pose(arm_point=True, cape_side=0),
    ]

    frames["DODGE_FRAMES"] = [draw_dodge_frame(i) for i in range(7)]

    frames["TALK_FRAMES"] = [draw_dio_pose(offset_y=-1, mouth=m) for m in range(6)]

    frames["ZA_WARUDO_FRAMES"] = [draw_za_frame(i) for i in range(6)]

    frames["HOVER_FRAMES"] = [
        draw_dio_pose(offset_y=0),
        draw_dio_pose(offset_y=-2),
    ]

    return frames


STORYLINE_JS = r'''
var DIO_STORYLINE = {
  'index': {
    enter: [
      "You have arrived at HABIBI-SIEM. I am DIO, your operations guide.",
      "Operation MERIDIAN-7 — thirteen trials, one breach, one story.",
      "Click the button below when you are ready. Only I can begin your investigation."
    ],
    tips: [
      "Each module unlocks the next in sequence.",
      "Complete all 13 to unlock your Analyst Debrief Report."
    ],
    nextAction: { label: "Begin Operation MERIDIAN-7", url: "experience-modules/game1-terminal/index.html" }
  },
  'game1-terminal': {
    enter: [
      "The Terminal. Where all analysts begin.",
      "Type commands. The system responds. Learn to read what it tells you.",
      "This is reconnaissance — the first phase of every investigation.",
      "Complete all 5 levels. I will be watching."
    ],
    level1: ["Level 1. Basic commands. Type: ls, then pwd, whoami, date, echo hello."],
    level2: ["Chain commands. find . -name '*.log' -mmin -60"],
    level3: ["grep 192.168.1.100 auth.log — watch the load bar."],
    level4: ["grep ACCESS, CMD, MODIFY, NET — rebuild the timeline."],
    level5: ["Epilogue. Your choices carry forward to The Breach."],
    complete: ["WRYYY. The Breach awaits. An incident is already in progress."],
    nextAction: { label: "Enter The Breach", url: "experience-modules/game2-breach/index.html" }
  },
  'game2-breach': {
    enter: [
      "The Breach. Alerts incoming. SQL injection. Brute force. Lateral movement.",
      "Triage correctly. Alert the right team.",
      "Your Terminal report already told me your approach."
    ],
    level1: ["SQL injection from 185.193.88.14. BLOCK IP first, then ALERT DEV."],
    level2: ["Five alerts. Five minutes. Match each alert to the correct playbook action."],
    level3: ["INVESTIGATE LOGS before BLOCK IP. Sequence matters."],
    level4: ["LOCKBIT-3 ransomware. Patient zero first, then contain, then escalate."],
    complete: ["Contained. The Ghost Network holds the lateral movement evidence."],
    nextAction: { label: "Enter The Ghost Network", url: "experience-modules/game3-network/index.html" }
  },
  'game3-network': {
    enter: ["The Ghost Network. Click nodes. Trace lateral movement."],
    level1: ["Find DC-01. The Domain Controller."],
    level2: ["Flag anomalous RDP from WS-003 to DC-01."],
    level3: ["Attacker enumerates. Next target: DB-01."],
    level4: ["C2 beats every 10 seconds. Find the pulse."],
    complete: ["The network told you everything. The Cipher is next."],
    nextAction: { label: "Enter The Cipher", url: "experience-modules/game4-cipher/index.html" }
  },
  'game4-cipher': {
    enter: ["The Cipher. Caesar. Substitution. Enigma. RSA."],
    level1: ["URYYB JBEYQ. Shift 13."],
    level2: ["Frequency analysis. E dominates English."],
    level3: ["Enigma rotors. Find the combination."],
    level4: ["RSA N=3233. Factor it."],
    complete: ["You can read their traffic. The Simulation shows the full kill chain."],
    nextAction: { label: "Enter The Simulation", url: "experience-modules/game5-simulation/index.html" }
  },
  'game5-simulation': {
    enter: ["The Simulation. Full MITRE kill chain."],
    level1: ["Reconnaissance detected. Block or segment."],
    level2: ["Phishing delivery. Choose your control."],
    level3: ["CVE-2024-1234 exploitation window."],
    level4: ["C2 and lateral movement. Stop both if you can."],
    complete: ["The Interrogation Room holds the decoded commands."],
    nextAction: { label: "Enter The Interrogation Room", url: "experience-modules/game6-intercept/index.html" }
  },
  'game6-intercept': {
    enter: ["The Interrogation Room. Decode C2. Extract IOCs."],
    complete: ["Playbook exposed. The Forge awaits."],
    nextAction: { label: "Enter The Forge", url: "experience-modules/game7-forge/index.html" }
  },
  'game7-forge': {
    enter: ["The Forge. Write detection rules. Catch malicious. Ignore benign."],
    complete: ["Rules written. Test them in The Deep Archive."],
    nextAction: { label: "Enter The Deep Archive", url: "experience-modules/game8-archive/index.html" }
  },
  'game8-archive': {
    enter: ["The Deep Archive. Sort logs. Reconstruct the timeline."],
    complete: ["Timeline complete. See the attack from the other side — The Heist."],
    nextAction: { label: "Enter The Heist", url: "experience-modules/game9-heist/index.html" }
  },
  'game9-heist': {
    enter: ["The Heist. Plan the attack path. Fewest hops. Least monitored."],
    complete: ["Both sides seen. Analyse the malware in The Lab."],
    nextAction: { label: "Enter The Lab", url: "experience-modules/game10-lab/index.html" }
  },
  'game10-lab': {
    enter: ["The Lab. Static analysis. Dynamic behaviour. Extract IOCs."],
    complete: ["Sample profiled. Cartography shows attribution."],
    nextAction: { label: "Enter The Cartography", url: "experience-modules/game11-cartography/index.html" }
  },
  'game11-cartography': {
    enter: ["The Cartography. Attribute the actor. Click the origin region."],
    complete: ["Attribution filed. The Memorial documents the lesson."],
    nextAction: { label: "Enter The Memorial", url: "experience-modules/game12-memorial/index.html" }
  },
  'game12-memorial': {
    enter: ["The Memorial. Root cause. Remediation. Document it."],
    complete: ["One trial remains. The Resonance."],
    nextAction: { label: "Enter The Resonance", url: "experience-modules/game13-resonance/index.html" }
  },
  'game13-resonance': {
    enter: ["The Resonance. Tune thresholds. Maximise signal."],
    complete: [
      "ZA WARUDO.",
      "All 13 trials complete.",
      "You traced MERIDIAN-7 from first alert to attribution.",
      "Your Debrief Report is ready.",
      "WRYYY."
    ],
    nextAction: { label: "View Debrief Report", url: "debrief.html" }
  },
  'terminal': { enter: ["Classic terminal experience. For 3D command center, use the 3D link."], nextAction: { label: "3D Terminal", url: "experience-modules/game1-terminal/index.html" } },
  'breach': { enter: ["Classic breach sim. 3D triage module available."], nextAction: { label: "3D Breach", url: "experience-modules/game2-breach/index.html" } },
  'network': { enter: ["Ghost Network classic view."], nextAction: { label: "3D Network", url: "experience-modules/game3-network/index.html" } },
  'cipher': { enter: ["Cipher vault classic."], nextAction: { label: "3D Cipher", url: "experience-modules/game4-cipher/index.html" } },
  'sim': { enter: ["Kill chain classic sim."], nextAction: { label: "3D Simulation", url: "experience-modules/game5-simulation/index.html" } },
  'intercept': { enter: ["Intercept room classic."], nextAction: { label: "3D Interrogation", url: "experience-modules/game6-intercept/index.html" } },
  'forge': { enter: ["Rule forge classic."], nextAction: { label: "3D Forge", url: "experience-modules/game7-forge/index.html" } },
  'archive': { enter: ["Deep archive classic."], nextAction: { label: "3D Archive", url: "experience-modules/game8-archive/index.html" } },
  'heist': { enter: ["Heist classic."], nextAction: { label: "3D Heist", url: "experience-modules/game9-heist/index.html" } },
  'lab': { enter: ["Detection lab classic."], nextAction: { label: "3D Lab", url: "experience-modules/game10-lab/index.html" } },
  'cartography': { enter: ["Threat globe classic."], nextAction: { label: "3D Cartography", url: "experience-modules/game11-cartography/index.html" } },
  'memorial': { enter: ["Memorial classic."], nextAction: { label: "3D Memorial", url: "experience-modules/game12-memorial/index.html" } },
  'resonance': { enter: ["Resonance classic."], nextAction: { label: "3D Resonance", url: "experience-modules/game13-resonance/index.html" } },
  'debrief': { enter: ["Operation MERIDIAN-7 debrief. Your analyst report."], nextAction: { label: "Return to Hub", url: "index.html" } }
};

var RECRUITER_SCRIPT = [
  "Welcome. I am DIO. I will give you the 90-second overview.",
  "HABIBI-SIEM is a Security Operations Centre simulator built entirely in-browser.",
  "13 games. Each teaches one phase of real SOC work — from log analysis to malware sandboxing.",
  "Built with Three.js, Cannon-es physics, and a shared progression engine.",
  "Game 1: The Terminal. CLI threat reconnaissance. MITRE T1059.",
  "Game 2: The Breach. Incident response triage. NIST RS.RP-1.",
  "Game 6: The Interrogation Room. C2 communication decoding. MITRE T1071.",
  "Game 7: The Forge. Detection rule engineering. SIGMA and YARA.",
  "Game 11: The Cartography. Threat actor attribution. MITRE Groups.",
  "Together the 13 games cover all 5 NIST CSF functions: Identify, Protect, Detect, Respond, Recover.",
  "The detection engine in the companion dashboard maps to STRIDE and MITRE ATT&CK.",
  "28 modules. 245 guides. One connected investigation across 13 playable experiences.",
  "That is HABIBI-SIEM. ZA WARUDO."
];
'''

DIO_CLASSES = r'''
var DIO_PALETTE = {
  SKIN:           '#F5DEB3',
  SKIN_SHADOW:    '#D4A870',
  SKIN_DARK:      '#B8864E',
  OUTLINE:        '#0A0008',
  HAIR_BRIGHT:    '#FFE800',
  HAIR_MID:       '#D4B800',
  HAIR_DARK:      '#A08A00',
  HAIR_SHADOW:    '#6A5C00',
  GEM_GREEN:      '#00FF66',
  GEM_DARK:       '#00AA44',
  BAND_GOLD:      '#C8A020',
  COAT_DARK:      '#1A0A2E',
  COAT_MID:       '#2A1A4A',
  COAT_LIGHT:     '#3D2A6A',
  GOLD_TRIM:      '#C8A020',
  GOLD_BRIGHT:    '#FFD700',
  EYE_PURPLE:     '#8040C0',
  EYE_BRIGHT:     '#AA66FF',
  EYE_WHITE:      '#FFFFFF',
  EYE_DARK:       '#401880',
  TOOTH:          '#F0F0E8',
  TOOTH_SHADOW:   '#C8C8B8',
  LIP_DARK:       '#8B2020',
  TONGUE:         '#CC4444',
  SHIRT:          '#F0E8D0',
  SHADOW:         '#0A0412',
  TRANSPARENT:    null
};

function DioSprite(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.pixelSize = 4;
  this.gridW = 32;
  this.gridH = 48;
  this.currentAnimation = 'idle';
  this.currentFrame = 0;
  this.frameTimer = 0;
  this.guide = null;
  this.animations = {
    idle: { frames: IDLE_FRAMES, loop: true, fps: 8 },
    walk: { frames: WALK_FRAMES, loop: true, fps: 12 },
    point: { frames: POINT_FRAMES, loop: false, fps: 8 },
    dodge: { frames: DODGE_FRAMES, loop: false, fps: 16 },
    talk: { frames: TALK_FRAMES, loop: true, fps: 10 },
    za_warudo: { frames: ZA_WARUDO_FRAMES, loop: false, fps: 10 },
    hover: { frames: HOVER_FRAMES, loop: true, fps: 4 }
  };
}

DioSprite.prototype.drawFrame = function (frameData, offsetX, offsetY) {
  var row, col, colour;
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  for (row = 0; row < this.gridH; row++) {
    for (col = 0; col < this.gridW; col++) {
      colour = frameData[row][col];
      if (colour === null) continue;
      this.ctx.fillStyle = DIO_PALETTE[colour];
      this.ctx.fillRect(
        offsetX + col * this.pixelSize,
        offsetY + row * this.pixelSize,
        this.pixelSize,
        this.pixelSize
      );
    }
  }
};

DioSprite.prototype.update = function (dt) {
  this.frameTimer += dt;
  var anim = this.animations[this.currentAnimation];
  var frameDuration = 1000 / anim.fps;
  if (this.frameTimer >= frameDuration) {
    this.frameTimer = 0;
    this.currentFrame++;
    if (this.currentFrame >= anim.frames.length) {
      if (anim.loop) {
        this.currentFrame = 0;
      } else {
        this.currentFrame = anim.frames.length - 1;
        this.onAnimationComplete(this.currentAnimation);
      }
    }
  }
};

DioSprite.prototype.playAnimation = function (name) {
  if (this.currentAnimation === name) return;
  this.currentAnimation = name;
  this.currentFrame = 0;
  this.frameTimer = 0;
};

DioSprite.prototype.onAnimationComplete = function (animName) {
  if (animName === 'point' || animName === 'talk') this.playAnimation('idle');
  if (animName === 'za_warudo') this.playAnimation('idle');
  if (animName === 'dodge' && this.guide) this.guide.onDodgeComplete();
};

function DioGuide() {
  this.container = null;
  this.canvas = null;
  this.speechBubble = null;
  this.speechText = null;
  this.sprite = null;
  this.x = window.innerWidth * 0.85;
  this.y = window.innerHeight * 0.6;
  this.isDodging = false;
  this.isVisible = true;
  this.dialogueQueue = [];
  this.lastMouseX = 0;
  this.lastMouseY = 0;
  this.floatOffset = 0;
  this.floatDir = 1;
  this.storylinePosition = null;
  this.animFrame = null;
  this.autoAdvanceTimer = null;
  this.recruiterMode = false;
  this.recruiterIndex = 0;
  this.recruiterStart = 0;
  this.levelTrackInterval = null;
  this.lastLevel = null;
  this.gameCompleteShown = false;
  this.pendingAction = null;
  this.isLanding = false;
  this.landingFloat = 0;
  this.panelClickActive = false;
}

DioGuide.prototype.init = function () {
  var params = new URLSearchParams(window.location.search);
  this.recruiterMode = params.get('recruiter') === 'true';
  this.buildDOM();
  this.bindEvents();
  this.detectCurrentPage();
  this.initLevelTracking();
  if (this.recruiterMode) this.startRecruiterTour();
  this.startLoop();
  var self = this;
  window.addEventListener('habibi-game-complete', function (e) {
    if (e.detail && e.detail.gameId) self.onGameComplete(e.detail.gameId);
  });
  window.addEventListener('resize', function () { self.applyLayout(); });
};

DioGuide.prototype.buildDOM = function () {
  this.container = document.createElement('div');
  this.container.id = 'dio-guide';
  this.panel = document.createElement('div');
  this.panel.className = 'dio-panel';
  this.speechBubble = document.createElement('div');
  this.speechBubble.id = 'dio-speech';
  this.speechText = document.createElement('div');
  this.speechText.id = 'dio-speech-text';
  this.actionSlot = document.createElement('div');
  this.actionSlot.id = 'dio-actions';
  this.actionSlot.className = 'dio-actions';
  var name = document.createElement('div');
  name.className = 'dio-speaker-name';
  name.textContent = 'DIO';
  var subtitle = document.createElement('div');
  subtitle.className = 'dio-speaker-sub';
  subtitle.textContent = 'Operations Guide · MERIDIAN-7';
  var tail = document.createElement('div');
  tail.className = 'dio-speech-tail';
  this.avatarWrap = document.createElement('div');
  this.avatarWrap.className = 'dio-avatar';
  this.avatarWrap.style.width = '128px';
  this.canvas = document.createElement('canvas');
  this.canvas.width = 128;
  this.canvas.height = 192;
  this.speechBubble.appendChild(name);
  this.speechBubble.appendChild(subtitle);
  this.speechBubble.appendChild(this.speechText);
  this.speechBubble.appendChild(this.actionSlot);
  this.speechBubble.appendChild(tail);
  this.avatarWrap.appendChild(this.canvas);
  this.panel.appendChild(this.speechBubble);
  this.panel.appendChild(this.avatarWrap);
  this.container.appendChild(this.panel);
  document.body.appendChild(this.container);
  this.sprite = new DioSprite(this.canvas);
  this.sprite.guide = this;
  this.applyLayout();
};

DioGuide.prototype.bindEvents = function () {
  var self = this;
  this.panel.addEventListener('mousedown', function () {
    self.panelClickActive = true;
  });
  document.addEventListener('mouseup', function () {
    self.panelClickActive = false;
  });
  this.panel.addEventListener('click', function (e) {
    if (e.target.closest('#dio-next-btn')) return;
    if (!self.isDodging && !self.recruiterMode) self.advanceDialogue();
  });
  document.addEventListener('mousemove', function (e) {
    self.lastMouseX = e.clientX;
    self.lastMouseY = e.clientY;
    if (!self.panelClickActive) self.checkHoverDistance();
  });
};

DioGuide.prototype.applyLayout = function () {
  if (this.isLanding) {
    this.container.classList.add('dio-landing');
    this.container.style.left = '50%';
    this.container.style.right = 'auto';
    this.container.style.top = 'auto';
    this.container.style.bottom = '80px';
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight - 200;
    return;
  }
  this.container.classList.remove('dio-landing');
  this.x = Math.min(window.innerWidth - 420, Math.max(16, window.innerWidth * 0.62));
  this.y = Math.max(80, window.innerHeight - 220);
  this.container.style.left = this.x + 'px';
  this.container.style.top = this.y + 'px';
  this.container.style.bottom = 'auto';
  this.container.style.right = 'auto';
};

DioGuide.prototype.checkHoverDistance = function () {
  if (this.isDodging || this.recruiterMode || this.isLanding) return;
  var rect = this.avatarWrap.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;
  var dist = Math.hypot(this.lastMouseX - cx, this.lastMouseY - cy);
  if (dist < 60) this.dodge();
};

DioGuide.prototype.dodge = function () {
  var self = this;
  this.isDodging = true;
  this.sprite.playAnimation('dodge');
  var corners = [
    { x: 40, y: 40 },
    { x: window.innerWidth - 160, y: 40 },
    { x: 40, y: window.innerHeight - 240 },
    { x: window.innerWidth - 160, y: window.innerHeight - 240 }
  ];
  var best = corners[0];
  var bestDist = -1;
  corners.forEach(function (c) {
    var d = Math.hypot(c.x - self.lastMouseX, c.y - self.lastMouseY);
    if (d > bestDist) { bestDist = d; best = c; }
  });
  var startX = this.x, startY = this.y, startTime = performance.now();
  var moveInterval = setInterval(function () {
    var t = Math.min((performance.now() - startTime) / 400, 1);
    var eased = 1 - Math.pow(1 - t, 3);
    self.x = startX + (best.x - startX) * eased;
    self.y = startY + (best.y - startY) * eased;
    self.updatePosition();
    if (t >= 1) clearInterval(moveInterval);
  }, 16);
};

DioGuide.prototype.onDodgeComplete = function () {
  var self = this;
  this.sprite.playAnimation('idle');
  setTimeout(function () { self.isDodging = false; }, 500);
};

DioGuide.prototype.startLoop = function () {
  var self = this;
  var lastTime = performance.now();
  function loop(now) {
    var dt = now - lastTime;
    lastTime = now;
    self.floatOffset += self.floatDir * dt * 0.04;
    if (Math.abs(self.floatOffset) > 6) self.floatDir *= -1;
    var floatY = self.floatOffset;
    if (self.isLanding) {
      self.container.style.transform = 'translateX(-50%) translateY(' + floatY + 'px)';
    } else {
      self.container.style.transform = 'translateY(' + floatY + 'px)';
    }
    self.sprite.update(dt);
    var anim = self.sprite.animations[self.sprite.currentAnimation];
    self.sprite.drawFrame(anim.frames[self.sprite.currentFrame], 0, 0);
    self.animFrame = requestAnimationFrame(loop);
  }
  self.animFrame = requestAnimationFrame(loop);
};

DioGuide.prototype.updatePosition = function () {
  if (!this.isLanding) {
    this.container.style.left = this.x + 'px';
    this.container.style.top = this.y + 'px';
  }
};

DioGuide.prototype.resolvePageKey = function () {
  if (document.body.classList.contains('landing-dio-mode')) return 'index';
  var path = window.location.pathname;
  var parts = path.split('/').filter(Boolean);
  var filename = (parts[parts.length - 1] || 'index').replace('.html', '');
  var pageMap = {
    index: 'index', terminal: 'terminal', breach: 'breach', network: 'network',
    cipher: 'cipher', sim: 'sim', intercept: 'intercept', forge: 'forge',
    archive: 'archive', heist: 'heist', lab: 'lab', cartography: 'cartography',
    memorial: 'memorial', resonance: 'resonance', debrief: 'debrief', read: 'read'
  };
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].indexOf('game') === 0 && parts[i].indexOf('-') > 0) return parts[i];
  }
  if (pageMap[filename]) return pageMap[filename];
  if (filename === 'index' || filename === '') return 'index';
  if (/\/index\.html$/i.test(path) || path === '/' || /\/$/.test(path)) return 'index';
  if (!/\.html$/i.test(path) && !pageMap[filename]) return 'index';
  return filename || 'index';
};

DioGuide.prototype.detectCurrentPage = function () {
  this.storylinePosition = this.resolvePageKey();
  this.isLanding = this.storylinePosition === 'index' && !this.recruiterMode;
  this.applyLayout();
  if (DIO_STORYLINE[this.storylinePosition]) {
    var script = DIO_STORYLINE[this.storylinePosition];
    if (script.nextAction) this.pendingAction = script.nextAction;
    if (this.isLanding && script.nextAction) this.showNextActionButton(script.nextAction);
    if (script.enter && !this.recruiterMode) {
      var lines = script.enter.slice();
      if (window.HabibiNarrative) {
        var ctxMap = {
          'game2-breach': 'the_breach', 'game3-network': 'the_ghost_network',
          'game4-cipher': 'the_cipher', 'game5-simulation': 'the_simulation',
          'game6-intercept': 'the_interrogation_room', 'game7-forge': 'the_forge',
          'game8-archive': 'the_deep_archive', 'game9-heist': 'the_heist',
          'game10-lab': 'the_lab', 'game11-cartography': 'the_cartography',
          'game12-memorial': 'the_memorial', 'game13-resonance': 'the_resonance'
        };
        var ctxId = ctxMap[this.storylinePosition];
        if (ctxId) {
          var ctxLine = HabibiNarrative.getContextForGame(ctxId);
          if (ctxLine) lines.unshift(ctxLine);
        }
      }
      this.queueDialogue(lines);
    } else if (script.nextAction && !this.recruiterMode) {
      this.showNextActionButton(script.nextAction);
    }
  }
};

DioGuide.prototype.queueDialogue = function (lines) {
  this.dialogueQueue = lines.slice();
  this.advanceDialogue();
};

DioGuide.prototype.advanceDialogue = function () {
  var self = this;
  if (this.dialogueQueue.length === 0) {
    this.sprite.playAnimation('idle');
    if (this.pendingAction) this.showNextActionButton(this.pendingAction);
    return;
  }
  var line = this.dialogueQueue.shift();
  this.showSpeechBubble(line);
  this.sprite.playAnimation('talk');
  var readTime = Math.min(Math.max(line.length * 60, 2000), 6000);
  clearTimeout(this.autoAdvanceTimer);
  this.autoAdvanceTimer = setTimeout(function () {
    if (self.dialogueQueue.length > 0) self.advanceDialogue();
    else {
      self.sprite.playAnimation('idle');
      if (self.pendingAction) self.showNextActionButton(self.pendingAction);
    }
  }, readTime);
};

DioGuide.prototype.showSpeechBubble = function (text) {
  this.speechText.textContent = text;
  this.speechBubble.style.opacity = '1';
};

DioGuide.prototype.hideSpeechBubble = function () {
  this.speechBubble.style.opacity = '0';
};

DioGuide.prototype.showNextActionButton = function (action) {
  if (!this.actionSlot) return;
  this.actionSlot.innerHTML = '';
  var btn = document.createElement('a');
  btn.href = (window.SiemCore && window.SiemCore.resolveSiteHref)
    ? window.SiemCore.resolveSiteHref(action.url)
    : action.url;
  btn.id = 'dio-next-btn';
  btn.className = 'dio-next-btn';
  btn.textContent = action.label;
  this.actionSlot.appendChild(btn);
  this.speechBubble.style.opacity = '1';
};

DioGuide.prototype.initLevelTracking = function () {
  var self = this;
  var gameMap = {
    'game1-terminal': 'the_terminal', 'game2-breach': 'the_breach',
    'game3-network': 'the_ghost_network', 'game4-cipher': 'the_cipher',
    'game5-simulation': 'the_simulation', 'game6-intercept': 'the_interrogation_room',
    'game7-forge': 'the_forge', 'game8-archive': 'the_deep_archive',
    'game9-heist': 'the_heist', 'game10-lab': 'the_lab',
    'game11-cartography': 'the_cartography', 'game12-memorial': 'the_memorial',
    'game13-resonance': 'the_resonance'
  };
  this.levelTrackInterval = setInterval(function () {
    try {
      var pageKey = self.storylinePosition;
      var gameId = gameMap[pageKey];
      if (!gameId) return;
      var raw = localStorage.getItem('habibi-xp-' + gameId);
      if (!raw) return;
      var data = JSON.parse(raw);
      var level = data.currentLevel || 1;
      if (level !== self.lastLevel) {
        self.lastLevel = level;
        var script = DIO_STORYLINE[pageKey];
        var levelKey = 'level' + level;
        if (script && script[levelKey]) {
          self.queueDialogue(script[levelKey]);
          self.sprite.playAnimation('point');
        }
      }
      if (data.completedLevels && data.completedLevels.indexOf(5) >= 0 && !self.gameCompleteShown) {
        self.gameCompleteShown = true;
        self.onGameComplete(gameId);
      }
    } catch (err) { /* ignore */ }
  }, 2000);
};

DioGuide.prototype.onGameComplete = function (gameId) {
  if (!this._completedGames) this._completedGames = {};
  if (this._completedGames[gameId]) return;
  this._completedGames[gameId] = true;
  var map = {
    the_terminal: 'game1-terminal', the_breach: 'game2-breach', the_ghost_network: 'game3-network',
    the_cipher: 'game4-cipher', the_simulation: 'game5-simulation',
    the_interrogation_room: 'game6-intercept', the_forge: 'game7-forge',
    the_deep_archive: 'game8-archive', the_heist: 'game9-heist', the_lab: 'game10-lab',
    the_cartography: 'game11-cartography', the_memorial: 'game12-memorial',
    the_resonance: 'game13-resonance'
  };
  var key = map[gameId];
  if (!key || !DIO_STORYLINE[key]) return;
  var script = DIO_STORYLINE[key];
  if (script.complete) {
    this.queueDialogue(script.complete);
    this.sprite.playAnimation('za_warudo');
  }
  if (script.nextAction) this.showNextActionButton(script.nextAction);
  if (window.HabibiNarrative) HabibiNarrative.recordGameComplete(gameId, {});
};

DioGuide.prototype.startRecruiterTour = function () {
  var self = this;
  this.recruiterStart = Date.now();
  this.recruiterIndex = 0;
  var bar = document.createElement('div');
  bar.id = 'dio-recruiter-bar';
  bar.innerHTML = 'Recruiter Preview — 90 seconds <div id="dio-recruiter-fill"></div>';
  document.body.prepend(bar);
  function nextLine() {
    if (self.recruiterIndex >= RECRUITER_SCRIPT.length) {
      self.queueDialogue(['Full experience available here. Debrief report auto-generated on completion.']);
      return;
    }
    self.showSpeechBubble(RECRUITER_SCRIPT[self.recruiterIndex]);
    self.sprite.playAnimation('talk');
    self.recruiterIndex++;
    var elapsed = Date.now() - self.recruiterStart;
    var pct = Math.min(100, (elapsed / 90000) * 100);
    var fill = document.getElementById('dio-recruiter-fill');
    if (fill) fill.style.width = pct + '%';
    setTimeout(nextLine, 6000);
  }
  nextLine();
};

window.DioGuide = DioGuide;
document.addEventListener('DOMContentLoaded', function () {
  window.DIO = new DioGuide();
  window.DIO.init();
});
'''


def main() -> None:
    frames = build_frames()
    body: list[str] = ["(function (global) {\n'use strict';\n\n"]
    body.append(DIO_CLASSES.split("function DioSprite")[0])
    for set_name, frame_list in frames.items():
        body.append(f"var {set_name} = [\n")
        for idx, grid in enumerate(frame_list):
            body.append(f"  // {set_name} frame {idx}\n  [\n{grid_to_js_rows(grid)}\n  ],\n")
        body.append("];\n\n")
    body.append(STORYLINE_JS)
    body.append("\n")
    body.append(DIO_CLASSES[DIO_CLASSES.index("function DioSprite") :])
    body.append("\n})(typeof window !== 'undefined' ? window : globalThis);\n")
    content = "".join(body)
    OUT.write_text(content, encoding="utf-8")
    lines = len(content.splitlines())
    palette_keys = [
        "SKIN", "SKIN_SHADOW", "SKIN_DARK", "OUTLINE",
        "HAIR_BRIGHT", "HAIR_MID", "HAIR_DARK", "HAIR_SHADOW",
        "GEM_GREEN", "GEM_DARK", "BAND_GOLD",
        "COAT_DARK", "COAT_MID", "COAT_LIGHT", "GOLD_TRIM", "GOLD_BRIGHT",
        "EYE_PURPLE", "EYE_BRIGHT", "EYE_WHITE", "EYE_DARK",
        "TOOTH", "TOOTH_SHADOW", "LIP_DARK", "TONGUE", "SHIRT", "SHADOW",
    ]
    pixels = sum(content.count(f"'{k}'") for k in palette_keys)
    print(f"Wrote {OUT} — {lines} lines, {pixels} palette pixel refs")


if __name__ == "__main__":
    main()
