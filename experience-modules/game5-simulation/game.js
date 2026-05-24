/**
 * THE SIMULATION — 3D Experience Module (full rewrite)
 * Core concept: Cyber kill chain intervention under pressure.
 * Mechanics: Phase actions + shell validations + branching consequences.
 */
(function () {
  'use strict';

  var GAME_ID = 'the_simulation';
  var score = 0;
  var meshes = [];
  var activePulse = 0;

  var ACTION_DEFS = [
    { id: 'block_scanner', label: 'BLOCK SCANNER', action: 'BLOCK SCANNER' },
    { id: 'implement_segmentation', label: 'IMPLEMENT SEGMENTATION', action: 'IMPLEMENT SEGMENTATION' },
    { id: 'observe', label: 'OBSERVE', action: 'OBSERVE' },
    { id: 'threat_hunt', label: 'THREAT HUNT', action: 'THREAT HUNT' },
    { id: 'isolate_host', label: 'ISOLATE HOST', action: 'ISOLATE HOST' },
    { id: 'rotate_credentials', label: 'ROTATE CREDENTIALS', action: 'ROTATE CREDENTIALS' },
    { id: 'patch', label: 'PATCH', action: 'PATCH' },
    { id: 'monitor', label: 'MONITOR', action: 'MONITOR' },
    { id: 'ignore', label: 'IGNORE', action: 'IGNORE' },
    { id: 'reimage', label: 'REIMAGE', action: 'REIMAGE' },
    { id: 'egress_filter', label: 'EGRESS FILTER', action: 'EGRESS FILTER' },
    { id: 'do_both', label: 'DO BOTH', action: 'DO BOTH' }
  ];

  var PHASE_RULES = {
    1: {
      id: 'recon',
      title: 'Phase 1 — Reconnaissance',
      validChoices: ['block_scanner', 'implement_segmentation'],
      defaultChoice: 'observe',
      points: {
        block_scanner: 140,
        implement_segmentation: 150,
        observe: 0
      },
      feedback: {
        block_scanner: '[PHASE1] Scanner source blocked. Recon volume drops 62% in 90 seconds.',
        implement_segmentation: '[PHASE1] Segmentation policy deployed. East-west probes collapse across VLAN boundaries.',
        observe: '[PHASE1] Observe is not a valid intervention. Recon continues and attacker fingerprints exposed services.'
      }
    },
    2: {
      id: 'delivery',
      title: 'Phase 2 — Delivery',
      validChoices: ['threat_hunt', 'isolate_host', 'rotate_credentials'],
      defaultChoice: 'threat_hunt',
      points: {
        threat_hunt: 120,
        isolate_host: 130,
        rotate_credentials: 110
      },
      feedback: {
        threat_hunt: '[PHASE2] Threat hunt identifies staged payloads in temp directories. Delivery chain is partially disrupted.',
        isolate_host: '[PHASE2] Host isolation cuts malware fan-out quickly but leaves unanswered initial access questions.',
        rotate_credentials: '[PHASE2] Credential rotation invalidates harvested tokens. Adversary retries delivery with fallback accounts.'
      }
    },
    3: {
      id: 'exploitation',
      title: 'Phase 3 — Exploitation',
      validChoices: ['patch', 'monitor'],
      defaultChoice: 'ignore',
      points: {
        patch: 170,
        monitor: 130,
        ignore: -40
      },
      feedback: {
        patch: '[PHASE3] Patch deployed for CVE-2024-1234 exploit path. Weaponized payload now fails integrity checks.',
        monitor: '[PHASE3] Monitor activated. You preserve telemetry but leave the CVE-2024-1234 attack path open longer.',
        ignore: '[PHASE3] IGNORE is invalid. CVE-2024-1234 exploitation succeeds and foothold hardens.'
      }
    },
    4: {
      id: 'actions_on_objectives',
      title: 'Phase 4 — Actions on Objectives',
      validChoices: ['reimage', 'egress_filter', 'do_both'],
      defaultChoice: 'reimage',
      points: {
        reimage: 160,
        egress_filter: 160,
        do_both: 260
      },
      feedback: {
        reimage: '[PHASE4] Reimage removes host persistence. Some outbound exfil channels may still exist in adjacent nodes.',
        egress_filter: '[PHASE4] Egress filtering throttles exfiltration. Existing implanted hosts still retain local persistence.',
        do_both: '[PHASE4] Combined containment + eradication executed. Exfil channels collapse and persistence is removed.'
      }
    }
  };

  var STORY_BEATS = {
    1: {
      opening: '2026-05-24T20:07:31Z | MITRE TA0043 Reconnaissance: external scanner cluster maps exposed APIs in subnet A.',
      beat1: '2026-05-24T20:08:02Z | ATT&CK T1595 Active Scanning observed from ASN 64498. Probe cadence: 18 req/s.',
      beat2: '2026-05-24T20:08:46Z | Passive DNS pivot links scanner infrastructure to previous ransomware pre-positioning.',
      closing: 'Phase 1 contained. Recon signal degraded before delivery tooling lock-in.'
    },
    2: {
      opening: '2026-05-24T20:11:09Z | MITRE TA0001 Initial Access and TA0002 Execution overlap as payload staging begins.',
      beat1: '2026-05-24T20:11:40Z | ATT&CK T1566 Spearphishing + T1204 User Execution chain detected on finance endpoint.',
      beat2: '2026-05-24T20:12:14Z | Beacon bootstrap scripts attempt token replay across two service accounts.',
      closing: 'Phase 2 decision recorded. Delivery disruption changed downstream exploitation tempo.'
    },
    3: {
      opening: '2026-05-24T20:15:57Z | MITRE TA0003 Persistence setup piggybacks on vulnerable middleware module.',
      beat1: '2026-05-24T20:16:21Z | CVE-2024-1234 exploit signature matches inbound traffic to edge app worker.',
      beat2: '2026-05-24T20:17:03Z | ATT&CK T1068 Privilege Escalation attempt follows successful exploit path in test sandbox.',
      closing: 'Phase 3 complete. CVE-2024-1234 handling path now reflected in incident timeline.'
    },
    4: {
      opening: '2026-05-24T20:21:36Z | MITRE TA0010 Exfiltration and TA0040 Impact indicators begin to rise.',
      beat1: '2026-05-24T20:22:05Z | ATT&CK T1041 Exfiltration over C2 channel spikes to 412 MB/min sustained.',
      beat2: '2026-05-24T20:22:49Z | Impact simulation predicts domain-wide blast radius within 11 minutes if unchecked.',
      closing: 'Phase 4 resolved. Final kill chain intervention score committed.'
    },
    5: {
      opening: '2026-05-24T20:26:10Z | Debrief window opened. Chain-of-events and controls effectiveness are now graded.',
      beat1: 'Timeline synthesis complete. MITRE mapping exported for executive and IR runbook review.',
      beat2: 'Residual risk model updated. Recovery recommendations tied to concrete phase choices.',
      closing: 'Simulation debrief complete. Progression unlocks after reflection.'
    }
  };

  var TIMING_ORDER = [
    'scanner-detected',
    'payload-delivered',
    'exploit-attempt',
    'privilege-escalation',
    'lateral-movement',
    'c2-established',
    'exfil-start',
    'containment-executed'
  ];

  function narrateLevel(level, shell) {
    var beat = STORY_BEATS[level];
    if (!beat || !shell) return;
    shell.appendOut('[NARRATIVE] ' + beat.opening);
    shell.appendOut('[NARRATIVE] ' + beat.beat1);
    shell.appendOut('[NARRATIVE] ' + beat.beat2);
  }

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = 'SCORE ' + score;
  }

  function ensureExtras(shell) {
    if (!shell.levelState.extras) shell.levelState.extras = {};
    if (!shell.levelState.extras.choiceId) shell.levelState.extras.choiceId = '';
    if (!shell.levelState.extras.history) shell.levelState.extras.history = [];
  }

  function resetChoice(shell) {
    ensureExtras(shell);
    shell.levelState.extras.choiceId = '';
  }

  function setChoice(shell, choiceId) {
    ensureExtras(shell);
    shell.levelState.extras.choiceId = choiceId;
    shell.levelState.extras.history.push({
      phase: shell.levelState.level,
      choice: choiceId,
      at: Date.now()
    });
  }

  function getChoice(shell) {
    ensureExtras(shell);
    return shell.levelState.extras.choiceId;
  }

  function validateChoice(shell, allowedChoices) {
    return allowedChoices.indexOf(getChoice(shell)) >= 0;
  }

  function validatePhase1(shell) {
    return validateChoice(shell, ['block_scanner', 'implement_segmentation']);
  }

  function validatePhase2(shell) {
    return validateChoice(shell, ['threat_hunt', 'isolate_host', 'rotate_credentials']);
  }

  function validatePhase3(shell) {
    return validateChoice(shell, ['patch', 'monitor']);
  }

  function validatePhase4(shell) {
    return validateChoice(shell, ['reimage', 'egress_filter', 'do_both']);
  }

  function getActionFromChoice(choiceId) {
    var i;
    for (i = 0; i < ACTION_DEFS.length; i++) {
      if (ACTION_DEFS[i].id === choiceId) return ACTION_DEFS[i].action;
    }
    return choiceId;
  }

  function appendActionLog(line) {
    var log = document.getElementById('action-log');
    if (!log) return;
    log.textContent += line + '\n';
    log.scrollTop = log.scrollHeight;
  }

  function getPhaseButtons(level) {
    if (level === 1) return ['block_scanner', 'implement_segmentation', 'observe'];
    if (level === 2) return ['threat_hunt', 'isolate_host', 'rotate_credentials'];
    if (level === 3) return ['patch', 'monitor', 'ignore'];
    if (level === 4) return ['reimage', 'egress_filter', 'do_both'];
    return [];
  }

  function bindActionButtons(shell, level) {
    var wrap = document.getElementById('action-btns');
    var def = shell.config.levels[level];
    var phaseButtons = getPhaseButtons(level);
    var i;

    if (!wrap) return;
    wrap.innerHTML = '';

    if (!def || def.epilogue) {
      var debrief = document.createElement('button');
      debrief.type = 'button';
      debrief.className = 'act-btn';
      debrief.textContent = 'Begin Debrief';
      debrief.onclick = function () { shell.runEpilogue(); };
      wrap.appendChild(debrief);
      return;
    }

    for (i = 0; i < phaseButtons.length; i++) {
      addActionButton(wrap, phaseButtons[i], shell, level);
    }
  }

  function addActionButton(wrap, choiceId, shell, level) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'act-btn';
    btn.textContent = getActionFromChoice(choiceId);
    btn.onclick = function () {
      onAction(choiceId, shell, level);
    };
    wrap.appendChild(btn);
  }

  function onAction(choiceId, shell, level) {
    var phase = PHASE_RULES[level];
    var choiceAction = getActionFromChoice(choiceId);
    var isValid;
    var points;
    var feedback;

    if (!phase) return;

    setChoice(shell, choiceId);
    if (shell._killChainSkillHook) shell._killChainSkillHook(level, choiceId);
    if (shell._mitigationSkillHook) shell._mitigationSkillHook(level, choiceId);
    appendActionLog('> ' + choiceAction);

    if (level === 1) isValid = validatePhase1(shell);
    if (level === 2) isValid = validatePhase2(shell);
    if (level === 3) isValid = validatePhase3(shell);
    if (level === 4) isValid = validatePhase4(shell);

    points = phase.points[choiceId];
    feedback = phase.feedback[choiceId];
    if (typeof points !== 'number') points = 0;

    if (!isValid) {
      HabibiProgression.logFailure(GAME_ID, level, 'wrong_action', shell.state);
      shell.appendOut('[FAIL] Invalid choice for this phase: ' + choiceAction);
      shell.appendOut('[TUTOR] ' + (feedback || 'Action does not break this kill chain stage.'));
      if (choiceId === 'ignore') {
        shell.appendOut('[TUTOR] CVE-2024-1234 remains exploitable. Patch or monitor to recover initiative.');
      }
      return;
    }

    score += points;
    shell.score += points;
    updateScoreDisplay();
    shell.appendOut('[SUCCESS] ' + (feedback || 'Phase action accepted.'));
    shell.appendOut('[POINTS] +' + points + ' | Running score ' + score);

    if (level === 4 && choiceId !== 'do_both') {
      shell.appendOut('[INFO] Partial credit applied. Use DO BOTH for max phase-four impact.');
    }

    shell.onLevelTasksComplete();
  }

  function buildScene(engine, level, shell) {
    var i;
    var count;
    var core;
    var beacon;
    var pulseRing;
    var particle;

    if (engine.clearPhysics) engine.clearPhysics();
    meshes = [];
    activePulse = 0;

    engine.addFloor(20, 20, 0x071024);
    core = engine.addBox(0, 0.65, 0, 1.4, 1.1, 1.4, 0x0a102c, 0);
    core.material.emissive = new THREE.Color(0x19335a);
    core.material.emissiveIntensity = 0.35;
    core.userData.kind = 'core';
    meshes.push(core);

    count = 5 + level * 2;
    for (i = 0; i < count; i++) {
      beacon = engine.addBox(
        (Math.random() - 0.5) * 11,
        0.8 + Math.random() * 1.5,
        (Math.random() - 0.5) * 11,
        0.35,
        0.35,
        0.35,
        0x10213f + i * 2500,
        0.3 + level * 0.05
      );
      beacon.userData.objId = 'beacon_' + level + '_' + i;
      beacon.userData.kind = 'beacon';
      meshes.push(beacon);
    }

    for (i = 0; i < level + 2; i++) {
      pulseRing = engine.addBox(
        (Math.random() - 0.5) * 8,
        2.0 + Math.random() * 1.2,
        (Math.random() - 0.5) * 8,
        0.9,
        0.06,
        0.9,
        0x3b82f6,
        0
      );
      pulseRing.material.emissive = new THREE.Color(0x2dd4bf);
      pulseRing.material.emissiveIntensity = 0.2;
      pulseRing.userData.kind = 'ring';
      meshes.push(pulseRing);
    }

    if (engine.addPhysicsSphere) {
      for (i = 0; i < level + 4; i++) {
        particle = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 10,
          2 + Math.random() * 3,
          (Math.random() - 0.5) * 10,
          0.1 + Math.random() * 0.08,
          0x60a5fa,
          0.25
        );
        particle.userData.kind = 'particle';
        meshes.push(particle);
      }
    }

    narrateLevel(level, shell);
    bindActionButtons(shell, level);
  }

  function startKillChainIdSkill(shell) {
    var expectedPhases = [1, 2, 3, 4];
    var idx = 0;
    var phaseChoices = [];

    shell.appendOut('[SKILL] Kill Chain ID started. Pause and choose one valid action per phase in order.');

    shell._killChainSkillHook = function (level, choiceId) {
      if (idx >= expectedPhases.length) return;
      if (level !== expectedPhases[idx]) return;
      phaseChoices.push({ phase: level, choiceId: choiceId });
      idx += 1;
      shell.appendOut('[SKILL] Phase ' + level + ' captured: ' + getActionFromChoice(choiceId));
      if (idx >= expectedPhases.length) {
        var correct = 0;
        var i;
        for (i = 0; i < phaseChoices.length; i++) {
          if (isChoiceValidForPhase(phaseChoices[i].phase, phaseChoices[i].choiceId)) correct += 1;
        }
        var skillScore = 500 + correct * 90;
        shell.submitScore('killChainId', skillScore);
        shell.appendOut('[SKILL] Kill Chain ID score: ' + skillScore);
      }
    };
  }

  function startTimingSkill(shell) {
    var startedAt = Date.now();
    var progress = 0;

    shell.appendOut('[SKILL] Timing started. Enter 8 timeline steps in exact order via terminal:');
    shell.appendOut('[SKILL] ' + TIMING_ORDER.join(' -> '));

    shell.onCommand = function (cmd, activeShell) {
      var token = cmd.toLowerCase().trim();
      var needed = TIMING_ORDER[progress];
      if (token === needed) {
        progress += 1;
        activeShell.appendOut('[SKILL] Step ' + progress + '/8 accepted: ' + token);
        if (progress >= TIMING_ORDER.length) {
          var elapsedMs = Date.now() - startedAt;
          var timingScore = Math.max(120, 1000 - Math.floor(elapsedMs / 220));
          activeShell.submitScore('timing', timingScore);
          activeShell.appendOut('[SKILL] Timing score: ' + timingScore);
          activeShell.onCommand = null;
        }
      } else {
        activeShell.appendOut('[SKILL] Wrong order. Expected: ' + needed);
      }
    };
  }

  function startMitigationOptimizerSkill(shell) {
    var budget = 300;
    var spent = 0;
    var impact = 0;
    var costs = {
      block_scanner: 80,
      implement_segmentation: 120,
      threat_hunt: 95,
      isolate_host: 110,
      rotate_credentials: 90,
      patch: 115,
      monitor: 75,
      reimage: 120,
      egress_filter: 105,
      do_both: 180
    };
    var impacts = {
      block_scanner: 120,
      implement_segmentation: 165,
      threat_hunt: 110,
      isolate_host: 140,
      rotate_credentials: 100,
      patch: 180,
      monitor: 95,
      reimage: 160,
      egress_filter: 155,
      do_both: 250
    };

    shell.appendOut('[SKILL] Mitigation Optimizer started. Budget: ' + budget + ' points.');
    shell.appendOut('[SKILL] Pick actions during phases; score = impact minus overspend penalties.');

    shell._mitigationSkillHook = function (level, choiceId) {
      var c = costs[choiceId] || 0;
      var i = impacts[choiceId] || 0;
      var over;
      var optimizerScore;

      spent += c;
      impact += i;
      shell.appendOut('[SKILL] Budget update | phase ' + level + ' | cost ' + c + ' | spent ' + spent + '/' + budget);

      if (level !== 4) return;
      over = Math.max(0, spent - budget);
      optimizerScore = Math.max(50, impact - over * 2);
      shell.submitScore('mitigationOptimizer', optimizerScore);
      shell.appendOut('[SKILL] Mitigation Optimizer score: ' + optimizerScore + ' (impact ' + impact + ', overspend ' + over + ')');
    };
  }

  function isChoiceValidForPhase(level, choiceId) {
    var phase = PHASE_RULES[level];
    if (!phase) return false;
    return phase.validChoices.indexOf(choiceId) >= 0;
  }

  function setupTerminalCommandHandler(shell) {
    shell.onCommand = function (cmd, activeShell) {
      var line = cmd.trim().toLowerCase();
      if (!line) return;

      if (line === 'help') {
        activeShell.appendOut('[CMD] Use action buttons for phase decisions.');
        activeShell.appendOut('[CMD] Skills are in sidebar. Type "status" for current phase state.');
        return;
      }

      if (line === 'status') {
        var currentLevel = activeShell.state.currentLevel;
        var currentDef = PHASE_RULES[currentLevel];
        var selected = getChoice(activeShell) || '(none)';
        activeShell.appendOut('[STATUS] Level ' + currentLevel + ' | ' + (currentDef ? currentDef.title : 'Debrief'));
        activeShell.appendOut('[STATUS] Selected choice id: ' + selected);
        return;
      }

      if (line.indexOf('setchoice ') === 0) {
        var choiceId = line.replace('setchoice ', '').trim();
        if (!choiceId) {
          activeShell.appendOut('[CMD] Missing choice id.');
          return;
        }
        setChoice(activeShell, choiceId);
        activeShell.appendOut('[CMD] choiceId set to: ' + choiceId);
        return;
      }

      if (line === 'validate') {
        var lv = activeShell.state.currentLevel;
        var ok = false;
        if (lv === 1) ok = validatePhase1(activeShell);
        if (lv === 2) ok = validatePhase2(activeShell);
        if (lv === 3) ok = validatePhase3(activeShell);
        if (lv === 4) ok = validatePhase4(activeShell);
        activeShell.appendOut('[CMD] Validation result: ' + (ok ? 'PASS' : 'FAIL'));
        return;
      }

      activeShell.appendOut('[CMD] Unknown command. Try: help, status, setchoice <id>, validate');
    };
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE SIMULATION',
    achievementId: 'simulation_master',
    leaderboardChallenge: 'killChainId',
    engine: { bg: 0x061123, physics: true },
    moveSpeed: 2.35,
    buildScene: buildScene,
    levels: {
      1: {
        name: 'Reconnaissance Interdiction',
        hint: 'Choose a recon disruption action.',
        timeLimit: 220,
        tasks: [{
          id: 'phase1_choice',
          hint: 'Phase 1: Block Scanner or Implement Segmentation. Observe is wrong.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            return validatePhase1(shell);
          },
          output: '[OK] Phase 1 intervention recorded.',
          onSuccess: function (shell) {
            shell.appendOut('[PHASE] Reconnaissance gate passed.');
          }
        }],
        branch: {
          title: 'Recon Consequence',
          desc: 'Your phase one intervention changes delivery pressure in phase two.',
          options: [
            { id: 'branch_fast_containment_1', label: 'Prioritize immediate containment over full telemetry collection.' },
            { id: 'branch_balanced_1', label: 'Balance response speed with evidence quality for later prosecution.' },
            { id: 'branch_forensic_1', label: 'Preserve deep forensic trail before broad containment actions.' },
            { id: 'branch_ops_1', label: 'Keep operations stable while applying narrow defensive controls.' },
            { id: 'branch_aggressive_1', label: 'Apply aggressive controls despite potential business disruption.' }
          ]
        }
      },
      2: {
        name: 'Delivery Disruption',
        hint: 'Any action is valid; each has different consequences.',
        timeLimit: 260,
        tasks: [{
          id: 'phase2_choice',
          hint: 'Phase 2: Threat Hunt / Isolate Host / Rotate Credentials all valid.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            return validatePhase2(shell);
          },
          output: '[OK] Phase 2 intervention recorded.',
          onSuccess: function (shell) {
            shell.appendOut('[PHASE] Delivery gate passed.');
          }
        }],
        branch: {
          title: 'Delivery Consequence',
          desc: 'Phase two choice influences exploitation dwell time and observability.',
          options: [
            { id: 'branch_fast_containment_2', label: 'Fast containment, accept reduced certainty on attacker objective.' },
            { id: 'branch_balanced_2', label: 'Balanced stance with moderate containment and moderate insight.' },
            { id: 'branch_forensic_2', label: 'Forensics-first to map adversary intent before broad host takedown.' },
            { id: 'branch_ops_2', label: 'Operational continuity-first with targeted endpoint controls.' },
            { id: 'branch_aggressive_2', label: 'Aggressive suppression with immediate account and endpoint restrictions.' }
          ]
        }
      },
      3: {
        name: 'Exploitation Window',
        hint: 'Patch or Monitor are valid. Ignore is wrong and references CVE-2024-1234.',
        timeLimit: 300,
        tasks: [{
          id: 'phase3_choice',
          hint: 'Phase 3: Patch or Monitor. Ignore is invalid due to CVE-2024-1234 risk.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            return validatePhase3(shell);
          },
          output: '[OK] Phase 3 intervention recorded.',
          onSuccess: function (shell) {
            shell.appendOut('[PHASE] Exploitation gate passed.');
          }
        }],
        branch: {
          title: 'Exploitation Consequence',
          desc: 'Your third-phase mitigation sets the runway for objective-level containment.',
          options: [
            { id: 'branch_fast_containment_3', label: 'Contain fast and cut exposure quickly, even with thin telemetry.' },
            { id: 'branch_balanced_3', label: 'Balance resilience and intelligence to support legal and recovery paths.' },
            { id: 'branch_forensic_3', label: 'Delay hard containment slightly for richer exploit-chain evidence.' },
            { id: 'branch_ops_3', label: 'Maintain service availability while reducing privilege escalation vectors.' },
            { id: 'branch_aggressive_3', label: 'Suppress aggressively to minimize blast radius at all costs.' }
          ]
        }
      },
      4: {
        name: 'Actions on Objectives',
        hint: 'Do Both gives max points; single action gives partial.',
        timeLimit: 320,
        tasks: [{
          id: 'phase4_choice',
          hint: 'Phase 4: Reimage / Egress Filter valid, Do Both is highest impact.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            return validatePhase4(shell);
          },
          output: '[OK] Phase 4 intervention recorded.',
          onSuccess: function (shell) {
            shell.appendOut('[PHASE] Final kill chain gate passed.');
          }
        }]
      },
      5: {
        name: 'Simulation Debrief',
        epilogue: true
      }
    },
    skills: [
      {
        id: 'killChainId',
        name: 'Kill Chain ID',
        unlockAfter: 1,
        desc: 'Pause at each phase and identify valid interventions in sequence.',
        start: startKillChainIdSkill
      },
      {
        id: 'timing',
        name: 'Timing',
        unlockAfter: 2,
        desc: 'Enter the 8-step incident timeline in the correct order.',
        start: startTimingSkill
      },
      {
        id: 'mitigationOptimizer',
        name: 'Mitigation Optimizer',
        unlockAfter: 3,
        desc: 'Optimize mitigation impact under a constrained response budget.',
        start: startMitigationOptimizerSkill
      }
    ],
    onLevelStart: function (level, shell) {
      var phase = PHASE_RULES[level];
      var baseAward = 20 + level * 8;
      var tip;

      resetChoice(shell);
      score += baseAward;
      shell.score += baseAward;
      updateScoreDisplay();
      narrateLevel(level, shell);

      if (phase) {
        tip = '[TIP] ' + phase.title + ' | valid: ' + phase.validChoices.join(', ');
        if (level === 1) tip += ' | invalid trap: observe';
        if (level === 3) tip += ' | invalid trap: ignore';
        shell.setTaskText('Choose a phase action, then run "validate" or proceed via button outcomes.');
        shell.appendOut(tip);
      }
    },
    onLevelComplete: function (level, shell) {
      var beat = STORY_BEATS[level];
      if (beat) shell.appendOut('[NARRATIVE] ' + beat.closing);
      if (level === 4) {
        shell.appendOut('[REPORT] Final score before debrief: ' + score);
      }
    }
  };

  config.onTick = function (dt, shell) {
    var i;
    var m;

    activePulse += dt * 2.4;
    for (i = 0; i < meshes.length; i++) {
      m = meshes[i];
      if (!m || !m.userData) continue;
      if (m.userData.physicsBody && m.userData.physicsBody.mass > 0) continue;

      if (m.userData.kind === 'beacon') {
        m.rotation.y += dt * 0.25;
        m.position.y += Math.sin(activePulse + i * 0.35) * dt * 0.3;
      }
      if (m.userData.kind === 'ring') {
        m.rotation.x += dt * 0.15;
        m.rotation.z += dt * 0.1;
      }
      if (m.userData.kind === 'core') {
        m.material.emissiveIntensity = 0.25 + Math.abs(Math.sin(activePulse)) * 0.25;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var shell;
    var taskTextEl = document.getElementById('task-text');
    var actionLogEl = document.getElementById('action-log');

    if (!HabibiProgression.isGameUnlocked(GAME_ID) && GAME_ID !== 'the_terminal') {
      var st = HabibiProgression.load(GAME_ID);
      if (!st.unlocked) {
        if (taskTextEl) taskTextEl.textContent = 'Module locked — complete previous game epilogue first.';
        return;
      }
    }

    shell = new HabibiGameShell(config);
    shell.score = 0;
    shell.updateScore = updateScoreDisplay;
    shell.appendOut = function (text) {
      if (!actionLogEl) return;
      actionLogEl.textContent += text + '\n';
      actionLogEl.scrollTop = actionLogEl.scrollHeight;
    };
    shell.setTaskText = function (text) {
      if (taskTextEl) taskTextEl.textContent = text;
    };

    setupTerminalCommandHandler(shell);
    shell.init();
  });
})();
