/**
 * THE BREACH — SOC incident response simulation
 * Game ID: the_breach
 * Pattern: HabibiGameShell
 */
(function () {
  'use strict';

  var GAME_ID = 'the_breach';
  var score = 0;
  var meshes = [];
  var activeShell = null;

  var actionDefs = [
    { id: 'block_ip', label: 'BLOCK IP', action: 'BLOCK IP' },
    { id: 'alert_dev', label: 'ALERT DEV', action: 'ALERT DEV' },
    { id: 'isolate_node', label: 'ISOLATE NODE', action: 'ISOLATE NODE' },
    { id: 'investigate_logs', label: 'INVESTIGATE LOGS', action: 'INVESTIGATE LOGS' },
    { id: 'escalate', label: 'ESCALATE', action: 'ESCALATE' }
  ];

  var ALERT_LIBRARY = [
    {
      id: 'sqli-waf',
      title: 'SQL injection burst',
      indicator: '185.193.88.14',
      timestamp: '2026-05-24T20:14:08Z',
      cve: 'CVE-2024-36401',
      mitre: 'T1190',
      requiredAction: 'ALERT DEV'
    },
    {
      id: 'brute-force-vpn',
      title: 'VPN brute-force wave',
      indicator: '45.148.10.77',
      timestamp: '2026-05-24T20:18:42Z',
      cve: 'CVE-2023-4966',
      mitre: 'T1110',
      requiredAction: 'BLOCK IP'
    },
    {
      id: 'lateral-psexec',
      title: 'Lateral movement via PsExec',
      indicator: '10.22.44.19',
      timestamp: '2026-05-24T20:21:03Z',
      cve: 'CVE-2024-21413',
      mitre: 'T1021.002',
      requiredAction: 'ISOLATE NODE'
    },
    {
      id: 'exfil-s3',
      title: 'Exfiltration to rogue S3',
      indicator: '89.44.9.201',
      timestamp: '2026-05-24T20:25:18Z',
      cve: 'CVE-2022-36934',
      mitre: 'T1041',
      requiredAction: 'ESCALATE'
    },
    {
      id: 'beacon-c2',
      title: 'Beaconing to C2 over HTTPS',
      indicator: '172.67.34.221',
      timestamp: '2026-05-24T20:27:51Z',
      cve: 'CVE-2024-3400',
      mitre: 'T1071.001',
      requiredAction: 'INVESTIGATE LOGS'
    }
  ];

  var STORY_BEATS = {
    1: {
      title: 'Initial Compromise',
      opening: 'Meridian-7 SOC receives API gateway anomalies tied to 185.193.88.14 at 2026-05-24T20:14:08Z.',
      beat1: 'Threat intel links payload fingerprint to SQLmap campaign exploiting CVE-2024-36401 (MITRE T1190).',
      beat2: 'WAF telemetry shows 612 requests/min with UNION SELECT probes against /auth/reset endpoint.',
      beat3: 'HTTP logs include db_version() and information_schema extraction attempts from attacker session 7f1b93.',
      beat4: 'Splunk correlation tags matching user-agent sqlmap/1.8.2 with source ASN 206092.',
      beat5: 'SOAR runbook notes immediate perimeter containment on ingress IP before any application rollback.',
      beat6: 'Developer contact list marks payments API owner on-call as devops-pager slot B at 20:16Z.',
      beat7: 'Command decision path: contain ingress first, then alert owner to patch vulnerable query builder.',
      closing: 'Containment and developer notification complete for Level 1.'
    },
    2: {
      title: 'Alert Flood',
      opening: 'Five high-priority alerts fire between 20:18:42Z and 20:27:51Z under a 300 second SLA.',
      beat1: 'Alert #1 SQLi replay from 185.193.88.14 maps to CVE-2024-36401 and MITRE T1190.',
      beat2: 'Alert #2 VPN brute-force from 45.148.10.77 reaches 940 failed auth attempts in 90 seconds (T1110).',
      beat3: 'Alert #3 lateral movement from host 10.22.44.19 triggers PsExec service creation pattern (T1021.002).',
      beat4: 'Alert #4 outbound archive transfer to 89.44.9.201 includes 1.2 GB encrypted chunking behavior (T1041).',
      beat5: 'Alert #5 periodic beacon to 172.67.34.221 every 45 seconds matches known C2 cadence (T1071.001).',
      beat6: 'SOC timeline confirms same adversary infrastructure observed in FIN7 playbook addendum rev 2026.05.',
      beat7: 'Priority queue requires action chaining with minimal context switching and strict playbook ordering.',
      closing: 'All five alerts triaged within SLA for Level 2.'
    },
    3: {
      title: 'Root Cause Hunt',
      opening: 'Credential abuse indicators escalate: impossible travel and service token replay overlap at 20:31:09Z.',
      beat1: 'Authentication logs show 2,311 failed attempts followed by one success on dormant svc.report account.',
      beat2: 'Successful login source 45.148.10.77 reused stolen MFA token associated with CVE-2023-4966 chain.',
      beat3: 'Endpoint timeline on node APP-17 shows suspicious encoded PowerShell child process spawned by w3wp.',
      beat4: 'Threat model maps behavior to MITRE T1110, T1059.001, and T1078 valid account abuse cluster.',
      beat5: 'Immediate blocking without log review risks suppressing evidence needed for blast-radius calculation.',
      beat6: 'After log pivot confirms pivot host, block edge ingress and isolate compromised node in that order.',
      beat7: 'Investigation-first sequence preserves forensic context while still reducing adversary dwell time.',
      closing: 'Forensic-first containment path executed for Level 3.'
    },
    4: {
      title: 'Ransomware Staging',
      opening: 'EDR flags staged ransomware loader hash 5a9f...d2c at 2026-05-24T20:39:56Z on file node FS-04.',
      beat1: 'SMB write bursts from 10.22.44.19 include renamed extension .meridian-lock and ransom note templates.',
      beat2: 'Process ancestry reveals cobalt strike beacon parent chain matching MITRE T1055 injection behavior.',
      beat3: 'Known exploit precondition ties to unpatched Netlogon path from CVE-2020-1472 residual exposure.',
      beat4: 'Logs indicate initial encryption simulation only; full impact likely if containment delayed > 7 minutes.',
      beat5: 'Isolating FS-04 before triage can sever needed telemetry stream from EDR event channel 1183.',
      beat6: 'Playbook sequence requires log investigation first, then isolate host, then escalate to IR commander.',
      beat7: 'Escalation packet must include host timeline, IOC set, and estimated business impact window.',
      closing: 'Containment and command escalation completed for Level 4.'
    },
    5: {
      title: 'Incident Debrief',
      opening: 'Executive debrief compiles 2026-05-24 SOC timeline from first SQLi alert to ransomware containment.',
      beat1: 'Mean time to detect: 47 seconds; mean time to contain: 4 minutes 39 seconds.',
      beat2: 'Key IOCs: 185.193.88.14, 45.148.10.77, 89.44.9.201, 172.67.34.221, and host 10.22.44.19.',
      beat3: 'Top mapped ATT&CK techniques: T1190, T1110, T1021.002, T1041, and T1071.001.',
      beat4: 'Patch actions tracked: CVE-2024-36401 query sanitizer update and CVE-2023-4966 session hardening.',
      beat5: 'Risk reduction recommendation: enforce segmented admin plane and rotate all service credentials.',
      beat6: 'Training result indicates improved triage sequencing under multi-alert pressure conditions.',
      beat7: 'Debrief package approved by IR lead and SOC manager for board reporting.',
      closing: 'Epilogue complete. Meridian-7 breach scenario closed.'
    }
  };

  var LEVEL_FLOWS = {
    1: {
      timeLimit: 180,
      steps: [
        {
          id: 'l1_step1_block',
          action: 'BLOCK IP',
          hint: 'Step 1/2: Block attacking IP 185.193.88.14 before application-side response.',
          successText: '[L1] Edge ACL updated. Source 185.193.88.14 dropped at perimeter.',
          wrongFeedback: {
            'ALERT DEV': 'Dev alert is premature. Block IP 185.193.88.14 first to stop active exploitation traffic.',
            default: 'Incorrect step. Immediate containment requires BLOCK IP first for the active SQLi source.'
          }
        },
        {
          id: 'l1_step2_alert',
          action: 'ALERT DEV',
          hint: 'Step 2/2: Alert owning developer to patch CVE-2024-36401 exposure in query builder.',
          successText: '[L1] Developer paging sent with IOC context and CVE details.',
          wrongFeedback: {
            default: 'Containment is done. Now notify engineering with CVE-2024-36401 details via ALERT DEV.'
          }
        }
      ]
    },
    2: {
      timeLimit: 300,
      steps: [
        {
          id: 'l2_a1_sqli',
          action: 'ALERT DEV',
          hint: 'Alert 1/5 SQLi (185.193.88.14, T1190): choose ALERT DEV.',
          successText: '[L2-A1] SQLi issue routed to API owner for emergency patch validation.',
          wrongFeedback: {
            default: 'For SQLi on the vulnerable endpoint, priority action is ALERT DEV so patching starts immediately.'
          }
        },
        {
          id: 'l2_a2_bruteforce',
          action: 'BLOCK IP',
          hint: 'Alert 2/5 Brute-force VPN (45.148.10.77, T1110): choose BLOCK IP.',
          successText: '[L2-A2] Bruteforce source blocked at VPN edge after 940 failed attempts.',
          wrongFeedback: {
            default: 'Brute-force is active ingress abuse. BLOCK IP 45.148.10.77 to halt the attack stream.'
          }
        },
        {
          id: 'l2_a3_lateral',
          action: 'ISOLATE NODE',
          hint: 'Alert 3/5 Lateral movement from APP-17 (T1021.002): choose ISOLATE NODE.',
          successText: '[L2-A3] APP-17 isolated from east-west segment to prevent host-to-host spread.',
          wrongFeedback: {
            default: 'Lateral movement indicates compromised internal host control. ISOLATE NODE to contain pivoting.'
          }
        },
        {
          id: 'l2_a4_exfil',
          action: 'ESCALATE',
          hint: 'Alert 4/5 Exfiltration to 89.44.9.201 (T1041): choose ESCALATE.',
          successText: '[L2-A4] Incident escalated to IR command with potential data-loss impact report.',
          wrongFeedback: {
            default: 'Potential exfiltration crosses business impact threshold. ESCALATE for IR command involvement.'
          }
        },
        {
          id: 'l2_a5_beacon',
          action: 'INVESTIGATE LOGS',
          hint: 'Alert 5/5 Beaconing to 172.67.34.221 (T1071.001): choose INVESTIGATE LOGS.',
          successText: '[L2-A5] Beacon pattern confirmed in proxy and DNS logs; C2 profile enriched.',
          wrongFeedback: {
            default: 'Beacon activity requires context-building first. INVESTIGATE LOGS to map cadence and scope.'
          }
        }
      ]
    },
    3: {
      timeLimit: 360,
      steps: [
        {
          id: 'l3_step1_investigate',
          action: 'INVESTIGATE LOGS',
          hint: 'Step 1/3: Investigate logs on svc.report compromise path before enforcement.',
          successText: '[L3] Authentication and EDR timelines correlated for root-cause evidence.',
          wrongFeedback: {
            default: 'Start with INVESTIGATE LOGS to preserve forensic path before making containment moves.'
          }
        },
        {
          id: 'l3_step2_block',
          action: 'BLOCK IP',
          hint: 'Step 2/3: Block ingress source 45.148.10.77 after root cause is confirmed.',
          successText: '[L3] Ingress source blocked after evidence pivot confirmation.',
          wrongFeedback: {
            default: 'After investigation, block the malicious edge source next using BLOCK IP.'
          }
        },
        {
          id: 'l3_step3_isolate',
          action: 'ISOLATE NODE',
          hint: 'Step 3/3: Isolate compromised APP-17 node to cut internal pivot paths.',
          successText: '[L3] APP-17 isolated and forensic capture process initiated.',
          wrongFeedback: {
            default: 'Final containment for this flow is ISOLATE NODE on the compromised system.'
          }
        },
        wrongOrderFeedback: {
          'BLOCK IP': 'Blocking before log investigation can hide attacker sequence. INVESTIGATE LOGS first.'
        }
      ]
    },
    4: {
      timeLimit: 420,
      steps: [
        {
          id: 'l4_step1_investigate',
          action: 'INVESTIGATE LOGS',
          hint: 'Step 1/3: Review FS-04 telemetry and process ancestry before host isolation.',
          successText: '[L4] EDR and SMB traces confirm staging behavior tied to FS-04.',
          wrongFeedback: {
            default: 'Ransomware staging requires evidence triage first. Begin with INVESTIGATE LOGS.'
          }
        },
        {
          id: 'l4_step2_isolate',
          action: 'ISOLATE NODE',
          hint: 'Step 2/3: Isolate FS-04 from production VLAN to stop spread.',
          successText: '[L4] FS-04 isolated with break-glass admin channel preserved.',
          wrongFeedback: {
            default: 'After triage confirms staging host, contain spread by selecting ISOLATE NODE.'
          }
        },
        {
          id: 'l4_step3_escalate',
          action: 'ESCALATE',
          hint: 'Step 3/3: Escalate to IR commander with timeline, IOC set, and business impact.',
          successText: '[L4] Escalation package delivered to incident commander and legal liaison.',
          wrongFeedback: {
            default: 'Final response action is command-level notification. Choose ESCALATE.'
          }
        },
        wrongOrderFeedback: {
          'ISOLATE NODE': 'Isolating before log triage can sever needed telemetry. INVESTIGATE LOGS first.'
        }
      ]
    }
  };

  function el(id) {
    return document.getElementById(id);
  }

  function appendActionLine(text) {
    var log = el('action-log');
    if (!log) {
      return;
    }
    log.textContent += text + '\n';
    log.scrollTop = log.scrollHeight;
  }

  function appendOut(shell, text) {
    if (shell && typeof shell.appendOut === 'function') {
      shell.appendOut(text);
      return;
    }
    appendActionLine(text);
  }

  function updateScoreDisplay() {
    var scoreEl = el('hud-score');
    if (scoreEl) {
      scoreEl.textContent = 'SCORE ' + score;
    }
  }

  function ensureLevelExtras(shell, level) {
    if (!shell.levelState) {
      shell.levelState = {};
    }
    if (!shell.levelState.extras) {
      shell.levelState.extras = {};
    }
    if (!shell.levelState.extras.levelStepComplete) {
      shell.levelState.extras.levelStepComplete = {};
    }
    if (!shell.levelState.extras.levelTimestamps) {
      shell.levelState.extras.levelTimestamps = {};
    }
    if (!shell.levelState.extras.currentLevel) {
      shell.levelState.extras.currentLevel = level;
    }
    return shell.levelState.extras;
  }

  function getStepValidationState(taskId, level, shellRef) {
    var shell = shellRef || activeShell;
    if (!shell || !shell.levelState || !shell.levelState.extras) {
      return false;
    }
    if (shell.levelState.extras.currentLevel !== level) {
      return false;
    }
    if (!shell.levelState.extras.levelStepComplete) {
      return false;
    }
    return !!shell.levelState.extras.levelStepComplete[taskId];
  }

  function makeStepTask(level, step, points) {
    return {
      id: step.id,
      hint: step.hint,
      errorType: 'wrong_command',
      validate: function (shell) {
        return getStepValidationState(step.id, level, shell);
      },
      output: '[OK] ' + step.successText,
      onSuccess: function (shell) {
        if (!shell) {
          return;
        }
        if (typeof shell.score !== 'number') {
          shell.score = 0;
        }
        shell.score += points;
      }
    };
  }

  function narrateLevel(level, shell) {
    var beats = STORY_BEATS[level];
    if (!beats) {
      return;
    }
    appendOut(shell, '[NARRATIVE] ' + beats.opening);
    appendOut(shell, '[NARRATIVE] ' + beats.beat1);
    appendOut(shell, '[NARRATIVE] ' + beats.beat2);
  }

  function awardGameplayScore(level, stepIndex) {
    var base = 95 + level * 20;
    var bonus = Math.max(0, 35 - stepIndex * 4);
    score += base + bonus;
    updateScoreDisplay();
  }

  function buildScene(engine, level, shell) {
    if (engine.clearPhysics) {
      engine.clearPhysics();
    }

    meshes = [];
    engine.addFloor(18, 18, 0x0f172a);

    var central = engine.addBox(0, 0.65, 0, 1.3, 1.2, 1.3, 0x120608, 0);
    central.material.emissive = new THREE.Color(0x451a03);
    central.material.emissiveIntensity = 0.3;
    meshes.push(central);

    var ringCount = 6 + level;
    for (var i = 0; i < ringCount; i++) {
      var angle = (Math.PI * 2 * i) / ringCount;
      var radius = 3.2 + (level * 0.25);
      var box = engine.addBox(
        Math.cos(angle) * radius,
        1 + (Math.random() * 0.75),
        Math.sin(angle) * radius,
        0.45,
        0.45,
        0.45,
        0x1e293b + (i * 0x020202),
        0.35
      );
      box.userData.objId = 'intel_node_' + level + '_' + i;
      meshes.push(box);
    }

    if (engine.addPhysicsSphere) {
      var spheres = 3 + level;
      for (var s = 0; s < spheres; s++) {
        var sphere = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 7,
          2.4 + Math.random() * 1.8,
          (Math.random() - 0.5) * 7,
          0.11 + Math.random() * 0.1,
          0x38bdf8,
          0.5
        );
        sphere.userData.particle = true;
        meshes.push(sphere);
      }
    }

    if (level >= 2) {
      var alertBar = engine.addBox(0, 2.1, -2.2, 2.8, 0.12, 0.12, 0x7f1d1d, 0);
      alertBar.material.emissive = new THREE.Color(0xff0000);
      alertBar.material.emissiveIntensity = 0.45;
      meshes.push(alertBar);
    }

    bindActionButtons(shell, level);
  }

  function updateTaskText(shell, text) {
    if (shell && typeof shell.setTaskText === 'function') {
      shell.setTaskText(text);
      return;
    }
    var taskEl = el('task-text');
    if (taskEl) {
      taskEl.textContent = text;
    }
  }

  function describeCurrentStep(level, stepIndex) {
    var flow = LEVEL_FLOWS[level];
    if (!flow || !flow.steps || !flow.steps[stepIndex]) {
      return 'Continue incident response actions.';
    }
    return flow.steps[stepIndex].hint;
  }

  function clearSkillMode(shell) {
    shell._skillMode = null;
    updateTaskText(shell, describeCurrentStep(shell.level, shell.levelState.taskIdx || 0));
  }

  function handleSpeedTrialAction(action, shell, mode) {
    var now = Date.now();
    if (now >= mode.expiresAt) {
      appendOut(shell, '[SKILL] Speed Trial expired at 90 seconds. Score: 0');
      shell.submitScore('speedTrial', 0);
      clearSkillMode(shell);
      return !0;
    }

    var expected = mode.sequence[mode.index];
    if (!expected) {
      return !0;
    }

    if (action === expected.requiredAction) {
      mode.index += 1;
      appendOut(shell, '[SKILL] Correct: ' + expected.title + ' -> ' + expected.requiredAction);
      if (mode.index >= mode.sequence.length) {
        var elapsedSeconds = Math.floor((now - mode.startedAt) / 1000);
        var finalScore = Math.max(0, 1000 - elapsedSeconds * 10);
        shell.submitScore('speedTrial', finalScore);
        appendOut(shell, '[SKILL] Completed in ' + elapsedSeconds + 's. Score: ' + finalScore);
        clearSkillMode(shell);
      } else {
        var next = mode.sequence[mode.index];
        updateTaskText(shell, '[Skill] ' + next.title + ' (' + next.timestamp + ') -> choose action');
      }
      return !0;
    }

    appendOut(
      shell,
      '[SKILL] Incorrect. ' + expected.title + ' maps to ' + expected.requiredAction +
      ' under MITRE ' + expected.mitre + '.'
    );
    return !0;
  }

  function handleAccuracyGauntletAction(action, shell, mode) {
    if (mode.index >= mode.rounds.length) {
      return !0;
    }

    var round = mode.rounds[mode.index];
    if (action === round.requiredAction) {
      mode.correct += 1;
      appendOut(shell, '[SKILL] Round ' + (mode.index + 1) + ' correct for ' + round.title + '.');
    } else {
      appendOut(
        shell,
        '[SKILL] Round ' + (mode.index + 1) + ' wrong. Expected ' + round.requiredAction +
        ' for indicator ' + round.indicator + '.'
      );
    }

    mode.index += 1;
    if (mode.index >= mode.rounds.length) {
      var computed = Math.round((mode.correct / 10) * 1000);
      shell.submitScore('accuracyGauntlet', computed);
      appendOut(shell, '[SKILL] Accuracy Gauntlet score: ' + computed + ' (' + mode.correct + '/10 correct)');
      clearSkillMode(shell);
      return !0;
    }

    var nextRound = mode.rounds[mode.index];
    updateTaskText(
      shell,
      '[Skill] Round ' + (mode.index + 1) + '/10: ' + nextRound.title +
      ' [' + nextRound.timestamp + ']'
    );
    return !0;
  }

  function handleDecisionTreeAction(action, shell, mode) {
    if (mode.index >= mode.scenarios.length) {
      return !0;
    }

    var scenario = mode.scenarios[mode.index];
    if (scenario.options.indexOf(action) === -1) {
      appendOut(shell, '[SKILL] Use one of: ' + scenario.options.join(', '));
      return !0;
    }

    var wasCorrect = action === scenario.bestAction;
    if (wasCorrect) {
      mode.correct += 1;
      appendOut(shell, '[SKILL] Scenario ' + (mode.index + 1) + ' correct.');
    } else {
      appendOut(shell, '[SKILL] Scenario ' + (mode.index + 1) + ' suboptimal.');
    }

    mode.reasoning.push(
      'Scenario ' + (mode.index + 1) + ': selected ' + action + '. ' + scenario.reasoning
    );
    mode.index += 1;

    if (mode.index >= mode.scenarios.length) {
      var finalScore = mode.correct * 300;
      shell.submitScore('decisionTree', finalScore);
      appendOut(shell, '[SKILL] Decision Tree score: ' + finalScore);
      for (var i = 0; i < mode.reasoning.length; i++) {
        appendOut(shell, '[REASON] ' + mode.reasoning[i]);
      }
      clearSkillMode(shell);
      return !0;
    }

    updateTaskText(shell, '[Skill] Scenario ' + (mode.index + 1) + '/3: choose best response action.');
    return !0;
  }

  function routeSkillAction(action, shell) {
    var mode = shell._skillMode;
    if (!mode || !mode.id) {
      return false;
    }
    if (mode.id === 'speedTrial') {
      return handleSpeedTrialAction(action, shell, mode);
    }
    if (mode.id === 'accuracyGauntlet') {
      return handleAccuracyGauntletAction(action, shell, mode);
    }
    if (mode.id === 'decisionTree') {
      return handleDecisionTreeAction(action, shell, mode);
    }
    return false;
  }

  function onAction(action, shell, level) {
    if (!shell || !shell.config || !shell.config.levels) {
      return;
    }

    appendActionLine('> ' + action);

    if (routeSkillAction(action, shell)) {
      return;
    }

    var levelDef = shell.config.levels[level];
    if (!levelDef || levelDef.epilogue) {
      return;
    }

    var flow = LEVEL_FLOWS[level];
    var extras = ensureLevelExtras(shell, level);
    var index = shell.levelState.taskIdx || 0;
    var step = flow.steps[index];
    if (!step) {
      return;
    }

    if (action === step.action) {
      extras.levelStepComplete[step.id] = true;
      extras.levelTimestamps[step.id] = Date.now();
      appendOut(shell, step.successText);
      awardGameplayScore(level, index);
      shell.levelState.taskIdx = index + 1;
      if (shell.levelState.taskIdx >= flow.steps.length) {
        appendOut(shell, '[SUCCESS] Level action chain complete.');
        shell.onLevelTasksComplete();
      } else {
        updateTaskText(shell, describeCurrentStep(level, shell.levelState.taskIdx));
      }
      return;
    }

    if (level === 3 && index === 0 && action === 'BLOCK IP') {
      appendOut(shell, '[FAIL] ' + flow.wrongOrderFeedback['BLOCK IP']);
      return;
    }

    if (level === 4 && index === 0 && action === 'ISOLATE NODE') {
      appendOut(shell, '[FAIL] ' + flow.wrongOrderFeedback['ISOLATE NODE']);
      return;
    }

    var message = step.wrongFeedback[action] || step.wrongFeedback.default || 'Incorrect action for current step.';
    appendOut(shell, '[FAIL] ' + message);
  }

  function bindActionButtons(shell, level) {
    var wrap = el('action-btns');
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';

    var levelDef = shell.config.levels[level];
    if (!levelDef || levelDef.epilogue) {
      var epiBtn = document.createElement('button');
      epiBtn.type = 'button';
      epiBtn.className = 'act-btn';
      epiBtn.textContent = 'Begin debrief';
      epiBtn.onclick = function () {
        shell.runEpilogue();
      };
      wrap.appendChild(epiBtn);
      return;
    }

    for (var i = 0; i < actionDefs.length; i++) {
      (function (def) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'act-btn';
        btn.textContent = def.label;
        btn.onclick = function () {
          onAction(def.action, shell, level);
        };
        wrap.appendChild(btn);
      })(actionDefs[i]);
    }
  }

  function shuffledAlerts(total) {
    var pool = [];
    for (var i = 0; i < total; i++) {
      var src = ALERT_LIBRARY[i % ALERT_LIBRARY.length];
      pool.push({
        id: src.id + '_round_' + i,
        title: src.title,
        indicator: src.indicator,
        timestamp: src.timestamp,
        cve: src.cve,
        mitre: src.mitre,
        requiredAction: src.requiredAction
      });
    }
    for (var j = pool.length - 1; j > 0; j--) {
      var idx = Math.floor(Math.random() * (j + 1));
      var temp = pool[j];
      pool[j] = pool[idx];
      pool[idx] = temp;
    }
    return pool;
  }

  function startSpeedTrial(shell) {
    var sequence = ALERT_LIBRARY.slice(0, 5);
    shell._skillMode = {
      id: 'speedTrial',
      startedAt: Date.now(),
      expiresAt: Date.now() + (90 * 1000),
      index: 0,
      sequence: sequence
    };
    appendOut(shell, '[SKILL] Speed Trial started. 5 alerts, 90 second timer.');
    appendOut(shell, '[SKILL] Score formula: max(0, 1000 - elapsed_seconds * 10).');
    updateTaskText(shell, '[Skill] ' + sequence[0].title + ' (' + sequence[0].timestamp + ')');
  }

  function startAccuracyGauntlet(shell) {
    var rounds = shuffledAlerts(10);
    shell._skillMode = {
      id: 'accuracyGauntlet',
      index: 0,
      correct: 0,
      rounds: rounds
    };
    appendOut(shell, '[SKILL] Accuracy Gauntlet started: 10 random alerts.');
    appendOut(shell, '[SKILL] Score formula: (correct / 10) * 1000.');
    updateTaskText(shell, '[Skill] Round 1/10: ' + rounds[0].title + ' [' + rounds[0].indicator + ']');
  }

  function startDecisionTree(shell) {
    var scenarios = [
      {
        prompt: 'SQLi spike and exploit attempts from 185.193.88.14 on vulnerable endpoint.',
        options: ['ALERT DEV', 'BLOCK IP', 'INVESTIGATE LOGS'],
        bestAction: 'BLOCK IP',
        reasoning: 'Contain active ingress first, then coordinate patching to reduce immediate blast radius.'
      },
      {
        prompt: 'Internal host APP-17 launches PsExec to two finance nodes after suspicious token use.',
        options: ['ISOLATE NODE', 'ESCALATE', 'ALERT DEV'],
        bestAction: 'ISOLATE NODE',
        reasoning: 'Lateral movement on internal hosts requires immediate segmentation before command-level comms.'
      },
      {
        prompt: 'Confirmed data exfiltration to 89.44.9.201 with possible regulated records exposure.',
        options: ['INVESTIGATE LOGS', 'BLOCK IP', 'ESCALATE'],
        bestAction: 'ESCALATE',
        reasoning: 'Potential disclosure event exceeds analyst authority; command escalation activates legal and IR leadership.'
      }
    ];

    shell._skillMode = {
      id: 'decisionTree',
      index: 0,
      correct: 0,
      scenarios: scenarios,
      reasoning: []
    };

    appendOut(shell, '[SKILL] Decision Tree started. 3 scenarios, 3 options each.');
    appendOut(shell, '[SKILL] Score formula: correct * 300.');
    appendOut(shell, '[SCENARIO] 1: ' + scenarios[0].prompt);
    appendOut(shell, '[SCENARIO] Options: ' + scenarios[0].options.join(', '));
    updateTaskText(shell, '[Skill] Scenario 1/3: select best action.');
  }

  function buildBranch(level) {
    return {
      title: 'Story branch — Level ' + level + ' (5 paths)',
      desc: 'Your SOC triage decisions shape follow-on incidents. Fifteen branches exist across levels 1-3.',
      options: [
        { id: 'branch_speed_' + level, label: 'Fast containment first' },
        { id: 'branch_hunt_' + level, label: 'Deep hunt before containment' },
        { id: 'branch_escalate_' + level, label: 'Escalate to command immediately' },
        { id: 'branch_document_' + level, label: 'Document forensic timeline live' },
        { id: 'branch_segment_' + level, label: 'Segment affected network zone' }
      ]
    };
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE BREACH',
    achievementId: 'breach_master',
    leaderboardChallenge: 'speedTrial',
    engine: {
      bg: 0x120608,
      physics: true
    },
    moveSpeed: 2.45,
    buildScene: buildScene,
    levels: {
      1: {
        name: 'Initial Compromise',
        hint: LEVEL_FLOWS[1].steps[0].hint,
        action: 'ALERT DEV',
        timeLimit: LEVEL_FLOWS[1].timeLimit,
        taskSequence: [
          { action: 'BLOCK IP', hint: LEVEL_FLOWS[1].steps[0].hint },
          { action: 'ALERT DEV', hint: LEVEL_FLOWS[1].steps[1].hint }
        ],
        tasks: [
          makeStepTask(1, LEVEL_FLOWS[1].steps[0], 120),
          makeStepTask(1, LEVEL_FLOWS[1].steps[1], 140)
        ],
        branch: buildBranch(1)
      },
      2: {
        name: 'Alert Flood',
        hint: LEVEL_FLOWS[2].steps[0].hint,
        action: 'INVESTIGATE LOGS',
        timeLimit: LEVEL_FLOWS[2].timeLimit,
        taskSequence: [
          { action: 'ALERT DEV', hint: LEVEL_FLOWS[2].steps[0].hint },
          { action: 'BLOCK IP', hint: LEVEL_FLOWS[2].steps[1].hint },
          { action: 'ISOLATE NODE', hint: LEVEL_FLOWS[2].steps[2].hint },
          { action: 'ESCALATE', hint: LEVEL_FLOWS[2].steps[3].hint },
          { action: 'INVESTIGATE LOGS', hint: LEVEL_FLOWS[2].steps[4].hint }
        ],
        tasks: [
          makeStepTask(2, LEVEL_FLOWS[2].steps[0], 120),
          makeStepTask(2, LEVEL_FLOWS[2].steps[1], 120),
          makeStepTask(2, LEVEL_FLOWS[2].steps[2], 130),
          makeStepTask(2, LEVEL_FLOWS[2].steps[3], 140),
          makeStepTask(2, LEVEL_FLOWS[2].steps[4], 150)
        ],
        branch: buildBranch(2)
      },
      3: {
        name: 'Root Cause Hunt',
        hint: LEVEL_FLOWS[3].steps[0].hint,
        action: 'ISOLATE NODE',
        timeLimit: LEVEL_FLOWS[3].timeLimit,
        taskSequence: [
          { action: 'INVESTIGATE LOGS', hint: LEVEL_FLOWS[3].steps[0].hint },
          { action: 'BLOCK IP', hint: LEVEL_FLOWS[3].steps[1].hint },
          { action: 'ISOLATE NODE', hint: LEVEL_FLOWS[3].steps[2].hint }
        ],
        tasks: [
          makeStepTask(3, LEVEL_FLOWS[3].steps[0], 130),
          makeStepTask(3, LEVEL_FLOWS[3].steps[1], 130),
          makeStepTask(3, LEVEL_FLOWS[3].steps[2], 160)
        ],
        branch: buildBranch(3)
      },
      4: {
        name: 'Ransomware Staging',
        hint: LEVEL_FLOWS[4].steps[0].hint,
        action: 'ESCALATE',
        timeLimit: LEVEL_FLOWS[4].timeLimit,
        taskSequence: [
          { action: 'INVESTIGATE LOGS', hint: LEVEL_FLOWS[4].steps[0].hint },
          { action: 'ISOLATE NODE', hint: LEVEL_FLOWS[4].steps[1].hint },
          { action: 'ESCALATE', hint: LEVEL_FLOWS[4].steps[2].hint }
        ],
        tasks: [
          makeStepTask(4, LEVEL_FLOWS[4].steps[0], 150),
          makeStepTask(4, LEVEL_FLOWS[4].steps[1], 170),
          makeStepTask(4, LEVEL_FLOWS[4].steps[2], 180)
        ]
      },
      5: {
        name: 'Incident Debrief',
        epilogue: true
      }
    },
    skills: [
      {
        id: 'speedTrial',
        name: 'Speed Trial',
        unlockAfter: 1,
        desc: 'Resolve 5 alerts in under 90 seconds.',
        start: startSpeedTrial
      },
      {
        id: 'accuracyGauntlet',
        name: 'Accuracy Gauntlet',
        unlockAfter: 2,
        desc: 'Handle 10 random alerts with precise action mapping.',
        start: startAccuracyGauntlet
      },
      {
        id: 'decisionTree',
        name: 'Decision Tree',
        unlockAfter: 3,
        desc: 'Choose optimal response path across 3 scenarios.',
        start: startDecisionTree
      }
    ],
    onLevelStart: function (level, shell) {
      var flow = LEVEL_FLOWS[level];
      activeShell = shell;
      shell._skillMode = null;
      shell.level = level;
      shell.levelState = shell.levelState || {};
      shell.levelState.taskIdx = 0;
      ensureLevelExtras(shell, level);
      updateTaskText(shell, describeCurrentStep(level, 0));
      narrateLevel(level, shell);
      bindActionButtons(shell, level);
      if (flow && flow.timeLimit) {
        appendOut(shell, '[LEVEL] Time limit: ' + flow.timeLimit + ' seconds.');
      }
    },
    onLevelComplete: function (level, shell) {
      var beats = STORY_BEATS[level];
      if (beats) {
        appendOut(shell, '[NARRATIVE] ' + beats.beat6);
        appendOut(shell, '[NARRATIVE] ' + beats.beat7);
        appendOut(shell, '[NARRATIVE] ' + beats.closing);
      }
    }
  };

  config.onTick = function (dt) {
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (!mesh || !mesh.userData) {
        continue;
      }
      if (mesh.userData.physicsBody && mesh.userData.physicsBody.mass > 0) {
        continue;
      }
      if (mesh.userData.particle) {
        mesh.position.y += Math.sin(Date.now() * 0.002 + mesh.position.x) * dt * 0.35;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!HabibiProgression.isGameUnlocked(GAME_ID) && GAME_ID !== 'the_terminal') {
      var state = HabibiProgression.load(GAME_ID);
      if (!state.unlocked) {
        var lockEl = el('task-text');
        if (lockEl) {
          lockEl.textContent = 'Module locked - complete previous game epilogue first.';
        }
        return;
      }
    }

    var shell = new HabibiGameShell(config);
    activeShell = shell;
    shell.score = 0;
    shell.appendOut = function (text) {
      appendActionLine(text);
    };
    shell.setTaskText = function (text) {
      var node = el('task-text');
      if (node) {
        node.textContent = text;
      }
    };
    shell.updateScore = updateScoreDisplay;
    updateScoreDisplay();
    shell.init();
  });
})();
