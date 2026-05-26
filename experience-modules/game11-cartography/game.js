/**
 * CARTOGRAPHY — 3D Experience Module
 * Core concept: Attribution-led geospatial targeting
 * Mechanic: Raycast-select correct globe region nodes per level data
 */
(function () {
  'use strict';

  var GAME_ID = 'the_cartography';
  var score = 0;
  var regionMeshes = [];
  var globeShell = null;
  var levelStart = 0;

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();

  var REGION_POINTS = {
    north_america: { lat: 41, lon: -98, label: 'North America' },
    western_europe: { lat: 50, lon: 8, label: 'Western Europe' },
    eastern_europe: { lat: 49, lon: 30, label: 'Eastern Europe' },
    russia: { lat: 60, lon: 90, label: 'Russia' },
    middle_east: { lat: 28, lon: 45, label: 'Middle East' },
    east_asia: { lat: 35, lon: 116, label: 'East Asia' },
    southeast_asia: { lat: 12, lon: 106, label: 'Southeast Asia' },
    south_asia: { lat: 21, lon: 79, label: 'South Asia' },
    oceania: { lat: -25, lon: 133, label: 'Oceania' },
    south_america: { lat: -15, lon: -60, label: 'South America' },
    africa_north: { lat: 28, lon: 16, label: 'North Africa' },
    africa_subsaharan: { lat: 0, lon: 20, label: 'Sub-Saharan Africa' }
  };

  var CARTOGRAPHY_LEVELS = {
    1: {
      levelIndex: 1,
      name: 'Origin Spotting',
      hint: 'Select actor origin region based on attribution note.',
      briefing: 'Threat intel reports a spear-phishing campaign linked to a regional actor cluster.',
      attribution: {
        actor: 'Sable Kestrel',
        campaign: 'Invoice Fog',
        ttp: 'Initial access via multilingual finance lures',
        targetSector: 'Manufacturing',
        expectedRegion: 'eastern_europe'
      },
      decoys: ['western_europe', 'russia', 'middle_east'],
      story: {
        opening: 'Analysts disagree between neighboring regions with overlapping infrastructure.',
        beat1: 'Correct origin drives the right intelligence-sharing channel.',
        closing: 'Origin validated; partner SOC receives targeted warning.'
      }
    },
    2: {
      levelIndex: 2,
      name: 'Pivot Region',
      hint: 'Identify infrastructure pivot region used for staging.',
      briefing: 'Botnet staging traffic appears in cloud edge logs with mixed geolocation.',
      attribution: {
        actor: 'Copper Atlas',
        campaign: 'Ghost Relay',
        ttp: 'Compromised VPS chain with short-lived C2 relay',
        targetSector: 'Telecom',
        expectedRegion: 'southeast_asia'
      },
      decoys: ['east_asia', 'south_asia', 'oceania'],
      story: {
        opening: 'Campaign rotates infrastructure every four hours to evade sinkholing.',
        beat1: 'Choosing the right pivot region improves blocklist precision.',
        closing: 'Pivot identified; C2 relay windows collapse after coordinated takedown.'
      },
      timeLimit: 220
    },
    3: {
      levelIndex: 3,
      name: 'Target Expansion',
      hint: 'Select the next predicted impact region from actor pattern.',
      briefing: 'Actor shifts from regional attacks to globally staged supply-chain prepositioning.',
      attribution: {
        actor: 'Helix Lantern',
        campaign: 'Silent Registry',
        ttp: 'Tampered updater packages and signed binary abuse',
        targetSector: 'Healthcare',
        expectedRegion: 'north_america'
      },
      decoys: ['south_america', 'western_europe', 'africa_north'],
      story: {
        opening: 'Historical telemetry shows expansion follows SaaS dependency graph.',
        beat1: 'Predicting next impact zone supports pre-emptive hardening.',
        closing: 'Expansion forecast confirmed. Sector SOCs receive early controls checklist.'
      },
      timeLimit: 240
    },
    4: {
      levelIndex: 4,
      name: 'Attribution Confidence',
      hint: 'Pick region matching full actor-tradecraft confidence model.',
      briefing: 'Final briefing requires high-confidence regional attribution for executive escalation.',
      attribution: {
        actor: 'Night Tracer',
        campaign: 'Aurora Circuit',
        ttp: 'Credential replay plus cloud metadata abuse',
        targetSector: 'Energy',
        expectedRegion: 'middle_east'
      },
      decoys: ['africa_north', 'south_asia', 'eastern_europe'],
      story: {
        opening: 'Board-level response depends on whether attack is regional opportunism or strategic pressure.',
        beat1: 'False region assignment misdirects legal and diplomatic response.',
        closing: 'Confidence threshold exceeded; leadership approves targeted response posture.'
      },
      timeLimit: 260
    },
    5: { name: 'Strategic Brief', epilogue: true }
  };

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

  function addButton(text, handler) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'act-btn';
    btn.textContent = text;
    btn.onclick = handler;
    wrap.appendChild(btn);
  }

  function latLonToVector(lat, lon, radius) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);
    return {
      x: -(radius * Math.sin(phi) * Math.cos(theta)),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  }

  function regionColor(id, expected) {
    if (id === expected) return 0x22c55e;
    return 0x334155;
  }

  function buildRegionMesh(engine, regionId, expected, radius, idx) {
    var p = REGION_POINTS[regionId];
    var pos = latLonToVector(p.lat, p.lon, radius);
    var mesh = engine.addBox(pos.x, pos.y, pos.z, 0.26, 0.26, 0.26, regionColor(regionId, expected), false);
    mesh.userData.regionId = regionId;
    mesh.userData.regionLabel = p.label;
    mesh.material.emissive = new THREE.Color(regionColor(regionId, expected));
    mesh.material.emissiveIntensity = 0.25;
    mesh.material.roughness = 0.35;
    mesh.material.metalness = 0.65;
    mesh.lookAt(0, 0, 0);

    var marker = engine.addPhysicsSphere(pos.x * 1.05, pos.y * 1.05, pos.z * 1.05, 0.08, 0x22d3ee, 0.1);
    marker.userData.particle = true;
    marker.userData.regionId = regionId;
    marker.userData.marker = true;
    marker.userData.phase = idx * 0.8;

    return mesh;
  }

  function refreshRegionVisuals(levelDef, selectedRegion) {
    regionMeshes.forEach(function (mesh) {
      var isSelected = selectedRegion && mesh.userData.regionId === selectedRegion;
      mesh.material.emissiveIntensity = isSelected ? 0.55 : 0.25;
      mesh.material.color.setHex(regionColor(mesh.userData.regionId, levelDef.attribution.expectedRegion));
    });
  }

  function resetLevelState(shell) {
    shell.levelState.picked = null;
    shell.levelState.locked = false;
    shell.levelState.errors = 0;
  }

  function buildScene(engine, level, shell) {
    var def = shell.config.levels[level];
    engine.clearPhysics();
    regionMeshes = [];
    globeShell = null;
    levelStart = Date.now();
    engine.addFloor(18, 18, 0x071025);

    if (!def || def.epilogue) {
      clearButtons();
      addButton('Begin Debrief', function () { shell.runEpilogue(); });
      shell.setTaskText('Epilogue unlocked. Debrief to close operation.');
      return;
    }

    globeShell = engine.addPhysicsSphere(0, 2.2, 0, 2.2, 0x0f172a, 0);
    globeShell.material.transparent = true;
    globeShell.material.opacity = 0.86;
    globeShell.material.emissive = new THREE.Color(0x1d4ed8);
    globeShell.material.emissiveIntensity = 0.2;

    var focusRegions = [def.attribution.expectedRegion].concat(def.decoys);
    focusRegions.forEach(function (regionId, idx) {
      regionMeshes.push(buildRegionMesh(engine, regionId, def.attribution.expectedRegion, 2.35, idx));
    });

    resetLevelState(shell);
    refreshRegionVisuals(def, null);
    bindButtons(shell, level);

    log(shell, '[NARRATIVE] ' + def.briefing);
    log(shell, '[NARRATIVE] ' + def.story.opening);
    log(shell, '[NARRATIVE] ' + def.story.beat1);
    log(shell, '[ATTRIB] Actor=' + def.attribution.actor + ', Campaign=' + def.attribution.campaign);
    log(shell, '[ATTRIB] TTP=' + def.attribution.ttp + ', Sector=' + def.attribution.targetSector);
    shell.setTaskText(def.hint);
  }

  function submitSelection(shell, def) {
    if (!shell.levelState.picked) {
      log(shell, '[FAIL] Select a region node before submitting.');
      return;
    }
    if (shell.levelState.locked) return;

    var chosen = shell.levelState.picked;
    var expected = def.attribution.expectedRegion;
    var elapsed = Math.floor((Date.now() - levelStart) / 1000);
    var timeBonus = Math.max(0, 120 - elapsed);

    if (chosen === expected) {
      var gained = 260 + def.levelIndex * 40 + timeBonus;
      score += gained;
      updateScoreDisplay();
      shell.levelState.locked = true;
      log(shell, '[SUCCESS] Correct region: ' + REGION_POINTS[expected].label + '. +' + gained);
      log(shell, '[STORY] ' + def.story.closing);
      shell.onLevelTasksComplete();
      return;
    }

    shell.levelState.errors += 1;
    HabibiProgression.logFailure(GAME_ID, def.levelIndex, 'wrong_region', shell.state);
    var n = HabibiProgression.getFailureCount(GAME_ID, def.levelIndex, 'wrong_region', shell.state);
    var tutor = HabibiLearning.getFailureFeedback(GAME_ID, def.levelIndex, 'wrong_command', n);
    log(shell, '[FAIL] Selected ' + REGION_POINTS[chosen].label + ', attribution indicates another region.');
    if (tutor) log(shell, '[TUTOR] ' + tutor);
    else log(shell, '[TUTOR] Re-check campaign logistics, language lures, and infrastructure overlap.');
  }

  function revealAttribution(def, shell) {
    log(shell, '[DATA] Actor=' + def.attribution.actor);
    log(shell, '[DATA] Campaign=' + def.attribution.campaign);
    log(shell, '[DATA] Tradecraft=' + def.attribution.ttp);
    log(shell, '[DATA] Target sector=' + def.attribution.targetSector);
  }

  function clearSelection(shell, def) {
    shell.levelState.picked = null;
    refreshRegionVisuals(def, null);
    shell.setTaskText(def.hint);
    log(shell, '[INFO] Region selection cleared.');
  }

  function bindButtons(shell, level) {
    clearButtons();
    var def = shell.config.levels[level];
    if (!def || def.epilogue) {
      addButton('Begin Debrief', function () { shell.runEpilogue(); });
      return;
    }

    addButton('Submit Region', function () { submitSelection(shell, def); });
    addButton('Clear Selection', function () { clearSelection(shell, def); });
    addButton('Review Attribution', function () { revealAttribution(def, shell); });
  }

  function pickRegion(shell, event) {
    var level = shell.state.currentLevel;
    var def = shell.config.levels[level];
    if (!def || def.epilogue || !shell.engine || !shell.levelState || shell.levelState.locked) return;

    var rect = shell.engine.renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, shell.engine.camera);

    var hits = raycaster.intersectObjects(regionMeshes, false);
    if (!hits.length) return;

    var regionId = hits[0].object.userData.regionId;
    shell.levelState.picked = regionId;
    refreshRegionVisuals(def, regionId);
    shell.setTaskText(
      'Selected ' + REGION_POINTS[regionId].label + '. Submit when ready.'
    );
    log(shell, '[PICK] ' + REGION_POINTS[regionId].label + ' selected.');
  }

  function startSpeedTrial(shell) {
    var errors = shell.levelState && shell.levelState.errors ? shell.levelState.errors : 0;
    var val = Math.max(140, 1000 - errors * 140);
    shell.submitScore('speedTrial', val);
    log(shell, '[SKILL] Speed trial score: ' + val);
  }

  function startAccuracyGauntlet(shell) {
    var errors = shell.levelState && shell.levelState.errors ? shell.levelState.errors : 0;
    var val = Math.max(100, 900 - errors * 180);
    shell.submitScore('accuracyGauntlet', val);
    log(shell, '[SKILL] Accuracy gauntlet score: ' + val);
  }

  function startDecisionTree(shell) {
    log(shell, '[TREE] Regional attribution model weights: language lure, hosting locality, victim vertical.');
    shell.submitScore('decisionTree', 650);
  }

  var config = {
    gameId: GAME_ID,
    title: 'CARTOGRAPHY',
    achievementId: 'cartography_master',
    leaderboardChallenge: 'speedTrial',
    engine: { bg: 0x071025, physics: true },
    moveSpeed: 2.3,
    buildScene: buildScene,
    levels: {
      1: CARTOGRAPHY_LEVELS[1],
      2: CARTOGRAPHY_LEVELS[2],
      3: CARTOGRAPHY_LEVELS[3],
      4: CARTOGRAPHY_LEVELS[4],
      5: CARTOGRAPHY_LEVELS[5]
    },
    skills: [
      { id: 'speedTrial', name: 'Speed Trial', unlockAfter: 1, desc: 'Identify region quickly', start: startSpeedTrial },
      { id: 'accuracyGauntlet', name: 'Accuracy Gauntlet', unlockAfter: 2, desc: 'No incorrect region picks', start: startAccuracyGauntlet },
      { id: 'decisionTree', name: 'Decision Tree', unlockAfter: 3, desc: 'Review attribution model', start: startDecisionTree }
    ],
    onLevelStart: function (level, shell) {
      var def = shell.config.levels[level];
      if (!def || def.epilogue) {
        shell.setTaskText('Epilogue unlocked. Begin debrief.');
        return;
      }
      resetLevelState(shell);
      levelStart = Date.now();
      bindButtons(shell, level);
      shell.setTaskText(def.hint);
    },
    onLevelComplete: function (level, shell) {
      var def = shell.config.levels[level];
      if (def && def.story) log(shell, '[NARRATIVE] ' + def.story.closing);
    },
    onTick: function (dt) {
      if (globeShell) globeShell.rotation.y += dt * 0.18;
      regionMeshes.forEach(function (mesh, idx) {
        mesh.rotation.y += dt * (0.3 + idx * 0.03);
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
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
      var taskEl = document.getElementById('task-text');
      if (taskEl) taskEl.textContent = text;
    };
    shell.init();

    var canvas = document.getElementById('canvas-host');
    if (canvas) {
      canvas.addEventListener('click', function (event) {
        pickRegion(shell, event);
      });
    }
    updateScoreDisplay();
  });
})();
