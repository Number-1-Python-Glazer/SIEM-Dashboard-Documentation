/**
 * THE MEMORIAL — 3D Experience Module
 * Core concept: post-incident memory and corrective action quality.
 * Mechanics: choose root cause, then choose remediation for each level.
 */
(function () {
  'use strict';

  var GAME_ID = 'the_memorial';
  var totalScore = 0;
  var meshes = [];
  var state = {
    currentLevel: 1,
    selectedCause: null,
    selectedRemediation: null,
    phase: 'cause',
    history: {}
  };

  var LEVEL_DEFS = {
    1: {
      name: 'Memorial Wall: East Cluster',
      breach: 'Northstar Retail Breach',
      intel: {
        victim: 'Northstar Retail Group (EMEA)',
        date: '2025-02-11',
        initialAccess: 'VPN gateway account takeover',
        evidence: [
          'Security admin account logged in from ASN 4134 at 03:12 UTC without MFA challenge.',
          'Okta audit trail shows policy exception applied two weeks earlier for "vendor emergency support".',
          'Palo Alto VPN logs show successful auth from new device fingerprint and impossible travel from Warsaw to Jakarta in 14 minutes.',
          'Attacker staged `adfind.exe` and ran LDAP enumeration before moving to finance SQL hosts.'
        ],
        impact: '2.3M loyalty accounts exposed; payment token vault was not breached.'
      },
      causes: [
        { id: 'l1_c1', label: 'Unpatched VPN zero-day exploit', correct: false, feedback: 'No exploit indicators were found. Access used valid credentials and accepted policy exemptions.' },
        { id: 'l1_c2', label: 'Compromised service account with disabled MFA policy', correct: true, feedback: 'Correct. A policy exception disabled MFA for this account and enabled direct VPN entry.' },
        { id: 'l1_c3', label: 'Data center physical intrusion', correct: false, feedback: 'No physical access anomalies were recorded in badge systems or CCTV review.' },
        { id: 'l1_c4', label: 'Endpoint antivirus signature miss', correct: false, feedback: 'Malware appeared only after authenticated access; antivirus was not the root-cause trigger.' },
        { id: 'l1_c5', label: 'DNS cache poisoning event', correct: false, feedback: 'DNS telemetry stayed clean and was unrelated to the first authenticated foothold.' }
      ],
      remediations: [
        { id: 'l1_r1', label: 'Force global password reset only', correct: false, feedback: 'Insufficient alone. The bypassed MFA policy and exception process remain exploitable.' },
        { id: 'l1_r2', label: 'Reinstate MFA, remove policy exceptions, enforce conditional access on VPN admins', correct: true, feedback: 'Correct. This directly closes the abused identity-and-policy weakness.' },
        { id: 'l1_r3', label: 'Upgrade warehouse barcode scanners', correct: false, feedback: 'Operationally useful, but unrelated to identity-based VPN intrusion.' },
        { id: 'l1_r4', label: 'Block all outbound DNS over HTTPS', correct: false, feedback: 'Does not address the exploited IAM control breakdown.' },
        { id: 'l1_r5', label: 'Rotate SIEM API keys monthly', correct: false, feedback: 'Good hygiene, but unrelated to the initial compromise path.' }
      ]
    },
    2: {
      name: 'Memorial Wall: Finance Chamber',
      breach: 'Cobalt Credit Union Intrusion',
      intel: {
        victim: 'Cobalt Credit Union',
        date: '2024-11-03',
        initialAccess: 'phishing -> OAuth token theft',
        evidence: [
          'Microsoft 365 sign-in logs show "Consent to application: QuickInvoice Sync" from finance workstation.',
          'The malicious app requested `Mail.ReadWrite`, `Files.ReadWrite.All`, and persisted refresh tokens.',
          'EDR showed no malware binary; data egress happened through Graph API calls over valid HTTPS sessions.',
          'Internal phishing simulation had warned of this app family one month prior.'
        ],
        impact: 'Quarterly close workbooks and merger planning docs exfiltrated.'
      },
      causes: [
        { id: 'l2_c1', label: 'Ransomware encryption worm in VDI farm', correct: false, feedback: 'No encryption event occurred; this was stealthy SaaS abuse via OAuth grants.' },
        { id: 'l2_c2', label: 'Privileged OAuth consent abuse with excessive Graph scopes', correct: true, feedback: 'Correct. The attacker weaponized OAuth consent and broad delegated scopes.' },
        { id: 'l2_c3', label: 'BGP hijack against headquarters ISP', correct: false, feedback: 'Network transit remained stable; indicators center on cloud identity abuse.' },
        { id: 'l2_c4', label: 'USB device malware spread', correct: false, feedback: 'No removable media chain was observed in endpoint logs.' },
        { id: 'l2_c5', label: 'Firewall misroute to DMZ jump host', correct: false, feedback: 'No routing misconfiguration tied to the exfiltration path.' }
      ],
      remediations: [
        { id: 'l2_r1', label: 'Disable all third-party cloud apps permanently', correct: false, feedback: 'Overly disruptive and not risk-based; governance and scoped controls are needed.' },
        { id: 'l2_r2', label: 'Implement admin consent workflow, app allow-list, and risky OAuth grant detections', correct: true, feedback: 'Correct. This prevents untrusted app consent and detects suspicious delegated permissions.' },
        { id: 'l2_r3', label: 'Reinstall endpoint agents on all desktops', correct: false, feedback: 'This was not endpoint binary malware; agent reinstall misses identity control gaps.' },
        { id: 'l2_r4', label: 'Increase mailbox quota limits', correct: false, feedback: 'Storage policy has no relation to token abuse and cloud data theft.' },
        { id: 'l2_r5', label: 'Move finance users to separate VLAN', correct: false, feedback: 'Network segmentation does not block OAuth abuse in SaaS control plane.' }
      ]
    },
    3: {
      name: 'Memorial Wall: Clinical Annex',
      breach: 'HelixCare Regional Hospital',
      intel: {
        victim: 'HelixCare Hospital Network',
        date: '2025-01-27',
        initialAccess: 'internet-exposed Citrix ADC with stale patch',
        evidence: [
          'NDR captured exploit chain matching CVE-2023-3519 request fingerprint.',
          'DMZ ADC appliance patch baseline lagged by 73 days due to frozen change window.',
          'Post-exploit web shell beaconed to 45.137.22.19 and proxied RDP to radiology subnet.',
          'SIEM alerts existed but were tuned to low severity and auto-closed within 5 minutes.'
        ],
        impact: 'Radiology imaging archive and patient scheduling systems disrupted for 19 hours.'
      },
      causes: [
        { id: 'l3_c1', label: 'Outdated edge appliance patching and weak exploit severity triage', correct: true, feedback: 'Correct. Patch delay and muted alert triage enabled exploitation and lateral movement.' },
        { id: 'l3_c2', label: 'Compromised cafeteria POS terminals', correct: false, feedback: 'No trace linked POS systems to the DMZ exploit sequence.' },
        { id: 'l3_c3', label: 'Cloud bucket public read access', correct: false, feedback: 'Issue was active edge exploitation, not object-storage exposure.' },
        { id: 'l3_c4', label: 'Insider copying records to personal mail', correct: false, feedback: 'User-behavior analytics did not indicate insider exfiltration.' },
        { id: 'l3_c5', label: 'Broken SIEM indexing cluster disks', correct: false, feedback: 'SIEM was operational; the major issue was triage policy, not index failure.' }
      ],
      remediations: [
        { id: 'l3_r1', label: 'Patch monthly only and accept delayed emergency windows', correct: false, feedback: 'The breach exploited delayed emergency patching; this repeats the weakness.' },
        { id: 'l3_r2', label: 'Create internet-edge emergency patch SLA, elevate exploit IOCs, and auto-escalate DMZ shell detections', correct: true, feedback: 'Correct. This addresses both exposure timing and inadequate alert response.' },
        { id: 'l3_r3', label: 'Replace all radiology workstations this quarter', correct: false, feedback: 'Expensive but not root-cause aligned; edge hardening is primary.' },
        { id: 'l3_r4', label: 'Disable remote desktop enterprise-wide', correct: false, feedback: 'Too broad and operationally harmful; targeted segmentation plus detection is better.' },
        { id: 'l3_r5', label: 'Compress SIEM logs older than 7 days', correct: false, feedback: 'Storage optimization does not remediate exploitable perimeter risk.' }
      ]
    },
    4: {
      name: 'Memorial Wall: Maritime Ops Deck',
      breach: 'BlueHarbor Logistics Compromise',
      intel: {
        victim: 'BlueHarbor Logistics',
        date: '2024-09-14',
        initialAccess: 'third-party remote monitoring tool compromise',
        evidence: [
          'Vendor RMM agent pushed unsigned script `diag_sync.ps1` to 217 hosts.',
          'Script disabled local EDR tamper guard for 180 seconds and dropped Cobalt Strike loader.',
          'Procurement records show the vendor skipped SOC 2 renewal for two years.',
          'Asset owner approved broad RMM admin rights during holiday freeze without risk review.'
        ],
        impact: 'Port scheduling operations delayed; customs filing queue backlogged for 36 hours.'
      },
      causes: [
        { id: 'l4_c1', label: 'Weak third-party access governance and over-privileged RMM trust', correct: true, feedback: 'Correct. Excessive trust in a vendor channel enabled broad scripted execution.' },
        { id: 'l4_c2', label: 'Wi-Fi rogue access point in dockyard', correct: false, feedback: 'Wireless telemetry did not indicate rogue AP influence on this chain.' },
        { id: 'l4_c3', label: 'Mainframe credential brute force', correct: false, feedback: 'No brute-force campaign preceded the scripted deployment events.' },
        { id: 'l4_c4', label: 'Backup tape corruption event', correct: false, feedback: 'Recovery challenges occurred later; not the initiating vulnerability.' },
        { id: 'l4_c5', label: 'Failed UPS batteries in SOC rack', correct: false, feedback: 'Power health remained normal and unrelated to entry vector.' }
      ],
      remediations: [
        { id: 'l4_r1', label: 'Terminate all vendor integrations immediately', correct: false, feedback: 'Unrealistic and business-disruptive; targeted control hardening is required.' },
        { id: 'l4_r2', label: 'Enforce vendor least privilege, signed-script allowlist, and continuous third-party risk attestation', correct: true, feedback: 'Correct. This directly mitigates vendor trust abuse and script execution risk.' },
        { id: 'l4_r3', label: 'Increase SOC shift overlap by one hour', correct: false, feedback: 'Helpful staffing change, but does not control vendor-origin command execution.' },
        { id: 'l4_r4', label: 'Deploy new antivirus logo and training posters', correct: false, feedback: 'Awareness branding does not close authorization and code-signing gaps.' },
        { id: 'l4_r5', label: 'Move SIEM dashboards to 4K displays', correct: false, feedback: 'UI upgrades do not remediate vendor access governance failures.' }
      ]
    },
    5: {
      name: 'Final Memorial: Archive Seal',
      epilogue: true
    }
  };

  var STORY_BEATS = {
    1: {
      opening: 'Memorial transcript loaded: Northstar Retail. The first frame captures an unchallenged admin login and policy bypass.',
      beat1: 'Investigator note: impossible travel and a dormant exception policy reveal identity governance drift, not exploit novelty.',
      beat2: 'Board hearing excerpt: a temporary vendor exception remained active for 42 days without compensating controls.',
      beat3: 'Lesson marker: if privileged identity controls can be bypassed quietly, every downstream control becomes reactive.',
      closing: 'Archive update: Level 1 findings sealed with root-cause and remediation rationale.'
    },
    2: {
      opening: 'Memorial transcript loaded: Cobalt Credit Union. Consent phishing replaced malware with sanctioned API abuse.',
      beat1: 'Investigator note: token refresh chains persisted access even after user password reset.',
      beat2: 'Board hearing excerpt: delegated permissions were approved by habit, not by business need.',
      beat3: 'Lesson marker: cloud control-plane abuse demands app governance, not only endpoint hardening.',
      closing: 'Archive update: Level 2 findings sealed with scope-aware cloud control recommendations.'
    },
    3: {
      opening: 'Memorial transcript loaded: HelixCare Hospital. Public edge exposure met delayed patch execution.',
      beat1: 'Investigator note: exploit fingerprints were known, but low-priority tuning buried alerts.',
      beat2: 'Board hearing excerpt: emergency change freeze overrode urgent edge security maintenance.',
      beat3: 'Lesson marker: patch latency plus muted triage creates predictable breach windows.',
      closing: 'Archive update: Level 3 findings sealed with emergency patch and triage reforms.'
    },
    4: {
      opening: 'Memorial transcript loaded: BlueHarbor Logistics. Vendor channel trust became an attack distribution lane.',
      beat1: 'Investigator note: unsigned scripts executed with inherited administrative authority across critical fleet systems.',
      beat2: 'Board hearing excerpt: third-party assurance expired, yet privileged access remained untouched.',
      beat3: 'Lesson marker: supply-chain trust must be continuously verified, bounded, and observable.',
      closing: 'Archive update: Level 4 findings sealed with enforceable third-party trust boundaries.'
    },
    5: {
      opening: 'Final memorial chamber unlocked. Every incident now maps to a control failure and a precise corrective action.',
      beat1: 'Curator note: memory without control changes repeats history; memory with controls prevents recurrence.',
      beat2: 'Curator note: closure requires measurable implementation owners, deadlines, and verification evidence.',
      beat3: 'Curator note: SOC memory becomes resilience only when lessons are operationalized.',
      closing: 'Memorial complete. You preserved breach truth and converted it to defensive architecture.'
    }
  };

  function appendLog(line) {
    var el = document.getElementById('action-log');
    if (!el) {
      return;
    }
    el.textContent += line + '\n';
    el.scrollTop = el.scrollHeight;
  }

  function updateHud() {
    var scoreEl = document.getElementById('hud-score');
    if (scoreEl) {
      scoreEl.textContent = 'SCORE ' + totalScore;
    }
  }

  function setTaskText(text) {
    var taskEl = document.getElementById('task-text');
    if (taskEl) {
      taskEl.textContent = text;
    }
  }

  function narrate(level, shell) {
    var beat = STORY_BEATS[level];
    if (!beat || !shell) {
      return;
    }
    shell.appendOut('[NARRATIVE] ' + beat.opening);
    shell.appendOut('[NARRATIVE] ' + beat.beat1);
    shell.appendOut('[NARRATIVE] ' + beat.beat2);
    shell.appendOut('[NARRATIVE] ' + beat.beat3);
  }

  function summarizeIntel(levelDef) {
    var intel = levelDef.intel;
    if (!intel) {
      return [];
    }
    var lines = [];
    lines.push('[INTEL] Victim: ' + intel.victim);
    lines.push('[INTEL] Incident Date: ' + intel.date);
    lines.push('[INTEL] Initial Access: ' + intel.initialAccess);
    for (var i = 0; i < intel.evidence.length; i++) {
      lines.push('[EVIDENCE] ' + intel.evidence[i]);
    }
    lines.push('[IMPACT] ' + intel.impact);
    return lines;
  }

  function buildScene(engine, level, shell) {
    state.currentLevel = level;
    state.selectedCause = null;
    state.selectedRemediation = null;
    state.phase = 'cause';

    if (engine.clearPhysics) {
      engine.clearPhysics();
    }
    meshes = [];

    engine.addFloor(16, 16, 0x111827);
    var monolith = engine.addBox(0, 0.6, 0, 1.4, 1.2, 1.2, 0x1f2937, 0);
    monolith.material.emissive = new THREE.Color(0x0f172a);
    monolith.material.emissiveIntensity = 0.35;
    meshes.push(monolith);

    var ringCount = 5 + level;
    for (var i = 0; i < ringCount; i++) {
      var angle = (Math.PI * 2 * i) / ringCount;
      var x = Math.cos(angle) * (3 + level * 0.4);
      var z = Math.sin(angle) * (3 + level * 0.4);
      var shard = engine.addBox(x, 1.2 + (i % 2) * 0.3, z, 0.35, 0.6, 0.2, 0x334155 + i * 4200, 0.2);
      shard.userData.particle = true;
      meshes.push(shard);
    }

    if (engine.addPhysicsSphere && level >= 2) {
      for (var s = 0; s < level + 2; s++) {
        var orb = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 5,
          2.2 + Math.random() * 1.8,
          (Math.random() - 0.5) * 5,
          0.16,
          0x60a5fa,
          0.4
        );
        meshes.push(orb);
      }
    }

    var levelDef = LEVEL_DEFS[level];
    if (!levelDef || levelDef.epilogue) {
      buildDebriefButtons(shell);
      return;
    }

    renderChoiceButtons(shell, level);
    narrate(level, shell);
    var intelLines = summarizeIntel(levelDef);
    for (var lineIdx = 0; lineIdx < intelLines.length; lineIdx++) {
      shell.appendOut(intelLines[lineIdx]);
    }
    setTaskText('Phase 1/2: Select the most likely root cause for "' + levelDef.breach + '".');
  }

  function recordSelection(level, kind, id, correct) {
    if (!state.history[level]) {
      state.history[level] = {};
    }
    state.history[level][kind] = {
      id: id,
      correct: correct,
      at: Date.now()
    };
  }

  function getOptionById(arr, optionId) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === optionId) {
        return arr[i];
      }
    }
    return null;
  }

  function scoreForCorrect(level, phase) {
    var base = phase === 'cause' ? 180 : 220;
    return base + level * 30;
  }

  function scorePenalty(level) {
    return Math.max(20, 80 - level * 8);
  }

  function validateCauseChoice(shell, level, causeId) {
    var levelDef = LEVEL_DEFS[level];
    var choice = getOptionById(levelDef.causes, causeId);
    if (!choice) {
      shell.appendOut('[FAIL] Unknown cause selection.');
      return false;
    }

    recordSelection(level, 'cause', causeId, !!choice.correct);
    state.selectedCause = causeId;

    if (choice.correct) {
      var points = scoreForCorrect(level, 'cause');
      totalScore += points;
      updateHud();
      shell.appendOut('[SUCCESS] Root cause validated: ' + choice.label);
      shell.appendOut('[WHY] ' + choice.feedback);
      shell.appendOut('[SCORE] +' + points + ' for accurate causal analysis.');
      state.phase = 'remediation';
      setTaskText('Phase 2/2: Choose remediation that directly closes the validated weakness.');
      renderChoiceButtons(shell, level);
      return !0;
    }

    var penalty = scorePenalty(level);
    totalScore = Math.max(0, totalScore - penalty);
    updateHud();
    HabibiProgression.logFailure(GAME_ID, level, 'wrong_cause', shell.state);
    var failCount = HabibiProgression.getFailureCount(GAME_ID, level, 'wrong_cause', shell.state);
    var tutor = HabibiLearning.getFailureFeedback(GAME_ID, level, 'wrong_command', failCount);
    shell.appendOut('[FAIL] Root cause rejected: ' + choice.label);
    shell.appendOut('[WHY] ' + choice.feedback);
    shell.appendOut('[SCORE] -' + penalty + ' for mismatch with breach evidence.');
    if (tutor) {
      shell.appendOut('[TUTOR] ' + tutor);
    }
    setTaskText('Phase 1/2: Re-evaluate evidence and select the true root cause.');
    return false;
  }

  function validateRemediationChoice(shell, level, remediationId) {
    var levelDef = LEVEL_DEFS[level];
    var choice = getOptionById(levelDef.remediations, remediationId);
    if (!choice) {
      shell.appendOut('[FAIL] Unknown remediation selection.');
      return false;
    }

    recordSelection(level, 'remediation', remediationId, !!choice.correct);
    state.selectedRemediation = remediationId;

    if (choice.correct) {
      var points = scoreForCorrect(level, 'remediation');
      totalScore += points;
      updateHud();
      shell.appendOut('[SUCCESS] Remediation validated: ' + choice.label);
      shell.appendOut('[WHY] ' + choice.feedback);
      shell.appendOut('[SCORE] +' + points + ' for control-mapped corrective action.');
      shell.appendOut('[NARRATIVE] ' + STORY_BEATS[level].closing);
      shell.onLevelTasksComplete();
      return !0;
    }

    var penalty = scorePenalty(level);
    totalScore = Math.max(0, totalScore - penalty);
    updateHud();
    HabibiProgression.logFailure(GAME_ID, level, 'wrong_remediation', shell.state);
    var failCount = HabibiProgression.getFailureCount(GAME_ID, level, 'wrong_remediation', shell.state);
    var tutor = HabibiLearning.getFailureFeedback(GAME_ID, level, 'wrong_command', failCount);
    shell.appendOut('[FAIL] Remediation rejected: ' + choice.label);
    shell.appendOut('[WHY] ' + choice.feedback);
    shell.appendOut('[SCORE] -' + penalty + ' for weak corrective mapping.');
    if (tutor) {
      shell.appendOut('[TUTOR] ' + tutor);
    }
    setTaskText('Phase 2/2: Select remediation that blocks this root cause directly.');
    return false;
  }

  function onOptionClick(shell, level, optionId) {
    if (state.phase === 'cause') {
      validateCauseChoice(shell, level, optionId);
      return;
    }
    validateRemediationChoice(shell, level, optionId);
  }

  function button(label, onClick, cls) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls || 'act-btn';
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
  }

  function renderChoiceButtons(shell, level) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';

    var levelDef = LEVEL_DEFS[level];
    if (!levelDef || levelDef.epilogue) {
      buildDebriefButtons(shell);
      return;
    }

    var phaseTitle = document.createElement('div');
    phaseTitle.className = 'phase-title';
    phaseTitle.textContent = state.phase === 'cause' ? 'ROOT CAUSE OPTIONS' : 'REMEDIATION OPTIONS';
    wrap.appendChild(phaseTitle);

    var options = state.phase === 'cause' ? levelDef.causes : levelDef.remediations;
    for (var i = 0; i < options.length; i++) {
      (function (option) {
        var btn = button(option.label, function () {
          appendLog('> ' + option.label);
          onOptionClick(shell, level, option.id);
        }, 'act-btn choice-btn');
        wrap.appendChild(btn);
      })(options[i]);
    }

    var resetBtn = button('Reset Selection Phase', function () {
      state.selectedCause = null;
      state.selectedRemediation = null;
      state.phase = 'cause';
      shell.appendOut('[SYSTEM] Selection phase reset to root-cause analysis.');
      setTaskText('Phase 1/2: Select the most likely root cause for "' + levelDef.breach + '".');
      renderChoiceButtons(shell, level);
    }, 'act-btn secondary');
    wrap.appendChild(resetBtn);
  }

  function buildDebriefButtons(shell) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';
    wrap.appendChild(button('Begin Debrief', function () {
      shell.runEpilogue();
    }, 'act-btn'));
  }

  function startSpeedTrial(shell) {
    var correctSelections = 0;
    var levels = [1, 2, 3, 4];
    for (var i = 0; i < levels.length; i++) {
      var rec = state.history[levels[i]];
      if (rec && rec.cause && rec.cause.correct && rec.remediation && rec.remediation.correct) {
        correctSelections += 2;
      }
    }
    var skillScore = 400 + correctSelections * 70;
    shell.submitScore('speedTrial', skillScore);
    shell.appendOut('[SKILL] Memorial speed synthesis scored ' + skillScore + '.');
  }

  function startAccuracyGauntlet(shell) {
    var misses = 0;
    var levels = [1, 2, 3, 4];
    for (var i = 0; i < levels.length; i++) {
      var rec = state.history[levels[i]];
      if (!rec || !rec.cause || !rec.cause.correct) {
        misses++;
      }
      if (!rec || !rec.remediation || !rec.remediation.correct) {
        misses++;
      }
    }
    var skillScore = Math.max(0, 1000 - misses * 120);
    shell.submitScore('accuracyGauntlet', skillScore);
    shell.appendOut('[SKILL] Memorial accuracy gauntlet scored ' + skillScore + '.');
  }

  function startDecisionTree(shell) {
    var weighted = 0;
    var levels = [1, 2, 3, 4];
    for (var i = 0; i < levels.length; i++) {
      var lvl = levels[i];
      var rec = state.history[lvl];
      if (rec && rec.cause && rec.cause.correct) {
        weighted += 90 + lvl * 5;
      }
      if (rec && rec.remediation && rec.remediation.correct) {
        weighted += 120 + lvl * 7;
      }
    }
    shell.submitScore('decisionTree', weighted);
    shell.appendOut('[TREE] Memorial decision tree scored ' + weighted + '.');
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE MEMORIAL',
    achievementId: 'memorial_master',
    leaderboardChallenge: 'accuracyGauntlet',
    engine: { bg: 0x0b1020, physics: true },
    moveSpeed: 2.4,
    buildScene: buildScene,
    levels: {
      1: {
        name: LEVEL_DEFS[1].name,
        hint: 'Identify true root cause and fix.',
        tasks: [
          {
            id: 'l1_memorial',
            hint: 'Validate root-cause and remediation decisions for Northstar.',
            errorType: 'wrong_command',
            validate: function () {
              var rec = state.history[1];
              return !!(rec && rec.cause && rec.cause.correct && rec.remediation && rec.remediation.correct);
            },
            output: '[OK] Northstar incident analysis validated.'
          }
        ]
      },
      2: {
        name: LEVEL_DEFS[2].name,
        hint: 'Identify cloud-control-plane abuse patterns.',
        tasks: [
          {
            id: 'l2_memorial',
            hint: 'Validate root-cause and remediation decisions for Cobalt.',
            errorType: 'wrong_command',
            validate: function () {
              var rec = state.history[2];
              return !!(rec && rec.cause && rec.cause.correct && rec.remediation && rec.remediation.correct);
            },
            output: '[OK] Cobalt incident analysis validated.'
          }
        ]
      },
      3: {
        name: LEVEL_DEFS[3].name,
        hint: 'Map edge exploit and triage failures to controls.',
        tasks: [
          {
            id: 'l3_memorial',
            hint: 'Validate root-cause and remediation decisions for HelixCare.',
            errorType: 'wrong_command',
            validate: function () {
              var rec = state.history[3];
              return !!(rec && rec.cause && rec.cause.correct && rec.remediation && rec.remediation.correct);
            },
            output: '[OK] HelixCare incident analysis validated.'
          }
        ]
      },
      4: {
        name: LEVEL_DEFS[4].name,
        hint: 'Resolve third-party trust and privilege breakdowns.',
        tasks: [
          {
            id: 'l4_memorial',
            hint: 'Validate root-cause and remediation decisions for BlueHarbor.',
            errorType: 'wrong_command',
            validate: function () {
              var rec = state.history[4];
              return !!(rec && rec.cause && rec.cause.correct && rec.remediation && rec.remediation.correct);
            },
            output: '[OK] BlueHarbor incident analysis validated.'
          }
        ]
      },
      5: {
        name: LEVEL_DEFS[5].name,
        epilogue: true
      }
    },
    skills: [
      { id: 'speedTrial', name: 'Speed Trial', unlockAfter: 1, desc: 'Score completed memorial decisions.', start: startSpeedTrial },
      { id: 'accuracyGauntlet', name: 'Accuracy Gauntlet', unlockAfter: 2, desc: 'Reward precise root-cause mapping.', start: startAccuracyGauntlet },
      { id: 'decisionTree', name: 'Decision Tree', unlockAfter: 3, desc: 'Weight decisions by incident severity.', start: startDecisionTree }
    ],
    onLevelStart: function (level, shell) {
      state.currentLevel = level;
      state.selectedCause = null;
      state.selectedRemediation = null;
      state.phase = 'cause';
      totalScore += level * 12;
      updateHud();
      var def = LEVEL_DEFS[level];
      if (def && !def.epilogue) {
        setTaskText('Phase 1/2: Select the most likely root cause for "' + def.breach + '".');
      } else {
        setTaskText('Memorial archive ready for final debrief.');
      }
    },
    onLevelComplete: function (level, shell) {
      if (STORY_BEATS[level]) {
        shell.appendOut('[CLOSING] ' + STORY_BEATS[level].closing);
      }
    }
  };

  config.onTick = function (dt) {
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (!mesh || !mesh.userData || !mesh.userData.particle) {
        continue;
      }
      mesh.position.y += Math.sin(Date.now() * 0.0015 + i) * dt * 0.25;
      mesh.rotation.y += dt * 0.35;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var shell = new HabibiGameShell(config);
    shell.score = 0;
    shell.appendOut = function (txt) {
      appendLog(txt);
    };
    shell.setTaskText = function (txt) {
      setTaskText(txt);
    };
    shell.updateScore = function () {
      updateHud();
    };
    shell.init();
  });
})();
