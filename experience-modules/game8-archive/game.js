/**
 * DEEP ARCHIVE — full gameplay module
 * Reconstruct incident timelines by reordering log entries.
 */
(function () {
  'use strict';

  var GAME_ID = 'the_deep_archive';
  var score = 0;
  var meshes = [];
  var swing = 0;
  var runtime = {
    skill: null,
    selectedIndex: -1
  };

  var ARCHIVE_LEVELS = {
    1: {
      name: 'Initial Access Chain',
      intel: {
        ip: '10.12.77.91',
        cve: 'CVE-2021-34527',
        mitre: 'T1190',
        tool: 'Splunk',
        ts: '2026-05-24'
      },
      ordered: [
        '2026-05-24T18:00:12Z | 10.12.77.91 | spoolsv crash from CVE-2021-34527 payload',
        '2026-05-24T18:00:44Z | 10.12.77.91 | powershell child process created',
        '2026-05-24T18:01:02Z | 10.12.77.91 | outbound HTTPS beacon to 185.141.26.43',
        '2026-05-24T18:01:31Z | 10.12.77.91 | scheduled task update_checker registered',
        '2026-05-24T18:01:58Z | 10.12.77.91 | local admin group membership changed'
      ]
    },
    2: {
      name: 'Credential Theft Sequence',
      intel: {
        ip: '10.18.40.66',
        cve: 'CVE-2023-23397',
        mitre: 'T1003.001',
        tool: 'Elastic SIEM',
        ts: '2026-05-24'
      },
      ordered: [
        '2026-05-24T18:18:09Z | 10.18.40.66 | suspicious Outlook reminder object processed',
        '2026-05-24T18:18:41Z | 10.18.40.66 | ntlm hash relay attempt logged',
        '2026-05-24T18:19:13Z | 10.18.40.66 | lsass read handle opened by mimikatz',
        '2026-05-24T18:19:47Z | 10.18.40.66 | sekurlsa output staged in temp file',
        '2026-05-24T18:20:20Z | 10.18.40.66 | compressed dump uploaded via webdav'
      ]
    },
    3: {
      name: 'Lateral Movement Window',
      intel: {
        ip: '172.19.55.144',
        cve: 'CVE-2020-1472',
        mitre: 'T1021.002',
        tool: 'Chronicle',
        ts: '2026-05-24'
      },
      ordered: [
        '2026-05-24T18:39:26Z | 172.19.55.144 | netlogon privilege abuse observed',
        '2026-05-24T18:39:58Z | 172.19.55.144 | machine account password reset',
        '2026-05-24T18:40:22Z | 172.19.55.144 | smb session to 10.10.1.20 established',
        '2026-05-24T18:40:51Z | 172.19.55.144 | service install command pushed remotely',
        '2026-05-24T18:41:24Z | 172.19.55.144 | executable copied into admin$ share'
      ]
    },
    4: {
      name: 'Exfiltration Timeline',
      intel: {
        ip: '192.168.104.28',
        cve: 'CVE-2021-44228',
        mitre: 'T1041',
        tool: 'QRadar',
        ts: '2026-05-24'
      },
      ordered: [
        '2026-05-24T19:04:03Z | 192.168.104.28 | jndi callback to attacker host confirmed',
        '2026-05-24T19:04:28Z | 192.168.104.28 | reverse shell spawned under java process',
        '2026-05-24T19:05:01Z | 192.168.104.28 | archive staging command tar -czf issued',
        '2026-05-24T19:05:35Z | 192.168.104.28 | websocket c2 channel initialized',
        '2026-05-24T19:06:08Z | 192.168.104.28 | encrypted outbound transfer exceeded baseline'
      ]
    }
  };

  var STORY_BEATS = {
    1: [
      '2026-05-24T18:00:12Z | SRC 10.12.77.91 | CVE-2021-34527 exploit path opens.',
      '2026-05-24T18:00:33Z | MITRE T1190 public-facing exploit telemetry appears.',
      '2026-05-24T18:00:56Z | Tool source: Splunk timeline index receives first burst.',
      '2026-05-24T18:01:18Z | Process lineage shows powershell pivot after spoolsv crash.',
      '2026-05-24T18:01:42Z | HTTPS beaconing starts toward known C2 destination.',
      '2026-05-24T18:02:03Z | Privilege changes occur after persistence registration.',
      '2026-05-24T18:02:26Z | Analyst action required: reorder logs into exact chronology.'
    ],
    2: [
      '2026-05-24T18:18:09Z | SRC 10.18.40.66 | CVE-2023-23397 exploitation sequence starts.',
      '2026-05-24T18:18:31Z | MITRE T1003.001 credential access behavior mapped.',
      '2026-05-24T18:18:57Z | Tool source: Elastic SIEM stitched endpoint and mail events.',
      '2026-05-24T18:19:19Z | LSASS handle access follows relay setup.',
      '2026-05-24T18:19:45Z | Dump material staged prior to outbound transfer.',
      '2026-05-24T18:20:11Z | WebDAV upload indicates theft completion stage.',
      '2026-05-24T18:20:36Z | Analyst action required: place events in strict order.'
    ],
    3: [
      '2026-05-24T18:39:26Z | SRC 172.19.55.144 | CVE-2020-1472 abuse confirmed.',
      '2026-05-24T18:39:49Z | MITRE T1021.002 remote service traffic starts.',
      '2026-05-24T18:40:12Z | Tool source: Chronicle merges domain controller events.',
      '2026-05-24T18:40:36Z | Password reset precedes SMB lateral pivot.',
      '2026-05-24T18:40:59Z | Service installation appears before file transfer completion.',
      '2026-05-24T18:41:20Z | Host spread continues through admin shares.',
      '2026-05-24T18:41:46Z | Analyst action required: reconstruct timeline accurately.'
    ],
    4: [
      '2026-05-24T19:04:03Z | SRC 192.168.104.28 | CVE-2021-44228 callback observed.',
      '2026-05-24T19:04:24Z | MITRE T1041 exfiltration path begins forming.',
      '2026-05-24T19:04:49Z | Tool source: QRadar flow monitor identifies abnormal stream.',
      '2026-05-24T19:05:12Z | Reverse shell and staging commands occur before transfer.',
      '2026-05-24T19:05:39Z | Websocket C2 setup precedes final high-volume egress.',
      '2026-05-24T19:06:01Z | Outbound encrypted transfer crosses alert threshold.',
      '2026-05-24T19:06:24Z | Analyst action required: sort timeline in exact order.'
    ],
    5: [
      '2026-05-24T19:19:18Z | Archive merge for four incident timelines begins.',
      '2026-05-24T19:19:44Z | MITRE tags consolidated: T1190, T1003.001, T1021.002, T1041.',
      '2026-05-24T19:20:05Z | CVE chain locked for final incident packet.',
      '2026-05-24T19:20:31Z | Tool outputs merged from Splunk, Elastic SIEM, Chronicle, QRadar.',
      '2026-05-24T19:20:53Z | Chronology confidence score reaches review threshold.',
      '2026-05-24T19:21:19Z | Response lead requests final archive sign-off.',
      '2026-05-24T19:21:41Z | Operator action required: run debrief.'
    ]
  };

  function ensureExtras(shell) {
    var extras = shell.levelState.extras || {};
    if (!extras.currentOrder) extras.currentOrder = [];
    if (!extras.correctOrder) extras.correctOrder = [];
    if (!extras.orderValidated) extras.orderValidated = false;
    if (!extras.moves) extras.moves = 0;
    if (!extras.history) extras.history = [];
    if (!extras.failures) extras.failures = 0;
    shell.levelState.extras = extras;
    return extras;
  }

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = 'SCORE ' + score;
  }

  function addPoints(shell, amount, reason) {
    score += amount;
    shell.score += amount;
    updateScoreDisplay();
    shell.appendOut('[POINTS] +' + amount + ' ' + reason + ' | total ' + score);
  }

  function showInputAndButtons() {
    var form = document.getElementById('term-form');
    var btns = document.getElementById('action-btns');
    if (form) form.classList.remove('hidden');
    if (btns) btns.classList.remove('hidden');
  }

  function cloneArray(arr) {
    return arr.slice();
  }

  function shuffleCopy(arr) {
    var out = cloneArray(arr);
    var i;
    var j;
    var tmp;
    for (i = out.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function isOrderCorrect(extras) {
    var i;
    if (extras.currentOrder.length !== extras.correctOrder.length) return false;
    for (i = 0; i < extras.correctOrder.length; i++) {
      if (extras.currentOrder[i] !== extras.correctOrder[i]) return false;
    }
    return !0;
  }

  function setTaskText(shell, level) {
    if (level === 5) shell.setTaskText('Debrief phase: click RUN DEBRIEF or type run debrief.');
    else shell.setTaskText('Reorder logs chronologically. Use click-select then move buttons, or terminal move commands.');
  }

  function logStory(shell, level) {
    var beats = STORY_BEATS[level] || [];
    var i;
    for (i = 0; i < beats.length; i++) shell.appendOut('[INTEL] ' + beats[i]);
  }

  function initializeOrder(shell, level) {
    var extras = ensureExtras(shell);
    var data = ARCHIVE_LEVELS[level];
    if (!data) return;
    extras.correctOrder = cloneArray(data.ordered);
    extras.currentOrder = shuffleCopy(data.ordered);
    extras.orderValidated = false;
    extras.moves = 0;
    extras.history = [];
    if (isOrderCorrect(extras)) extras.currentOrder.reverse();
    renderTimeline(shell, level);
  }

  function renderTimeline(shell, level) {
    var extras = ensureExtras(shell);
    var log = document.getElementById('action-log');
    var i;
    if (!log) return;
    log.textContent = '';
    for (i = 0; i < extras.currentOrder.length; i++) {
      var prefix = (runtime.selectedIndex === i) ? '[*] ' : '[ ] ';
      log.textContent += prefix + (i + 1) + '. ' + extras.currentOrder[i] + '\n';
    }
    log.scrollTop = 0;
    if (level <= 4) {
      var intel = ARCHIVE_LEVELS[level].intel;
      shell.appendOut('[CASE] ' + intel.ts + ' | IP ' + intel.ip + ' | ' + intel.cve + ' | ' + intel.mitre + ' | ' + intel.tool);
    }
  }

  function validateCurrentOrder(shell, level) {
    var extras = ensureExtras(shell);
    if (level > 4) return;
    extras.orderValidated = isOrderCorrect(extras);
    if (extras.orderValidated) {
      var speedBonus = Math.max(20, 120 - extras.moves * 4);
      addPoints(shell, 120 + speedBonus, 'correct timeline reconstruction');
      shell.appendOut('[SUCCESS] Timeline is correct.');
    } else {
      extras.failures += 1;
      HabibiProgression.logFailure(GAME_ID, level, 'wrong_order', shell.state);
      shell.appendOut('[FAIL] Timeline order is incorrect.');
    }
    shell.processCommand('check');
  }

  function moveEntry(shell, fromIdx, toIdx) {
    var extras = ensureExtras(shell);
    if (fromIdx < 0 || fromIdx >= extras.currentOrder.length) return false;
    if (toIdx < 0 || toIdx >= extras.currentOrder.length) return false;
    if (fromIdx === toIdx) return false;
    var moved = extras.currentOrder.splice(fromIdx, 1)[0];
    extras.currentOrder.splice(toIdx, 0, moved);
    extras.moves += 1;
    extras.history.push({ at: Date.now(), from: fromIdx, to: toIdx });
    return !0;
  }

  function swapEntries(shell, a, b) {
    var extras = ensureExtras(shell);
    if (a < 0 || b < 0 || a >= extras.currentOrder.length || b >= extras.currentOrder.length) return false;
    var tmp = extras.currentOrder[a];
    extras.currentOrder[a] = extras.currentOrder[b];
    extras.currentOrder[b] = tmp;
    extras.moves += 1;
    extras.history.push({ at: Date.now(), swap: [a, b] });
    return !0;
  }

  function buildControlButtons(shell, level) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (level === 5) {
      appendButton(wrap, 'RUN DEBRIEF', function () { shell.runEpilogue(); });
      return;
    }

    appendButton(wrap, 'SELECT PREV', function () {
      var extras = ensureExtras(shell);
      if (runtime.selectedIndex < 0) runtime.selectedIndex = 0;
      else runtime.selectedIndex = Math.max(0, runtime.selectedIndex - 1);
      renderTimeline(shell, level);
    });

    appendButton(wrap, 'SELECT NEXT', function () {
      var extras = ensureExtras(shell);
      if (runtime.selectedIndex < 0) runtime.selectedIndex = 0;
      else runtime.selectedIndex = Math.min(extras.currentOrder.length - 1, runtime.selectedIndex + 1);
      renderTimeline(shell, level);
    });

    appendButton(wrap, 'MOVE UP', function () {
      if (runtime.selectedIndex <= 0) return;
      if (moveEntry(shell, runtime.selectedIndex, runtime.selectedIndex - 1)) {
        runtime.selectedIndex -= 1;
        renderTimeline(shell, level);
      }
    });

    appendButton(wrap, 'MOVE DOWN', function () {
      var extras = ensureExtras(shell);
      if (runtime.selectedIndex < 0 || runtime.selectedIndex >= extras.currentOrder.length - 1) return;
      if (moveEntry(shell, runtime.selectedIndex, runtime.selectedIndex + 1)) {
        runtime.selectedIndex += 1;
        renderTimeline(shell, level);
      }
    });

    appendButton(wrap, 'VALIDATE ORDER', function () {
      validateCurrentOrder(shell, level);
    });
  }

  function appendButton(wrap, label, fn) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'act-btn';
    button.textContent = label;
    button.onclick = fn;
    wrap.appendChild(button);
  }

  function parseCommand(shell, cmd) {
    var level = shell.state.currentLevel;
    var lower = String(cmd || '').trim().toLowerCase();
    var parts;
    var a;
    var b;
    if (runtime.skill) {
      handleSkillInput(shell, cmd);
      return;
    }
    if (lower === 'status') {
      var extras = ensureExtras(shell);
      shell.appendOut('[STATUS] moves=' + extras.moves + ' validated=' + extras.orderValidated);
      return;
    }
    if (lower === 'validate') {
      validateCurrentOrder(shell, level);
      return;
    }
    if (lower === 'show') {
      renderTimeline(shell, level);
      return;
    }
    if (lower.indexOf('move ') === 0) {
      parts = lower.split(/\s+/);
      if (parts.length === 3) {
        a = Number(parts[1]) - 1;
        b = Number(parts[2]) - 1;
        if (moveEntry(shell, a, b)) renderTimeline(shell, level);
      }
      return;
    }
    if (lower.indexOf('swap ') === 0) {
      parts = lower.split(/\s+/);
      if (parts.length === 3) {
        a = Number(parts[1]) - 1;
        b = Number(parts[2]) - 1;
        if (swapEntries(shell, a, b)) renderTimeline(shell, level);
      }
      return;
    }
    if (level === 5 && lower === 'run debrief') {
      shell.runEpilogue();
      return;
    }
    shell.appendOut('[CMD] Use: move <from> <to>, swap <a> <b>, validate, show, status');
  }

  function validateTimelineTask(level, shell) {
    var extras = ensureExtras(shell);
    return extras.orderValidated && isOrderCorrect(extras);
  }

  function startChronoDash(shell) {
    runtime.skill = {
      id: 'chronoDash',
      rounds: [
        ['18:01:20', '18:00:40', '18:01:45', '18:00:05'],
        ['19:04:09', '19:03:02', '19:05:17', '19:03:55'],
        ['21:14:40', '21:13:12', '21:15:21', '21:14:03']
      ],
      idx: 0,
      misses: 0,
      startMs: Date.now()
    };
    shell.appendOut('[SKILL] Chrono Dash started. Sort timestamps ascending, comma-separated.');
    shell.appendOut('[SKILL] Round 1: ' + runtime.skill.rounds[0].join(', '));
  }

  function startMitreChain(shell) {
    runtime.skill = {
      id: 'mitreChain',
      expected: ['T1190', 'T1059.001', 'T1021.002', 'T1041'],
      idx: 0,
      miss: 0,
      startMs: Date.now()
    };
    shell.appendOut('[SKILL] MITRE Chain started. Enter next technique ID in sequence.');
    shell.appendOut('[SKILL] Enter 1/4');
  }

  function startLogAccuracy(shell) {
    runtime.skill = {
      id: 'logAccuracy',
      prompts: [
        { q: 'Which log source tracks process create?', a: 'sysmon' },
        { q: 'Which field holds event time?', a: 'timestamp' },
        { q: 'Best field for source host?', a: 'src_ip' },
        { q: 'Which value indicates successful order check?', a: 'validated' }
      ],
      idx: 0,
      correct: 0,
      startMs: Date.now()
    };
    shell.appendOut('[SKILL] Log Accuracy started.');
    shell.appendOut('[SKILL] ' + runtime.skill.prompts[0].q);
  }

  function finishChronoDash(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var scoreValue = Math.max(140, 1000 - elapsed * 24 - skill.misses * 70);
    shell.submitScore('chronoDash', scoreValue);
    shell.appendOut('[SKILL] Chrono Dash score=' + scoreValue);
    runtime.skill = null;
  }

  function finishMitreChain(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var scoreValue = Math.max(120, 940 - elapsed * 16 - skill.miss * 55);
    shell.submitScore('mitreChain', scoreValue);
    shell.appendOut('[SKILL] MITRE Chain score=' + scoreValue);
    runtime.skill = null;
  }

  function finishLogAccuracy(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var accuracy = skill.correct / skill.prompts.length;
    var scoreValue = Math.max(120, Math.floor(accuracy * 940) - elapsed * 10);
    shell.submitScore('logAccuracy', scoreValue);
    shell.appendOut('[SKILL] Log Accuracy score=' + scoreValue + ' accuracy=' + Math.round(accuracy * 100) + '%');
    runtime.skill = null;
  }

  function handleSkillInput(shell, raw) {
    var skill = runtime.skill;
    var text = String(raw || '').trim();
    if (!skill) return;

    if (skill.id === 'chronoDash') {
      var expected = cloneArray(skill.rounds[skill.idx]).sort();
      var got = text.split(',').map(function (t) { return t.trim(); });
      var ok = got.length === expected.length;
      var i;
      if (ok) {
        for (i = 0; i < expected.length; i++) {
          if (got[i] !== expected[i]) { ok = false; break; }
        }
      }
      if (!ok) skill.misses += 1;
      skill.idx += 1;
      if (skill.idx >= skill.rounds.length) finishChronoDash(shell, skill);
      else shell.appendOut('[SKILL] Round ' + (skill.idx + 1) + ': ' + skill.rounds[skill.idx].join(', '));
      return;
    }

    if (skill.id === 'mitreChain') {
      if (text.toUpperCase() !== skill.expected[skill.idx]) skill.miss += 1;
      skill.idx += 1;
      if (skill.idx >= skill.expected.length) finishMitreChain(shell, skill);
      else shell.appendOut('[SKILL] Enter ' + (skill.idx + 1) + '/' + skill.expected.length);
      return;
    }

    if (skill.id === 'logAccuracy') {
      if (text.toLowerCase() === skill.prompts[skill.idx].a) skill.correct += 1;
      skill.idx += 1;
      if (skill.idx >= skill.prompts.length) finishLogAccuracy(shell, skill);
      else shell.appendOut('[SKILL] ' + skill.prompts[skill.idx].q);
    }
  }

  function buildScene(engine, level, shell) {
    var i;
    if (engine.clearPhysics) engine.clearPhysics();
    meshes = [];
    swing = 0;
    runtime.selectedIndex = -1;

    engine.addFloor(18, 18, 0x0a0b14);
    var core = engine.addBox(0, 0.6, 0, 1.9, 1.1, 1.9, 0x111827, 0);
    core.material.emissive = new THREE.Color(0xa855f7);
    core.material.emissiveIntensity = 0.2;
    core.userData.kind = 'core';
    meshes.push(core);

    for (i = 0; i < 7 + level * 2; i++) {
      var cube = engine.addBox(
        (Math.random() - 0.5) * 10,
        0.8 + Math.random() * 1.8,
        (Math.random() - 0.5) * 10,
        0.34,
        0.34,
        0.34,
        0xc084fc + i * 300,
        0.2 + level * 0.03
      );
      cube.userData.kind = 'cube';
      meshes.push(cube);
    }

    for (i = 0; i < level + 3; i++) {
      var strip = engine.addBox(
        (Math.random() - 0.5) * 8,
        2.0 + Math.random() * 1.2,
        (Math.random() - 0.5) * 8,
        1.0,
        0.05,
        0.2,
        0xe9d5ff,
        0
      );
      strip.material.emissive = new THREE.Color(0xd8b4fe);
      strip.material.emissiveIntensity = 0.17;
      strip.userData.kind = 'strip';
      meshes.push(strip);
    }

    if (engine.addPhysicsSphere) {
      for (i = 0; i < level + 5; i++) {
        var orb = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 9,
          2 + Math.random() * 2.4,
          (Math.random() - 0.5) * 9,
          0.11 + Math.random() * 0.08,
          0xa855f7,
          0.32
        );
        orb.userData.kind = 'orb';
        meshes.push(orb);
      }
    }

    showInputAndButtons();
    buildControlButtons(shell, level);
    logStory(shell, level);
    if (level <= 4) initializeOrder(shell, level);
  }

  var config = {
    gameId: GAME_ID,
    title: 'DEEP ARCHIVE',
    achievementId: 'archive_master',
    leaderboardChallenge: 'chronoDash',
    engine: { bg: 0x090914, physics: true },
    moveSpeed: 2.25,
    buildScene: buildScene,
    levels: {
      1: {
        name: 'Initial Access Chain',
        hint: 'Chronologically order incident logs.',
        timeLimit: 300,
        tasks: [
          {
            id: 'l1_timeline',
            hint: 'Validate chronological sequence.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateTimelineTask(1, shell); },
            output: '[TASK] Timeline accepted.'
          }
        ],
        branch: {
          title: 'Investigation Path',
          desc: 'Choose what to prioritize after ordering first timeline.',
          options: [
            { id: 'archive_l1_scope', label: 'Expand scope to all affected hosts.' },
            { id: 'archive_l1_root', label: 'Focus root-cause host deep-dive first.' },
            { id: 'archive_l1_hunt', label: 'Use timeline to launch hunting queries.' },
            { id: 'archive_l1_report', label: 'Draft interim report for leadership.' },
            { id: 'archive_l1_preserve', label: 'Preserve volatile evidence immediately.' }
          ]
        }
      },
      2: {
        name: 'Credential Theft Sequence',
        hint: 'Sort credential-theft event chain.',
        timeLimit: 320,
        tasks: [
          {
            id: 'l2_timeline',
            hint: 'Validate chronological sequence.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateTimelineTask(2, shell); },
            output: '[TASK] Timeline accepted.'
          }
        ],
        branch: {
          title: 'Response Focus',
          desc: 'Choose next phase after theft sequence reconstruction.',
          options: [
            { id: 'archive_l2_reset', label: 'Force enterprise credential reset.' },
            { id: 'archive_l2_scope', label: 'Map all likely touched identities.' },
            { id: 'archive_l2_watch', label: 'Track token replay before reset.' },
            { id: 'archive_l2_block', label: 'Block outbound channels first.' },
            { id: 'archive_l2_notify', label: 'Notify legal and compliance teams.' }
          ]
        }
      },
      3: {
        name: 'Lateral Movement Window',
        hint: 'Order lateral movement artifacts.',
        timeLimit: 340,
        tasks: [
          {
            id: 'l3_timeline',
            hint: 'Validate chronological sequence.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateTimelineTask(3, shell); },
            output: '[TASK] Timeline accepted.'
          }
        ],
        branch: {
          title: 'Containment Choice',
          desc: 'Choose containment action after movement timeline is confirmed.',
          options: [
            { id: 'archive_l3_segment', label: 'Segment affected subnets immediately.' },
            { id: 'archive_l3_isolate', label: 'Isolate compromised pivot hosts.' },
            { id: 'archive_l3_dc', label: 'Harden domain controllers first.' },
            { id: 'archive_l3_hunt', label: 'Run enterprise lateral movement hunt.' },
            { id: 'archive_l3_ir', label: 'Escalate to full incident response bridge.' }
          ]
        }
      },
      4: {
        name: 'Exfiltration Timeline',
        hint: 'Order exfiltration timeline end-to-end.',
        timeLimit: 370,
        tasks: [
          {
            id: 'l4_timeline',
            hint: 'Validate chronological sequence.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateTimelineTask(4, shell); },
            output: '[TASK] Timeline accepted.'
          }
        ]
      },
      5: { name: 'Archive Debrief', epilogue: true }
    },
    skills: [
      {
        id: 'chronoDash',
        name: 'Chrono Dash',
        unlockAfter: 1,
        desc: 'Sort micro-timelines rapidly.',
        start: startChronoDash
      },
      {
        id: 'mitreChain',
        name: 'MITRE Chain',
        unlockAfter: 2,
        desc: 'Recall technique sequence under time pressure.',
        start: startMitreChain
      },
      {
        id: 'logAccuracy',
        name: 'Log Accuracy',
        unlockAfter: 3,
        desc: 'Answer forensic logging prompts precisely.',
        start: startLogAccuracy
      }
    ],
    onLevelStart: function (level, shell) {
      var extras = ensureExtras(shell);
      extras.currentOrder = [];
      extras.correctOrder = [];
      extras.orderValidated = false;
      extras.moves = 0;
      extras.history = [];
      setTaskText(shell, level);
      addPoints(shell, 12 + level * 4, 'level start');
    },
    onLevelComplete: function (level, shell) {
      if (level <= 4) shell.appendOut('[REPORT] Timeline ' + level + ' accepted for archive.');
      if (level === 4) shell.appendOut('[REPORT] Deep archive reconstruction complete.');
    }
  };

  config.onTick = function (dt) {
    var i;
    swing += dt * 2.0;
    for (i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (!mesh || !mesh.userData) continue;
      if (mesh.userData.physicsBody && mesh.userData.physicsBody.mass > 0) continue;
      if (mesh.userData.kind === 'cube') {
        mesh.rotation.y += dt * 0.32;
        mesh.position.y += Math.sin(swing + i * 0.38) * dt * 0.26;
      }
      if (mesh.userData.kind === 'strip') {
        mesh.rotation.x += dt * 0.15;
      }
      if (mesh.userData.kind === 'core') {
        mesh.material.emissiveIntensity = 0.16 + Math.abs(Math.sin(swing)) * 0.25;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var shell;
    var taskText = document.getElementById('task-text');
    var actionLog = document.getElementById('action-log');
    var form = document.getElementById('term-form');
    var input = document.getElementById('term-in');

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
      parseCommand(activeShell, cmd);
    };

    shell.init();
    showInputAndButtons();
    updateScoreDisplay();

    if (form && input) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        shell.appendOut('> ' + text);
        shell.onCommand(text, shell);
      }, true);
    }
  });
})();
