/**
 * THE CIPHER — 3D Experience Module
 * Cryptographic attack recognition across Caesar, substitution, Enigma, and RSA.
 */
(function () {
  'use strict';

  var GAME_ID = 'the_cipher';
  var score = 0;
  var meshes = [];
  var activeShell = null;

  var CAESAR_CIPHERTEXT = 'URYYB JBEYQ';
  var CAESAR_PLAINTEXT = 'HELLO WORLD';
  var SUB_PLAINTEXT = 'SECURE THE NODE';
  var SUB_MAP = { S: 'K', E: 'Z', C: 'M', U: 'X', R: 'I', T: 'Q', H: 'N', N: 'G', O: 'R', D: 'V' };
  var SUB_CIPHERTEXT = encryptWithMap(SUB_PLAINTEXT, SUB_MAP);

  var ENIGMA_TARGET = [7, 14, 3];
  var RSA_N = 3233;
  var RSA_P = 61;
  var RSA_Q = 53;
  var RSA_D = 2753;

  var runtime = {
    levelStartMs: 0,
    inputAttempts: {},
    level2Mappings: {},
    rsaPhase: 'factor',
    ui: {
      mappingHost: null
    },
    skill: {
      active: null
    }
  };

  var STORY_BEATS = {
    1: {
      title: 'Caesar Intercept',
      opening: [
        'SIGINT pulls a burst transmission from a rogue relay node in Sector C.',
        'Packet headers show low sophistication: static shift, no nonce, no key rotation.',
        'Decrypt quickly to recover the call-sign before the relay rekeys.'
      ],
      closing: 'The relay call-sign resolves to HELIOS. You tag the sender as low-tier operator tooling.'
    },
    2: {
      title: 'Substitution Forensics',
      opening: [
        'A second channel uses monoalphabetic substitution to mask internal movement orders.',
        'Traffic frequency spikes on Z, K, and Q indicate repeated command verbs.',
        'Recover the phrase to identify the targeted infrastructure asset.'
      ],
      closing: 'Recovered directive confirms focus on a single endpoint cluster. Defensive watchlist updated.'
    },
    3: {
      title: 'Rotor Alignment Drill',
      opening: [
        'Captured firmware image includes an Enigma-style rotor simulator used for operator training.',
        'Telemetry leak reveals one reflector family and constrained rotor offsets.',
        'Match the exact offsets to replay encrypted challenge traffic.'
      ],
      closing: 'Rotor set accepted. Emulated stream reproduces adversary training transcript byte-for-byte.'
    },
    4: {
      title: 'RSA Key Recovery',
      opening: [
        'Command channel upgrades to RSA with weak key generation hygiene.',
        'Public modulus N=3233 appears in every handshake and never rotates.',
        'Factor N, derive private key component D, and stage decryption of queued beacons.'
      ],
      closing: 'Private exponent confirmed. Historical beacon archive is now decryptable for attribution.'
    },
    5: {
      title: 'Cipher Debrief',
      opening: [
        'All cryptographic checkpoints complete.',
        'Meridian-7 requests final analytic notes before forwarding to threat intel.'
      ],
      closing: 'Debrief accepted. Cipher operation signed off for chain progression.'
    }
  };

  function encryptWithMap(plaintext, map) {
    var out = '';
    for (var i = 0; i < plaintext.length; i++) {
      var ch = plaintext[i];
      if (ch === ' ') {
        out += ' ';
      } else {
        out += map[ch] || ch;
      }
    }
    return out;
  }

  function decryptWithReverseMap(ciphertext, reverseMap) {
    var out = '';
    for (var i = 0; i < ciphertext.length; i++) {
      var ch = ciphertext[i];
      if (ch === ' ') {
        out += ' ';
      } else {
        out += reverseMap[ch] || '?';
      }
    }
    return out;
  }

  function computeFrequency(text) {
    var freq = {};
    var upper = String(text || '').toUpperCase();
    for (var i = 0; i < upper.length; i++) {
      var ch = upper[i];
      if (ch >= 'A' && ch <= 'Z') {
        freq[ch] = (freq[ch] || 0) + 1;
      }
    }
    return freq;
  }

  function topFrequencyHints(text, count) {
    var freq = computeFrequency(text);
    var keys = Object.keys(freq);
    keys.sort(function (a, b) { return freq[b] - freq[a]; });
    var picked = keys.slice(0, count || 3);
    return picked.map(function (k) { return k + ':' + freq[k]; }).join('  ');
  }

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) {
      el.textContent = 'SCORE ' + score;
    }
  }

  function appendScore(points, reason, shell) {
    score += points;
    updateScoreDisplay();
    if (shell) {
      shell.appendOut('[SCORE] +' + points + ' ' + reason + ' (total=' + score + ')');
    }
  }

  function setInputMode(enabled) {
    var termForm = document.getElementById('term-form');
    var actionButtons = document.getElementById('action-btns');
    if (!termForm || !actionButtons) {
      return;
    }
    if (enabled) {
      termForm.classList.remove('hidden');
      actionButtons.classList.add('hidden');
    } else {
      termForm.classList.add('hidden');
      actionButtons.classList.remove('hidden');
    }
  }

  function appendStory(shell, level) {
    var beat = STORY_BEATS[level];
    if (!beat || !shell) {
      return;
    }
    shell.appendOut('[INTEL] ' + beat.title);
    for (var i = 0; i < beat.opening.length; i++) {
      shell.appendOut('[INTEL] ' + beat.opening[i]);
    }
  }

  function announceLevelPrompt(shell, level) {
    if (level === 1) {
      shell.setTaskText('Level 1: decode the Caesar ciphertext');
      shell.appendOut('[TASK] Ciphertext: "' + CAESAR_CIPHERTEXT + '"');
      shell.appendOut('[TASK] Submit plaintext via input. Expected format: HELLO WORLD');
      return;
    }
    if (level === 2) {
      shell.setTaskText('Level 2: crack substitution by text or mapping UI');
      shell.appendOut('[TASK] Ciphertext: "' + SUB_CIPHERTEXT + '"');
      shell.appendOut('[TASK] Option A: type full plaintext. Option B: set mapping table and apply mapping.');
      renderSubstitutionMappingUI(shell);
      return;
    }
    if (level === 3) {
      shell.setTaskText('Level 3: set Enigma rotors (0-25)');
      shell.appendOut('[TASK] Enter three rotor offsets, e.g. "7 14 3"');
      shell.appendOut('[TASK] Correct set unlocks replay decryption.');
      return;
    }
    if (level === 4) {
      shell.setTaskText('Level 4: factor N=3233 then derive D');
      shell.appendOut('[TASK] Phase 1: submit factors P and Q (primes).');
      shell.appendOut('[TASK] Phase 2: submit D once factors are correct.');
      runtime.rsaPhase = 'factor';
      return;
    }
    if (level === 5) {
      shell.setTaskText('Epilogue: complete cryptanalysis debrief');
      shell.appendOut('[TASK] Trigger debrief with RUN DEBRIEF.');
    }
  }

  function clearDynamicUI() {
    if (runtime.ui.mappingHost && runtime.ui.mappingHost.parentNode) {
      runtime.ui.mappingHost.parentNode.removeChild(runtime.ui.mappingHost);
    }
    runtime.ui.mappingHost = null;
  }

  function renderSubstitutionMappingUI(shell) {
    clearDynamicUI();
    var panel = document.getElementById('action-panel');
    if (!panel) {
      return;
    }

    var host = document.createElement('div');
    host.id = 'sub-map-ui';
    host.style.marginTop = '8px';
    host.style.padding = '8px';
    host.style.border = '1px solid rgba(255,255,255,0.15)';
    host.style.borderRadius = '6px';
    host.style.background = 'rgba(2,6,23,0.5)';

    var title = document.createElement('div');
    title.textContent = 'Letter Mapping UI';
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';
    host.appendChild(title);

    var letters = uniqueCipherLetters(SUB_CIPHERTEXT);
    for (var i = 0; i < letters.length; i++) {
      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.style.marginBottom = '4px';

      var tag = document.createElement('span');
      tag.textContent = letters[i] + ' ->';
      tag.style.width = '48px';

      var input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.dataset.cipherLetter = letters[i];
      input.style.width = '42px';
      input.style.textTransform = 'uppercase';
      input.autocomplete = 'off';

      row.appendChild(tag);
      row.appendChild(input);
      host.appendChild(row);
    }

    var applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.textContent = 'Apply Mapping';
    applyBtn.style.marginTop = '6px';
    applyBtn.addEventListener('click', function () {
      var inputs = host.querySelectorAll('input[data-cipher-letter]');
      runtime.level2Mappings = {};
      for (var j = 0; j < inputs.length; j++) {
        var cipherLetter = String(inputs[j].dataset.cipherLetter || '').toUpperCase();
        var plainLetter = String(inputs[j].value || '').trim().toUpperCase();
        if (cipherLetter && plainLetter && plainLetter >= 'A' && plainLetter <= 'Z') {
          runtime.level2Mappings[cipherLetter] = plainLetter;
        }
      }
      var guess = decryptWithReverseMap(SUB_CIPHERTEXT, runtime.level2Mappings);
      shell.appendOut('[MAP] Current decryption: ' + guess);
      if (guess === SUB_PLAINTEXT) {
        completeCurrentLevel(shell, 170, 'Substitution mapping solved');
      } else {
        var fixed = Object.keys(runtime.level2Mappings).length;
        shell.appendOut('[MAP] ' + fixed + ' mappings set. Continue refining.');
      }
    });
    host.appendChild(applyBtn);

    panel.appendChild(host);
    runtime.ui.mappingHost = host;
  }

  function uniqueCipherLetters(text) {
    var set = {};
    var letters = [];
    var upper = String(text || '').toUpperCase();
    for (var i = 0; i < upper.length; i++) {
      var ch = upper[i];
      if (ch >= 'A' && ch <= 'Z' && !set[ch]) {
        set[ch] = true;
        letters.push(ch);
      }
    }
    letters.sort();
    return letters;
  }

  function parseRotorInput(raw) {
    var normalized = String(raw || '').replace(/,/g, ' ').trim();
    var chunks = normalized.split(/\s+/);
    if (chunks.length !== 3) {
      return null;
    }
    var values = [];
    for (var i = 0; i < chunks.length; i++) {
      if (!/^\d+$/.test(chunks[i])) {
        return null;
      }
      var n = Number(chunks[i]);
      if (n < 0 || n > 25) {
        return null;
      }
      values.push(n);
    }
    return values;
  }

  function parseFactors(raw) {
    var text = String(raw || '').toUpperCase().replace(/,/g, ' ').replace(/=/g, ' ');
    var nums = text.match(/\d+/g);
    if (!nums || nums.length < 2) {
      return null;
    }
    return [Number(nums[0]), Number(nums[1])];
  }

  function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return !false;
    if (n % 2 === 0 || n % 3 === 0) return false;
    var i = 5;
    while (i * i <= n) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
      i += 6;
    }
    return !false;
  }

  function completeCurrentLevel(shell, points, reason) {
    appendScore(points, reason, shell);
    if (shell.levelState && !shell.levelState.completed) {
      shell.levelState.taskIdx = shell.levelState.tasks.length;
      shell.onLevelTasksComplete();
    }
  }

  function updateFailureCounter(level) {
    var key = 'L' + level;
    runtime.inputAttempts[key] = (runtime.inputAttempts[key] || 0) + 1;
    return runtime.inputAttempts[key];
  }

  function getSubstitutionExpectedReverseMap() {
    var reverse = {};
    var plainLetters = Object.keys(SUB_MAP);
    for (var i = 0; i < plainLetters.length; i++) {
      reverse[SUB_MAP[plainLetters[i]]] = plainLetters[i];
    }
    return reverse;
  }

  function evaluateLevelOne(input, shell) {
    var normalized = input.trim().toUpperCase();
    if (normalized === CAESAR_PLAINTEXT) {
      completeCurrentLevel(shell, 120, 'Caesar decrypted');
      return;
    }
    updateFailureCounter(1);
    HabibiProgression.logFailure(GAME_ID, 1, 'caesar_fail', shell.state);
    shell.appendOut('[FAIL] Incorrect plaintext for Level 1.');
    shell.appendOut('[HINT] Frequency snapshot ' + topFrequencyHints(CAESAR_CIPHERTEXT, 4));
    shell.appendOut('[HINT] "URYYB" often rotates into a common greeting.');
  }

  function evaluateLevelTwo(input, shell) {
    var normalized = input.trim().toUpperCase();
    var expectedReverse = getSubstitutionExpectedReverseMap();
    var inferred = decryptWithReverseMap(SUB_CIPHERTEXT, expectedReverse);

    if (normalized === SUB_PLAINTEXT || normalized === inferred) {
      completeCurrentLevel(shell, 170, 'Substitution plaintext recovered');
      return;
    }

    if (/^MAP\s+[A-Z]\s*=\s*[A-Z]$/.test(normalized)) {
      var parts = normalized.replace(/^MAP\s+/, '').split('=');
      var cipherLetter = parts[0].trim();
      var plainLetter = parts[1].trim();
      runtime.level2Mappings[cipherLetter] = plainLetter;
      var guess = decryptWithReverseMap(SUB_CIPHERTEXT, runtime.level2Mappings);
      shell.appendOut('[MAP] ' + cipherLetter + ' -> ' + plainLetter + ' set');
      shell.appendOut('[MAP] Current decryption: ' + guess);
      if (guess === SUB_PLAINTEXT) {
        completeCurrentLevel(shell, 170, 'Substitution solved from incremental mapping');
      }
      return;
    }

    updateFailureCounter(2);
    HabibiProgression.logFailure(GAME_ID, 2, 'sub_fail', shell.state);
    shell.appendOut('[FAIL] Plaintext or mapping not yet valid.');
    shell.appendOut('[HINT] Most common symbol in ciphertext is ' + topFrequencyHints(SUB_CIPHERTEXT, 1) + '.');
    shell.appendOut('[HINT] You can type: MAP K=S');
  }

  function evaluateLevelThree(input, shell) {
    var rotors = parseRotorInput(input);
    if (!rotors) {
      shell.appendOut('[FAIL] Enter three integers 0-25, example: 7 14 3');
      return;
    }

    var correctCount = 0;
    for (var i = 0; i < 3; i++) {
      if (rotors[i] === ENIGMA_TARGET[i]) {
        correctCount++;
      }
    }

    if (correctCount === 3) {
      var elapsedSec = Math.max(1, Math.floor((Date.now() - runtime.levelStartMs) / 1000));
      var speedBonus = Math.max(20, 140 - elapsedSec);
      completeCurrentLevel(shell, 150 + speedBonus, 'Enigma rotors aligned');
      return;
    }

    updateFailureCounter(3);
    HabibiProgression.logFailure(GAME_ID, 3, 'rotor_fail', shell.state);
    shell.appendOut('[FAIL] ' + correctCount + ' of 3 rotors are correct.');
    shell.appendOut('[HINT] Target values are constrained by leaked operator notebook ranges.');
  }

  function evaluateLevelFour(input, shell) {
    var normalized = input.trim().toUpperCase();
    if (runtime.rsaPhase === 'factor') {
      var factors = parseFactors(normalized);
      if (!factors) {
        shell.appendOut('[FAIL] Submit P and Q values, example: P=61 Q=53');
        return;
      }

      var p = factors[0];
      var q = factors[1];
      var validProduct = p * q === RSA_N;
      var validPrimePair = isPrime(p) && isPrime(q);
      var isTargetPair = (p === RSA_P && q === RSA_Q) || (p === RSA_Q && q === RSA_P);

      if (validProduct && validPrimePair && isTargetPair) {
        runtime.rsaPhase = 'private';
        appendScore(120, 'RSA modulus factored', shell);
        shell.appendOut('[RSA] Factors accepted. Now submit private exponent D.');
        shell.setTaskText('Level 4: submit D for N=3233');
        return;
      }

      updateFailureCounter(4);
      HabibiProgression.logFailure(GAME_ID, 4, 'rsa_factor_fail', shell.state);
      shell.appendOut('[FAIL] Incorrect factors for N=3233.');
      shell.appendOut('[HINT] Valid factors must both be prime and multiply to 3233.');
      return;
    }

    var dValue = Number(normalized.replace(/[^\d]/g, ''));
    if (dValue === RSA_D) {
      completeCurrentLevel(shell, 190, 'RSA private exponent recovered');
      return;
    }

    updateFailureCounter(4);
    HabibiProgression.logFailure(GAME_ID, 4, 'rsa_d_fail', shell.state);
    shell.appendOut('[FAIL] D value incorrect.');
    shell.appendOut('[HINT] Expected D corresponds to e=17 with phi=(61-1)*(53-1).');
  }

  function evaluateLevelFive(input, shell) {
    var normalized = input.trim().toUpperCase();
    if (normalized === 'RUN DEBRIEF' || normalized === 'DEBRIEF') {
      shell.runEpilogue();
      return;
    }
    shell.appendOut('[TASK] Type RUN DEBRIEF to complete the module.');
  }

  function processCipherInput(shell, level) {
    var inputEl = document.getElementById('term-in');
    if (!inputEl) {
      return;
    }
    var raw = inputEl.value;
    if (!raw || !raw.trim()) {
      return;
    }
    inputEl.value = '';
    shell.appendOut('> ' + raw);

    if (runtime.skill.active) {
      processSkillInput(shell, raw);
      return;
    }

    if (level === 1) {
      evaluateLevelOne(raw, shell);
      return;
    }
    if (level === 2) {
      evaluateLevelTwo(raw, shell);
      return;
    }
    if (level === 3) {
      evaluateLevelThree(raw, shell);
      return;
    }
    if (level === 4) {
      evaluateLevelFour(raw, shell);
      return;
    }
    evaluateLevelFive(raw, shell);
  }

  function hookCipherInputForm(shell) {
    var form = document.getElementById('term-form');
    if (!form) {
      return;
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      processCipherInput(shell, shell.state.currentLevel);
    }, true);
  }

  function startRotorRoulette(shell) {
    var rounds = 5;
    var targets = [];
    for (var i = 0; i < rounds; i++) {
      targets.push([randInt(0, 25), randInt(0, 25), randInt(0, 25)]);
    }
    runtime.skill.active = {
      id: 'rotorRoulette',
      startMs: Date.now(),
      rounds: rounds,
      targets: targets,
      idx: 0,
      misses: 0
    };
    shell.appendOut('[SKILL:Rotor Roulette] Timed rotor lock. Enter triplets like "3 11 22".');
    shell.appendOut('[SKILL:Rotor Roulette] Target 1/' + rounds + ': ' + targets[0].join(' '));
    shell.setTaskText('Skill: Rotor Roulette in progress');
  }

  function startFrequencyMaster(shell) {
    var challenges = [
      { text: 'QEB NRFZH YOLTK CLU GRJMP LSBO QEB IXWV ALD', answer: 'B' },
      { text: 'KHOOR ZRUOG KHOOR ZRUOG WKH VLJQDO LV EDFN', answer: 'O' },
      { text: 'L ORYH FUBSWRJUDSKB EXW IUU YRXQG PDMRU FKV', answer: 'R' },
      { text: 'SVOOLW VHTXHQFH GHWHFWHG DW WKH FRUH VHUYHU', answer: 'H' }
    ];
    runtime.skill.active = {
      id: 'frequencyMaster',
      startMs: Date.now(),
      idx: 0,
      correct: 0,
      prompts: challenges
    };
    shell.appendOut('[SKILL:Frequency Master] Reply with the most frequent letter in each line.');
    shell.appendOut('[SKILL:Frequency Master] Sample 1/' + challenges.length + ': ' + challenges[0].text);
    shell.setTaskText('Skill: Frequency Master in progress');
  }

  function startRsaSprint(shell) {
    var cases = [
      { n: 299, p: 13, q: 23 },
      { n: 437, p: 19, q: 23 },
      { n: 713, p: 23, q: 31 },
      { n: 851, p: 23, q: 37 }
    ];
    runtime.skill.active = {
      id: 'rsaSprint',
      startMs: Date.now(),
      idx: 0,
      misses: 0,
      cases: cases
    };
    shell.appendOut('[SKILL:RSA Sprint] Factor each N quickly. Input format: "p q"');
    shell.appendOut('[SKILL:RSA Sprint] N=' + cases[0].n + ' (1/' + cases.length + ')');
    shell.setTaskText('Skill: RSA Sprint in progress');
  }

  function processSkillInput(shell, raw) {
    var skill = runtime.skill.active;
    if (!skill) {
      return;
    }
    if (skill.id === 'rotorRoulette') {
      var rotors = parseRotorInput(raw);
      if (!rotors) {
        shell.appendOut('[SKILL] Enter exactly 3 rotor numbers.');
        skill.misses++;
        return;
      }
      var target = skill.targets[skill.idx];
      if (rotors[0] === target[0] && rotors[1] === target[1] && rotors[2] === target[2]) {
        skill.idx++;
        if (skill.idx >= skill.rounds) {
          finishRotorRoulette(shell, skill);
        } else {
          shell.appendOut('[SKILL] Correct. Next target ' + (skill.idx + 1) + '/' + skill.rounds + ': ' + skill.targets[skill.idx].join(' '));
        }
      } else {
        skill.misses++;
        shell.appendOut('[SKILL] Miss. Expected target was ' + target.join(' ') + '. Retry same target.');
      }
      return;
    }

    if (skill.id === 'frequencyMaster') {
      var ans = String(raw || '').trim().toUpperCase();
      if (ans.length !== 1 || ans < 'A' || ans > 'Z') {
        shell.appendOut('[SKILL] Submit one letter A-Z.');
        return;
      }
      var prompt = skill.prompts[skill.idx];
      if (ans === prompt.answer) {
        skill.correct++;
      }
      skill.idx++;
      if (skill.idx >= skill.prompts.length) {
        finishFrequencyMaster(shell, skill);
      } else {
        shell.appendOut('[SKILL] Sample ' + (skill.idx + 1) + '/' + skill.prompts.length + ': ' + skill.prompts[skill.idx].text);
      }
      return;
    }

    if (skill.id === 'rsaSprint') {
      var factors = parseFactors(raw);
      if (!factors) {
        shell.appendOut('[SKILL] Submit two integers.');
        skill.misses++;
        return;
      }
      var item = skill.cases[skill.idx];
      var okPair = (factors[0] === item.p && factors[1] === item.q) || (factors[0] === item.q && factors[1] === item.p);
      if (!okPair) {
        skill.misses++;
        shell.appendOut('[SKILL] Incorrect factors for N=' + item.n + '. Try again.');
        return;
      }
      skill.idx++;
      if (skill.idx >= skill.cases.length) {
        finishRsaSprint(shell, skill);
      } else {
        shell.appendOut('[SKILL] Correct. Next N=' + skill.cases[skill.idx].n + ' (' + (skill.idx + 1) + '/' + skill.cases.length + ')');
      }
    }
  }

  function finishRotorRoulette(shell, skill) {
    var elapsedSec = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var challengeScore = Math.max(0, 1000 - elapsedSec * 25 - skill.misses * 40);
    shell.submitScore('rotorRoulette', challengeScore);
    shell.appendOut('[SKILL:Rotor Roulette] time=' + elapsedSec + 's misses=' + skill.misses + ' score=' + challengeScore);
    runtime.skill.active = null;
    shell.setTaskText('Skill complete: Rotor Roulette');
  }

  function finishFrequencyMaster(shell, skill) {
    var total = skill.prompts.length;
    var accuracy = skill.correct / total;
    var elapsedSec = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var challengeScore = Math.max(0, Math.floor(accuracy * 900) - elapsedSec * 10);
    shell.submitScore('frequencyMaster', challengeScore);
    shell.appendOut('[SKILL:Frequency Master] accuracy=' + Math.round(accuracy * 100) + '% score=' + challengeScore);
    runtime.skill.active = null;
    shell.setTaskText('Skill complete: Frequency Master');
  }

  function finishRsaSprint(shell, skill) {
    var elapsedSec = Math.max(1, Math.floor((Date.now() - skill.startMs) / 1000));
    var challengeScore = Math.max(0, 1100 - elapsedSec * 30 - skill.misses * 55);
    shell.submitScore('rsaSprint', challengeScore);
    shell.appendOut('[SKILL:RSA Sprint] time=' + elapsedSec + 's misses=' + skill.misses + ' score=' + challengeScore);
    runtime.skill.active = null;
    shell.setTaskText('Skill complete: RSA Sprint');
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function buildScene(engine, level, shell) {
    if (engine.clearPhysics) {
      engine.clearPhysics();
    }
    meshes = [];
    clearDynamicUI();

    engine.addFloor(16, 16, 0x0f172a);
    var hub = engine.addBox(0, 0.5, 0, 1.8, 0.8, 1.8, 0x1e1b4b, 0);
    hub.material.emissive = new THREE.Color(0x4338ca);
    hub.material.emissiveIntensity = 0.22;
    meshes.push(hub);

    for (var i = 0; i < 6 + level; i++) {
      var orb = engine.addBox(
        (Math.random() - 0.5) * 8,
        1.2 + Math.random() * 1.2,
        (Math.random() - 0.5) * 8,
        0.32,
        0.32,
        0.32,
        0x0ea5e9,
        0.4
      );
      orb.userData.particle = true;
      meshes.push(orb);
    }

    if (level >= 2 && engine.addPhysicsSphere) {
      for (var s = 0; s < 3 + level; s++) {
        var ph = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 5,
          2.0 + Math.random() * 2.5,
          (Math.random() - 0.5) * 5,
          0.1 + Math.random() * 0.08,
          0xf59e0b,
          0.6
        );
        meshes.push(ph);
      }
    }

    setInputMode(level <= 4);
    appendStory(shell, level);
    announceLevelPrompt(shell, level);
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE CIPHER',
    achievementId: 'cipher_master',
    leaderboardChallenge: 'rotorRoulette',
    engine: { bg: 0x090c1a, physics: true },
    moveSpeed: 2.4,
    buildScene: buildScene,
    levels: {
      1: {
        name: 'Caesar Intercept',
        hint: 'Decrypt URYYB JBEYQ',
        tasks: [
          { id: 'L1_caesar', hint: 'Decode ciphertext through terminal input', cmd: 'HELLO WORLD', errorType: 'wrong_command' }
        ],
        branch: {
          title: 'Branch: Relay Attribution',
          desc: 'Choose how to tag the recovered Caesar sender profile.',
          options: [
            { id: 'branch_l1_lowtier', label: 'Mark as low-tier nuisance actor' },
            { id: 'branch_l1_proxy', label: 'Treat as proxy for larger crew' },
            { id: 'branch_l1_falseflag', label: 'Flag possible deception traffic' },
            { id: 'branch_l1_hunt', label: 'Prioritize infrastructure hunt' },
            { id: 'branch_l1_sinkhole', label: 'Prepare sinkhole operation' }
          ]
        }
      },
      2: {
        name: 'Substitution Forensics',
        hint: 'Recover substituted plaintext',
        timeLimit: 300,
        tasks: [
          { id: 'L2_sub', hint: 'Solve via input or mapping UI', cmd: SUB_PLAINTEXT, errorType: 'wrong_command' }
        ],
        branch: {
          title: 'Branch: Exposure Strategy',
          desc: 'Choose whether to expose observed plaintext behavior now or continue silent collection.',
          options: [
            { id: 'branch_l2_notify', label: 'Notify blue team immediately' },
            { id: 'branch_l2_shadow', label: 'Stay dark and collect more samples' },
            { id: 'branch_l2_honeypot', label: 'Seed honeypot with fake plaintext' },
            { id: 'branch_l2_alert', label: 'Raise partial executive alert' },
            { id: 'branch_l2_partner', label: 'Share indicators with partner SOC' }
          ]
        }
      },
      3: {
        name: 'Rotor Alignment Drill',
        hint: 'Find rotor tuple',
        timeLimit: 360,
        tasks: [
          { id: 'L3_enigma', hint: 'Input rotor values 0-25', cmd: '7 14 3', errorType: 'wrong_command' }
        ],
        branch: {
          title: 'Branch: Exploitation Choice',
          desc: 'Choose how to use recovered rotor profile intelligence.',
          options: [
            { id: 'branch_l3_replay', label: 'Replay historical traffic for pivots' },
            { id: 'branch_l3_watch', label: 'Monitor for rotor reuse only' },
            { id: 'branch_l3_deceive', label: 'Inject crafted rotor telemetry' },
            { id: 'branch_l3_block', label: 'Block channels tied to rotor profile' },
            { id: 'branch_l3_reverse', label: 'Reverse engineer simulator binary' }
          ]
        }
      },
      4: {
        name: 'RSA Key Recovery',
        hint: 'Factor N and derive D',
        timeLimit: 420,
        tasks: [
          { id: 'L4_rsa', hint: 'Submit factors and private exponent', cmd: 'P=61 Q=53 D=2753', errorType: 'wrong_command' }
        ]
      },
      5: {
        name: 'Cipher Debrief',
        epilogue: true
      }
    },
    skills: [
      {
        id: 'rotorRoulette',
        name: 'Rotor Roulette',
        unlockAfter: 1,
        desc: 'Timed rotor matching challenge.',
        start: startRotorRoulette
      },
      {
        id: 'frequencyMaster',
        name: 'Frequency Master',
        unlockAfter: 2,
        desc: 'Accuracy challenge for letter-frequency analysis.',
        start: startFrequencyMaster
      },
      {
        id: 'rsaSprint',
        name: 'RSA Sprint',
        unlockAfter: 3,
        desc: 'Timed mini-factorization gauntlet.',
        start: startRsaSprint
      }
    ],
    onLevelStart: function (level, shell) {
      runtime.levelStartMs = Date.now();
      runtime.rsaPhase = 'factor';
      runtime.level2Mappings = {};
      clearDynamicUI();
      appendStory(shell, level);
      announceLevelPrompt(shell, level);
    },
    onLevelComplete: function (level, shell) {
      var beat = STORY_BEATS[level];
      if (beat && beat.closing) {
        shell.appendOut('[INTEL] ' + beat.closing);
      }
    }
  };

  config.onTick = function (dt) {
    for (var i = 0; i < meshes.length; i++) {
      var m = meshes[i];
      if (!m || !m.userData) {
        continue;
      }
      if (m.userData.physicsBody && m.userData.physicsBody.mass > 0) {
        continue;
      }
      if (m.userData.particle) {
        m.rotation.x += dt * 0.5;
        m.rotation.y += dt * 0.6;
        m.position.y += Math.sin(Date.now() * 0.0018 + i) * dt * 0.25;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var shell = new HabibiGameShell(config);
    activeShell = shell;
    shell.score = 0;
    shell.updateScore = updateScoreDisplay;
    shell.appendOut = function (text) {
      var el = document.getElementById('action-log');
      if (!el) {
        return;
      }
      el.textContent += text + '\n';
      el.scrollTop = el.scrollHeight;
    };
    shell.setTaskText = function (text) {
      var el = document.getElementById('task-text');
      if (el) {
        el.textContent = text;
      }
    };

    shell.init();
    hookCipherInputForm(shell);
    setInputMode(shell.state.currentLevel <= 4);
    updateScoreDisplay();
  });
})();
