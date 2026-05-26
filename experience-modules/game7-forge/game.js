/**
 * THE FORGE — full gameplay module
 * Build and validate detection logic against malicious and benign samples.
 */
(function () {
  'use strict';

  var GAME_ID = 'the_forge';
  var score = 0;
  var meshes = [];
  var glow = 0;
  var runtime = {
    skill: null,
    levelStartMs: 0
  };

  var FORGE_LEVELS = {
    1: {
      name: 'PowerShell Downloader',
      intel: {
        ip: '10.44.2.91',
        cve: 'CVE-2021-26855',
        mitre: 'T1059.001',
        tool: 'Sysmon',
        ts: '2026-05-24T21:02:14Z',
        malicious: { field: 'process.command_line', condition: 'contains', value: 'IEX(New-Object Net.WebClient).DownloadString', count: 7 },
        benign: { field: 'process.command_line', condition: 'contains', value: 'Get-Process', count: 12 }
      }
    },
    2: {
      name: 'Encoded Script Launch',
      intel: {
        ip: '10.51.7.44',
        cve: 'CVE-2024-21413',
        mitre: 'T1027',
        tool: 'Defender for Endpoint',
        ts: '2026-05-24T21:18:07Z',
        malicious: { field: 'process.command_line', condition: 'contains', value: ' -enc ', count: 5 },
        benign: { field: 'process.command_line', condition: 'contains', value: 'powershell -file cleanup.ps1', count: 4 }
      }
    },
    3: {
      name: 'Suspicious Rundll32',
      intel: {
        ip: '172.19.12.222',
        cve: 'CVE-2023-23397',
        mitre: 'T1218.011',
        tool: 'Sigma Correlator',
        ts: '2026-05-24T21:33:53Z',
        malicious: { field: 'process.image', condition: 'endswith', value: 'rundll32.exe', count: 11 },
        benign: { field: 'process.image', condition: 'endswith', value: 'explorer.exe', count: 140 }
      }
    },
    4: {
      name: 'Credential Dump Chain',
      intel: {
        ip: '192.168.88.19',
        cve: 'CVE-2022-30190',
        mitre: 'T1003.001',
        tool: 'YARA-Live',
        ts: '2026-05-24T21:49:26Z',
        malicious: { field: 'process.command_line', condition: 'contains', value: 'sekurlsa::logonpasswords', count: 3 },
        benign: { field: 'process.command_line', condition: 'contains', value: 'whoami /groups', count: 9 }
      }
    }
  };

  var STORY_BEATS = {
    1: [
      '2026-05-24T21:02:14Z | SRC 10.44.2.91 | CVE-2021-26855 pre-auth chain opens command execution.',
      '2026-05-24T21:02:37Z | MITRE T1059.001 command and script interpreter events spike.',
      '2026-05-24T21:02:58Z | Tool signal: Sysmon EventID 1 populated with full command lines.',
      '2026-05-24T21:03:19Z | Malicious sample includes IEX(New-Object Net.WebClient).DownloadString.',
      '2026-05-24T21:03:41Z | Benign admin sample runs Get-Process for inventory baseline.',
      '2026-05-24T21:04:03Z | Rule objective: catch downloader execution while avoiding benign process listing.',
      '2026-05-24T21:04:25Z | Analyst action required: submit detection field, condition, and threshold.'
    ],
    2: [
      '2026-05-24T21:18:07Z | SRC 10.51.7.44 | CVE-2024-21413 follow-on payload observed.',
      '2026-05-24T21:18:33Z | MITRE T1027 obfuscated payload indicators mapped.',
      '2026-05-24T21:18:55Z | Tool signal: Defender process tree notes encoded command usage.',
      '2026-05-24T21:19:20Z | Malicious sample includes powershell command with -enc fragment.',
      '2026-05-24T21:19:46Z | Benign automation runs powershell -file cleanup.ps1 nightly.',
      '2026-05-24T21:20:11Z | Rule objective: detect encoded launch behavior, ignore scripted maintenance.',
      '2026-05-24T21:20:34Z | Analyst action required: craft precise detection values and threshold.'
    ],
    3: [
      '2026-05-24T21:33:53Z | SRC 172.19.12.222 | CVE-2023-23397 activity triggers execution chain.',
      '2026-05-24T21:34:14Z | MITRE T1218.011 signed binary proxy execution appears.',
      '2026-05-24T21:34:36Z | Tool signal: Sigma correlator groups repeated rundll32 ancestry.',
      '2026-05-24T21:35:02Z | Malicious sample image terminates with rundll32.exe.',
      '2026-05-24T21:35:24Z | Benign sample image terminates with explorer.exe.',
      '2026-05-24T21:35:47Z | Rule objective: detect suspicious binary usage without GUI process noise.',
      '2026-05-24T21:36:11Z | Analyst action required: submit rule inputs and validate sample outcomes.'
    ],
    4: [
      '2026-05-24T21:49:26Z | SRC 192.168.88.19 | CVE-2022-30190 chain enters credential access stage.',
      '2026-05-24T21:49:52Z | MITRE T1003.001 LSASS credential dump intent identified.',
      '2026-05-24T21:50:16Z | Tool signal: YARA-Live commandline signatures report sekurlsa tokens.',
      '2026-05-24T21:50:39Z | Malicious sample contains sekurlsa::logonpasswords keyword.',
      '2026-05-24T21:51:03Z | Benign sample runs whoami /groups for access checks.',
      '2026-05-24T21:51:27Z | Rule objective: catch credential dump attempts with low false positives.',
      '2026-05-24T21:51:49Z | Analyst action required: finalize field, condition, value, threshold.'
    ],
    5: [
      '2026-05-24T22:03:22Z | Detection summary compilation starts.',
      '2026-05-24T22:03:46Z | MITRE mappings include T1059.001, T1027, T1218.011, T1003.001.',
      '2026-05-24T22:04:08Z | CVE chain confirmed: CVE-2021-26855, CVE-2024-21413, CVE-2023-23397, CVE-2022-30190.',
      '2026-05-24T22:04:32Z | Tool outputs aggregated from Sysmon, Defender, Sigma Correlator, YARA-Live.',
      '2026-05-24T22:04:54Z | Rule effectiveness report generated with malicious-vs-benign outcomes.',
      '2026-05-24T22:05:18Z | Playbook reviewers request final sign-off.',
      '2026-05-24T22:05:40Z | Operator action required: run debrief.'
    ]
  };

  function ensureExtras(shell) {
    var extras = shell.levelState.extras || {};
    if (!extras.rule) extras.rule = { field: '', condition: '', value: '', threshold: '' };
    if (!extras.maliciousCaught) extras.maliciousCaught = false;
    if (!extras.benignIgnored) extras.benignIgnored = false;
    if (!extras.evaluationDone) extras.evaluationDone = false;
    if (!extras.failures) extras.failures = 0;
    if (!extras.history) extras.history = [];
    shell.levelState.extras = extras;
    return extras;
  }

  function norm(value) {
    return String(value || '').trim().toLowerCase();
  }

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = 'SCORE ' + score;
  }

  function addPoints(shell, value, reason) {
    score += value;
    shell.score += value;
    updateScoreDisplay();
    shell.appendOut('[POINTS] +' + value + ' ' + reason + ' | total ' + score);
  }

  function logStory(shell, level) {
    var beats = STORY_BEATS[level] || [];
    var i;
    for (i = 0; i < beats.length; i++) shell.appendOut('[INTEL] ' + beats[i]);
  }

  function showInputs() {
    var form = document.getElementById('term-form');
    var buttons = document.getElementById('action-btns');
    if (form) form.classList.remove('hidden');
    if (buttons) buttons.classList.remove('hidden');
  }

  function ruleMatchesSample(rule, sample) {
    var fieldMatch = norm(rule.field) === norm(sample.field);
    var conditionMatch = norm(rule.condition) === norm(sample.condition);
    var valueMatch = norm(rule.value) === norm(sample.value);
    var thresholdValue = Number(rule.threshold);
    if (!isFinite(thresholdValue)) return false;
    var thresholdMatch = thresholdValue <= sample.count;
    return fieldMatch && conditionMatch && valueMatch && thresholdMatch;
  }

  function evaluateRule(shell, level) {
    var intel = FORGE_LEVELS[level] && FORGE_LEVELS[level].intel;
    var extras = ensureExtras(shell);
    if (!intel) return;

    var maliciousHit = ruleMatchesSample(extras.rule, intel.malicious);
    var benignHit = ruleMatchesSample(extras.rule, intel.benign);
    extras.maliciousCaught = maliciousHit;
    extras.benignIgnored = !benignHit;
    extras.evaluationDone = true;
    extras.history.push({
      at: Date.now(),
      rule: {
        field: extras.rule.field,
        condition: extras.rule.condition,
        value: extras.rule.value,
        threshold: extras.rule.threshold
      },
      maliciousHit: maliciousHit,
      benignHit: benignHit
    });

    shell.appendOut('[EVAL] malicious_match=' + maliciousHit + ' benign_match=' + benignHit);
    if (maliciousHit && !benignHit) {
      addPoints(shell, 120, 'effective detection rule');
      shell.appendOut('[SUCCESS] Rule catches malicious sample and ignores benign sample.');
    } else {
      extras.failures += 1;
      HabibiProgression.logFailure(GAME_ID, level, 'bad_rule', shell.state);
      shell.appendOut('[FAIL] Rule quality insufficient. It must catch bad sample and skip good sample.');
      shell.appendOut('[HINT] Use exact field/condition/value from malicious sample and balanced threshold.');
    }
    shell.processCommand('check');
  }

  function parseRuleInput(shell, raw) {
    var extras = ensureExtras(shell);
    var text = String(raw || '').trim();
    var lower = text.toLowerCase();
    var parts;
    if (lower.indexOf('field:') === 0) {
      extras.rule.field = text.slice(6).trim();
      shell.appendOut('[RULE] field=' + extras.rule.field);
      return !0;
    }
    if (lower.indexOf('condition:') === 0) {
      extras.rule.condition = text.slice(10).trim();
      shell.appendOut('[RULE] condition=' + extras.rule.condition);
      return !0;
    }
    if (lower.indexOf('value:') === 0) {
      extras.rule.value = text.slice(6).trim();
      shell.appendOut('[RULE] value=' + extras.rule.value);
      return !0;
    }
    if (lower.indexOf('threshold:') === 0) {
      extras.rule.threshold = text.slice(10).trim();
      shell.appendOut('[RULE] threshold=' + extras.rule.threshold);
      return !0;
    }
    if (lower.indexOf('rule ') === 0) {
      parts = text.slice(5).split('|');
      if (parts.length === 4) {
        extras.rule.field = parts[0].trim();
        extras.rule.condition = parts[1].trim();
        extras.rule.value = parts[2].trim();
        extras.rule.threshold = parts[3].trim();
        shell.appendOut('[RULE] Parsed inline rule fields.');
        return !0;
      }
    }
    return false;
  }

  function renderActionButtons(shell, level) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (level === 5) {
      var debrief = document.createElement('button');
      debrief.type = 'button';
      debrief.className = 'act-btn';
      debrief.textContent = 'RUN DEBRIEF';
      debrief.onclick = function () { shell.runEpilogue(); };
      wrap.appendChild(debrief);
      return;
    }

    appendActionButton(wrap, 'SHOW SAMPLE', function () { showSamples(shell, level); });
    appendActionButton(wrap, 'EVALUATE RULE', function () { evaluateRule(shell, level); });
    appendActionButton(wrap, 'CLEAR RULE', function () {
      var extras = ensureExtras(shell);
      extras.rule = { field: '', condition: '', value: '', threshold: '' };
      extras.evaluationDone = false;
      extras.maliciousCaught = false;
      extras.benignIgnored = false;
      shell.appendOut('[RULE] Cleared.');
    });
  }

  function appendActionButton(wrap, label, handler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'act-btn';
    button.textContent = label;
    button.onclick = handler;
    wrap.appendChild(button);
  }

  function showSamples(shell, level) {
    var intel = FORGE_LEVELS[level] && FORGE_LEVELS[level].intel;
    if (!intel) return;
    shell.appendOut('[SAMPLE:bad] field=' + intel.malicious.field + ' condition=' + intel.malicious.condition + ' value=' + intel.malicious.value + ' count=' + intel.malicious.count);
    shell.appendOut('[SAMPLE:good] field=' + intel.benign.field + ' condition=' + intel.benign.condition + ' value=' + intel.benign.value + ' count=' + intel.benign.count);
    shell.appendOut('[INPUT] Set rule using "field:", "condition:", "value:", "threshold:".');
  }

  function buildScene(engine, level, shell) {
    var i;
    if (engine.clearPhysics) engine.clearPhysics();
    meshes = [];
    glow = 0;

    engine.addFloor(18, 18, 0x08110b);
    var forgeCore = engine.addBox(0, 0.6, 0, 1.7, 1.2, 1.7, 0x1f2937, 0);
    forgeCore.material.emissive = new THREE.Color(0x16a34a);
    forgeCore.material.emissiveIntensity = 0.22;
    forgeCore.userData.kind = 'core';
    meshes.push(forgeCore);

    for (i = 0; i < 7 + level * 2; i++) {
      var shard = engine.addBox(
        (Math.random() - 0.5) * 10,
        0.8 + Math.random() * 1.8,
        (Math.random() - 0.5) * 10,
        0.34,
        0.34,
        0.34,
        0x22c55e + i * 400,
        0.22 + level * 0.04
      );
      shard.userData.kind = 'shard';
      meshes.push(shard);
    }

    for (i = 0; i < level + 2; i++) {
      var rail = engine.addBox(
        (Math.random() - 0.5) * 8,
        2 + Math.random() * 1.2,
        (Math.random() - 0.5) * 8,
        1.1,
        0.05,
        0.2,
        0x86efac,
        0
      );
      rail.material.emissive = new THREE.Color(0x4ade80);
      rail.material.emissiveIntensity = 0.18;
      rail.userData.kind = 'rail';
      meshes.push(rail);
    }

    if (engine.addPhysicsSphere) {
      for (i = 0; i < level + 5; i++) {
        var droplet = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 9,
          2 + Math.random() * 2.5,
          (Math.random() - 0.5) * 9,
          0.1 + Math.random() * 0.09,
          0x4ade80,
          0.35
        );
        droplet.userData.kind = 'droplet';
        meshes.push(droplet);
      }
    }

    showInputs();
    renderActionButtons(shell, level);
    logStory(shell, level);
    if (level <= 4) showSamples(shell, level);
  }

  function validateEffectiveRule(level, shell) {
    var extras = ensureExtras(shell);
    return extras.evaluationDone && extras.maliciousCaught && extras.benignIgnored;
  }

  function validateRuleSet(level, shell) {
    var extras = ensureExtras(shell);
    var rule = extras.rule;
    return Boolean(rule.field && rule.condition && rule.value && rule.threshold);
  }

  function startRuleSprint(shell) {
    var rounds = [
      { field: 'process.command_line', condition: 'contains', value: ' -enc ', threshold: 3 },
      { field: 'process.image', condition: 'endswith', value: 'rundll32.exe', threshold: 4 },
      { field: 'process.command_line', condition: 'contains', value: 'sekurlsa::logonpasswords', threshold: 1 }
    ];
    runtime.skill = { id: 'ruleSprint', rounds: rounds, idx: 0, misses: 0, startMs: Date.now() };
    shell.appendOut('[SKILL] Rule Sprint started. Input: field|condition|value|threshold');
    shell.appendOut('[SKILL] Round 1/' + rounds.length + ' target=' + rounds[0].field + '|' + rounds[0].condition + '|' + rounds[0].value + '|' + rounds[0].threshold);
  }

  function startThresholdTuner(shell) {
    runtime.skill = {
      id: 'thresholdTuner',
      cases: [
        { bad: 8, good: 2, best: 3 },
        { bad: 5, good: 1, best: 2 },
        { bad: 12, good: 4, best: 5 },
        { bad: 3, good: 0, best: 1 }
      ],
      idx: 0,
      err: 0,
      startMs: Date.now()
    };
    var case0 = runtime.skill.cases[0];
    shell.appendOut('[SKILL] Threshold Tuner started. Choose threshold catching bad not good.');
    shell.appendOut('[SKILL] Case 1: bad=' + case0.bad + ' good=' + case0.good);
  }

  function startSigmaPrecision(shell) {
    runtime.skill = {
      id: 'sigmaPrecision',
      prompts: [
        { txt: 'field for commandline matching?', ans: 'process.command_line' },
        { txt: 'condition for suffix match?', ans: 'endswith' },
        { txt: 'field for executable path?', ans: 'process.image' },
        { txt: 'condition for substring?', ans: 'contains' }
      ],
      idx: 0,
      correct: 0,
      startMs: Date.now()
    };
    shell.appendOut('[SKILL] Sigma Precision started.');
    shell.appendOut('[SKILL] ' + runtime.skill.prompts[0].txt);
  }

  function finishRuleSprint(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var scoreValue = Math.max(160, 1050 - elapsed * 26 - skill.misses * 70);
    shell.submitScore('ruleSprint', scoreValue);
    shell.appendOut('[SKILL] Rule Sprint score=' + scoreValue + ' time=' + elapsed + 's misses=' + skill.misses);
    runtime.skill = null;
  }

  function finishThresholdTuner(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var scoreValue = Math.max(120, 980 - elapsed * 20 - skill.err * 60);
    shell.submitScore('thresholdTuner', scoreValue);
    shell.appendOut('[SKILL] Threshold Tuner score=' + scoreValue);
    runtime.skill = null;
  }

  function finishSigmaPrecision(shell, skill) {
    var elapsed = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var accuracy = skill.correct / skill.prompts.length;
    var scoreValue = Math.max(120, Math.floor(accuracy * 940) - elapsed * 10);
    shell.submitScore('sigmaPrecision', scoreValue);
    shell.appendOut('[SKILL] Sigma Precision score=' + scoreValue + ' accuracy=' + Math.round(accuracy * 100) + '%');
    runtime.skill = null;
  }

  function handleSkillInput(shell, raw) {
    var skill = runtime.skill;
    var text = String(raw || '').trim();
    var parts;
    if (!skill) return;

    if (skill.id === 'ruleSprint') {
      parts = text.split('|');
      if (parts.length !== 4) {
        skill.misses += 1;
        shell.appendOut('[SKILL] Format must be field|condition|value|threshold');
        return;
      }
      var target = skill.rounds[skill.idx];
      var ok =
        norm(parts[0]) === norm(target.field) &&
        norm(parts[1]) === norm(target.condition) &&
        norm(parts[2]) === norm(target.value) &&
        Number(parts[3]) === target.threshold;
      if (!ok) skill.misses += 1;
      else skill.idx += 1;
      if (skill.idx >= skill.rounds.length) finishRuleSprint(shell, skill);
      else {
        var next = skill.rounds[skill.idx];
        shell.appendOut('[SKILL] Next target=' + next.field + '|' + next.condition + '|' + next.value + '|' + next.threshold);
      }
      return;
    }

    if (skill.id === 'thresholdTuner') {
      var n = Number(text);
      var item = skill.cases[skill.idx];
      if (!isFinite(n)) {
        shell.appendOut('[SKILL] Threshold must be numeric.');
        skill.err += 1;
        return;
      }
      if (n !== item.best) skill.err += 1;
      skill.idx += 1;
      if (skill.idx >= skill.cases.length) finishThresholdTuner(shell, skill);
      else {
        var nextCase = skill.cases[skill.idx];
        shell.appendOut('[SKILL] Case ' + (skill.idx + 1) + ': bad=' + nextCase.bad + ' good=' + nextCase.good);
      }
      return;
    }

    if (skill.id === 'sigmaPrecision') {
      var prompt = skill.prompts[skill.idx];
      if (norm(text) === norm(prompt.ans)) skill.correct += 1;
      skill.idx += 1;
      if (skill.idx >= skill.prompts.length) finishSigmaPrecision(shell, skill);
      else shell.appendOut('[SKILL] ' + skill.prompts[skill.idx].txt);
    }
  }

  function setLevelTaskText(shell, level) {
    if (level === 5) {
      shell.setTaskText('Debrief phase: click RUN DEBRIEF or type run debrief.');
      return;
    }
    shell.setTaskText('Define rule field/condition/value/threshold, then evaluate against samples.');
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE FORGE',
    achievementId: 'forge_master',
    leaderboardChallenge: 'ruleSprint',
    engine: { bg: 0x04120a, physics: true },
    moveSpeed: 2.3,
    buildScene: buildScene,
    levels: {
      1: {
        name: 'PowerShell Downloader',
        hint: 'Build rule for downloader behavior.',
        timeLimit: 300,
        tasks: [
          {
            id: 'l1_rule_set',
            hint: 'Set field/condition/value/threshold inputs.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateRuleSet(1, shell); },
            output: '[TASK] Rule fields accepted.'
          },
          {
            id: 'l1_rule_eval',
            hint: 'Evaluate and ensure bad sample hit + good sample ignored.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateEffectiveRule(1, shell); },
            output: '[TASK] Rule evaluation accepted.'
          }
        ],
        branch: {
          title: 'Deployment Strategy',
          desc: 'Choose rollout strategy after first valid rule.',
          options: [
            { id: 'forge_l1_fast', label: 'Deploy immediately to all endpoints.' },
            { id: 'forge_l1_canary', label: 'Canary deploy to high-risk servers first.' },
            { id: 'forge_l1_shadow', label: 'Run in shadow mode for telemetry only.' },
            { id: 'forge_l1_hunt', label: 'Use as hunt query before alerting.' },
            { id: 'forge_l1_tiered', label: 'Stage by business criticality tiers.' }
          ]
        }
      },
      2: {
        name: 'Encoded Script Launch',
        hint: 'Catch encoded script executions.',
        timeLimit: 320,
        tasks: [
          {
            id: 'l2_rule_set',
            hint: 'Populate all rule fields.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateRuleSet(2, shell); },
            output: '[TASK] Rule fields accepted.'
          },
          {
            id: 'l2_rule_eval',
            hint: 'Validate rule behavior on samples.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateEffectiveRule(2, shell); },
            output: '[TASK] Rule evaluation accepted.'
          }
        ],
        branch: {
          title: 'Noise Handling',
          desc: 'Choose approach for tuning encoded-command detections.',
          options: [
            { id: 'forge_l2_strict', label: 'Raise strict severity for any encoded token.' },
            { id: 'forge_l2_context', label: 'Require parent-process context before alert.' },
            { id: 'forge_l2_count', label: 'Use count threshold to suppress one-offs.' },
            { id: 'forge_l2_user', label: 'Scope alerts to non-admin users first.' },
            { id: 'forge_l2_time', label: 'Prioritize off-hours encoded execution.' }
          ]
        }
      },
      3: {
        name: 'Suspicious Rundll32',
        hint: 'Detect suspicious rundll32 usage.',
        timeLimit: 340,
        tasks: [
          {
            id: 'l3_rule_set',
            hint: 'Set full rule payload.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateRuleSet(3, shell); },
            output: '[TASK] Rule fields accepted.'
          },
          {
            id: 'l3_rule_eval',
            hint: 'Ensure malicious hit and benign miss.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateEffectiveRule(3, shell); },
            output: '[TASK] Rule evaluation accepted.'
          }
        ],
        branch: {
          title: 'Proxy Execution Response',
          desc: 'Choose containment strategy for signed binary abuse.',
          options: [
            { id: 'forge_l3_block', label: 'Block rundll32 child process chains.' },
            { id: 'forge_l3_parent', label: 'Alert only on suspicious parent pairs.' },
            { id: 'forge_l3_cmdline', label: 'Gate on commandline DLL patterns.' },
            { id: 'forge_l3_hunt', label: 'Pivot into historical process lineage.' },
            { id: 'forge_l3_isolate', label: 'Isolate hosts with repeated proxy execution.' }
          ]
        }
      },
      4: {
        name: 'Credential Dump Chain',
        hint: 'Detect credential dumping commands.',
        timeLimit: 370,
        tasks: [
          {
            id: 'l4_rule_set',
            hint: 'Set rule field, condition, value, threshold.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateRuleSet(4, shell); },
            output: '[TASK] Rule fields accepted.'
          },
          {
            id: 'l4_rule_eval',
            hint: 'Evaluate against malicious and benign sample.',
            errorType: 'wrong_command',
            validate: function (cmd, shell) { return validateEffectiveRule(4, shell); },
            output: '[TASK] Rule evaluation accepted.'
          }
        ]
      },
      5: { name: 'Forge Debrief', epilogue: true }
    },
    skills: [
      {
        id: 'ruleSprint',
        name: 'Rule Sprint',
        unlockAfter: 1,
        desc: 'Rapidly recreate exact detection tuples.',
        start: startRuleSprint
      },
      {
        id: 'thresholdTuner',
        name: 'Threshold Tuner',
        unlockAfter: 2,
        desc: 'Pick effective thresholds under pressure.',
        start: startThresholdTuner
      },
      {
        id: 'sigmaPrecision',
        name: 'Sigma Precision',
        unlockAfter: 3,
        desc: 'Answer sigma-style field/condition prompts.',
        start: startSigmaPrecision
      }
    ],
    onLevelStart: function (level, shell) {
      var extras = ensureExtras(shell);
      extras.rule = { field: '', condition: '', value: '', threshold: '' };
      extras.maliciousCaught = false;
      extras.benignIgnored = false;
      extras.evaluationDone = false;
      extras.history = [];
      runtime.levelStartMs = Date.now();
      setLevelTaskText(shell, level);
      addPoints(shell, 14 + level * 4, 'level start');
    },
    onLevelComplete: function (level, shell) {
      if (level <= 4) shell.appendOut('[REPORT] Rule quality accepted for case ' + level + '.');
      if (level === 4) shell.appendOut('[REPORT] Detection pack complete and ready for review.');
    }
  };

  config.onTick = function (dt) {
    var i;
    glow += dt * 2.2;
    for (i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (!mesh || !mesh.userData) continue;
      if (mesh.userData.physicsBody && mesh.userData.physicsBody.mass > 0) continue;
      if (mesh.userData.kind === 'shard') {
        mesh.rotation.y += dt * 0.36;
        mesh.position.y += Math.sin(glow + i * 0.3) * dt * 0.32;
      }
      if (mesh.userData.kind === 'rail') {
        mesh.rotation.z += dt * 0.14;
      }
      if (mesh.userData.kind === 'core') {
        mesh.material.emissiveIntensity = 0.18 + Math.abs(Math.sin(glow)) * 0.3;
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
      if (runtime.skill) {
        handleSkillInput(activeShell, cmd);
        return;
      }
      if (norm(cmd) === 'evaluate') {
        evaluateRule(activeShell, activeShell.state.currentLevel);
        return;
      }
      if (norm(cmd) === 'samples') {
        showSamples(activeShell, activeShell.state.currentLevel);
        return;
      }
      if (norm(cmd) === 'status') {
        var extras = ensureExtras(activeShell);
        activeShell.appendOut('[STATUS] field=' + extras.rule.field + ' condition=' + extras.rule.condition + ' value=' + extras.rule.value + ' threshold=' + extras.rule.threshold);
        activeShell.appendOut('[STATUS] maliciousCaught=' + extras.maliciousCaught + ' benignIgnored=' + extras.benignIgnored);
        return;
      }
      if (activeShell.state.currentLevel === 5 && norm(cmd) === 'run debrief') {
        activeShell.runEpilogue();
        return;
      }
      if (!parseRuleInput(activeShell, cmd)) {
        activeShell.appendOut('[CMD] Unknown input. Use field:/condition:/value:/threshold: or "rule a|b|c|d".');
      } else {
        activeShell.processCommand('check');
      }
    };

    shell.init();
    showInputs();
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
