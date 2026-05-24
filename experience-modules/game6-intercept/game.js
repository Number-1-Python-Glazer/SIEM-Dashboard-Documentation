/**
 * INTERROGATION ROOM — full gameplay module
 * Decode C2 command traffic and classify protocol patterns.
 */
(function () {
  'use strict';

  var GAME_ID = 'the_interrogation_room';
  var score = 0;
  var meshes = [];
  var pulse = 0;
  var runtime = {
    skill: null,
    buttonMap: {},
    levelStartMs: 0
  };

  var C2_LEVELS = {
    1: {
      name: 'Beacon Bootstrap',
      intel: {
        ip: '185.141.26.43',
        cve: 'CVE-2023-34362',
        mitre: 'T1071.001',
        tool: 'Cobalt Strike',
        ts: '2026-05-24T19:11:22Z',
        protocol: 'HTTPS',
        encoded: 'd2hvYW1pICYgaXBjb25maWcgL2FsbA==',
        decoded: 'whoami && ipconfig /all'
      }
    },
    2: {
      name: 'DNS Tunneling Pivot',
      intel: {
        ip: '103.77.192.88',
        cve: 'CVE-2024-1709',
        mitre: 'T1071.004',
        tool: 'dnscat2',
        ts: '2026-05-24T19:23:48Z',
        protocol: 'DNS',
        encoded: 'bmV0IHVzZXIgL2RvbWFpbg==',
        decoded: 'net user /domain'
      }
    },
    3: {
      name: 'SMB Lateral Relay',
      intel: {
        ip: '172.20.44.91',
        cve: 'CVE-2020-1472',
        mitre: 'T1021.002',
        tool: 'Impacket',
        ts: '2026-05-24T19:41:05Z',
        protocol: 'SMB',
        encoded: 'bmV0IHVzZSBcXFwxMC4xMC4xLjIwXGMk',
        decoded: 'net use \\\\10.10.1.20\\c$'
      }
    },
    4: {
      name: 'WebSocket Fallback',
      intel: {
        ip: '45.155.205.17',
        cve: 'CVE-2021-44228',
        mitre: 'T1105',
        tool: 'Sliver',
        ts: '2026-05-24T20:02:16Z',
        protocol: 'WEBSOCKET',
        encoded: 'Y21kIC9jIHBvd2Vyc2hlbGwgLWVuYw==',
        decoded: 'cmd /c powershell -enc'
      }
    }
  };

  var PROTOCOL_CHOICES = ['HTTPS', 'DNS', 'SMB', 'WEBSOCKET', 'IRC', 'FTP'];

  var STORY_BEATS = {
    1: [
      '2026-05-24T19:11:22Z | SRC 185.141.26.43 | CVE-2023-34362 exploitation chain opens shell transport.',
      '2026-05-24T19:11:41Z | MITRE T1071.001 observed over JA3-tuned TLS beaconing.',
      '2026-05-24T19:12:03Z | Tool fingerprint: Cobalt Strike profile with 60s jitter.',
      '2026-05-24T19:12:25Z | Packet body contains base64 task block d2hvYW1pICYgaXBjb25maWcgL2FsbA==.',
      '2026-05-24T19:12:44Z | EDR notes child process cmd.exe spawning discovery commands.',
      '2026-05-24T19:13:01Z | MITRE T1082 system discovery confirms host inventory pull.',
      '2026-05-24T19:13:21Z | Analyst action required: classify protocol and decode initial command.'
    ],
    2: [
      '2026-05-24T19:23:48Z | SRC 103.77.192.88 | CVE-2024-1709 exploitation follows edge VPN auth bypass.',
      '2026-05-24T19:24:10Z | MITRE T1071.004 beacon channel shifts into TXT subdomain bursts.',
      '2026-05-24T19:24:29Z | Tool fingerprint: dnscat2 framing with base32 headers.',
      '2026-05-24T19:24:57Z | Encoded command bmV0IHVzZXIgL2RvbWFpbg== appears in response payload.',
      '2026-05-24T19:25:15Z | Resolver telemetry shows 14.2 qps to random-labeled domains.',
      '2026-05-24T19:25:42Z | MITRE T1087.002 indicates domain account enumeration.',
      '2026-05-24T19:26:04Z | Analyst action required: lock protocol class and decode operator intent.'
    ],
    3: [
      '2026-05-24T19:41:05Z | SRC 172.20.44.91 | CVE-2020-1472 path follows privilege reset.',
      '2026-05-24T19:41:21Z | MITRE T1021.002 remote service activity spikes across admin shares.',
      '2026-05-24T19:41:52Z | Tool fingerprint: Impacket smbexec chain with host fan-out.',
      '2026-05-24T19:42:13Z | Encoded command bmV0IHVzZSBcXFwxMC4xMC4xLjIwXGMk captured in job queue.',
      '2026-05-24T19:42:43Z | Defender alert: anomalous service creation via IPC$ session.',
      '2026-05-24T19:43:09Z | MITRE T1570 lateral transfer indicators reach threshold.',
      '2026-05-24T19:43:31Z | Analyst action required: identify protocol and decode staging command.'
    ],
    4: [
      '2026-05-24T20:02:16Z | SRC 45.155.205.17 | CVE-2021-44228 pre-auth payload observed.',
      '2026-05-24T20:02:37Z | MITRE T1105 ingress transfer switches from HTTPS to websocket fallback.',
      '2026-05-24T20:03:05Z | Tool fingerprint: Sliver transport upgrade with per-message AES framing.',
      '2026-05-24T20:03:32Z | Encoded command Y21kIC9jIHBvd2Vyc2hlbGwgLWVuYw== inserted into callback.',
      '2026-05-24T20:03:57Z | Proxy logs show websocket endpoint /live/feed pinned for 12 minutes.',
      '2026-05-24T20:04:17Z | MITRE T1059.001 indicates encoded powershell execution handoff.',
      '2026-05-24T20:04:36Z | Analyst action required: finalize protocol class and command decoding.'
    ],
    5: [
      '2026-05-24T20:17:06Z | Intel merge begins for all four intercepted channels.',
      '2026-05-24T20:17:25Z | MITRE mappings consolidated: T1071.001, T1071.004, T1021.002, T1105.',
      '2026-05-24T20:17:50Z | CVE chain includes CVE-2023-34362, CVE-2024-1709, CVE-2020-1472, CVE-2021-44228.',
      '2026-05-24T20:18:09Z | Tool tags exported: Cobalt Strike, dnscat2, Impacket, Sliver.',
      '2026-05-24T20:18:31Z | IOC package includes source IP set and decoded command set.',
      '2026-05-24T20:18:56Z | Response team requests debrief acknowledgment.',
      '2026-05-24T20:19:18Z | Operator action required: run module debrief.'
    ]
  };

  function ensureExtras(shell) {
    var extras = shell.levelState.extras || {};
    if (!extras.selectedProtocol) extras.selectedProtocol = '';
    if (!extras.decodedCommand) extras.decodedCommand = '';
    if (!extras.protocolVerified) extras.protocolVerified = false;
    if (!extras.commandVerified) extras.commandVerified = false;
    if (!extras.failures) extras.failures = 0;
    if (!extras.actions) extras.actions = [];
    shell.levelState.extras = extras;
    return extras;
  }

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = 'SCORE ' + score;
  }

  function addPoints(shell, amount, why) {
    score += amount;
    shell.score += amount;
    updateScoreDisplay();
    shell.appendOut('[POINTS] +' + amount + ' ' + why + ' | total ' + score);
  }

  function revealInputAndButtons() {
    var form = document.getElementById('term-form');
    var buttons = document.getElementById('action-btns');
    if (form) form.classList.remove('hidden');
    if (buttons) buttons.classList.remove('hidden');
  }

  function normalizeCmd(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function isExpectedCommand(level, candidate) {
    var intel = C2_LEVELS[level] && C2_LEVELS[level].intel;
    if (!intel) return false;
    return normalizeCmd(candidate) === normalizeCmd(intel.decoded);
  }

  function isExpectedProtocol(level, candidate) {
    var intel = C2_LEVELS[level] && C2_LEVELS[level].intel;
    if (!intel) return false;
    return String(candidate || '').toUpperCase() === intel.protocol;
  }

  function logStory(shell, level) {
    var beats = STORY_BEATS[level] || [];
    var i;
    for (i = 0; i < beats.length; i++) {
      shell.appendOut('[INTEL] ' + beats[i]);
    }
  }

  function levelSummary(shell, level) {
    var intel = C2_LEVELS[level] && C2_LEVELS[level].intel;
    if (!intel) return;
    shell.appendOut(
      '[CASE] SRC ' + intel.ip + ' | ' + intel.cve + ' | ' + intel.mitre + ' | ' + intel.tool + ' | ' + intel.ts
    );
    shell.appendOut('[CASE] Encoded command: ' + intel.encoded);
    shell.appendOut('[CASE] Select protocol, then type decoded command in terminal input.');
  }

  function renderProtocolButtons(shell, level) {
    var wrap = document.getElementById('action-btns');
    var i;
    if (!wrap) return;
    wrap.innerHTML = '';
    runtime.buttonMap = {};
    for (i = 0; i < PROTOCOL_CHOICES.length; i++) {
      appendProtocolButton(wrap, PROTOCOL_CHOICES[i], shell, level);
    }
    if (level === 5) {
      var debrief = document.createElement('button');
      debrief.type = 'button';
      debrief.className = 'act-btn';
      debrief.textContent = 'RUN DEBRIEF';
      debrief.onclick = function () { shell.runEpilogue(); };
      wrap.appendChild(debrief);
    }
  }

  function appendProtocolButton(wrap, protocol, shell, level) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'act-btn';
    button.textContent = protocol;
    button.onclick = function () {
      chooseProtocol(shell, level, protocol);
    };
    wrap.appendChild(button);
    runtime.buttonMap[protocol] = button;
  }

  function chooseProtocol(shell, level, protocol) {
    var extras = ensureExtras(shell);
    extras.selectedProtocol = protocol;
    extras.actions.push({ t: Date.now(), type: 'protocol', value: protocol });
    extras.protocolVerified = isExpectedProtocol(level, protocol);
    shell.appendOut('[ACTION] Protocol selected: ' + protocol);
    if (extras.protocolVerified) {
      addPoints(shell, 45, 'correct protocol');
      shell.appendOut('[SUCCESS] Protocol matches captured C2 transport.');
    } else {
      extras.failures += 1;
      HabibiProgression.logFailure(GAME_ID, level, 'wrong_protocol', shell.state);
      shell.appendOut('[FAIL] Protocol mismatch for this level intelligence.');
    }
    shell.processCommand('check');
  }

  function handleTypedCommand(shell, raw) {
    var level = shell.state.currentLevel;
    var extras = ensureExtras(shell);
    extras.decodedCommand = raw;
    extras.actions.push({ t: Date.now(), type: 'command', value: raw });
    extras.commandVerified = isExpectedCommand(level, raw);
    if (extras.commandVerified) {
      addPoints(shell, 80, 'decoded C2 command');
      shell.appendOut('[SUCCESS] Command decode validated against known C2 tasking.');
    } else {
      extras.failures += 1;
      HabibiProgression.logFailure(GAME_ID, level, 'wrong_command', shell.state);
      shell.appendOut('[FAIL] Command decode is incorrect for this payload.');
      shell.appendOut('[HINT] Base64 payload decodes into a Windows operator command.');
    }
    shell.processCommand('check');
  }

  function setupForm(shell) {
    var form = document.getElementById('term-form');
    var input = document.getElementById('term-in');
    if (!form || !input) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var cmd = input.value.trim();
      if (!cmd) return;
      input.value = '';
      shell.appendOut('> ' + cmd);
      if (runtime.skill) {
        handleSkillInput(shell, cmd);
        return;
      }
      if (shell.state.currentLevel === 5 && normalizeCmd(cmd) === 'run debrief') {
        shell.runEpilogue();
        return;
      }
      handleTypedCommand(shell, cmd);
    }, true);
  }

  function validateProtocolTask(level, shell) {
    var extras = ensureExtras(shell);
    return extras.protocolVerified && isExpectedProtocol(level, extras.selectedProtocol);
  }

  function validateCommandTask(level, shell) {
    var extras = ensureExtras(shell);
    return extras.commandVerified && isExpectedCommand(level, extras.decodedCommand);
  }

  function buildScene(engine, level, shell) {
    var i;
    if (engine.clearPhysics) engine.clearPhysics();
    meshes = [];
    pulse = 0;

    engine.addFloor(18, 18, 0x0b1220);
    var core = engine.addBox(0, 0.6, 0, 1.8, 1.1, 1.8, 0x111827, 0);
    core.material.emissive = new THREE.Color(0x1d4ed8);
    core.material.emissiveIntensity = 0.25;
    core.userData.kind = 'core';
    meshes.push(core);

    for (i = 0; i < 6 + level * 2; i++) {
      var node = engine.addBox(
        (Math.random() - 0.5) * 10,
        0.8 + Math.random() * 1.8,
        (Math.random() - 0.5) * 10,
        0.36,
        0.36,
        0.36,
        0x0ea5e9 + i * 600,
        0.2 + level * 0.03
      );
      node.userData.kind = 'node';
      meshes.push(node);
    }

    for (i = 0; i < level + 3; i++) {
      var ring = engine.addBox(
        (Math.random() - 0.5) * 8,
        2.1 + Math.random() * 1.1,
        (Math.random() - 0.5) * 8,
        1.0,
        0.05,
        1.0,
        0x22d3ee,
        0
      );
      ring.material.emissive = new THREE.Color(0x06b6d4);
      ring.material.emissiveIntensity = 0.22;
      ring.userData.kind = 'ring';
      meshes.push(ring);
    }

    if (engine.addPhysicsSphere) {
      for (i = 0; i < level + 4; i++) {
        var spark = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 9,
          2 + Math.random() * 2.2,
          (Math.random() - 0.5) * 9,
          0.1 + Math.random() * 0.08,
          0x60a5fa,
          0.3
        );
        spark.userData.kind = 'spark';
        meshes.push(spark);
      }
    }

    revealInputAndButtons();
    renderProtocolButtons(shell, level);
    logStory(shell, level);
    levelSummary(shell, level);
  }

  function startProtocolSprint(shell) {
    var rounds = [
      { protocol: 'HTTPS', mitre: 'T1071.001' },
      { protocol: 'DNS', mitre: 'T1071.004' },
      { protocol: 'SMB', mitre: 'T1021.002' },
      { protocol: 'WEBSOCKET', mitre: 'T1105' }
    ];
    runtime.skill = {
      id: 'protocolSprint',
      rounds: rounds,
      idx: 0,
      misses: 0,
      startMs: Date.now()
    };
    shell.appendOut('[SKILL] Protocol Sprint started. Type protocol for each MITRE hint.');
    shell.appendOut('[SKILL] Round 1/' + rounds.length + ' hint=' + rounds[0].mitre);
  }

  function startDecodeAccuracy(shell) {
    var rounds = [
      { encoded: 'd2hvYW1p', decoded: 'whoami' },
      { encoded: 'aXBjb25maWcgL2FsbA==', decoded: 'ipconfig /all' },
      { encoded: 'bmV0IHVzZXI=', decoded: 'net user' },
      { encoded: 'Y21kIC9jIGRpciA=', decoded: 'cmd /c dir' }
    ];
    runtime.skill = {
      id: 'decodeAccuracy',
      rounds: rounds,
      idx: 0,
      correct: 0,
      startMs: Date.now()
    };
    shell.appendOut('[SKILL] Decode Accuracy started. Type exact decoded command.');
    shell.appendOut('[SKILL] Encoded 1/' + rounds.length + ': ' + rounds[0].encoded);
  }

  function startBeaconTracing(shell) {
    runtime.skill = {
      id: 'beaconTracing',
      expected: ['185.141.26.43', '103.77.192.88', '172.20.44.91', '45.155.205.17'],
      idx: 0,
      misses: 0,
      startMs: Date.now()
    };
    shell.appendOut('[SKILL] Beacon Tracing started. Type IPs in chronological order.');
    shell.appendOut('[SKILL] Enter IP 1/4');
  }

  function finishProtocolSprint(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var scoreValue = Math.max(120, 1000 - elapsed * 24 - skill.misses * 55);
    shell.submitScore('protocolSprint', scoreValue);
    shell.appendOut('[SKILL] Protocol Sprint score: ' + scoreValue + ' | time ' + elapsed + 's | misses ' + skill.misses);
    runtime.skill = null;
  }

  function finishDecodeAccuracy(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var accuracy = skill.correct / skill.rounds.length;
    var scoreValue = Math.max(100, Math.floor(accuracy * 900) - elapsed * 12);
    shell.submitScore('decodeAccuracy', scoreValue);
    shell.appendOut('[SKILL] Decode Accuracy score: ' + scoreValue + ' | accuracy ' + Math.round(accuracy * 100) + '%');
    runtime.skill = null;
  }

  function finishBeaconTracing(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var scoreValue = Math.max(140, 980 - elapsed * 30 - skill.misses * 70);
    shell.submitScore('beaconTracing', scoreValue);
    shell.appendOut('[SKILL] Beacon Tracing score: ' + scoreValue + ' | time ' + elapsed + 's');
    runtime.skill = null;
  }

  function handleSkillInput(shell, raw) {
    var value = String(raw || '').trim();
    var skill = runtime.skill;
    if (!skill) return;

    if (skill.id === 'protocolSprint') {
      var expectedProtocol = skill.rounds[skill.idx].protocol;
      if (String(value).toUpperCase() === expectedProtocol) {
        skill.idx += 1;
        shell.appendOut('[SKILL] Correct.');
      } else {
        skill.misses += 1;
        shell.appendOut('[SKILL] Wrong. Expected transport class for hint.');
      }
      if (skill.idx >= skill.rounds.length) finishProtocolSprint(shell, skill);
      else shell.appendOut('[SKILL] Round ' + (skill.idx + 1) + '/' + skill.rounds.length + ' hint=' + skill.rounds[skill.idx].mitre);
      return;
    }

    if (skill.id === 'decodeAccuracy') {
      var expectedDecode = normalizeCmd(skill.rounds[skill.idx].decoded);
      if (normalizeCmd(value) === expectedDecode) {
        skill.correct += 1;
        shell.appendOut('[SKILL] Correct decode.');
      } else {
        shell.appendOut('[SKILL] Incorrect decode.');
      }
      skill.idx += 1;
      if (skill.idx >= skill.rounds.length) finishDecodeAccuracy(shell, skill);
      else shell.appendOut('[SKILL] Encoded ' + (skill.idx + 1) + '/' + skill.rounds.length + ': ' + skill.rounds[skill.idx].encoded);
      return;
    }

    if (skill.id === 'beaconTracing') {
      var expectedIp = skill.expected[skill.idx];
      if (value === expectedIp) {
        skill.idx += 1;
        shell.appendOut('[SKILL] Correct IP.');
      } else {
        skill.misses += 1;
        shell.appendOut('[SKILL] Incorrect order.');
      }
      if (skill.idx >= skill.expected.length) finishBeaconTracing(shell, skill);
      else shell.appendOut('[SKILL] Enter IP ' + (skill.idx + 1) + '/' + skill.expected.length);
    }
  }

  function setLevelText(shell, level) {
    if (level === 5) {
      shell.setTaskText('Debrief phase: click RUN DEBRIEF or type run debrief.');
      return;
    }
    shell.setTaskText('Select C2 protocol and decode the command payload for level ' + level + '.');
  }

  var config = {
    gameId: GAME_ID,
    title: 'INTERROGATION ROOM',
    achievementId: 'intercept_master',
    leaderboardChallenge: 'protocolSprint',
    engine: { bg: 0x081226, physics: true },
    moveSpeed: 2.35,
    buildScene: buildScene,
    levels: {
      1: {
        name: 'Beacon Bootstrap',
        hint: 'Classify C2 protocol and decode tasking.',
        timeLimit: 280,
        tasks: [
          {
            id: 'l1_protocol',
            hint: 'Select correct protocol based on telemetry.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateProtocolTask(1, shell); },
            output: '[TASK] Protocol validation complete.'
          },
          {
            id: 'l1_command',
            hint: 'Type decoded command from base64 block.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateCommandTask(1, shell); },
            output: '[TASK] Command validation complete.'
          }
        ],
        branch: {
          title: 'Escalation Path',
          desc: 'Choose investigation emphasis after first intercept.',
          options: [
            { id: 'intercept_l1_contain', label: 'Push immediate host containment.' },
            { id: 'intercept_l1_hunt', label: 'Run infra-wide hunt before isolation.' },
            { id: 'intercept_l1_deception', label: 'Deploy decoy endpoint for callback.' },
            { id: 'intercept_l1_chain', label: 'Prioritize full kill-chain reconstruction.' },
            { id: 'intercept_l1_partner', label: 'Share indicator package with partner SOC.' }
          ]
        }
      },
      2: {
        name: 'DNS Tunneling Pivot',
        hint: 'Identify DNS C2 and decode account enumeration tasking.',
        timeLimit: 310,
        tasks: [
          {
            id: 'l2_protocol',
            hint: 'Select protocol for tunneling beacon.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateProtocolTask(2, shell); },
            output: '[TASK] Protocol validation complete.'
          },
          {
            id: 'l2_command',
            hint: 'Decode and submit operator command.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateCommandTask(2, shell); },
            output: '[TASK] Command validation complete.'
          }
        ],
        branch: {
          title: 'Collection Strategy',
          desc: 'Choose signal collection posture for DNS beaconing.',
          options: [
            { id: 'intercept_l2_block', label: 'Block sinkholed domains now.' },
            { id: 'intercept_l2_monitor', label: 'Monitor query entropy for more hosts.' },
            { id: 'intercept_l2_trace', label: 'Trace resolver path to edge gateway.' },
            { id: 'intercept_l2_sink', label: 'Redirect C2 TXT responses to sink host.' },
            { id: 'intercept_l2_delay', label: 'Delay containment to collect campaign graph.' }
          ]
        }
      },
      3: {
        name: 'SMB Lateral Relay',
        hint: 'Detect SMB relay protocol and decode share access command.',
        timeLimit: 340,
        tasks: [
          {
            id: 'l3_protocol',
            hint: 'Identify transport protocol for lateral movement.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateProtocolTask(3, shell); },
            output: '[TASK] Protocol validation complete.'
          },
          {
            id: 'l3_command',
            hint: 'Submit decoded lateral movement command.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateCommandTask(3, shell); },
            output: '[TASK] Command validation complete.'
          }
        ],
        branch: {
          title: 'Lateral Movement Response',
          desc: 'Pick the next action after SMB relay confirmation.',
          options: [
            { id: 'intercept_l3_reset', label: 'Reset privileged credentials immediately.' },
            { id: 'intercept_l3_segment', label: 'Segment admin shares by subnet.' },
            { id: 'intercept_l3_hunt', label: 'Hunt for service-creation artifacts first.' },
            { id: 'intercept_l3_ticket', label: 'Invalidate Kerberos tickets globally.' },
            { id: 'intercept_l3_forensic', label: 'Preserve forensic image before cleaning.' }
          ]
        }
      },
      4: {
        name: 'WebSocket Fallback',
        hint: 'Resolve websocket fallback and decode powershell bootstrap.',
        timeLimit: 370,
        tasks: [
          {
            id: 'l4_protocol',
            hint: 'Identify fallback transport class.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateProtocolTask(4, shell); },
            output: '[TASK] Protocol validation complete.'
          },
          {
            id: 'l4_command',
            hint: 'Decode and submit bootstrap command.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateCommandTask(4, shell); },
            output: '[TASK] Command validation complete.'
          }
        ]
      },
      5: { name: 'Intercept Debrief', epilogue: true }
    },
    skills: [
      {
        id: 'protocolSprint',
        name: 'Protocol Sprint',
        unlockAfter: 1,
        desc: 'Rapidly map MITRE hints to C2 protocol classes.',
        start: startProtocolSprint
      },
      {
        id: 'decodeAccuracy',
        name: 'Decode Accuracy',
        unlockAfter: 2,
        desc: 'Decode base64 C2 tasks with high accuracy.',
        start: startDecodeAccuracy
      },
      {
        id: 'beaconTracing',
        name: 'Beacon Tracing',
        unlockAfter: 3,
        desc: 'Reconstruct beacon IP sequence under time pressure.',
        start: startBeaconTracing
      }
    ],
    onLevelStart: function (level, shell) {
      var extras = ensureExtras(shell);
      extras.selectedProtocol = '';
      extras.decodedCommand = '';
      extras.protocolVerified = false;
      extras.commandVerified = false;
      extras.actions = [];
      runtime.levelStartMs = Date.now();
      setLevelText(shell, level);
      addPoints(shell, 12 + level * 4, 'level start');
    },
    onLevelComplete: function (level, shell) {
      if (level <= 4) shell.appendOut('[REPORT] Intercept case ' + level + ' closed.');
      if (level === 4) shell.appendOut('[REPORT] Four-channel C2 decoding package complete.');
    }
  };

  config.onTick = function (dt) {
    var i;
    pulse += dt * 2.1;
    for (i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (!mesh || !mesh.userData) continue;
      if (mesh.userData.physicsBody && mesh.userData.physicsBody.mass > 0) continue;
      if (mesh.userData.kind === 'node') {
        mesh.rotation.y += dt * 0.3;
        mesh.position.y += Math.sin(pulse + i * 0.4) * dt * 0.3;
      }
      if (mesh.userData.kind === 'ring') {
        mesh.rotation.x += dt * 0.2;
        mesh.rotation.z += dt * 0.12;
      }
      if (mesh.userData.kind === 'core') {
        mesh.material.emissiveIntensity = 0.2 + Math.abs(Math.sin(pulse)) * 0.24;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var shell;
    var taskText = document.getElementById('task-text');
    var actionLog = document.getElementById('action-log');

    if (!HabibiProgression.isGameUnlocked(GAME_ID) && GAME_ID !== 'the_terminal') {
      var state = HabibiProgression.load(GAME_ID);
      if (!state.unlocked) {
        if (taskText) taskText.textContent = 'Module locked — complete previous game epilogue first.';
        return;
      }
    }

    shell = new HabibiGameShell(config);
    shell.score = 0;
    shell.updateScore = updateScoreDisplay;
    shell.appendOut = function (text) {
      if (!actionLog) return;
      actionLog.textContent += text + '\n';
      actionLog.scrollTop = actionLog.scrollHeight;
    };
    shell.setTaskText = function (text) {
      if (taskText) taskText.textContent = text;
    };

    shell.onCommand = function (cmd, activeShell) {
      var lowered = normalizeCmd(cmd);
      if (lowered === 'help') {
        activeShell.appendOut('[CMD] Select protocol button, then type decoded command.');
        activeShell.appendOut('[CMD] Skill mode uses direct text inputs.');
        return;
      }
      if (lowered === 'status') {
        var extras = ensureExtras(activeShell);
        activeShell.appendOut('[STATUS] protocol=' + (extras.selectedProtocol || '(none)') + ' verified=' + extras.protocolVerified);
        activeShell.appendOut('[STATUS] command=' + (extras.decodedCommand || '(none)') + ' verified=' + extras.commandVerified);
        return;
      }
      if (runtime.skill) {
        handleSkillInput(activeShell, cmd);
        return;
      }
      handleTypedCommand(activeShell, cmd);
    };

    shell.init();
    setupForm(shell);
    revealInputAndButtons();
    updateScoreDisplay();
  });
})();
