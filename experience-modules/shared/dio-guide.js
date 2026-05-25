(function (global) {
'use strict';

var DIO_PALETTE = {
  SKIN:           '#F0C070',
  SKIN_SHADOW:    '#C89040',
  SKIN_DARK:      '#A06830',
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

/* ─── Compact pixel encoder ─────────────────────────────────────────────
   Each character maps to a DIO_PALETTE key. '.' = transparent.
   _r() pads/truncates any string to exactly 32 columns.
   _f() turns 48 strings into a full frame (48×32 array).
   _mod() returns a shallow-copy of a frame array with specific rows replaced.
─────────────────────────────────────────────────────────────────────── */
var _PC = {
  '.':null,'O':'OUTLINE','H':'HAIR_BRIGHT','M':'HAIR_MID','D':'HAIR_DARK','S':'HAIR_SHADOW',
  'K':'SKIN','T':'SKIN_SHADOW','U':'SKIN_DARK','G':'GEM_GREEN','g':'GEM_DARK','B':'BAND_GOLD',
  'C':'COAT_DARK','c':'COAT_MID','L':'COAT_LIGHT','R':'GOLD_TRIM','F':'GOLD_BRIGHT',
  'E':'EYE_PURPLE','P':'EYE_BRIGHT','W':'EYE_WHITE','e':'EYE_DARK',
  'Y':'TOOTH','X':'LIP_DARK','Z':'TONGUE','N':'SHIRT','A':'SHADOW'
};
function _r(s) {
  s = s.replace(/О/g, 'O'); // normalize Cyrillic lookalike → Latin O
  while (s.length < 32) s += '.';
  return s.substring(0, 32).split('').map(function(c) {
    return (_PC[c] !== undefined) ? _PC[c] : null;
  });
}
function _f(rows) {
  var out = [];
  for (var i = 0; i < 48; i++) out.push(_r(rows[i] || ''));
  return out;
}
function _mod(base, changes) {
  var frame = base.slice();
  for (var i = 0; i < changes.length; i++) frame[changes[i][0]] = changes[i][1];
  return frame;
}

/* ─── Base sprite rows (32 cols × 48 rows) ───────────────────────────────
   DIO BRANDO — JoJo Part 1 anime style
   Layout:
     Rows  0-15 : Dramatic upward golden hair  (16 rows)
     Row   16   : Heart headband + green gem
     Rows 17-28 : Face (forehead / eyes / nose / mouth / chin)
     Rows 29-31 : Neck
     Rows 32-47 : Ornate dark coat with gold trim
─────────────────────────────────────────────────────────────────────── */
var _BASE = [
/* 0 */ "..............OMMO",
/* 1 */ ".............OMHMO",
/* 2 */ ".............OMHHMO",
/* 3 */ "............OMHHHMO",
/* 4 */ ".....OOMOO..OMHHHMO..OOMOO.",
/* 5 */ "....OMHMO..OMHHHHHMO.OMHMO.",
/* 6 */ "...OMHHMO..OMHHHHHMO.OMHHMO",
/* 7 */ "..OMHHHMO.OMHHHHHHHMO.OMHHHMO",
/* 8 */ ".OMHHHHMOOMHHHHHHHHHHMOOMHHHMO",
/* 9 */ "OMHHHHMMMHHHHHHHHHHHHMMMHHHHHMO",
/*10 */ "OMHHHMMMMHHDDDDDDDDHHMMMHHHHMMO",
/*11 */ ".OMHHHMMMDDDDDDDDDDDMMMHHHHMMO.",
/*12 */ "..OMHHMMMDDDDSSSSDDDDMMMHHHMMOO",
/*13 */ "...OMHMMMDDSSSSSSSSDDDMMHHMOO",
/*14 */ "....OMMDDSSSSSSSSSSDDDMMMOO",
/*15 */ ".....OMDSSSSSSSSSSSSDMOO",
/* HEADBAND */
/*16 */ ".....OBBBBBBBBgGgBBBBBBBBO",
/* FACE */
/*17 */ "........OKKKKKKKKKKKKKKO",
/*18 */ "........OKKKKKKKKKKKKKKO",
/*19 */ "........OKDDKKKKKDDKKKKO",
/*20 */ "........OKOEEOKKKOEEOKKО",
/*21 */ "........OKOWEOKKKOEWOKKO",
/*22 */ "........OKOEEOKKKOEEOKKО",
/*23 */ "........OKKKKTTKKKKKKKO",
/*24 */ "........OKKKKKKKKKKKKKO",
/*25 */ "........OKKOXXXXXXOKKKKO",
/*26 */ "........OKKOYYYYYYOKKKKO",
/*27 */ "........OKKOXXXXXXOKKKKO",
/*28 */ "........OKKKKKKKKKKKKKKO",
/* NECK */
/*29 */ ".........OKKKKKKKKKKKO",
/*30 */ "..........OCRRRRRRRCOO",
/*31 */ "..........OCRRRRRRRCOO",
/* COAT */
/*32 */ ".........OCRLRRLRRLCO",
/*33 */ "........OCCLRRRRRRLLCCO",
/*34 */ ".......OCCCLcccccLCCCO",
/*35 */ "......OCCCLLccccLLCCCO",
/*36 */ ".....OCCCLLLccccLLLCCCO",
/*37 */ "....OCCCCLLLcccLLLCCCCO",
/*38 */ "...OCCCCLLLLcccLLLLCCCCO",
/*39 */ "..OCCCCLLLLccccccLLLLCCCCO",
/*40 */ ".OCCCCLLLLcccccccccLLLLCCCCO",
/*41 */ "OCCCCLLLLcccccccccccLLLLCCCCO",
/*42 */ "OCCCCLLLLcccccccccccLLLLCCCCO",
/*43 */ "OCCCCLLLLcccccccccccLLLLCCCCO",
/*44 */ ".OCCCLLLcccccccccccccLLLCCCO",
/*45 */ "..OCCLLLcccccccccccccLLLCCO",
/*46 */ "...OCCLcccccccccccccccLCCO",
/*47 */ "....OOOOOOOOOOOOOOOOOOOOO"
];

/* ─── Animation variants (only rows that differ from _BASE) ─────────── */

/* IDLE frame 1 — subtle breathing (hair tip 1 px taller) */
var _IDLE1 = _mod(_BASE, [
  [0, "..............OOMMO"],
  [1, ".............OOMHMO"]
]);

/* TALK — mouth open */
var _TALK_OPEN = _mod(_BASE, [
  [25, "........OKKOCCCCCCOKKKKО"],
  [26, "........OKKOYYYYZYOKKKKO"],
  [27, "........OKKOCCCCCCOKKKKО"]
]);

/* WALK frame 1 — slight right lean */
var _WALK1 = _mod(_BASE, [
  [44, "OCCCLLLcccccccccccccLLLCCCO"],
  [45, ".OCCLLLcccccccccccccLLLCCO"],
  [46, "..OCCLcccccccccccccccLCCO"],
  [47, "...OOOOOOOOOOOOOOOOOOOOOOO"]
]);
/* WALK frame 2 — slight left lean */
var _WALK2 = _mod(_BASE, [
  [44, "...OCCCLLLcccccccccccLLLCCCO"],
  [45, "....OCCLLLcccccccccccLLLCCO"],
  [46, ".....OCCLcccccccccccccLCCO"],
  [47, "......OOOOOOOOOOOOOOOOOOOOO"]
]);

/* DODGE — body tilt suggests rapid sidestep */
var _DODGE1 = _mod(_BASE, [
  [37, "......OCCCCLLLcccLLLCCCCO"],
  [38, ".....OCCCCLLLLcccLLLLCCCCO"],
  [39, "....OCCCCLLLLccccccLLLLCCCCO"],
  [40, "...OCCCCLLLLcccccccccLLLLCCCCO"],
  [41, "..OCCCCLLLLcccccccccccLLLLCCCCO"],
  [42, "..OCCCCLLLLcccccccccccLLLLCCCCO"],
  [43, "..OCCCCLLLLcccccccccccLLLLCCCCO"]
]);

/* ZA WARUDO — intense, wide-eyed dramatic face */
var _ZAWARUDO1 = _mod(_BASE, [
  [19, "........ODDDDKKKKKDDDDKKO"],
  [20, "........OOEEEOKKKOEEEОKKO"],
  [21, "........OOWEEPKKWEEPOKKО"],
  [22, "........OOEEEOKKKOEEEОKKO"],
  [25, "........OKKOOOOOOOOOKKKKО"],
  [26, "........OKKOZYYYYYZOKKKKO"],
  [27, "........OKKOOOOOOOOOKKKKО"]
]);
var _ZAWARUDO2 = _mod(_ZAWARUDO1, [
  [0,  ".............OOMMO"],
  [1,  "............OOMHMO"],
  [4,  "....OOMMOO.OMHHHMO..OOMMOO"],
  [5,  "...OOMHMO..OMHHHHHMO.OOMHMO"]
]);
var _ZAWARUDO3 = _mod(_ZAWARUDO1, [
  [0,  "..............OMMO"],
  [1,  ".............OMHMO"],
  [4,  ".....OOMOO..OMHHHMO..OOMOO."]
]);

/* POINT — same as base (pointing is in speech text, sprite stays iconic) */
var _POINT1 = _BASE;

/* HOVER — alternates with idle (float effect via JS transform) */
var _HOVER1 = _BASE;
var _HOVER2 = _IDLE1;

/* ─── Animation sets ─────────────────────────────────────────────────── */
var IDLE_FRAMES      = [_f(_BASE),       _f(_IDLE1)];
var TALK_FRAMES      = [_f(_BASE),       _f(_TALK_OPEN)];
var WALK_FRAMES      = [_f(_WALK1),      _f(_WALK2)];
var DODGE_FRAMES     = [_f(_BASE),       _f(_DODGE1)];
var POINT_FRAMES     = [_f(_BASE),       _f(_POINT1)];
var ZA_WARUDO_FRAMES = [_f(_ZAWARUDO1),  _f(_ZAWARUDO2), _f(_ZAWARUDO3)];
var HOVER_FRAMES     = [_f(_HOVER1),     _f(_HOVER2)];

/* ─── Dialogue scripts ───────────────────────────────────────────────── */
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
  'terminal':    { enter: ["Classic terminal experience."], nextAction: { label: "3D Terminal", url: "experience-modules/game1-terminal/index.html" } },
  'breach':      { enter: ["Classic breach sim."], nextAction: { label: "3D Breach", url: "experience-modules/game2-breach/index.html" } },
  'network':     { enter: ["Ghost Network classic view."], nextAction: { label: "3D Network", url: "experience-modules/game3-network/index.html" } },
  'cipher':      { enter: ["Cipher vault classic."], nextAction: { label: "3D Cipher", url: "experience-modules/game4-cipher/index.html" } },
  'sim':         { enter: ["Kill chain classic sim."], nextAction: { label: "3D Simulation", url: "experience-modules/game5-simulation/index.html" } },
  'intercept':   { enter: ["Intercept room classic."], nextAction: { label: "3D Interrogation", url: "experience-modules/game6-intercept/index.html" } },
  'forge':       { enter: ["Rule forge classic."], nextAction: { label: "3D Forge", url: "experience-modules/game7-forge/index.html" } },
  'archive':     { enter: ["Deep archive classic."], nextAction: { label: "3D Archive", url: "experience-modules/game8-archive/index.html" } },
  'heist':       { enter: ["Heist classic."], nextAction: { label: "3D Heist", url: "experience-modules/game9-heist/index.html" } },
  'lab':         { enter: ["Detection lab classic."], nextAction: { label: "3D Lab", url: "experience-modules/game10-lab/index.html" } },
  'cartography': { enter: ["Threat globe classic."], nextAction: { label: "3D Cartography", url: "experience-modules/game11-cartography/index.html" } },
  'memorial':    { enter: ["Memorial classic."], nextAction: { label: "3D Memorial", url: "experience-modules/game12-memorial/index.html" } },
  'resonance':   { enter: ["Resonance classic."], nextAction: { label: "3D Resonance", url: "experience-modules/game13-resonance/index.html" } },
  'debrief':     { enter: ["Operation MERIDIAN-7 debrief. Your analyst report."], nextAction: { label: "Return to Hub", url: "index.html" } }
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

/* ─── DioSprite ──────────────────────────────────────────────────────── */
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
    idle:      { frames: IDLE_FRAMES,      loop: true,  fps: 4  },
    walk:      { frames: WALK_FRAMES,      loop: true,  fps: 10 },
    point:     { frames: POINT_FRAMES,     loop: false, fps: 8  },
    dodge:     { frames: DODGE_FRAMES,     loop: false, fps: 16 },
    talk:      { frames: TALK_FRAMES,      loop: true,  fps: 8  },
    za_warudo: { frames: ZA_WARUDO_FRAMES, loop: false, fps: 8  },
    hover:     { frames: HOVER_FRAMES,     loop: true,  fps: 3  }
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

/* ─── DioGuide ───────────────────────────────────────────────────────── */
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
  window.addEventListener('resize', function () { if (!self.isDodging) self.applyLayout(); });
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
  this.panel.addEventListener('mousedown', function () { self.panelClickActive = true; });
  document.addEventListener('mouseup', function () { self.panelClickActive = false; });
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
    this.container.style.bottom = '48px';
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
    if (t >= 1) { clearInterval(moveInterval); self.onDodgeComplete(); }
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

})(typeof window !== 'undefined' ? window : globalThis);
