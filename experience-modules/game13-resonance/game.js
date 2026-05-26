/**
 * THE RESONANCE — 3D Experience Module
 * Core concept: detection-rule tuning using threshold + conditions.
 * Mechanics: slider threshold and checkbox conditions validated against sample telemetry.
 */
(function () {
  'use strict';

  var GAME_ID = 'the_resonance';
  var totalScore = 0;
  var meshes = [];
  var uiMounted = false;

  var tuningState = {
    threshold: 72,
    conditions: {
      impossibleTravel: true,
      mfaBypass: true,
      suspiciousAsn: true,
      newDevice: true,
      privilegedAccount: true
    },
    metricsByLevel: {}
  };

  var LEVEL_RULE_TARGETS = {
    1: { minMaliciousRate: 90, maxFalsePositiveRate: 5 },
    2: { minMaliciousRate: 90, maxFalsePositiveRate: 5 },
    3: { minMaliciousRate: 90, maxFalsePositiveRate: 5 },
    4: { minMaliciousRate: 90, maxFalsePositiveRate: 5 }
  };

  var LEVEL_CONFIG = {
    1: {
      name: 'Resonance Channel: Identity Pulse',
      hint: 'Tune first-wave rule for identity-centric intrusions.',
      breachFocus: 'Compromised admin login without MFA challenge',
      sampleSet: [
        { id: 'L1-M01', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L1-M02', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L1-M03', malicious: true, impossibleTravel: true, mfaBypass: false, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L1-M04', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L1-M05', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L1-M06', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: false },
        { id: 'L1-M07', malicious: true, impossibleTravel: true, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L1-M08', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L1-M09', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L1-M10', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L1-B01', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: true },
        { id: 'L1-B02', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: false },
        { id: 'L1-B03', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L1-B04', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L1-B05', malicious: false, impossibleTravel: true, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L1-B06', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L1-B07', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L1-B08', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L1-B09', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L1-B10', malicious: false, impossibleTravel: true, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: true }
      ]
    },
    2: {
      name: 'Resonance Channel: SaaS Token Drift',
      hint: 'Tune OAuth abuse detection with low business friction.',
      breachFocus: 'Malicious OAuth consent with broad delegated scopes',
      sampleSet: [
        { id: 'L2-M01', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L2-M02', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L2-M03', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L2-M04', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L2-M05', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: false },
        { id: 'L2-M06', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L2-M07', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L2-M08', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: false },
        { id: 'L2-M09', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L2-M10', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: false },
        { id: 'L2-B01', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: true },
        { id: 'L2-B02', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: false },
        { id: 'L2-B03', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L2-B04', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L2-B05', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L2-B06', malicious: false, impossibleTravel: true, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: true },
        { id: 'L2-B07', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L2-B08', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L2-B09', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L2-B10', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: false }
      ]
    },
    3: {
      name: 'Resonance Channel: Edge Exploit Echo',
      hint: 'Tune edge compromise detections with accurate prioritization.',
      breachFocus: 'Exploit chain on exposed ADC and rapid DMZ pivot',
      sampleSet: [
        { id: 'L3-M01', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L3-M02', malicious: true, impossibleTravel: true, mfaBypass: false, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L3-M03', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L3-M04', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L3-M05', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L3-M06', malicious: true, impossibleTravel: true, mfaBypass: false, suspiciousAsn: true, newDevice: true, privilegedAccount: false },
        { id: 'L3-M07', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn:true, newDevice: false, privilegedAccount: true },
        { id: 'L3-M08', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L3-M09', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: false },
        { id: 'L3-M10', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: false },
        { id: 'L3-B01', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: true },
        { id: 'L3-B02', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: false },
        { id: 'L3-B03', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L3-B04', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L3-B05', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L3-B06', malicious: false, impossibleTravel: true, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L3-B07', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L3-B08', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L3-B09', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L3-B10', malicious: false, impossibleTravel: true, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: true }
      ]
    },
    4: {
      name: 'Resonance Channel: Supply Chain Frequency',
      hint: 'Tune trusted-vendor abuse detection with precision.',
      breachFocus: 'RMM abuse from over-trusted third-party integration',
      sampleSet: [
        { id: 'L4-M01', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L4-M02', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L4-M03', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L4-M04', malicious: true, impossibleTravel: true, mfaBypass: false, suspiciousAsn: true, newDevice: true, privilegedAccount: true },
        { id: 'L4-M05', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L4-M06', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: false },
        { id: 'L4-M07', malicious: true, impossibleTravel: true, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L4-M08', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L4-M09', malicious: true, impossibleTravel: false, mfaBypass: true, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L4-M10', malicious: true, impossibleTravel: true, mfaBypass: true, suspiciousAsn: true, newDevice: true, privilegedAccount: false },
        { id: 'L4-B01', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: true },
        { id: 'L4-B02', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: false },
        { id: 'L4-B03', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L4-B04', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L4-B05', malicious: false, impossibleTravel: true, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L4-B06', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: false },
        { id: 'L4-B07', malicious: false, impossibleTravel: false, mfaBypass: true, suspiciousAsn: false, newDevice: true, privilegedAccount: false },
        { id: 'L4-B08', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: true, newDevice: false, privilegedAccount: true },
        { id: 'L4-B09', malicious: false, impossibleTravel: false, mfaBypass: false, suspiciousAsn: false, newDevice: true, privilegedAccount: true },
        { id: 'L4-B10', malicious: false, impossibleTravel: true, mfaBypass: false, suspiciousAsn: false, newDevice: false, privilegedAccount: true }
      ]
    },
    5: {
      name: 'Final Resonance: Master Channel',
      epilogue: true
    }
  };

  var STORY_BEATS = {
    1: {
      opening: 'Resonance chamber online. Identity pulse dataset includes impossible travel and MFA bypass traces.',
      beat1: 'Threat intel: actor reused known bulletproof ASN ranges during privileged sign-ins.',
      beat2: 'SOC archive: false positives previously spiked when thresholds were too permissive.',
      beat3: 'Objective: maximize malicious capture while keeping analyst queue clean.',
      closing: 'Identity pulse tuned and archived.'
    },
    2: {
      opening: 'SaaS token drift channel engaged. OAuth-consent abuse now appears as legitimate API traffic.',
      beat1: 'Threat intel: delegated scope inflation correlates with refresh-token persistence campaigns.',
      beat2: 'SOC archive: passwords were reset, yet unauthorized Graph API reads continued.',
      beat3: 'Objective: tune for token abuse signatures with minimal business-user noise.',
      closing: 'SaaS token drift tuned and archived.'
    },
    3: {
      opening: 'Edge exploit echo channel engaged. Public ADC exploitation emits high-velocity telemetry clusters.',
      beat1: 'Threat intel: exploit probes precede shell drops by under two minutes.',
      beat2: 'SOC archive: low-severity auto-close rules hid actionable edge compromise signals.',
      beat3: 'Objective: tighten detections to elevate real edge intrusions quickly.',
      closing: 'Edge exploit echo tuned and archived.'
    },
    4: {
      opening: 'Supply chain frequency channel engaged. Trusted RMM pathways can carry hostile automation.',
      beat1: 'Threat intel: signed-vs-unsigned script divergence predicted lateral deployment risk.',
      beat2: 'SOC archive: overbroad vendor privileges amplified blast radius.',
      beat3: 'Objective: detect partner-origin abuse while preserving legitimate operations.',
      closing: 'Supply chain frequency tuned and archived.'
    },
    5: {
      opening: 'Master channel opened. Resonance profiles from prior incidents merge into final doctrine.',
      beat1: 'Curator note: rule quality is measured by both capture and precision.',
      beat2: 'Curator note: high recall without precision burns analyst trust.',
      beat3: 'Curator note: high precision without recall misses adversaries.',
      closing: 'Resonance doctrine finalized.'
    }
  };

  function appendLog(text) {
    var el = document.getElementById('action-log');
    if (!el) {
      return;
    }
    el.textContent += text + '\n';
    el.scrollTop = el.scrollHeight;
  }

  function updateHud() {
    var el = document.getElementById('hud-score');
    if (el) {
      el.textContent = 'SCORE ' + totalScore;
    }
  }

  function setTaskText(text) {
    var task = document.getElementById('task-text');
    if (task) {
      task.textContent = text;
    }
  }

  function getSeverityScore(event, selectedConditions) {
    var weights = {
      impossibleTravel: 22,
      mfaBypass: 28,
      suspiciousAsn: 19,
      newDevice: 14,
      privilegedAccount: 17
    };
    var score = 0;
    var keys = Object.keys(selectedConditions);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (selectedConditions[key] && event[key]) {
        score += weights[key];
      }
    }
    return score;
  }

  function evaluateRuleAgainstSampleSet(level, threshold, selectedConditions) {
    var sampleSet = LEVEL_CONFIG[level].sampleSet;
    var stats = {
      totalMalicious: 0,
      totalBenign: 0,
      detectedMalicious: 0,
      falsePositives: 0,
      detectedIds: [],
      missedIds: [],
      falsePositiveIds: []
    };

    for (var i = 0; i < sampleSet.length; i++) {
      var event = sampleSet[i];
      var score = getSeverityScore(event, selectedConditions);
      var hit = score >= threshold;
      if (event.malicious) {
        stats.totalMalicious++;
        if (hit) {
          stats.detectedMalicious++;
          stats.detectedIds.push(event.id);
        } else {
          stats.missedIds.push(event.id);
        }
      } else {
        stats.totalBenign++;
        if (hit) {
          stats.falsePositives++;
          stats.falsePositiveIds.push(event.id);
        }
      }
    }

    stats.maliciousHitRate = stats.totalMalicious === 0 ? 0 : (stats.detectedMalicious / stats.totalMalicious) * 100;
    stats.falsePositiveRate = stats.totalBenign === 0 ? 0 : (stats.falsePositives / stats.totalBenign) * 100;
    return stats;
  }

  function deepCopyConditions(conditions) {
    return {
      impossibleTravel: !!conditions.impossibleTravel,
      mfaBypass: !!conditions.mfaBypass,
      suspiciousAsn: !!conditions.suspiciousAsn,
      newDevice: !!conditions.newDevice,
      privilegedAccount: !!conditions.privilegedAccount
    };
  }

  function formatPct(n) {
    return n.toFixed(1) + '%';
  }

  function narrateLevel(level, shell) {
    var beat = STORY_BEATS[level];
    if (!beat || !shell) {
      return;
    }
    shell.appendOut('[NARRATIVE] ' + beat.opening);
    shell.appendOut('[NARRATIVE] ' + beat.beat1);
    shell.appendOut('[NARRATIVE] ' + beat.beat2);
    shell.appendOut('[NARRATIVE] ' + beat.beat3);
  }

  function renderTuningControls(shell, level) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';
    uiMounted = true;

    if (LEVEL_CONFIG[level].epilogue) {
      var debriefBtn = document.createElement('button');
      debriefBtn.type = 'button';
      debriefBtn.className = 'act-btn';
      debriefBtn.textContent = 'Begin Debrief';
      debriefBtn.onclick = function () {
        shell.runEpilogue();
      };
      wrap.appendChild(debriefBtn);
      return;
    }

    var title = document.createElement('div');
    title.className = 'phase-title';
    title.textContent = 'RULE TUNING CONSOLE';
    wrap.appendChild(title);

    var thresholdLabel = document.createElement('label');
    thresholdLabel.textContent = 'Alert Threshold: ';
    thresholdLabel.style.display = 'block';
    thresholdLabel.style.marginBottom = '6px';

    var thresholdValue = document.createElement('span');
    thresholdValue.id = 'res-threshold-value';
    thresholdValue.textContent = String(tuningState.threshold);
    thresholdLabel.appendChild(thresholdValue);
    wrap.appendChild(thresholdLabel);

    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '40';
    slider.max = '100';
    slider.step = '1';
    slider.value = String(tuningState.threshold);
    slider.style.width = '100%';
    slider.oninput = function () {
      tuningState.threshold = parseInt(slider.value, 10);
      thresholdValue.textContent = String(tuningState.threshold);
    };
    wrap.appendChild(slider);

    var conditionsTitle = document.createElement('div');
    conditionsTitle.textContent = 'Rule Conditions';
    conditionsTitle.style.marginTop = '10px';
    conditionsTitle.style.marginBottom = '6px';
    wrap.appendChild(conditionsTitle);

    var keys = Object.keys(tuningState.conditions);
    for (var i = 0; i < keys.length; i++) {
      (function (key) {
        var row = document.createElement('label');
        row.style.display = 'block';
        row.style.marginBottom = '4px';

        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!tuningState.conditions[key];
        cb.onchange = function () {
          tuningState.conditions[key] = cb.checked;
        };
        row.appendChild(cb);

        var text = document.createTextNode(' ' + key.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); }));
        row.appendChild(text);
        wrap.appendChild(row);
      })(keys[i]);
    }

    var analyzeBtn = document.createElement('button');
    analyzeBtn.type = 'button';
    analyzeBtn.className = 'act-btn';
    analyzeBtn.textContent = 'Analyze Rule';
    analyzeBtn.onclick = function () {
      runEvaluation(shell, level, false);
    };
    wrap.appendChild(analyzeBtn);

    var submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'act-btn';
    submitBtn.textContent = 'Submit Tuning';
    submitBtn.onclick = function () {
      runEvaluation(shell, level, true);
    };
    wrap.appendChild(submitBtn);

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'act-btn secondary';
    resetBtn.textContent = 'Reset Preset';
    resetBtn.onclick = function () {
      tuningState.threshold = 72;
      tuningState.conditions.impossibleTravel = true;
      tuningState.conditions.mfaBypass = true;
      tuningState.conditions.suspiciousAsn = true;
      tuningState.conditions.newDevice = true;
      tuningState.conditions.privilegedAccount = true;
      renderTuningControls(shell, level);
      shell.appendOut('[SYSTEM] Resonance preset restored.');
    };
    wrap.appendChild(resetBtn);
  }

  function runEvaluation(shell, level, commitIfPassing) {
    var selected = deepCopyConditions(tuningState.conditions);
    var activeCount = 0;
    var keys = Object.keys(selected);
    for (var i = 0; i < keys.length; i++) {
      if (selected[keys[i]]) {
        activeCount++;
      }
    }
    if (activeCount < 3) {
      shell.appendOut('[FAIL] At least 3 conditions must be active to avoid trivial underfitting.');
      return;
    }

    var stats = evaluateRuleAgainstSampleSet(level, tuningState.threshold, selected);
    var target = LEVEL_RULE_TARGETS[level];
    var pass = stats.maliciousHitRate > target.minMaliciousRate && stats.falsePositiveRate < target.maxFalsePositiveRate;

    shell.appendOut('[EVAL] Threshold=' + tuningState.threshold + ', ActiveConditions=' + activeCount);
    shell.appendOut('[EVAL] Malicious hit rate: ' + formatPct(stats.maliciousHitRate) + ' (target > ' + target.minMaliciousRate + '%)');
    shell.appendOut('[EVAL] False positive rate: ' + formatPct(stats.falsePositiveRate) + ' (target < ' + target.maxFalsePositiveRate + '%)');
    shell.appendOut('[EVAL] Detected malicious: ' + stats.detectedMalicious + '/' + stats.totalMalicious + ', False positives: ' + stats.falsePositives + '/' + stats.totalBenign);

    if (!pass) {
      if (stats.maliciousHitRate <= target.minMaliciousRate) {
        shell.appendOut('[TUTOR] Detection recall too low. Lower threshold or include a missing high-signal condition.');
      }
      if (stats.falsePositiveRate >= target.maxFalsePositiveRate) {
        shell.appendOut('[TUTOR] False positives too high. Increase threshold or disable weaker condition combinations.');
      }
      if (stats.missedIds.length > 0) {
        shell.appendOut('[INTEL] Missed malicious sample IDs: ' + stats.missedIds.join(', '));
      }
      if (stats.falsePositiveIds.length > 0) {
        shell.appendOut('[INTEL] False positive sample IDs: ' + stats.falsePositiveIds.join(', '));
      }
      if (commitIfPassing) {
        var penalty = 55 + level * 10;
        totalScore = Math.max(0, totalScore - penalty);
        updateHud();
        HabibiProgression.logFailure(GAME_ID, level, 'bad_tuning', shell.state);
        shell.appendOut('[SCORE] -' + penalty + ' for submitting non-compliant tuning.');
      }
      setTaskText('Tune for >90% malicious hits and <5% false positives before submission.');
      return;
    }

    tuningState.metricsByLevel[level] = {
      threshold: tuningState.threshold,
      conditions: selected,
      maliciousHitRate: stats.maliciousHitRate,
      falsePositiveRate: stats.falsePositiveRate,
      detectedMalicious: stats.detectedMalicious,
      falsePositives: stats.falsePositives
    };

    shell.appendOut('[SUCCESS] Rule profile satisfies resonance constraints.');
    shell.appendOut('[INTEL] Captured malicious sample IDs: ' + stats.detectedIds.join(', '));

    if (commitIfPassing) {
      var awarded = 260 + level * 35;
      totalScore += awarded;
      updateHud();
      shell.appendOut('[SCORE] +' + awarded + ' for production-grade tuning.');
      shell.appendOut('[CLOSING] ' + STORY_BEATS[level].closing);
      shell.onLevelTasksComplete();
    } else {
      setTaskText('Analysis passes. Submit tuning to lock this level.');
    }
  }

  function buildScene(engine, level, shell) {
    if (engine.clearPhysics) {
      engine.clearPhysics();
    }
    meshes = [];

    engine.addFloor(16, 16, 0x0f172a);
    var core = engine.addBox(0, 0.5, 0, 1.2, 1.0, 1.2, 0x111827, 0);
    core.material.emissive = new THREE.Color(0x1e1b4b);
    core.material.emissiveIntensity = 0.35;
    meshes.push(core);

    var panelCount = 6 + level;
    for (var i = 0; i < panelCount; i++) {
      var x = -4 + i * 1.1;
      var y = 1.2 + (i % 3) * 0.2;
      var z = -2 + (i % 2) * 1.6;
      var panel = engine.addBox(x, y, z, 0.6, 0.3, 0.1, 0x312e81 + i * 950, 0.15);
      panel.userData.particle = true;
      meshes.push(panel);
    }

    if (engine.addPhysicsSphere && level >= 2) {
      for (var s = 0; s < 2 + level; s++) {
        var orb = engine.addPhysicsSphere(
          (Math.random() - 0.5) * 6,
          2.5 + Math.random() * 1.6,
          (Math.random() - 0.5) * 6,
          0.15,
          0x22d3ee,
          0.4
        );
        meshes.push(orb);
      }
    }

    narrateLevel(level, shell);
    if (!LEVEL_CONFIG[level].epilogue) {
      shell.appendOut('[INTEL] Breach focus: ' + LEVEL_CONFIG[level].breachFocus);
      shell.appendOut('[INTEL] Adjust threshold and conditions, then submit a compliant profile.');
      setTaskText('Tune rule: malicious hits >90% and false positives <5%.');
    } else {
      setTaskText('Master channel ready for debrief.');
    }
    renderTuningControls(shell, level);
  }

  function levelPassRecorded(level) {
    var metric = tuningState.metricsByLevel[level];
    if (!metric) {
      return false;
    }
    return metric.maliciousHitRate > 90 && metric.falsePositiveRate < 5;
  }

  function startSpeedTrial(shell) {
    var score = 350;
    for (var lvl = 1; lvl <= 4; lvl++) {
      if (levelPassRecorded(lvl)) {
        score += 120;
      }
    }
    shell.submitScore('speedTrial', score);
    shell.appendOut('[SKILL] Resonance speed trial scored ' + score + '.');
  }

  function startAccuracyGauntlet(shell) {
    var score = 1000;
    for (var lvl = 1; lvl <= 4; lvl++) {
      var metric = tuningState.metricsByLevel[lvl];
      if (!metric) {
        score -= 160;
        continue;
      }
      var hitGap = Math.max(0, 90 - metric.maliciousHitRate);
      var fpGap = Math.max(0, metric.falsePositiveRate - 5);
      score -= Math.round(hitGap * 3 + fpGap * 4);
    }
    score = Math.max(0, score);
    shell.submitScore('accuracyGauntlet', score);
    shell.appendOut('[SKILL] Resonance accuracy gauntlet scored ' + score + '.');
  }

  function startDecisionTree(shell) {
    var score = 0;
    for (var lvl = 1; lvl <= 4; lvl++) {
      var metric = tuningState.metricsByLevel[lvl];
      if (!metric) {
        continue;
      }
      var quality = metric.maliciousHitRate - metric.falsePositiveRate;
      score += Math.round(quality * (4 + lvl));
    }
    shell.submitScore('decisionTree', score);
    shell.appendOut('[TREE] Resonance decision tree scored ' + score + '.');
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE RESONANCE',
    achievementId: 'resonance_master',
    leaderboardChallenge: 'accuracyGauntlet',
    engine: { bg: 0x090b1a, physics: true },
    moveSpeed: 2.4,
    buildScene: buildScene,
    levels: {
      1: {
        name: LEVEL_CONFIG[1].name,
        hint: LEVEL_CONFIG[1].hint,
        tasks: [
          {
            id: 'l1_tuning',
            hint: 'Submit tuning profile above malicious/FP thresholds.',
            errorType: 'wrong_command',
            validate: function () {
              return levelPassRecorded(1);
            },
            output: '[OK] Level 1 tuning validated.'
          }
        ]
      },
      2: {
        name: LEVEL_CONFIG[2].name,
        hint: LEVEL_CONFIG[2].hint,
        tasks: [
          {
            id: 'l2_tuning',
            hint: 'Submit tuning profile above malicious/FP thresholds.',
            errorType: 'wrong_command',
            validate: function () {
              return levelPassRecorded(2);
            },
            output: '[OK] Level 2 tuning validated.'
          }
        ]
      },
      3: {
        name: LEVEL_CONFIG[3].name,
        hint: LEVEL_CONFIG[3].hint,
        tasks: [
          {
            id: 'l3_tuning',
            hint: 'Submit tuning profile above malicious/FP thresholds.',
            errorType: 'wrong_command',
            validate: function () {
              return levelPassRecorded(3);
            },
            output: '[OK] Level 3 tuning validated.'
          }
        ]
      },
      4: {
        name: LEVEL_CONFIG[4].name,
        hint: LEVEL_CONFIG[4].hint,
        tasks: [
          {
            id: 'l4_tuning',
            hint: 'Submit tuning profile above malicious/FP thresholds.',
            errorType: 'wrong_command',
            validate: function () {
              return levelPassRecorded(4);
            },
            output: '[OK] Level 4 tuning validated.'
          }
        ]
      },
      5: {
        name: LEVEL_CONFIG[5].name,
        epilogue: true
      }
    },
    skills: [
      { id: 'speedTrial', name: 'Speed Trial', unlockAfter: 1, desc: 'Reward quick compliant tuning.', start: startSpeedTrial },
      { id: 'accuracyGauntlet', name: 'Accuracy Gauntlet', unlockAfter: 2, desc: 'Reward tight recall/precision performance.', start: startAccuracyGauntlet },
      { id: 'decisionTree', name: 'Decision Tree', unlockAfter: 3, desc: 'Weight tuning by net detection quality.', start: startDecisionTree }
    ],
    onLevelStart: function (level) {
      totalScore += level * 10;
      updateHud();
      if (!LEVEL_CONFIG[level].epilogue) {
        setTaskText('Tune rule: malicious hits >90% and false positives <5%.');
      } else {
        setTaskText('Final resonance archive ready for debrief.');
      }
    },
    onLevelComplete: function (level, shell) {
      if (STORY_BEATS[level]) {
        shell.appendOut('[ARCHIVE] ' + STORY_BEATS[level].closing);
      }
    }
  };

  config.onTick = function (dt) {
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (!mesh || !mesh.userData || !mesh.userData.particle) {
        continue;
      }
      mesh.position.y += Math.sin(Date.now() * 0.0018 + i) * dt * 0.3;
      mesh.rotation.x += dt * 0.2;
      mesh.rotation.y += dt * 0.3;
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

    if (!uiMounted) {
      renderTuningControls(shell, 1);
    }
  });
})();
