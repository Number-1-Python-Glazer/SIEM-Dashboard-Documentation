/**
 * Observation Deck modes — 15 feature pack (v14)
 * Loaded after main deck script; init via window.siemDeckModes.init(deckApi)
 */
(() => {
  'use strict';

  const LS = {
    skill: 'deck-skill-progress',
    session: 'deck-session-log',
    notes: 'deck-annotations',
    persona: 'deck-persona',
    readingOrder: 'deck-reading-order-on',
    audio: 'deck-audio-muted',
    user: 'deck-annotate-user',
  };

  const PERSONAS = {
    soc: {
      name: 'SOC Analyst',
      labels: ['Dashboard', 'Alert Manager', 'DetectionEngine', 'Brute Force', 'SQL Injection', 'XSS Attempt', 'Geo Map', 'SOAR Console', 'Correlation', 'SiemContext'],
      order: ['Dashboard', 'Alert Manager', 'DetectionEngine', 'Brute Force', 'Geo Map', 'SOAR Console'],
    },
    ciso: {
      name: 'CISO',
      labels: ['Architecture', 'RBAC', 'Documentation', 'Threat Intel', 'Pentest RBAC', 'Pentest CSRF', 'Cryptography', 'Backend API', 'SIEM Dashboard'],
      order: ['Architecture', 'RBAC', 'Threat Intel', 'Pentest RBAC', 'Documentation'],
    },
    junior: {
      name: 'Junior Analyst',
      labels: ['Documentation', 'SIEM Dashboard', 'Dashboard', 'Alert Manager', 'React Shell', 'SiemContext', 'Architecture'],
      order: ['Documentation', 'SIEM Dashboard', 'Dashboard', 'Alert Manager', 'Architecture'],
    },
    dev: {
      name: 'Developer',
      labels: ['Backend API', 'React Shell', 'API Client', 'AuthContext', 'Validation', 'DetectionEngine', 'rules.js', 'SQLite DB', 'Cryptography'],
      order: ['Architecture', 'Backend API', 'React Shell', 'DetectionEngine', 'Validation'],
    },
    auditor: {
      name: 'Auditor',
      labels: ['RBAC', 'Pentest RBAC', 'Pentest CSRF', 'Pentest Input', 'Documentation', 'Backend API', 'Cryptography', 'Alert Manager'],
      order: ['Documentation', 'RBAC', 'Pentest RBAC', 'Pentest CSRF', 'Pentest Input'],
    },
  };

  const SECTION_AUDIO = {
    Monitor: { freq: 55, type: 'sine', gain: 0.012 },
    Investigate: { freq: 110, type: 'triangle', gain: 0.008 },
    Respond: { freq: 82, type: 'sawtooth', gain: 0.01 },
    Backend: { freq: 48, type: 'sine', gain: 0.009 },
    Detection: { freq: 72, type: 'triangle', gain: 0.009 },
    default: { freq: 40, type: 'sine', gain: 0.006 },
  };

  let deck = null;
  let scenarios = null;
  let concepts = null;
  let skillTree = null;
  let changelog = null;
  let health = null;

  const state = {
    threatKey: '',
    threatPlaying: false,
    threatStep: -1,
    threatTimer: null,
    persona: 'soc',
    readingOrderOn: true,
    skillMode: false,
    chainMode: false,
    chain: [],
    conceptMode: false,
    changelogOn: true,
    tabletopId: '',
    tabletopStep: -1,
    tabletopTimer: null,
    tabletopLeft: 0,
    replayVisits: [],
    replayIdx: 0,
    replayPlaying: false,
    tunnelOn: false,
    tunnelLabel: '',
    challengeIdx: 0,
    challengeActive: false,
    challengePick: [],
    challengeScore: null,
    healthOverlay: false,
    portfolioMode: false,
    portfolioSet: new Set(),
    audioMuted: false,
    annotateMode: false,
    orbitParticles: [],
    conceptNodes: [],
    dustNodes: [],
  };

  let audioCtx = null;
  let audioNodes = [];
  let ui = {};

  function $(id) { return document.getElementById(id); }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  }

  function writeJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  function getSkillProgress() {
    return readJson(LS.skill, {});
  }

  function markRead(label) {
    const p = getSkillProgress();
    if (!p[label]) {
      p[label] = Date.now();
      writeJson(LS.skill, p);
      updateSkillBar();
    }
  }

  function isUnlocked(label) {
    if (!state.skillMode || !skillTree || !skillTree.nodes) return true;
    const req = (skillTree.nodes[label] && skillTree.nodes[label].requires) || [];
    const prog = getSkillProgress();
    return req.every((r) => prog[r]);
  }

  function skillProgressPct() {
    if (!skillTree || !skillTree.nodes) return 0;
    const labels = Object.keys(skillTree.nodes);
    const prog = getSkillProgress();
    const done = labels.filter((l) => prog[l]).length;
    return Math.round((done / labels.length) * 100);
  }

  function getSessionLog() {
    let log = readJson(LS.session, null);
    if (log == null) {
      const legacy = readJson('deck-session-visits', null);
      if (legacy) {
        writeJson(LS.session, legacy);
        log = legacy;
      }
    }
    return log || [];
  }

  function logVisit(label) {
    if (!label) return;
    markRead(label);
    const visits = getSessionLog();
    visits.push({ label, t: Date.now() });
    if (visits.length > 200) visits.splice(0, visits.length - 200);
    writeJson(LS.session, visits);
    state.replayVisits = visits;
    renderReplayBar();
  }

  function loadAnnotations() {
    return readJson(LS.notes, []);
  }

  function saveAnnotation(note) {
    const all = loadAnnotations();
    all.push(note);
    writeJson(LS.notes, all);
    renderAnnotationMarkers();
  }

  function userColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `hsl(${h}, 70%, 65%)`;
  }

  async function loadAssets() {
    const base = '../assets/';
    const [sc, co, sk, cl, he] = await Promise.all([
      fetch(base + 'deck-scenarios.json').then((r) => r.json()).catch(() => ({})),
      fetch(base + 'deck-concepts.json').then((r) => r.json()).catch(() => ({ concepts: [] })),
      fetch(base + 'deck-skill-tree.json').then((r) => r.json()).catch(() => ({ nodes: {} })),
      fetch(base + 'deck-changelog.json').then((r) => r.json()).catch(() => ({ nodes: {} })),
      fetch(base + 'deck-health.json').then((r) => r.json()).catch(() => ({ nodes: {} })),
    ]);
    scenarios = sc;
    concepts = co;
    skillTree = sk;
    changelog = cl;
    health = he;
    state.replayVisits = getSessionLog();
    state.persona = localStorage.getItem(LS.persona) || 'soc';
    state.readingOrderOn = localStorage.getItem(LS.readingOrder) !== '0';
    state.audioMuted = localStorage.getItem(LS.audio) === '1';
  }

  function buildConceptLayout() {
    state.conceptNodes = [];
    if (!concepts || !concepts.concepts) return;
    const cx = deck.W() / 2;
    const cy = deck.H() / 2;
    const R = Math.min(deck.W(), deck.H()) * 0.32;
    concepts.concepts.forEach((c, i) => {
      const a = (i / concepts.concepts.length) * Math.PI * 2 - Math.PI / 2;
      state.conceptNodes.push({
        ...c,
        x: cx + Math.cos(a) * R,
        y: cy + Math.sin(a) * R * 0.85,
        r: 14,
      });
    });
  }

  function initUI() {
    ui = {
      bar: $('deck-modes-bar'),
      threatSelect: $('deck-threat-select'),
      threatPlay: $('deck-threat-play'),
      personaSelect: $('deck-persona-select'),
      personaList: $('deck-persona-order'),
      readingOrderToggle: $('deck-reading-order-toggle'),
      skillToggle: $('deck-skill-toggle'),
      skillBar: $('deck-skill-bar'),
      skillFill: $('deck-skill-fill'),
      chainToggle: $('deck-chain-toggle'),
      chainPanel: $('deck-chain-panel'),
      chainText: $('deck-chain-text'),
      conceptToggle: $('deck-concept-toggle'),
      changelogToggle: $('deck-changelog-toggle'),
      tabletopSelect: $('deck-tabletop-select'),
      tabletopStart: $('deck-tabletop-start'),
      tabletopPanel: $('deck-tabletop-panel'),
      tabletopTimer: $('deck-tabletop-timer'),
      replayBar: $('deck-replay-bar'),
      replayScrub: $('deck-replay-scrub'),
      replayPlay: $('deck-replay-play'),
      tunnelBtn: $('deck-tunnel-btn'),
      tunnel: $('deck-tunnel'),
      tunnelTitle: $('deck-tunnel-title'),
      tunnelBody: $('deck-tunnel-body'),
      challengePanel: $('deck-challenge-panel'),
      challengePrompt: $('deck-challenge-prompt'),
      challengeScore: $('deck-challenge-score'),
      challengeNext: $('deck-challenge-next'),
      healthToggle: $('deck-health-toggle'),
      audioToggle: $('deck-audio-toggle'),
      portfolioToggle: $('deck-portfolio-toggle'),
      portfolioExport: $('deck-portfolio-export'),
      annotateToggle: $('deck-annotate-toggle'),
      annotateUser: $('deck-annotate-user'),
      xrefPopover: $('deck-xref-popover'),
      sidebar: $('deck-ext-sidebar'),
    };

    if (ui.threatSelect && scenarios && scenarios.threats) {
      Object.keys(scenarios.threats).forEach((k) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = scenarios.threats[k].label;
        ui.threatSelect.appendChild(opt);
      });
    }

    if (ui.tabletopSelect && scenarios && scenarios.tabletop) {
      scenarios.tabletop.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.title;
        ui.tabletopSelect.appendChild(opt);
      });
    }

    ui.threatSelect && ui.threatSelect.addEventListener('change', () => {
      state.threatKey = ui.threatSelect.value;
      state.threatStep = -1;
      applyThreatDim();
    });

    ui.threatPlay && ui.threatPlay.addEventListener('click', playThreatScenario);

    ui.personaSelect && (ui.personaSelect.value = state.persona);
    ui.personaSelect && ui.personaSelect.addEventListener('change', () => {
      state.persona = ui.personaSelect.value;
      localStorage.setItem(LS.persona, state.persona);
      renderPersonaOrder();
    });

    ui.readingOrderToggle && ui.readingOrderToggle.addEventListener('click', () => {
      state.readingOrderOn = !state.readingOrderOn;
      localStorage.setItem(LS.readingOrder, state.readingOrderOn ? '1' : '0');
      syncReadingOrderUI();
      if (!state.readingOrderOn && window.siemDeckFeatures && window.siemDeckFeatures.stopMission) {
        window.siemDeckFeatures.stopMission();
      }
    });

    syncReadingOrderUI();

    ui.skillToggle && ui.skillToggle.addEventListener('click', () => {
      state.skillMode = !state.skillMode;
      ui.skillToggle.classList.toggle('on', state.skillMode);
      ui.skillBar.hidden = !state.skillMode;
      updateSkillBar();
    });

    ui.chainToggle && ui.chainToggle.addEventListener('click', () => {
      state.chainMode = !state.chainMode;
      ui.chainToggle.classList.toggle('on', state.chainMode);
      ui.chainPanel.hidden = !state.chainMode;
      if (!state.chainMode) state.chain = [];
      updateChainPanel();
    });

    ui.conceptToggle && ui.conceptToggle.addEventListener('click', () => {
      state.conceptMode = !state.conceptMode;
      ui.conceptToggle.classList.toggle('on', state.conceptMode);
      buildConceptLayout();
    });

    ui.changelogToggle && ui.changelogToggle.addEventListener('click', () => {
      state.changelogOn = !state.changelogOn;
      ui.changelogToggle.classList.toggle('on', state.changelogOn);
    });

    ui.tabletopStart && ui.tabletopStart.addEventListener('click', startTabletop);

    ui.replayPlay && ui.replayPlay.addEventListener('click', toggleReplay);
    ui.replayScrub && ui.replayScrub.addEventListener('input', () => {
      state.replayIdx = parseInt(ui.replayScrub.value, 10) || 0;
      replayToIndex(state.replayIdx);
    });

    ui.tunnelBtn && ui.tunnelBtn.addEventListener('click', () => {
      const h = deck.getHover();
      if (h && h.label) enterTunnel(h.label);
    });

    ui.challengeNext && ui.challengeNext.addEventListener('click', nextChallenge);

    ui.healthToggle && ui.healthToggle.addEventListener('click', () => {
      state.healthOverlay = !state.healthOverlay;
      ui.healthToggle.classList.toggle('on', state.healthOverlay);
    });

    ui.audioToggle && ui.audioToggle.addEventListener('click', toggleAudio);
    ui.audioToggle && ui.audioToggle.classList.toggle('on', !state.audioMuted);

    ui.portfolioToggle && ui.portfolioToggle.addEventListener('click', () => {
      state.portfolioMode = !state.portfolioMode;
      ui.portfolioToggle.classList.toggle('on', state.portfolioMode);
      ui.portfolioExport.hidden = !state.portfolioMode;
    });

    ui.portfolioExport && ui.portfolioExport.addEventListener('click', exportPortfolio);

    ui.annotateToggle && ui.annotateToggle.addEventListener('click', () => {
      state.annotateMode = !state.annotateMode;
      ui.annotateToggle.classList.toggle('on', state.annotateMode);
    });

    ui.annotateUser && ui.annotateUser.addEventListener('change', () => {
      localStorage.setItem(LS.user, ui.annotateUser.value.trim());
    });
    const savedUser = localStorage.getItem(LS.user);
    if (savedUser && ui.annotateUser) ui.annotateUser.value = savedUser;

    renderPersonaOrder();
    renderReplayBar();
    renderAnnotationMarkers();
    updateSkillBar();
    if (!state.audioMuted) initAmbientAudio();
  }

  function syncReadingOrderUI() {
    if (ui.readingOrderToggle) {
      ui.readingOrderToggle.classList.toggle('on', state.readingOrderOn);
      ui.readingOrderToggle.textContent = state.readingOrderOn ? 'Custom on' : 'Custom off';
      ui.readingOrderToggle.title = state.readingOrderOn
        ? 'Disable persona reading order (restore default node view)'
        : 'Enable persona reading order';
    }
    if (ui.sidebar) {
      ui.sidebar.classList.toggle('deck-reading-order-off', !state.readingOrderOn);
    }
    renderPersonaOrder();
  }

  function renderPersonaOrder() {
    if (!ui.personaList) return;
    const p = PERSONAS[state.persona] || PERSONAS.soc;
    ui.personaList.innerHTML = '';
    if (!state.readingOrderOn) {
      const li = document.createElement('li');
      li.className = 'deck-reading-order-hint';
      li.textContent = 'Default view — all modules equal weight.';
      ui.personaList.appendChild(li);
      return;
    }
    (p.order || []).forEach((label, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = (i + 1) + '. ' + label;
      btn.addEventListener('click', () => deck.navigateToModule(label));
      li.appendChild(btn);
      ui.personaList.appendChild(li);
    });
  }

  function updateSkillBar() {
    if (!ui.skillFill) return;
    const pct = skillProgressPct();
    ui.skillFill.style.width = pct + '%';
    ui.skillFill.title = pct + '% modules visited';
  }

  function threatPathSet() {
    if (!state.threatKey || !scenarios || !scenarios.threats) return null;
    const t = scenarios.threats[state.threatKey];
    return t ? new Set(t.path) : null;
  }

  function applyThreatDim() {
    /* visual handled in nodeAlphaModifier */
  }

  function playThreatScenario() {
    if (!state.threatKey || !scenarios) return;
    const path = scenarios.threats[state.threatKey].path;
    if (!path || !path.length) return;
    state.threatPlaying = true;
    state.threatStep = -1;
    clearInterval(state.threatTimer);
    state.threatTimer = setInterval(() => {
      state.threatStep++;
      if (state.threatStep >= path.length) {
        clearInterval(state.threatTimer);
        state.threatPlaying = false;
        return;
      }
      const lbl = path[state.threatStep];
      const n = deck.nodeByLabel(lbl);
      if (n) deck.frameNode(n);
    }, 1400);
  }

  function startTabletop() {
    const id = ui.tabletopSelect && ui.tabletopSelect.value;
    if (!id || !scenarios) return;
    const card = scenarios.tabletop.find((t) => t.id === id);
    if (!card) return;
    ui.tabletopPanel.hidden = false;
    ui.tabletopPanel.querySelector('.deck-tabletop-brief').textContent = card.brief;
    state.tabletopId = id;
    state.tabletopStep = -1;
    state.tabletopLeft = card.timerSec || 600;
    clearInterval(state.tabletopTimer);
    state.tabletopTimer = setInterval(() => {
      state.tabletopLeft--;
      if (ui.tabletopTimer) ui.tabletopTimer.textContent = formatTime(state.tabletopLeft);
      if (state.tabletopLeft <= 0) clearInterval(state.tabletopTimer);
    }, 1000);
    if (ui.tabletopTimer) ui.tabletopTimer.textContent = formatTime(state.tabletopLeft);
    let step = 0;
    const path = card.path;
    const stepIv = setInterval(() => {
      if (step >= path.length) { clearInterval(stepIv); return; }
      const n = deck.nodeByLabel(path[step]);
      if (n) deck.frameNode(n);
      state.tabletopStep = step;
      step++;
    }, 1800);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function updateChainPanel() {
    if (!ui.chainText) return;
    if (!state.chain.length) {
      ui.chainText.textContent = 'Click modules to build a custom attack path.';
      return;
    }
    const lines = state.chain.map((lbl, i) => {
      const b = deck.getBriefs()[lbl];
      const snippet = b && b.body ? b.body.split('.')[0] : lbl;
      return (i + 1) + '. ' + lbl + ' — ' + snippet + '.';
    });
    ui.chainText.textContent = 'In this chain: ' + lines.join(' Then ');
  }

  function enterTunnel(label) {
    const b = deck.getBriefs()[label];
    if (!b) return;
    state.tunnelOn = true;
    state.tunnelLabel = label;
    ui.tunnel.hidden = false;
    ui.tunnel.classList.add('on');
    ui.tunnelTitle.textContent = label;
    ui.tunnelBody.innerHTML = deck.applyGlossary(b.body || '');
    startTunnelHum();
    deck.closeDeckBrief();
    const n = deck.nodeByLabel(label);
    if (n) deck.frameNode(n);
  }

  function exitTunnel() {
    state.tunnelOn = false;
    ui.tunnel.classList.remove('on');
    ui.tunnel.hidden = true;
    stopTunnelHum();
  }

  let tunnelOsc = null;
  function startTunnelHum() {
    if (state.audioMuted || !window.AudioContext) return;
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      tunnelOsc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      tunnelOsc.type = 'sine';
      tunnelOsc.frequency.value = 38;
      g.gain.value = 0.018;
      tunnelOsc.connect(g);
      g.connect(audioCtx.destination);
      tunnelOsc.start();
    } catch (_) {}
  }

  function stopTunnelHum() {
    if (tunnelOsc) {
      try { tunnelOsc.stop(); } catch (_) {}
      tunnelOsc = null;
    }
  }

  function initAmbientAudio() {
    if (!window.AudioContext || state.audioMuted) return;
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      audioNodes.forEach((n) => { try { n.osc.stop(); } catch (_) {} });
      audioNodes = [];
      Object.values(SECTION_AUDIO).forEach((cfg) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = cfg.type;
        osc.frequency.value = cfg.freq;
        g.gain.value = cfg.gain;
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start();
        audioNodes.push({ osc, g, cfg });
      });
    } catch (_) {}
  }

  function toggleAudio() {
    state.audioMuted = !state.audioMuted;
    localStorage.setItem(LS.audio, state.audioMuted ? '1' : '0');
    ui.audioToggle.classList.toggle('on', !state.audioMuted);
    if (state.audioMuted) {
      audioNodes.forEach((n) => { try { n.osc.stop(); } catch (_) {} });
      audioNodes = [];
      stopTunnelHum();
    } else {
      initAmbientAudio();
    }
  }

  function setAmbientForCategory(cat) {
    if (!audioNodes.length || state.audioMuted) return;
    const boost = SECTION_AUDIO[cat] || SECTION_AUDIO.default;
    audioNodes.forEach((n) => {
      n.g.gain.value = n.cfg === boost ? boost.gain * 2.2 : n.cfg.gain * 0.4;
    });
  }

  function nextChallenge() {
    if (!scenarios || !scenarios.challenges) return;
    state.challengeActive = true;
    state.challengeIdx = (state.challengeIdx + 1) % scenarios.challenges.length;
    state.challengePick = [];
    state.challengeScore = null;
    renderChallenge();
  }

  function renderChallenge() {
    if (!scenarios || !scenarios.challenges || !ui.challengePrompt) return;
    if (!state.challengeActive) {
      ui.challengePanel.hidden = true;
      return;
    }
    const c = scenarios.challenges[state.challengeIdx];
    ui.challengePanel.hidden = false;
    ui.challengePrompt.textContent = c.prompt;
    ui.challengeScore.textContent = state.challengeScore != null ? state.challengeScore : 'Pick 3 nodes in order (' + state.challengePick.length + '/3)';
  }

  function scoreChallenge() {
    const c = scenarios.challenges[state.challengeIdx];
    const pick = state.challengePick;
    const ans = c.answer;
    let correct = 0;
    for (let i = 0; i < 3; i++) {
      if (pick[i] === ans[i]) correct++;
    }
    const pts = correct === 3 ? 100 : correct === 2 ? 60 : correct === 1 ? 30 : 0;
    state.challengeScore = pts + '/100 — ' + c.explain;
    if (pts < 100) {
      state.challengeScore += ' Correct order: ' + ans.join(' → ');
    }
    ui.challengeScore.textContent = state.challengeScore;
  }

  function buildCrossRefIndex() {
    const briefs = deck.getBriefs();
    const index = {};
    Object.entries(briefs).forEach(([mod, meta]) => {
      const words = (meta.body || '').toLowerCase().match(/\b[a-z][a-z0-9-]{2,}\b/g) || [];
      words.forEach((w) => {
        if (!index[w]) index[w] = [];
        if (!index[w].includes(mod)) index[w].push(mod);
      });
    });
    return index;
  }

  let xrefIndex = null;
  function enhanceBriefCrossRef(label) {
    const b = deck.getBriefs()[label];
    if (!b || !b.body) return;
    if (!xrefIndex) xrefIndex = buildCrossRefIndex();
    const bodyEl = document.getElementById('deck-brief-body');
    if (!bodyEl) return;
    let html = deck.applyGlossary(b.body);
    const terms = Object.keys(xrefIndex).filter((t) => t.length > 4).slice(0, 500);
    terms.forEach((term) => {
      if (term.toLowerCase() === label.toLowerCase()) return;
      const mods = xrefIndex[term].filter((m) => m !== label);
      if (mods.length < 1) return;
      const re = new RegExp('\\b(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'gi');
      html = html.replace(re, (m) => '<span class="deck-xref-term" data-term="' + m + '" data-mods="' + mods.slice(0, 4).join('|') + '">' + m + '</span>');
    });
    bodyEl.innerHTML = html;
    bodyEl.querySelectorAll('.deck-xref-term').forEach((span) => {
      span.addEventListener('mouseenter', (e) => showXrefPopover(span, e));
      span.addEventListener('mouseleave', hideXrefPopover);
      span.addEventListener('click', () => {
        const mods = (span.dataset.mods || '').split('|').filter(Boolean);
        if (mods[0]) deck.navigateToModule(mods[0]);
      });
    });
    if (b.category) setAmbientForCategory(b.category);
  }

  function showXrefPopover(span, e) {
    if (!ui.xrefPopover) return;
    const mods = (span.dataset.mods || '').split('|').filter(Boolean);
    const term = span.dataset.term || span.textContent;
    let html = '<b>' + term + '</b><ul>';
    mods.forEach((m) => {
      const snip = (deck.getBriefs()[m].body || '').slice(0, 80);
      html += '<li><button type="button" data-mod="' + m + '">' + m + '</button><small>' + snip + '…</small></li>';
    });
    html += '</ul>';
    ui.xrefPopover.innerHTML = html;
    ui.xrefPopover.hidden = false;
    ui.xrefPopover.classList.add('on');
    ui.xrefPopover.style.left = Math.min(e.clientX + 8, innerWidth - 280) + 'px';
    ui.xrefPopover.style.top = Math.min(e.clientY + 8, innerHeight - 120) + 'px';
    ui.xrefPopover.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => deck.navigateToModule(btn.dataset.mod));
    });
  }

  function hideXrefPopover() {
    if (ui.xrefPopover) {
      ui.xrefPopover.classList.remove('on');
      ui.xrefPopover.hidden = true;
    }
  }

  function renderReplayBar() {
    if (!ui.replayScrub) return;
    const n = state.replayVisits.length;
    ui.replayScrub.max = Math.max(0, n - 1);
    ui.replayScrub.value = state.replayIdx;
    ui.replayBar.hidden = n < 1;
  }

  function replayToIndex(idx) {
    const v = state.replayVisits[idx];
    if (!v) return;
    const n = deck.nodeByLabel(v.label);
    if (n) deck.frameNode(n);
  }

  function toggleReplay() {
    state.replayPlaying = !state.replayPlaying;
    if (!state.replayPlaying) return;
    let i = 0;
    const iv = setInterval(() => {
      if (!state.replayPlaying || i >= state.replayVisits.length) {
        state.replayPlaying = false;
        clearInterval(iv);
        return;
      }
      state.replayIdx = i;
      ui.replayScrub.value = i;
      replayToIndex(i);
      i++;
    }, 900);
  }

  function exportPortfolio() {
    const labels = [...state.portfolioSet];
    if (!labels.length) { alert('Check modules in portfolio mode first.'); return; }
    const briefs = deck.getBriefs();
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SIEM Deck Portfolio</title><style>';
    html += 'body{font-family:Georgia,serif;max-width:720px;margin:2em auto;color:#111}';
    html += 'h1{border-bottom:2px solid #333}h2{margin-top:2em;color:#4c1d95}.toc{margin:2em 0}.toc a{display:block;margin:4px 0}';
    html += '.page{page-break-after:always}@media print{.no-print{display:none}}</style></head><body>';
    html += '<h1>SIEM Dashboard — Documentation Portfolio</h1><p>Assembled from the observation deck.</p>';
    html += '<div class="toc"><h2>Contents</h2>';
    labels.forEach((l, i) => { html += '<a href="#p' + i + '">' + (i + 1) + '. ' + l + '</a>'; });
    html += '</div>';
    labels.forEach((l, i) => {
      const b = briefs[l] || {};
      html += '<div class="page" id="p' + i + '"><h2>' + l + '</h2><p>' + (b.body || '') + '</p></div>';
    });
    html += '<p class="no-print"><button onclick="window.print()">Print / Save PDF</button></p></body></html>';
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(function () {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {}
      setTimeout(function () { frame.remove(); }, 1500);
    }, 300);
  }

  function renderAnnotationMarkers() {
    const layer = $('deck-annotate-layer');
    if (!layer) return;
    layer.innerHTML = '';
    loadAnnotations().forEach((note) => {
      const n = deck && deck.nodeByLabel(note.label);
      if (!n) return;
      const p = deck.worldToScreen(n.x, n.y);
      const el = document.createElement('div');
      el.className = 'deck-annotate-marker';
      el.style.left = p.sx + 'px';
      el.style.top = (p.sy - 20) + 'px';
      el.style.borderColor = userColor(note.user || 'anon');
      el.title = note.user + ': ' + note.text;
      el.textContent = '●';
      layer.appendChild(el);
    });
  }

  function ensureAnnotatorName() {
    if (localStorage.getItem(LS.user)) return localStorage.getItem(LS.user);
    const name = prompt('Your name for sticky notes (stored locally):');
    if (name && name.trim()) {
      localStorage.setItem(LS.user, name.trim());
      if (ui.annotateUser) ui.annotateUser.value = name.trim();
      return name.trim();
    }
    return 'anon';
  }

  function handleClick(n, shiftKey) {
    if (shiftKey) return false;
    if (state.tunnelOn) return true;

    if (state.skillMode && !isUnlocked(n.label)) {
      alert('Locked — read prerequisites first (skill tree mode).');
      return true;
    }

    if (state.chainMode) {
      if (!state.chain.includes(n.label)) state.chain.push(n.label);
      updateChainPanel();
      deck.frameNode(n);
      return true;
    }

    if (state.portfolioMode) {
      if (state.portfolioSet.has(n.label)) state.portfolioSet.delete(n.label);
      else state.portfolioSet.add(n.label);
      return true;
    }

    if (state.challengeActive && state.challengePick.length < 3 && ui.challengePanel && !ui.challengePanel.hidden) {
      state.challengePick.push(n.label);
      renderChallenge();
      if (state.challengePick.length >= 3) scoreChallenge();
      deck.frameNode(n);
      return true;
    }

    if (state.annotateMode) {
      ensureAnnotatorName();
      const text = prompt('Sticky note for ' + n.label + ':');
      if (text) {
        saveAnnotation({
          label: n.label,
          text,
          user: (ui.annotateUser && ui.annotateUser.value.trim()) || localStorage.getItem(LS.user) || 'anon',
          t: Date.now(),
        });
      }
      return true;
    }

    return false;
  }

  function beforeNavigate(label) {
    if (state.skillMode && !isUnlocked(label)) {
      alert('Locked in skill tree mode — read prerequisite modules first.');
      return false;
    }
    return true;
  }

  function onNavigate(label) {
    logVisit(label);
    enhanceBriefCrossRef(label);
  }

  function nodeAlphaModifier(n, baseAlpha) {
    if (!n.core || n.isRoot) return baseAlpha;
    let a = baseAlpha;

    const pathSet = threatPathSet();
    if (pathSet && state.threatKey) {
      a = pathSet.has(n.label) ? 1 : 0.12;
      if (state.threatPlaying && state.threatStep >= 0) {
        const path = scenarios.threats[state.threatKey].path;
        const cur = path[state.threatStep];
        if (n.label === cur) a = 1.2;
        else if (path.indexOf(n.label) < state.threatStep) a = 0.85;
      }
    }

    const persona = PERSONAS[state.persona];
    if (state.readingOrderOn && persona && persona.labels) {
      const pri = persona.labels.indexOf(n.label);
      if (pri >= 0) {
        a *= 1.0 + (persona.labels.length - pri) * 0.02;
      } else {
        a *= 0.35;
      }
    }

    if (state.skillMode && !isUnlocked(n.label)) a *= 0.25;

    if (state.portfolioMode && state.portfolioSet.has(n.label)) a = Math.max(a, 1);

    if (state.healthOverlay && health && health.nodes && health.nodes[n.label]) {
      const sc = health.nodes[n.label].score || 0.5;
      a *= 0.5 + sc * 0.5;
    }

    if (changelog && changelog.nodes && state.changelogOn) {
      const ch = changelog.nodes[n.label];
      if (ch && ch.recency < 0.15) a *= 0.55;
    }

    return Math.min(1.3, a);
  }

  function nodeScaleModifier(n) {
    if (!state.readingOrderOn) return 1;
    const persona = PERSONAS[state.persona];
    if (!persona || !persona.labels) return 1;
    const pri = persona.labels.indexOf(n.label);
    if (pri >= 0 && pri < 4) return 1 + (4 - pri) * 0.06;
    if (pri < 0) return 0.82;
    return 1;
  }

  function onDraw(ctx, fxCtx, t) {
    if (state.conceptMode) drawConceptMap(ctx, t);
    if (state.changelogOn) drawChangelogOrbit(fxCtx, t);
    if (state.healthOverlay) drawHealthHalos(ctx);
    if (state.chain.length > 1) drawChainLines(fxCtx, t);
    drawThreatTrail(fxCtx, t);
    drawTabletopTrail(fxCtx, t);
    if (state.annotateMode || loadAnnotations().length) renderAnnotationMarkers();
  }

  function drawConceptMap(ctx, t) {
    state.conceptNodes.forEach((c) => {
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9d5ff';
      ctx.font = '10px Consolas,monospace';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x, c.y + c.r + 12);
    });
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#c4b5fd';
    state.conceptNodes.forEach((c) => {
      (c.modules || []).forEach((mod) => {
        const n = deck.nodeByLabel(mod);
        if (!n) return;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      });
    });
    ctx.globalAlpha = 1;
  }

  function drawChangelogOrbit(fxCtx, t) {
    if (!changelog || !changelog.nodes) return;
    fxCtx.save();
    deck.applyFxTransform && deck.applyFxTransform();
    Object.values(changelog.nodes).forEach((ch) => {
      const n = deck.nodeByLabel(ch.label);
      if (!n) return;
      const rec = ch.recency || 0.1;
      const count = Math.ceil(rec * 8);
      for (let i = 0; i < count; i++) {
        const ang = t * 0.02 * (0.5 + rec) + i * (Math.PI * 2 / count);
        const rad = n.r + 12 + i * 2;
        const px = n.x + Math.cos(ang) * rad;
        const py = n.y + Math.sin(ang) * rad;
        fxCtx.globalAlpha = rec * 0.6;
        fxCtx.fillStyle = rec > 0.5 ? '#34d399' : '#6b7280';
        fxCtx.beginPath();
        fxCtx.arc(px, py, 1.2, 0, Math.PI * 2);
        fxCtx.fill();
      }
      if (rec < 0.15 && !REDUCED) {
        fxCtx.globalAlpha = 0.2;
        for (let d = 0; d < 4; d++) {
          const dx = n.x + Math.sin(t * 0.01 + d) * (n.r + 8);
          const dy = n.y + Math.cos(t * 0.013 + d) * (n.r + 6);
          fxCtx.fillStyle = '#4b5563';
          fxCtx.fillRect(dx, dy, 1, 1);
        }
      }
    });
    fxCtx.restore();
  }

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawHealthHalos(ctx) {
    if (!health || !health.nodes) return;
    Object.values(health.nodes).forEach((h) => {
      const n = deck.nodeByLabel(h.label);
      if (!n) return;
      const sc = h.score || 0.5;
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = sc > 0.7 ? '#34d399' : sc > 0.4 ? '#fbbf24' : '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 8, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function drawChainLines(fxCtx, t) {
    fxCtx.save();
    if (deck.applyFxTransform) deck.applyFxTransform();
    for (let i = 0; i < state.chain.length - 1; i++) {
      const a = deck.nodeByLabel(state.chain[i]);
      const b = deck.nodeByLabel(state.chain[i + 1]);
      if (!a || !b) continue;
      fxCtx.strokeStyle = '#fef9c3';
      fxCtx.lineWidth = 2;
      fxCtx.globalAlpha = 0.7;
      fxCtx.beginPath();
      fxCtx.moveTo(a.x, a.y);
      fxCtx.lineTo(b.x, b.y);
      fxCtx.stroke();
    }
    fxCtx.restore();
  }

  function drawThreatTrail(fxCtx, t) {
    if (!state.threatPlaying || !state.threatKey) return;
    const path = scenarios.threats[state.threatKey].path;
    drawPathGlow(fxCtx, path, state.threatStep, '#f472b6');
  }

  function drawTabletopTrail(fxCtx, t) {
    if (state.tabletopStep < 0 || !state.tabletopId) return;
    const card = scenarios.tabletop.find((x) => x.id === state.tabletopId);
    if (!card) return;
    drawPathGlow(fxCtx, card.path, state.tabletopStep, '#fef9c3');
  }

  function drawPathGlow(fxCtx, path, step, color) {
    fxCtx.save();
    if (deck.applyFxTransform) deck.applyFxTransform();
    for (let i = 0; i < Math.min(step + 1, path.length); i++) {
      const n = deck.nodeByLabel(path[i]);
      if (!n) continue;
      fxCtx.globalAlpha = i === step ? 0.9 : 0.4;
      fxCtx.strokeStyle = color;
      fxCtx.lineWidth = i === step ? 3 : 1.5;
      fxCtx.beginPath();
      fxCtx.arc(n.x, n.y, n.r + 10, 0, Math.PI * 2);
      fxCtx.stroke();
    }
    fxCtx.restore();
  }

  function onKeydown(e) {
    if (e.key === 'f' || e.key === 'F') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return false;
      const h = deck.getHover();
      if (h && h.label) { e.preventDefault(); enterTunnel(h.label); return true; }
    }
    if (e.key === 'Escape' && state.tunnelOn) {
      e.preventDefault();
      exitTunnel();
      return true;
    }
    return false;
  }

  function onChangelogHover(n, sx, sy) {
    if (!state.changelogOn || !changelog || !changelog.nodes) return;
    const ch = changelog.nodes[n.label];
    if (!ch) return;
    const tip = $('deck-changelog-tip');
    if (!tip) return;
    tip.hidden = false;
    tip.textContent = (ch.date || '').slice(0, 10) + ' — ' + (ch.summary || '');
    tip.style.left = sx + 12 + 'px';
    tip.style.top = sy + 12 + 'px';
  }

  function hideChangelogTip() {
    const tip = $('deck-changelog-tip');
    if (tip) tip.hidden = true;
  }

  async function boot(deckApi) {
    deck = deckApi || window.siemDeck;
    if (!deck) return;
    await loadAssets();
    initUI();
    renderChallenge();
    buildConceptLayout();
    dispatchEvent(new CustomEvent('siem-deck-modes-ready'));
  }

  function init(deckApi) {
    return boot(deckApi);
  }

  const hooks = {
    handleClick,
    beforeNavigate,
    onNavigate,
    nodeAlphaModifier,
    nodeScaleModifier,
    onDraw,
    onKeydown,
    onChangelogHover,
    hideChangelogTip,
    enterTunnel,
    exitTunnel,
    getState: () => state,
  };

  window.siemDeckModes = { init, ...hooks };
  window.siemDeckExt = hooks;

  if (window.siemDeck && window.siemDeck.ready) {
    init(window.siemDeck);
  } else {
    addEventListener('siem-deck-ready', () => init(window.siemDeck));
  }
})();
