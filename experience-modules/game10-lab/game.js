/**
 * THE LAB — 3D Experience Module
 * Core concept: Malware sample triage
 * Mechanic: Answer sample questions with buttons and typed classification
 */
(function () {
  'use strict';

  var GAME_ID = 'the_lab';
  var score = 0;
  var sampleMeshes = [];
  var sampleLookup = {};
  var currentQuestionIndex = 0;
  var questionStart = 0;

  var LAB_LEVELS = {
    1: {
      levelIndex: 1,
      name: 'Loader Triage',
      hint: 'Classify low-noise loader samples before detonation.',
      briefing: 'SOC queue flooded with email attachments from finance spoofing.',
      samples: [
        {
          id: 'SMPL-A1',
          label: 'Invoice_29817.zip',
          fileType: 'zip-dropper',
          behavior: 'writes dll and schedules persistence',
          hashClass: 'trojan-loader',
          family: 'BazarLite'
        },
        {
          id: 'SMPL-A2',
          label: 'policy_update.js',
          fileType: 'js-script',
          behavior: 'launches powershell cradle',
          hashClass: 'downloader',
          family: 'SocGholish'
        },
        {
          id: 'SMPL-A3',
          label: 'benefits_sheet.xlsm',
          fileType: 'office-macro',
          behavior: 'spawns cmd and drops exe',
          hashClass: 'initial-access',
          family: 'Emotet'
        }
      ],
      questionSet: [
        { type: 'fileType', prompt: 'Select correct file type for each sample.' },
        { type: 'behavior', prompt: 'Select observed behavior from sandbox run.' },
        { type: 'hashClass', prompt: 'Type the hash class (exact token).' }
      ],
      story: {
        opening: 'Inbox telemetry shows a coordinated pre-ransomware staging wave.',
        beat1: 'Mislabeling loaders delays containment and widens foothold.',
        closing: 'Loader taxonomy mapped. Containment playbooks auto-triggered.'
      }
    },
    2: {
      levelIndex: 2,
      name: 'Credential Stealers',
      hint: 'Identify stealers by artifact patterns and hash class.',
      briefing: 'Multiple browser credential dumps seen in endpoint quarantine vault.',
      samples: [
        {
          id: 'SMPL-B1',
          label: 'chrome_sync.dat',
          fileType: 'pe32',
          behavior: 'collects browser cookies and wallets',
          hashClass: 'infostealer',
          family: 'RedLine'
        },
        {
          id: 'SMPL-B2',
          label: 'secure_viewer.apk',
          fileType: 'android-apk',
          behavior: 'captures sms and overlays banking apps',
          hashClass: 'banker',
          family: 'Anubis'
        },
        {
          id: 'SMPL-B3',
          label: 'authpatch.msi',
          fileType: 'msi-installer',
          behavior: 'drops stealer module and beacon',
          hashClass: 'credential-theft',
          family: 'Vidar'
        }
      ],
      questionSet: [
        { type: 'behavior', prompt: 'Pick primary malicious behavior.' },
        { type: 'fileType', prompt: 'Confirm source artifact file type.' },
        { type: 'hashClass', prompt: 'Enter hash class token.' }
      ],
      story: {
        opening: 'Adversary shifts from loaders to account theft monetization.',
        beat1: 'Wallet and browser sessions become lateral movement fuel.',
        closing: 'Stealer chain identified; forced credential resets begin.'
      },
      timeLimit: 230
    },
    3: {
      levelIndex: 3,
      name: 'Ransomware Precursors',
      hint: 'Catch precursor binaries before encryption stage.',
      briefing: 'IR team intercepted binaries from suspicious backup task execution.',
      samples: [
        {
          id: 'SMPL-C1',
          label: 'tasksvc.exe',
          fileType: 'pe32',
          behavior: 'disables shadow copies and services',
          hashClass: 'ransomware-prep',
          family: 'LockBit'
        },
        {
          id: 'SMPL-C2',
          label: 'driver_patch.sys',
          fileType: 'kernel-driver',
          behavior: 'terminates EDR processes by handle abuse',
          hashClass: 'defense-evasion',
          family: 'BlackCat'
        },
        {
          id: 'SMPL-C3',
          label: 'ops_notes.vbs',
          fileType: 'vbs-script',
          behavior: 'maps shares and enumerates backups',
          hashClass: 'discovery',
          family: 'Conti'
        }
      ],
      questionSet: [
        { type: 'fileType', prompt: 'Choose file artifact type.' },
        { type: 'hashClass', prompt: 'Type correct classification token.' },
        { type: 'behavior', prompt: 'Select dominant behavior indicator.' }
      ],
      story: {
        opening: 'Encryption has not started yet, but prep artifacts are active.',
        beat1: 'Correct precursor tags unlock pre-encryption isolation workflows.',
        closing: 'Ransomware prep neutralized before impact window.'
      },
      timeLimit: 250
    },
    4: {
      levelIndex: 4,
      name: 'Attribution Stack',
      hint: 'Answer all triage questions with zero misclassification.',
      briefing: 'Threat intel requests family-grade confidence for cross-org sharing.',
      samples: [
        {
          id: 'SMPL-D1',
          label: 'telemetry_stage.bin',
          fileType: 'elf',
          behavior: 'executes cloud metadata theft routines',
          hashClass: 'cloud-credential-theft',
          family: 'TeamTNT'
        },
        {
          id: 'SMPL-D2',
          label: 'print_driver.pkg',
          fileType: 'mach-o',
          behavior: 'installs launch agent and keylogger',
          hashClass: 'spyware',
          family: 'OSX.Atomic'
        },
        {
          id: 'SMPL-D3',
          label: 'audit_cache.ps1',
          fileType: 'powershell-script',
          behavior: 'downloads c2 profile and executes in memory',
          hashClass: 'fileless-loader',
          family: 'PowerShell Empire'
        }
      ],
      questionSet: [
        { type: 'behavior', prompt: 'Select behavior from sandbox evidence.' },
        { type: 'hashClass', prompt: 'Type exact hash classification.' },
        { type: 'fileType', prompt: 'Pick original sample file type.' }
      ],
      story: {
        opening: 'Cross-platform malware campaign targets cloud and desktop identity stores.',
        beat1: 'Confidence in attribution depends on precise triage vocabulary.',
        closing: 'Attribution package signed and shared with partner SOCs.'
      },
      timeLimit: 280
    },
    5: { name: 'Lab Report', epilogue: true }
  };

  var FILE_TYPE_OPTIONS = [
    'zip-dropper', 'js-script', 'office-macro', 'pe32', 'android-apk', 'msi-installer',
    'kernel-driver', 'vbs-script', 'elf', 'mach-o', 'powershell-script'
  ];
  var BEHAVIOR_OPTIONS = [
    'writes dll and schedules persistence',
    'launches powershell cradle',
    'spawns cmd and drops exe',
    'collects browser cookies and wallets',
    'captures sms and overlays banking apps',
    'drops stealer module and beacon',
    'disables shadow copies and services',
    'terminates EDR processes by handle abuse',
    'maps shares and enumerates backups',
    'executes cloud metadata theft routines',
    'installs launch agent and keylogger',
    'downloads c2 profile and executes in memory'
  ];

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = 'SCORE ' + score;
  }

  function log(shell, text) {
    shell.appendOut(text);
    var panel = document.getElementById('action-log');
    if (panel) panel.scrollTop = panel.scrollHeight;
  }

  function clearButtons() {
    var wrap = document.getElementById('action-btns');
    if (wrap) wrap.innerHTML = '';
  }

  function makeButton(text, handler) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'act-btn';
    btn.textContent = text;
    btn.onclick = handler;
    wrap.appendChild(btn);
  }

  function normalize(text) {
    return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function buildSampleMesh(engine, idx, sample) {
    var mesh = engine.addBox(-3.8 + idx * 3.2, 1.0, 1.1, 1.0, 0.65, 0.7, 0x1d4ed8 + idx * 0x111111, false);
    mesh.material.emissive = new THREE.Color(0x0f172a);
    mesh.material.emissiveIntensity = 0.25;
    mesh.userData.sampleId = sample.id;

    var glow = engine.addPhysicsSphere(mesh.position.x, 1.9, 1.1, 0.09, 0x22d3ee, 0.1);
    glow.userData.particle = true;

    return mesh;
  }

  function buildScene(engine, level, shell) {
    var def = shell.config.levels[level];
    engine.clearPhysics();
    sampleMeshes = [];
    sampleLookup = {};
    currentQuestionIndex = 0;
    questionStart = Date.now();

    engine.addFloor(18, 18, 0x0a1020);

    if (!def || def.epilogue) {
      clearButtons();
      makeButton('Begin Debrief', function () { shell.runEpilogue(); });
      shell.setTaskText('Epilogue unlocked. Complete debrief.');
      return;
    }

    var i;
    for (i = 0; i < def.samples.length; i++) {
      var sample = def.samples[i];
      sampleLookup[sample.id] = sample;
      sampleMeshes.push(buildSampleMesh(engine, i, sample));
    }

    shell.levelState.answers = {};
    shell.levelState.misses = 0;
    shell.levelState.completed = false;
    shell.levelState.activeQuestion = 0;

    log(shell, '[NARRATIVE] ' + def.briefing);
    log(shell, '[NARRATIVE] ' + def.story.opening);
    log(shell, '[NARRATIVE] ' + def.story.beat1);
    presentQuestion(shell, def);
  }

  function questionFor(def) {
    return def.questionSet[currentQuestionIndex];
  }

  function currentSample(def) {
    return def.samples[currentQuestionIndex];
  }

  function answerKeyFor(sample, qType) {
    if (qType === 'fileType') return sample.fileType;
    if (qType === 'behavior') return sample.behavior;
    return sample.hashClass;
  }

  function choicesFor(qType) {
    if (qType === 'fileType') return FILE_TYPE_OPTIONS.slice();
    if (qType === 'behavior') return BEHAVIOR_OPTIONS.slice();
    return [];
  }

  function setQuestionTask(shell, def, sample, q) {
    shell.setTaskText(
      'Sample ' + (currentQuestionIndex + 1) + '/' + def.samples.length + ': ' +
      sample.label + ' — ' + q.prompt
    );
  }

  function validateAnswer(shell, def, submitted) {
    var sample = currentSample(def);
    var q = questionFor(def);
    var expected = answerKeyFor(sample, q.type);
    var ok = normalize(submitted) === normalize(expected);

    if (ok) {
      var elapsed = Math.floor((Date.now() - questionStart) / 1000);
      var gain = Math.max(80, 180 - elapsed * 3) + (def.levelIndex * 18);
      score += gain;
      updateScoreDisplay();
      shell.levelState.answers[sample.id + '_' + q.type] = submitted;
      log(shell, '[SUCCESS] ' + sample.id + ' ' + q.type + ' classified as "' + expected + '". +' + gain);
      currentQuestionIndex += 1;
      if (currentQuestionIndex >= def.samples.length) {
        shell.levelState.completed = true;
        log(shell, '[STORY] ' + def.story.closing);
        shell.onLevelTasksComplete();
      } else {
        questionStart = Date.now();
        presentQuestion(shell, def);
      }
      return;
    }

    shell.levelState.misses += 1;
    HabibiProgression.logFailure(GAME_ID, def.levelIndex, 'wrong_classification', shell.state);
    var count = HabibiProgression.getFailureCount(GAME_ID, def.levelIndex, 'wrong_classification', shell.state);
    var tutor = HabibiLearning.getFailureFeedback(GAME_ID, def.levelIndex, 'wrong_command', count);
    log(shell, '[FAIL] Incorrect. Expected category differs for ' + sample.id + '.');
    if (q.type === 'hashClass') {
      log(shell, '[HINT] Hash class tokens are lowercase and hyphenated.');
    }
    if (tutor) log(shell, '[TUTOR] ' + tutor);
  }

  function renderInputQuestion(shell, def, sample, q) {
    clearButtons();
    var wrap = document.getElementById('action-btns');
    if (!wrap) return;

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'lab-hash-input';
    input.placeholder = 'type ' + q.type + ' token';
    input.className = 'act-btn';
    input.style.width = '66%';
    input.autocomplete = 'off';
    wrap.appendChild(input);

    var submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'act-btn';
    submit.textContent = 'Submit';
    submit.onclick = function () {
      validateAnswer(shell, def, input.value || '');
    };
    wrap.appendChild(submit);

    makeButton('Reveal Sample Context', function () {
      log(shell, '[SAMPLE] ' + sample.id + ' family=' + sample.family + ' label=' + sample.label);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        validateAnswer(shell, def, input.value || '');
      }
    });
    input.focus();
  }

  function renderChoiceQuestion(shell, def, sample, q) {
    clearButtons();
    var options = choicesFor(q.type);
    var expected = answerKeyFor(sample, q.type);

    options.sort(function (a, b) {
      if (a === expected) return -1;
      if (b === expected) return 1;
      return a.localeCompare(b);
    });

    options.slice(0, 8).forEach(function (opt) {
      makeButton(opt, function () {
        validateAnswer(shell, def, opt);
      });
    });

    makeButton('Inspect Sample', function () {
      log(shell, '[SAMPLE] ' + sample.id + ' | ' + sample.label + ' | family hint=' + sample.family);
    });
  }

  function presentQuestion(shell, def) {
    var sample = currentSample(def);
    var q = questionFor(def);
    if (!sample || !q) return;

    setQuestionTask(shell, def, sample, q);
    log(shell, '[QUESTION] ' + q.prompt + ' [' + sample.id + ']');

    if (q.type === 'hashClass') {
      renderInputQuestion(shell, def, sample, q);
      return;
    }
    renderChoiceQuestion(shell, def, sample, q);
  }

  function restartQuestion(shell) {
    var def = shell.config.levels[shell.state.currentLevel];
    if (!def || def.epilogue || shell.levelState.completed) return;
    questionStart = Date.now();
    presentQuestion(shell, def);
    log(shell, '[INFO] Question refreshed.');
  }

  function skipForReview(shell) {
    var def = shell.config.levels[shell.state.currentLevel];
    if (!def || def.epilogue || shell.levelState.completed) return;
    var sample = currentSample(def);
    var q = questionFor(def);
    var expected = answerKeyFor(sample, q.type);
    log(shell, '[REVIEW] ' + sample.id + ' expected ' + q.type + ': ' + expected);
  }

  function bindActionButtons(shell, level) {
    clearButtons();
    var def = shell.config.levels[level];
    if (!def || def.epilogue) {
      makeButton('Begin Debrief', function () { shell.runEpilogue(); });
      return;
    }
    presentQuestion(shell, def);
    makeButton('Refresh Prompt', function () { restartQuestion(shell); });
    makeButton('Review Expected', function () { skipForReview(shell); });
  }

  function startSpeedTrial(shell) {
    var misses = shell.levelState && shell.levelState.misses ? shell.levelState.misses : 0;
    var val = Math.max(100, 1000 - misses * 120);
    shell.submitScore('speedTrial', val);
    log(shell, '[SKILL] Speed trial submitted: ' + val);
  }

  function startAccuracyGauntlet(shell) {
    var misses = shell.levelState && shell.levelState.misses ? shell.levelState.misses : 0;
    var val = Math.max(80, 950 - misses * 160);
    shell.submitScore('accuracyGauntlet', val);
    log(shell, '[SKILL] Accuracy gauntlet submitted: ' + val);
  }

  function startDecisionTree(shell) {
    log(shell, '[TREE] Classification tree: artifact -> behavior -> hash class.');
    shell.submitScore('decisionTree', 620);
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE LAB',
    achievementId: 'lab_master',
    leaderboardChallenge: 'speedTrial',
    engine: { bg: 0x0a1020, physics: true },
    moveSpeed: 2.3,
    buildScene: buildScene,
    levels: {
      1: LAB_LEVELS[1],
      2: LAB_LEVELS[2],
      3: LAB_LEVELS[3],
      4: LAB_LEVELS[4],
      5: LAB_LEVELS[5]
    },
    skills: [
      { id: 'speedTrial', name: 'Speed Trial', unlockAfter: 1, desc: 'Classify quickly', start: startSpeedTrial },
      { id: 'accuracyGauntlet', name: 'Accuracy Gauntlet', unlockAfter: 2, desc: 'Zero wrong classifications', start: startAccuracyGauntlet },
      { id: 'decisionTree', name: 'Decision Tree', unlockAfter: 3, desc: 'Review taxonomy logic', start: startDecisionTree }
    ],
    onLevelStart: function (level, shell) {
      var def = shell.config.levels[level];
      if (!def || def.epilogue) {
        shell.setTaskText('Epilogue unlocked. Debrief to finish.');
        return;
      }
      currentQuestionIndex = 0;
      questionStart = Date.now();
      shell.levelState.misses = 0;
      bindActionButtons(shell, level);
      shell.setTaskText(def.hint);
    },
    onLevelComplete: function (level, shell) {
      var def = shell.config.levels[level];
      if (def && def.story) log(shell, '[NARRATIVE] ' + def.story.closing);
    },
    onTick: function (dt) {
      sampleMeshes.forEach(function (mesh, idx) {
        mesh.rotation.y += dt * (0.2 + idx * 0.05);
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!HabibiProgression.isGameUnlocked(GAME_ID) && GAME_ID !== 'the_terminal') {
      var st = HabibiProgression.load(GAME_ID);
      if (!st.unlocked) {
        document.getElementById('task-text').textContent = 'Module locked — complete previous game epilogue first.';
        return;
      }
    }

    var shell = new HabibiGameShell(config);
    shell.score = 0;
    shell.updateScore = updateScoreDisplay;
    shell.appendOut = function (text) {
      var el = document.getElementById('action-log');
      if (!el) return;
      el.textContent += text + '\n';
      el.scrollTop = el.scrollHeight;
    };
    shell.setTaskText = function (text) {
      var task = document.getElementById('task-text');
      if (task) task.textContent = text;
    };
    shell.init();
    updateScoreDisplay();
  });
})();
