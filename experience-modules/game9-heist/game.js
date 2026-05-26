/**
 * THE HEIST — 3D Experience Module
 * Core concept: Red-team pathing through monitored infrastructure
 * Mechanic: Click network nodes in sequence to build lowest-risk route
 */
(function () {
  'use strict';

  var GAME_ID = 'the_heist';
  var score = 0;

  var sceneNodes = [];
  var sceneEdges = [];
  var nodeLookup = {};
  var selectedPath = [];
  var levelClockStart = 0;

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();

  var HEIST_LEVELS = {
    1: {
      name: 'Perimeter Probe',
      hint: 'Select the safest route from Gateway to HR-Vault.',
      briefing: 'Contract objective: exfil payroll manifest with minimal SOC visibility.',
      start: 'GATEWAY',
      end: 'HR_VAULT',
      nodes: [
        { id: 'GATEWAY', x: -4.8, z: 2.2, y: 1.0, monitor: 5, label: 'Gateway' },
        { id: 'JUMPBOX_A', x: -2.9, z: 1.2, y: 1.1, monitor: 3, label: 'Jumpbox A' },
        { id: 'MAIL', x: -1.0, z: 2.5, y: 1.15, monitor: 4, label: 'Mail' },
        { id: 'FILE_A', x: 1.0, z: 1.7, y: 1.0, monitor: 2, label: 'File A' },
        { id: 'SIEM_SENSOR', x: -0.8, z: -0.8, y: 1.1, monitor: 9, label: 'Sensor' },
        { id: 'HR_VAULT', x: 3.8, z: 1.4, y: 1.2, monitor: 6, label: 'HR Vault' },
        { id: 'PRINTER_NET', x: 1.2, z: -1.5, y: 0.95, monitor: 1, label: 'Printer Net' }
      ],
      edges: [
        ['GATEWAY', 'JUMPBOX_A'],
        ['JUMPBOX_A', 'MAIL'],
        ['MAIL', 'FILE_A'],
        ['FILE_A', 'HR_VAULT'],
        ['GATEWAY', 'SIEM_SENSOR'],
        ['SIEM_SENSOR', 'HR_VAULT'],
        ['JUMPBOX_A', 'PRINTER_NET'],
        ['PRINTER_NET', 'HR_VAULT'],
        ['MAIL', 'SIEM_SENSOR']
      ],
      story: {
        opening: 'Blue-team patch window leaves edge filtering degraded for six minutes.',
        beat1: 'A loud route raises alert confidence and burns the campaign.',
        beat2: 'Quiet lateral motion through low-monitored enclaves buys time.',
        closing: 'Payroll manifest staging complete. SOC still classifies activity as user drift.'
      }
    },
    2: {
      name: 'Credential Relay',
      hint: 'Find least-monitored shortest path from VPN to Domain-Admin.',
      briefing: 'Operator goal: steal delegated token and avoid impossible-travel triggers.',
      start: 'VPN_EDGE',
      end: 'DOMAIN_ADMIN',
      nodes: [
        { id: 'VPN_EDGE', x: -5.2, z: 0.3, y: 1.0, monitor: 4, label: 'VPN Edge' },
        { id: 'BILLING', x: -3.2, z: 2.0, y: 1.05, monitor: 6, label: 'Billing' },
        { id: 'HELPDESK', x: -2.4, z: -1.8, y: 1.05, monitor: 2, label: 'Helpdesk' },
        { id: 'ADSYNC', x: -0.8, z: 0.4, y: 1.2, monitor: 5, label: 'ADSync' },
        { id: 'LEGACY_FS', x: 1.0, z: -1.5, y: 1.0, monitor: 1, label: 'Legacy FS' },
        { id: 'BACKUP_CTL', x: 1.8, z: 1.8, y: 1.2, monitor: 3, label: 'Backup Ctl' },
        { id: 'DOMAIN_ADMIN', x: 4.2, z: 0.2, y: 1.2, monitor: 7, label: 'Domain Admin' },
        { id: 'UEBA_TRAP', x: 0.2, z: 3.0, y: 1.1, monitor: 10, label: 'UEBA Trap' }
      ],
      edges: [
        ['VPN_EDGE', 'BILLING'],
        ['VPN_EDGE', 'HELPDESK'],
        ['HELPDESK', 'ADSYNC'],
        ['ADSYNC', 'DOMAIN_ADMIN'],
        ['HELPDESK', 'LEGACY_FS'],
        ['LEGACY_FS', 'DOMAIN_ADMIN'],
        ['BILLING', 'BACKUP_CTL'],
        ['BACKUP_CTL', 'DOMAIN_ADMIN'],
        ['BILLING', 'UEBA_TRAP'],
        ['UEBA_TRAP', 'DOMAIN_ADMIN'],
        ['ADSYNC', 'BACKUP_CTL']
      ],
      story: {
        opening: 'A credential dump appears in browser cache snapshots from remote support.',
        beat1: 'Direct hops are tempting but monitored choke points spike anomaly scores.',
        beat2: 'Shortest path parity means monitor totals decide survivability.',
        closing: 'Token relay succeeds; SOC sees only routine helpdesk movement.'
      },
      timeLimit: 220
    },
    3: {
      name: 'R&D Pivot',
      hint: 'Traverse from Build-Runner to Formula-Repo with optimal stealth.',
      briefing: 'Objective: pivot into biotech repo before EDR baseline re-learns.',
      start: 'BUILD_RUNNER',
      end: 'FORMULA_REPO',
      nodes: [
        { id: 'BUILD_RUNNER', x: -5.0, z: 1.7, y: 1.0, monitor: 3, label: 'Build Runner' },
        { id: 'QA_NET', x: -3.1, z: 0.2, y: 1.0, monitor: 2, label: 'QA Net' },
        { id: 'LIC_SERVER', x: -1.6, z: 2.3, y: 1.1, monitor: 5, label: 'Lic Server' },
        { id: 'PKI', x: -0.7, z: -1.2, y: 1.2, monitor: 8, label: 'PKI' },
        { id: 'LAB_PROXY', x: 1.3, z: 0.5, y: 1.0, monitor: 2, label: 'Lab Proxy' },
        { id: 'ARCHIVE', x: 2.5, z: -1.8, y: 1.0, monitor: 1, label: 'Archive' },
        { id: 'FORMULA_REPO', x: 4.6, z: 0.7, y: 1.25, monitor: 6, label: 'Formula Repo' },
        { id: 'DECEPTION', x: 0.5, z: 2.9, y: 1.1, monitor: 9, label: 'Deception' }
      ],
      edges: [
        ['BUILD_RUNNER', 'QA_NET'],
        ['QA_NET', 'LAB_PROXY'],
        ['LAB_PROXY', 'FORMULA_REPO'],
        ['QA_NET', 'PKI'],
        ['PKI', 'FORMULA_REPO'],
        ['BUILD_RUNNER', 'LIC_SERVER'],
        ['LIC_SERVER', 'DECEPTION'],
        ['DECEPTION', 'FORMULA_REPO'],
        ['LAB_PROXY', 'ARCHIVE'],
        ['ARCHIVE', 'FORMULA_REPO'],
        ['LIC_SERVER', 'LAB_PROXY']
      ],
      story: {
        opening: 'R&D segmentation changed after prior incident, but stale trust edges remain.',
        beat1: 'Deception mesh now imitates authentic repo hosts under heavy telemetry.',
        beat2: 'Operator must avoid PKI corridor unless no equivalent route exists.',
        closing: 'Formulation archive mirrored; no critical detections fired.'
      },
      timeLimit: 240
    },
    4: {
      name: 'Exfil Corridor',
      hint: 'Reach Cold-Relay from Data-Lake with shortest and quietest corridor.',
      briefing: 'Mission critical: move payload through egress channels below alarm threshold.',
      start: 'DATA_LAKE',
      end: 'COLD_RELAY',
      nodes: [
        { id: 'DATA_LAKE', x: -5.0, z: -0.4, y: 1.2, monitor: 7, label: 'Data Lake' },
        { id: 'ML_NODE', x: -3.3, z: 1.8, y: 1.0, monitor: 4, label: 'ML Node' },
        { id: 'BATCH_IO', x: -2.4, z: -2.1, y: 1.0, monitor: 3, label: 'Batch IO' },
        { id: 'REPORTING', x: -0.6, z: 1.0, y: 1.1, monitor: 5, label: 'Reporting' },
        { id: 'STAGING', x: 0.4, z: -1.7, y: 1.0, monitor: 2, label: 'Staging' },
        { id: 'PROXY_OUT', x: 2.1, z: 0.3, y: 1.1, monitor: 6, label: 'Proxy Out' },
        { id: 'SAT_LINK', x: 2.8, z: -2.3, y: 1.0, monitor: 1, label: 'Sat Link' },
        { id: 'COLD_RELAY', x: 4.8, z: -0.7, y: 1.2, monitor: 4, label: 'Cold Relay' },
        { id: 'SOAR_GATE', x: 0.8, z: 2.7, y: 1.1, monitor: 10, label: 'SOAR Gate' }
      ],
      edges: [
        ['DATA_LAKE', 'ML_NODE'],
        ['DATA_LAKE', 'BATCH_IO'],
        ['ML_NODE', 'REPORTING'],
        ['BATCH_IO', 'STAGING'],
        ['REPORTING', 'PROXY_OUT'],
        ['STAGING', 'SAT_LINK'],
        ['PROXY_OUT', 'COLD_RELAY'],
        ['SAT_LINK', 'COLD_RELAY'],
        ['REPORTING', 'SOAR_GATE'],
        ['SOAR_GATE', 'COLD_RELAY'],
        ['STAGING', 'PROXY_OUT']
      ],
      story: {
        opening: 'Blue team escalated to automated SOAR quarantine during exfil windows.',
        beat1: 'Any route through SOAR_GATE almost guarantees orchestration lockout.',
        beat2: 'Satellite egress is older infrastructure and less instrumented.',
        closing: 'Payload exits through low-noise corridor; alarms remain below action threshold.'
      },
      timeLimit: 260
    },
    5: { name: 'Clean Exit', epilogue: true }
  };

  var STORY_BEATS = {
    1: HEIST_LEVELS[1].story,
    2: HEIST_LEVELS[2].story,
    3: HEIST_LEVELS[3].story,
    4: HEIST_LEVELS[4].story
  };

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = 'SCORE ' + score;
  }

  function logLine(shell, text) {
    if (!shell) return;
    shell.appendOut(text);
    var panel = document.getElementById('action-log');
    if (panel) panel.scrollTop = panel.scrollHeight;
  }

  function clearActionButtons() {
    var wrap = document.getElementById('action-btns');
    if (wrap) wrap.innerHTML = '';
  }

  function addButton(text, onClick, className) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className || 'act-btn';
    btn.textContent = text;
    btn.onclick = onClick;
    wrap.appendChild(btn);
  }

  function monitorColor(value) {
    if (value <= 2) return 0x22c55e;
    if (value <= 4) return 0x84cc16;
    if (value <= 6) return 0xeab308;
    if (value <= 8) return 0xf97316;
    return 0xef4444;
  }

  function resetLevelState(shell) {
    shell.levelState.selectedPath = [];
    shell.levelState.completed = false;
    shell.levelState.invalidClicks = 0;
    shell.levelState.reviewed = false;
    selectedPath = [];
  }

  function calculatePathCost(pathIds, levelDef) {
    var monitorTotal = 0;
    var i;
    for (i = 0; i < pathIds.length; i++) {
      monitorTotal += nodeLookup[pathIds[i]].monitor;
    }
    return {
      hops: Math.max(0, pathIds.length - 1),
      monitor: monitorTotal
    };
  }

  function computeOptimalPaths(levelDef) {
    var adjacency = {};
    var i;
    var j;
    var start = levelDef.start;
    var target = levelDef.end;
    var bestHops = Number.POSITIVE_INFINITY;
    var bestMonitor = Number.POSITIVE_INFINITY;
    var optimal = [];

    levelDef.nodes.forEach(function (n) {
      adjacency[n.id] = [];
    });
    levelDef.edges.forEach(function (edge) {
      adjacency[edge[0]].push(edge[1]);
      adjacency[edge[1]].push(edge[0]);
    });

    function dfs(path) {
      var current = path[path.length - 1];
      if (path.length - 1 > bestHops) return;
      if (current === target) {
        var metrics = calculatePathCost(path, levelDef);
        if (metrics.hops < bestHops) {
          bestHops = metrics.hops;
          bestMonitor = metrics.monitor;
          optimal = [path.slice()];
          return;
        }
        if (metrics.hops === bestHops) {
          if (metrics.monitor < bestMonitor) {
            bestMonitor = metrics.monitor;
            optimal = [path.slice()];
            return;
          }
          if (metrics.monitor === bestMonitor) {
            optimal.push(path.slice());
          }
        }
        return;
      }
      for (i = 0; i < adjacency[current].length; i++) {
        var nextId = adjacency[current][i];
        if (path.indexOf(nextId) !== -1) continue;
        path.push(nextId);
        dfs(path);
        path.pop();
      }
    }

    dfs([start]);

    for (j = 0; j < optimal.length; j++) {
      optimal[j] = optimal[j].join('>');
    }

    return {
      bestHops: bestHops,
      bestMonitor: bestMonitor,
      optimalSignatures: optimal
    };
  }

  function edgeExists(a, b, levelDef) {
    var i;
    for (i = 0; i < levelDef.edges.length; i++) {
      var e = levelDef.edges[i];
      if ((e[0] === a && e[1] === b) || (e[0] === b && e[1] === a)) return !0;
    }
    return false;
  }

  function nodeLabel(id) {
    var node = nodeLookup[id];
    return node ? node.label : id;
  }

  function updateTaskText(shell, levelDef) {
    var pathText = shell.levelState.selectedPath.map(nodeLabel).join(' -> ');
    if (!pathText) pathText = '(none)';
    var task = 'Build route ' + nodeLabel(levelDef.start) + ' -> ' + nodeLabel(levelDef.end) + '. Current: ' + pathText;
    shell.setTaskText(task);
  }

  function markPathVisual() {
    var i;
    for (i = 0; i < sceneNodes.length; i++) {
      var mesh = sceneNodes[i];
      var isSelected = selectedPath.indexOf(mesh.userData.nodeId) !== -1;
      mesh.material.emissiveIntensity = isSelected ? 0.45 : 0.18;
      mesh.material.metalness = isSelected ? 0.7 : 0.3;
    }

    for (i = 0; i < sceneEdges.length; i++) {
      var edge = sceneEdges[i];
      var inPath = false;
      var idx;
      for (idx = 1; idx < selectedPath.length; idx++) {
        var a = selectedPath[idx - 1];
        var b = selectedPath[idx];
        if ((edge.userData.a === a && edge.userData.b === b) || (edge.userData.a === b && edge.userData.b === a)) {
          inPath = true;
          break;
        }
      }
      edge.material.color.setHex(inPath ? 0x22d3ee : 0x334155);
      edge.material.emissiveIntensity = inPath ? 0.45 : 0.1;
    }
  }

  function submitPath(shell, levelDef) {
    var path = shell.levelState.selectedPath;
    if (path.length < 2) {
      logLine(shell, '[FAIL] Build a route with at least two nodes.');
      return;
    }
    if (path[0] !== levelDef.start) {
      logLine(shell, '[FAIL] Route must start at ' + nodeLabel(levelDef.start) + '.');
      return;
    }
    if (path[path.length - 1] !== levelDef.end) {
      logLine(shell, '[FAIL] Route must end at ' + nodeLabel(levelDef.end) + '.');
      return;
    }

    var signature = path.join('>');
    var metrics = calculatePathCost(path, levelDef);
    var optimal = shell.levelState.optimal;
    var elapsedSec = Math.floor((Date.now() - levelClockStart) / 1000);
    var timeBonus = Math.max(0, 120 - elapsedSec);
    var baseScore = 250 + levelDef.levelIndex * 35;

    if (optimal.optimalSignatures.indexOf(signature) !== -1) {
      score += baseScore + timeBonus;
      updateScoreDisplay();
      logLine(shell, '[SUCCESS] Optimal route locked. Hops=' + metrics.hops + ', Monitor=' + metrics.monitor + '.');
      logLine(shell, '[STORY] ' + STORY_BEATS[levelDef.levelIndex].closing);
      shell.levelState.completed = true;
      shell.levelState.reviewed = true;
      shell.onLevelTasksComplete();
      return;
    }

    HabibiProgression.logFailure(GAME_ID, levelDef.levelIndex, 'suboptimal_path', shell.state);
    var count = HabibiProgression.getFailureCount(GAME_ID, levelDef.levelIndex, 'suboptimal_path', shell.state);
    var tutor = HabibiLearning.getFailureFeedback(GAME_ID, levelDef.levelIndex, 'wrong_command', count);

    logLine(shell, '[FAIL] Route is valid but not optimal.');
    logLine(shell, '[DATA] Your route hops=' + metrics.hops + ', monitor=' + metrics.monitor +
      ' | best hops=' + optimal.bestHops + ', best monitor=' + optimal.bestMonitor + '.');
    if (tutor) {
      logLine(shell, '[TUTOR] ' + tutor);
    } else {
      logLine(shell, '[TUTOR] First minimize hops, then choose the lowest monitor total among those routes.');
    }
  }

  function clearPath(shell, levelDef) {
    shell.levelState.selectedPath = [];
    selectedPath = [];
    markPathVisual();
    updateTaskText(shell, levelDef);
    logLine(shell, '[INFO] Route cleared.');
  }

  function bindActionButtons(shell, level) {
    clearActionButtons();
    var def = shell.config.levels[level];
    if (!def || def.epilogue) {
      addButton('Begin debrief', function () { shell.runEpilogue(); });
      return;
    }

    addButton('Submit Route', function () {
      if (!shell.levelState || shell.levelState.completed) return;
      submitPath(shell, def);
    });
    addButton('Clear Route', function () {
      if (!shell.levelState || shell.levelState.completed) return;
      clearPath(shell, def);
    });
    addButton('Show Objective', function () {
      logLine(shell, '[OBJECTIVE] ' + def.hint);
      logLine(shell, '[RULE] Must start at ' + nodeLabel(def.start) + ' and end at ' + nodeLabel(def.end) + '.');
    });
  }

  function buildEdgeMesh(engine, aNode, bNode) {
    var dx = bNode.x - aNode.x;
    var dz = bNode.z - aNode.z;
    var distance = Math.sqrt((dx * dx) + (dz * dz));
    var line = engine.addBox(
      (aNode.x + bNode.x) / 2,
      0.15,
      (aNode.z + bNode.z) / 2,
      Math.max(0.2, distance),
      0.06,
      0.12,
      0x334155,
      false
    );
    line.rotation.y = Math.atan2(dz, dx);
    line.material.emissive = new THREE.Color(0x0f172a);
    line.material.emissiveIntensity = 0.1;
    line.userData.edge = true;
    return line;
  }

  function buildNodeMesh(engine, node) {
    var mesh = engine.addBox(node.x, node.y, node.z, 0.52, 0.52, 0.52, monitorColor(node.monitor), false);
    mesh.material.emissive = new THREE.Color(monitorColor(node.monitor));
    mesh.material.emissiveIntensity = 0.18;
    mesh.material.roughness = 0.45;
    mesh.material.metalness = 0.3;
    mesh.userData.nodeId = node.id;
    mesh.userData.monitor = node.monitor;

    var ring = engine.addBox(node.x, 0.02, node.z, 0.72, 0.02, 0.72, 0x1e293b, false);
    ring.material.emissive = new THREE.Color(0x0f172a);
    ring.material.emissiveIntensity = 0.25;
    ring.userData.decoration = true;

    if (node.id === 'SIEM_SENSOR' || node.id === 'UEBA_TRAP' || node.id === 'DECEPTION' || node.id === 'SOAR_GATE') {
      var hazard = engine.addPhysicsSphere(node.x, node.y + 1.2, node.z, 0.1, 0xef4444, 0.1);
      hazard.userData.particle = true;
      hazard.userData.hazard = true;
    }

    return mesh;
  }

  function buildScene(engine, level, shell) {
    var levelDef = shell.config.levels[level];
    if (!levelDef || levelDef.epilogue) {
      engine.clearPhysics();
      engine.addFloor(18, 18, 0x05070d);
      clearActionButtons();
      addButton('Begin Debrief', function () { shell.runEpilogue(); });
      return;
    }

    engine.clearPhysics();
    sceneNodes = [];
    sceneEdges = [];
    nodeLookup = {};
    selectedPath = [];

    engine.addFloor(20, 20, 0x0b1020);

    var i;
    for (i = 0; i < levelDef.nodes.length; i++) {
      nodeLookup[levelDef.nodes[i].id] = levelDef.nodes[i];
    }

    for (i = 0; i < levelDef.edges.length; i++) {
      var edge = levelDef.edges[i];
      var a = nodeLookup[edge[0]];
      var b = nodeLookup[edge[1]];
      var edgeMesh = buildEdgeMesh(engine, a, b);
      edgeMesh.userData.a = edge[0];
      edgeMesh.userData.b = edge[1];
      sceneEdges.push(edgeMesh);
    }

    for (i = 0; i < levelDef.nodes.length; i++) {
      sceneNodes.push(buildNodeMesh(engine, levelDef.nodes[i]));
    }

    shell.levelState.optimal = computeOptimalPaths(levelDef);
    resetLevelState(shell);
    levelClockStart = Date.now();
    bindActionButtons(shell, level);
    updateTaskText(shell, levelDef);
    logLine(shell, '[NARRATIVE] ' + levelDef.briefing);
    logLine(shell, '[NARRATIVE] ' + STORY_BEATS[level].opening);
    logLine(shell, '[NARRATIVE] ' + STORY_BEATS[level].beat1);
    logLine(shell, '[DATA] Start=' + nodeLabel(levelDef.start) + ' End=' + nodeLabel(levelDef.end));
  }

  function pickNode(shell, event) {
    var levelDef = shell.config.levels[shell.state.currentLevel];
    if (!levelDef || levelDef.epilogue || !shell.engine || !shell.levelState || shell.levelState.completed) return;

    var rect = shell.engine.renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, shell.engine.camera);
    var hits = raycaster.intersectObjects(sceneNodes, false);
    if (!hits.length) return;

    var picked = hits[0].object.userData.nodeId;
    var currentPath = shell.levelState.selectedPath;

    if (currentPath.length === 0) {
      if (picked !== levelDef.start) {
        logLine(shell, '[FAIL] First node must be ' + nodeLabel(levelDef.start) + '.');
        return;
      }
      currentPath.push(picked);
      selectedPath = currentPath.slice();
      markPathVisual();
      updateTaskText(shell, levelDef);
      logLine(shell, '[PATH] Start locked: ' + nodeLabel(picked));
      return;
    }

    var last = currentPath[currentPath.length - 1];
    if (picked === last) {
      logLine(shell, '[INFO] Node already selected as current endpoint.');
      return;
    }

    if (currentPath.indexOf(picked) !== -1) {
      logLine(shell, '[FAIL] Route cannot revisit a node.');
      shell.levelState.invalidClicks += 1;
      return;
    }

    if (!edgeExists(last, picked, levelDef)) {
      logLine(shell, '[FAIL] No direct link between ' + nodeLabel(last) + ' and ' + nodeLabel(picked) + '.');
      shell.levelState.invalidClicks += 1;
      return;
    }

    currentPath.push(picked);
    selectedPath = currentPath.slice();
    markPathVisual();
    updateTaskText(shell, levelDef);
    logLine(shell, '[PATH] ' + nodeLabel(last) + ' -> ' + nodeLabel(picked) +
      ' (monitor ' + nodeLookup[picked].monitor + ')');
  }

  function startSpeedTrial(shell) {
    var lv = shell.state.currentLevel;
    var levelDef = shell.config.levels[lv];
    if (!levelDef || levelDef.epilogue) return;
    var optimal = shell.levelState && shell.levelState.optimal;
    if (!optimal) return;
    var scoreValue = Math.max(200, 1200 - optimal.bestHops * 120 - optimal.bestMonitor * 20);
    shell.submitScore('speedTrial', scoreValue);
    logLine(shell, '[SKILL] Speed trial benchmark submitted: ' + scoreValue);
  }

  function startAccuracyGauntlet(shell) {
    var penalty = (shell.levelState && shell.levelState.invalidClicks) ? shell.levelState.invalidClicks * 45 : 0;
    var scoreValue = Math.max(120, 900 - penalty);
    shell.submitScore('accuracyGauntlet', scoreValue);
    logLine(shell, '[SKILL] Accuracy gauntlet submitted: ' + scoreValue);
  }

  function startDecisionTree(shell) {
    var lv = shell.state.currentLevel;
    var levelDef = shell.config.levels[lv];
    if (!levelDef || levelDef.epilogue) return;
    logLine(shell, '[TREE] Decision rubric: prioritize minimum hops, then minimum monitoring total.');
    logLine(shell, '[TREE] Start at ' + nodeLabel(levelDef.start) + '; finish at ' + nodeLabel(levelDef.end) + '.');
    shell.submitScore('decisionTree', 640);
  }

  var config = {
    gameId: GAME_ID,
    title: 'THE HEIST',
    achievementId: 'heist_master',
    leaderboardChallenge: 'speedTrial',
    engine: { bg: 0x0b1020, physics: true },
    moveSpeed: 2.35,
    buildScene: buildScene,
    levels: {
      1: Object.assign({ levelIndex: 1 }, HEIST_LEVELS[1]),
      2: Object.assign({ levelIndex: 2 }, HEIST_LEVELS[2]),
      3: Object.assign({ levelIndex: 3 }, HEIST_LEVELS[3]),
      4: Object.assign({ levelIndex: 4 }, HEIST_LEVELS[4]),
      5: HEIST_LEVELS[5]
    },
    skills: [
      { id: 'speedTrial', name: 'Speed Trial', unlockAfter: 1, desc: 'Benchmark stealth routing speed', start: startSpeedTrial },
      { id: 'accuracyGauntlet', name: 'Accuracy Gauntlet', unlockAfter: 2, desc: 'Avoid invalid node selections', start: startAccuracyGauntlet },
      { id: 'decisionTree', name: 'Decision Tree', unlockAfter: 3, desc: 'Review route optimization strategy', start: startDecisionTree }
    ],
    onLevelStart: function (level, shell) {
      var def = shell.config.levels[level];
      if (!def || def.epilogue) {
        shell.setTaskText('Epilogue unlocked. Debrief to finish mission chain.');
        return;
      }
      levelClockStart = Date.now();
      resetLevelState(shell);
      shell.setTaskText(def.hint);
      bindActionButtons(shell, level);
    },
    onLevelComplete: function (level, shell) {
      var beat = STORY_BEATS[level];
      if (beat) logLine(shell, '[NARRATIVE] ' + beat.closing);
    },
    onTick: function (dt) {
      var i;
      for (i = 0; i < sceneNodes.length; i++) {
        var n = sceneNodes[i];
        n.position.y += Math.sin((Date.now() * 0.0012) + i) * dt * 0.08;
      }
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
        pickNode(shell, event);
      });
    }
    updateScoreDisplay();
  });
})();
