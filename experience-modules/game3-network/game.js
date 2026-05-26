/**
 * GHOST NETWORK - 3D Experience Module
 * Core concept: interactive network hunting with click-based validation.
 * Physics: Cannon-es via HabibiPhysics | Branches: 15 (5xL1-3)
 */
(function () {
  'use strict';

  var GAME_ID = 'the_ghost_network';
  var score = 0;
  var sceneMeshes = [];

  var sceneState = {
    nodesById: {},
    edgesById: {},
    interactiveRoots: [],
    raycaster: null,
    pointer: null,
    clickUnbind: null,
    pairSelection: null,
    pulse: {
      edgeId: 'APP-01->EXT-C2',
      nodeId: 'EXT-C2',
      cycleMs: 10000,
      activeWindowMs: 2300,
      active: false,
      announcedAt: 0
    },
    activeSkill: null
  };

  var NODE_DATA = [
    { nodeId: 'DC-01', deviceType: 'domain-controller', ip: '10.20.0.10', position: [0.0, 1.2, 0.0] },
    { nodeId: 'WS-003', deviceType: 'workstation', ip: '10.20.2.33', position: [-3.1, 1.0, 1.1] },
    { nodeId: 'DB-01', deviceType: 'database', ip: '10.20.10.41', position: [2.9, 1.3, -0.9] },
    { nodeId: 'VPN-01', deviceType: 'vpn-gateway', ip: '10.20.254.4', position: [-5.0, 1.1, -2.2] },
    { nodeId: 'MAIL-01', deviceType: 'mail-server', ip: '10.20.12.15', position: [4.8, 1.1, 2.4] },
    { nodeId: 'APP-01', deviceType: 'application-server', ip: '10.20.6.21', position: [1.3, 1.0, 3.8] },
    { nodeId: 'WEB-01', deviceType: 'web-server', ip: '10.20.6.12', position: [-1.2, 1.0, 4.6] },
    { nodeId: 'EXT-C2', deviceType: 'external-host', ip: '198.51.100.77', position: [6.2, 1.1, 1.2] }
  ];

  var EDGE_DATA = [
    { edgeId: 'WS-003->DC-01', from: 'WS-003', to: 'DC-01', protocol: 'RDP', port: 3389, anomaly: true },
    { edgeId: 'WS-003->MAIL-01', from: 'WS-003', to: 'MAIL-01', protocol: 'SMTP', port: 25, anomaly: false },
    { edgeId: 'VPN-01->DC-01', from: 'VPN-01', to: 'DC-01', protocol: 'LDAP', port: 389, anomaly: false },
    { edgeId: 'WEB-01->APP-01', from: 'WEB-01', to: 'APP-01', protocol: 'HTTPS', port: 443, anomaly: false },
    { edgeId: 'APP-01->DB-01', from: 'APP-01', to: 'DB-01', protocol: 'MSSQL', port: 1433, anomaly: true },
    { edgeId: 'MAIL-01->DB-01', from: 'MAIL-01', to: 'DB-01', protocol: 'IMAP', port: 143, anomaly: false },
    { edgeId: 'DC-01->DB-01', from: 'DC-01', to: 'DB-01', protocol: 'SMB', port: 445, anomaly: false },
    { edgeId: 'WS-003->APP-01', from: 'WS-003', to: 'APP-01', protocol: 'WinRM', port: 5985, anomaly: true },
    { edgeId: 'VPN-01->WEB-01', from: 'VPN-01', to: 'WEB-01', protocol: 'HTTPS', port: 443, anomaly: false },
    { edgeId: 'APP-01->EXT-C2', from: 'APP-01', to: 'EXT-C2', protocol: 'HTTPS', port: 443, anomaly: true },
    { edgeId: 'WEB-01->MAIL-01', from: 'WEB-01', to: 'MAIL-01', protocol: 'HTTP', port: 80, anomaly: false },
    { edgeId: 'MAIL-01->EXT-C2', from: 'MAIL-01', to: 'EXT-C2', protocol: 'DNS', port: 53, anomaly: true }
  ];

  var STORY_BEATS = {
    1: {
      title: 'Asset Identification',
      opening: '22:04:10Z - SOC receives host inventory drift alert from 10.20.2.33 after ATT&CK T1087 account discovery noise.',
      beats: [
        '22:04:24Z - Zeek flow 10.20.2.33 to 10.20.0.10 spikes; analyst tags source as workstation under T1046 network service discovery.',
        '22:04:51Z - Endpoint telemetry shows lsass handle request on WS-003, mapped to credential access T1003.',
        '22:05:13Z - AD logs from 10.20.0.10 expose unusual Kerberos pre-auth failures linked to T1110 brute force.',
        '22:05:36Z - Firewall notes RDP probing toward DC-01, suggesting lateral movement prep under T1021.001.',
        '22:06:05Z - SIEM enrichment confirms DC-01 role criticality with blast radius score 96 for identity services.',
        '22:06:42Z - Hunt team verifies WS-003 user context and excludes service account false positive scenario.',
        '22:07:08Z - Incident commander requests exact domain controller confirmation before containment action.'
      ],
      closing: 'DC-01 correctly validated as primary identity target.'
    },
    2: {
      title: 'RDP Anomaly',
      opening: '22:12:01Z - Correlation rule links WS-003 to suspicious RDP handshakes against DC-01 with ATT&CK T1021.001 confidence high.',
      beats: [
        '22:12:23Z - Packet capture shows rapid SYN pattern on 3389 from 10.20.2.33 to 10.20.0.10.',
        '22:12:46Z - EDR on WS-003 reports mstsc spawn from scripted parent process, mapped to T1059 command and scripting.',
        '22:13:09Z - Domain controller event 4624 type 10 appears with legacy cipher and impossible travel context.',
        '22:13:27Z - Baseline model marks this edge outlier at 8.3 sigma versus prior seven-day behavior.',
        '22:13:54Z - Analyst compares VPN and jump-host routes, ruling out approved admin maintenance window.',
        '22:14:16Z - Threat intel cross-check ties source behavior to FIN7 post-compromise lateral playbook.',
        '22:14:49Z - Team asks for direct verification of WS-003 to DC-01 edge before host isolation.'
      ],
      closing: 'RDP edge WS-003 to DC-01 validated as anomalous pivot.'
    },
    3: {
      title: 'Database Pivot',
      opening: '22:20:03Z - Alert chain indicates possible objective shift to data theft against DB-01 using ATT&CK T1213 data from information repositories.',
      beats: [
        '22:20:18Z - Process graph links compromised token from WS-003 to service account query against 10.20.10.41.',
        '22:20:45Z - SQL audit records show sudden schema enumeration from non-database host under T1046 overlap.',
        '22:21:11Z - SMB relay attempts from DC-01 to DB-01 logged but blocked by signing policy.',
        '22:21:38Z - DB-01 observes xp_cmdshell enable attempt, mapped to T1505.001 server software component abuse.',
        '22:22:07Z - Netflow reveals encrypted exfil staging to app tier before external beacon window.',
        '22:22:31Z - IR lead confirms finance table touched by unauthorized principal and requests DB-01 lock focus.',
        '22:22:58Z - Containment branch decision required: isolate DB-01 path or watch for second-stage C2.'
      ],
      closing: 'DB-01 identified as the lateral objective node.'
    },
    4: {
      title: 'Beacon Timing',
      opening: '22:31:00Z - Beacon analytics flag periodic outbound jitter from APP-01 to 198.51.100.77 tied to ATT&CK T1071.001 web protocols.',
      beats: [
        '22:31:14Z - Pattern engine marks 10 second cadence with 2.3 second burst windows on edge APP-01 to EXT-C2.',
        '22:31:39Z - JA3 fingerprint mismatch indicates custom TLS client not seen in production deployment.',
        '22:32:04Z - DNS fallback channel from MAIL-01 to 198.51.100.77 appears as decoy traffic under T1071.004.',
        '22:32:27Z - Response team replays captures and confirms pulse repeats despite user inactivity.',
        '22:32:55Z - ATT&CK mapping updated with T1105 ingress tool transfer suspicion after payload pull.',
        '22:33:19Z - C2 hunt runbook requests operator click confirmation during active pulse, not idle state.',
        '22:33:44Z - Command authorizes final block only once pulsing edge or endpoint is verified live.'
      ],
      closing: 'Pulsing C2 channel confirmed and ready for eradication actions.'
    }
  };

  var LEVEL_DETAILS = {
    1: {
      name: 'Asset Identification',
      hint: 'Click the real domain controller node (DC-01).',
      correctNodeId: 'DC-01'
    },
    2: {
      name: 'RDP Anomaly',
      hint: 'Confirm the anomalous edge WS-003 to DC-01.',
      correctEdgeId: 'WS-003->DC-01'
    },
    3: {
      name: 'Database Pivot',
      hint: 'Select the lateral movement target DB-01.',
      correctNodeId: 'DB-01'
    },
    4: {
      name: 'Beacon Timing',
      hint: 'Wait for pulse and click APP-01->EXT-C2 or EXT-C2.',
      correctEdgeId: 'APP-01->EXT-C2',
      correctNodeId: 'EXT-C2',
      timeLimit: 420
    },
    5: {
      name: 'Mission Debrief',
      epilogue: true
    }
  };

  function makeBranch(levelNum) {
    return {
      title: 'Story branch - Level ' + levelNum + ' (5 paths)',
      desc: 'Your handling of network telemetry shapes downstream containment and recovery posture.',
      options: [
        { id: 'branch_speed_' + levelNum, label: 'Contain immediately with aggressive endpoint isolation' },
        { id: 'branch_evidence_' + levelNum, label: 'Collect additional memory and packet evidence first' },
        { id: 'branch_escalate_' + levelNum, label: 'Escalate to incident commander before host action' },
        { id: 'branch_document_' + levelNum, label: 'Prioritize timeline and chain-of-custody records' },
        { id: 'branch_segment_' + levelNum, label: 'Segment only affected subnet and monitor impact' }
      ]
    };
  }

  function getNodeMeta(nodeId) {
    for (var i = 0; i < NODE_DATA.length; i++) {
      if (NODE_DATA[i].nodeId === nodeId) return NODE_DATA[i];
    }
    return null;
  }

  function getEdgeMeta(edgeId) {
    for (var i = 0; i < EDGE_DATA.length; i++) {
      if (EDGE_DATA[i].edgeId === edgeId) return EDGE_DATA[i];
    }
    return null;
  }

  function colorForDevice(deviceType) {
    if (deviceType === 'domain-controller') return 0x0ea5e9;
    if (deviceType === 'workstation') return 0x22c55e;
    if (deviceType === 'database') return 0x8b5cf6;
    if (deviceType === 'vpn-gateway') return 0xeab308;
    if (deviceType === 'mail-server') return 0xf97316;
    if (deviceType === 'application-server') return 0x14b8a6;
    if (deviceType === 'web-server') return 0x3b82f6;
    return 0xef4444;
  }

  function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = 'SCORE ' + score;
  }

  function createLabelSprite(labelText) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(2,6,23,0.86)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(56,189,248,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);

    var texture = new THREE.CanvasTexture(canvas);
    var material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    var sprite = new THREE.Sprite(material);
    sprite.scale.set(1.8, 0.45, 1);
    return sprite;
  }

  function createEdgeMesh(engine, fromNode, toNode, edgeMeta) {
    var fromV = new THREE.Vector3(fromNode.position[0], fromNode.position[1], fromNode.position[2]);
    var toV = new THREE.Vector3(toNode.position[0], toNode.position[1], toNode.position[2]);
    var dir = new THREE.Vector3().subVectors(toV, fromV);
    var len = dir.length();
    var mid = new THREE.Vector3().addVectors(fromV, toV).multiplyScalar(0.5);
    var geom = new THREE.BoxGeometry(len, 0.07, 0.07);
    var mat = new THREE.MeshStandardMaterial({
      color: edgeMeta.anomaly ? 0xef4444 : 0x64748b,
      emissive: edgeMeta.anomaly ? 0x7f1d1d : 0x0f172a,
      emissiveIntensity: edgeMeta.anomaly ? 0.35 : 0.15
    });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
    mesh.userData = {
      interactiveType: 'edge',
      edgeId: edgeMeta.edgeId,
      from: edgeMeta.from,
      to: edgeMeta.to,
      anomaly: edgeMeta.anomaly
    };
    engine.scene.add(mesh);
    return mesh;
  }

  function clearClickBinding() {
    if (sceneState.clickUnbind) {
      sceneState.clickUnbind();
      sceneState.clickUnbind = null;
    }
  }

  function bindCanvasClick(shell, level) {
    clearClickBinding();
    var dom = shell.engine && shell.engine.renderer && shell.engine.renderer.domElement;
    if (!dom) return;
    if (!sceneState.raycaster) sceneState.raycaster = new THREE.Raycaster();
    if (!sceneState.pointer) sceneState.pointer = new THREE.Vector2();

    var onCanvasClick = function (ev) {
      var rect = dom.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      sceneState.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      sceneState.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      sceneState.raycaster.setFromCamera(sceneState.pointer, shell.engine.camera);

      var hits = sceneState.raycaster.intersectObjects(sceneState.interactiveRoots, true);
      if (!hits.length) return;

      var target = hits[0].object;
      while (target && !target.userData.interactiveType && target.parent) {
        target = target.parent;
      }
      if (!target || !target.userData) return;

      if (target.userData.interactiveType === 'node') {
        onNodeClick(target.userData.nodeId, shell, level);
        return;
      }
      if (target.userData.interactiveType === 'edge') {
        onEdgeClick(target.userData.edgeId, shell, level);
      }
    };

    dom.addEventListener('click', onCanvasClick);
    sceneState.clickUnbind = function () {
      dom.removeEventListener('click', onCanvasClick);
    };
  }

  function markObjectiveValidated(shell, objectiveId, extraPayload) {
    if (!shell || !shell.levelState) return;
    var extras = shell.levelState.extras || {};
    extras.nodeValidated = objectiveId;
    extras.lastValidationPayload = extraPayload || null;
    shell.levelState.extras = extras;
    shell.processCommand('__node_validation__');
  }

  function deviceTypeFeedback(deviceType) {
    if (deviceType === 'workstation') return 'That is a workstation. Hunt path starts there but objective is the identity core.';
    if (deviceType === 'database') return 'Database is high value, but this level asks for identity infrastructure.';
    if (deviceType === 'mail-server') return 'Mail server telemetry is clean in this stage. Keep focus on privileged auth targets.';
    if (deviceType === 'vpn-gateway') return 'VPN gateway is entry context, not the objective in this phase.';
    if (deviceType === 'application-server') return 'Application tier is relevant later, not for this validation.';
    if (deviceType === 'web-server') return 'Web server belongs to exposure surface, not the requested objective.';
    if (deviceType === 'external-host') return 'External host is for C2 phase. Current level requires an internal objective.';
    return 'Node selected is not the required objective for this step.';
  }

  function onNodeClick(nodeId, shell, level) {
    var nodeMeta = getNodeMeta(nodeId);
    if (!nodeMeta) return;
    shell.appendOut('[CLICK] Node ' + nodeId + ' (' + nodeMeta.deviceType + ', ' + nodeMeta.ip + ')');
    runSkillNodeHandlers(shell, nodeId);

    var levelDef = LEVEL_DETAILS[level];
    if (!levelDef || levelDef.epilogue) return;

    if (level === 1) {
      if (nodeId === levelDef.correctNodeId) {
        score += 140;
        updateScoreDisplay();
        markObjectiveValidated(shell, 'L1_main', { nodeId: nodeId });
      } else {
        shell.appendOut('[TUTOR] ' + deviceTypeFeedback(nodeMeta.deviceType));
      }
      return;
    }

    if (level === 2) {
      var extras = shell.levelState.extras || {};
      var withinWindow = extras.pairStartedAt && (Date.now() - extras.pairStartedAt <= 6000);
      if (nodeId === 'WS-003') {
        extras.pairStart = 'WS-003';
        extras.pairStartedAt = Date.now();
        shell.levelState.extras = extras;
        shell.appendOut('[TRACE] Pair start recorded on WS-003. Click DC-01 to confirm RDP anomaly.');
        return;
      }
      if (nodeId === 'DC-01' && extras.pairStart === 'WS-003' && withinWindow) {
        score += 160;
        updateScoreDisplay();
        markObjectiveValidated(shell, 'L2_main', { nodePair: ['WS-003', 'DC-01'] });
        return;
      }
      shell.appendOut('[TUTOR] For level 2, click WS-003 then DC-01, or click the WS-003->DC-01 edge directly.');
      return;
    }

    if (level === 3) {
      if (nodeId === levelDef.correctNodeId) {
        score += 170;
        updateScoreDisplay();
        markObjectiveValidated(shell, 'L3_main', { nodeId: nodeId, lateral: true });
      } else {
        shell.appendOut('[TUTOR] Lateral target is the database server receiving post-auth movement.');
      }
      return;
    }

    if (level === 4) {
      var pulseOk = isPulseActive();
      if (nodeId === levelDef.correctNodeId && pulseOk) {
        score += 210;
        updateScoreDisplay();
        markObjectiveValidated(shell, 'L4_main', { nodeId: nodeId, pulseAt: Date.now() });
      } else if (nodeId === levelDef.correctNodeId && !pulseOk) {
        shell.appendOut('[TUTOR] EXT-C2 selected outside pulse window. Wait for the 10s burst and click during glow.');
      } else {
        shell.appendOut('[TUTOR] Level 4 requires the active C2 endpoint or pulsing edge.');
      }
    }
  }

  function onEdgeClick(edgeId, shell, level) {
    var edgeMeta = getEdgeMeta(edgeId);
    if (!edgeMeta) return;
    shell.appendOut('[CLICK] Edge ' + edgeId + ' ' + edgeMeta.protocol + '/' + edgeMeta.port);
    runSkillEdgeHandlers(shell, edgeId, edgeMeta);

    var levelDef = LEVEL_DETAILS[level];
    if (!levelDef || levelDef.epilogue) return;

    if (level === 2) {
      if (edgeId === levelDef.correctEdgeId) {
        score += 160;
        updateScoreDisplay();
        markObjectiveValidated(shell, 'L2_main', { edgeId: edgeId, directEdge: true });
      } else {
        shell.appendOut('[TUTOR] Selected edge is not the RDP anomaly from WS-003 to DC-01.');
      }
      return;
    }

    if (level === 4) {
      if (edgeId === levelDef.correctEdgeId && isPulseActive()) {
        score += 220;
        updateScoreDisplay();
        markObjectiveValidated(shell, 'L4_main', { edgeId: edgeId, pulseAt: Date.now() });
      } else if (edgeId === levelDef.correctEdgeId) {
        shell.appendOut('[TUTOR] Correct edge, wrong timing. Click it while the pulse is active.');
      } else {
        shell.appendOut('[TUTOR] This connection does not match the periodic C2 beacon.');
      }
    }
  }

  function narrateLevel(level, shell) {
    var data = STORY_BEATS[level];
    if (!data || !shell) return;
    shell.appendOut('[NARRATIVE] ' + data.opening);
    for (var i = 0; i < data.beats.length; i++) {
      shell.appendOut('[NARRATIVE] ' + data.beats[i]);
    }
  }

  function bindActionButtons(shell, level) {
    var wrap = document.getElementById('action-btns');
    if (!wrap) return;
    wrap.innerHTML = '';

    var levelDef = LEVEL_DETAILS[level];
    if (!levelDef || levelDef.epilogue) {
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

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'act-btn';
    resetBtn.textContent = 'Reset Pair Selection';
    resetBtn.onclick = function () {
      if (shell.levelState && shell.levelState.extras) {
        shell.levelState.extras.pairStart = null;
        shell.levelState.extras.pairStartedAt = 0;
      }
      shell.appendOut('[INFO] Pair selection reset.');
    };
    wrap.appendChild(resetBtn);

    var hintBtn = document.createElement('button');
    hintBtn.type = 'button';
    hintBtn.className = 'act-btn';
    hintBtn.textContent = 'Mission Hint';
    hintBtn.onclick = function () {
      shell.appendOut('[HINT] ' + levelDef.hint);
    };
    wrap.appendChild(hintBtn);
  }

  function resetSceneState() {
    sceneState.nodesById = {};
    sceneState.edgesById = {};
    sceneState.interactiveRoots = [];
    sceneState.activeSkill = null;
  }

  function buildScene(engine, level, shell) {
    if (engine.clearPhysics) engine.clearPhysics();
    clearClickBinding();
    resetSceneState();
    sceneMeshes = [];

    engine.addFloor(20, 20, 0x0b1120);

    var center = engine.addBox(0, 0.45, 0, 1.5, 0.8, 1.5, 0x0b1220, 0);
    center.material.emissive = new THREE.Color(0x082f49);
    center.material.emissiveIntensity = 0.28;
    sceneMeshes.push(center);

    for (var i = 0; i < NODE_DATA.length; i++) {
      var node = NODE_DATA[i];
      var color = colorForDevice(node.deviceType);
      var mesh = engine.addBox(node.position[0], node.position[1], node.position[2], 0.75, 0.75, 0.75, color, 0);
      mesh.material.emissive = new THREE.Color(color);
      mesh.material.emissiveIntensity = 0.2;
      mesh.userData = {
        interactiveType: 'node',
        nodeId: node.nodeId,
        deviceType: node.deviceType,
        ip: node.ip
      };

      var tag = createLabelSprite(node.nodeId);
      tag.position.set(0, 0.72, 0);
      mesh.add(tag);

      sceneState.nodesById[node.nodeId] = mesh;
      sceneState.interactiveRoots.push(mesh);
      sceneMeshes.push(mesh);
    }

    for (var e = 0; e < EDGE_DATA.length; e++) {
      var edge = EDGE_DATA[e];
      var fromNode = getNodeMeta(edge.from);
      var toNode = getNodeMeta(edge.to);
      if (!fromNode || !toNode) continue;
      var edgeMesh = createEdgeMesh(engine, fromNode, toNode, edge);
      sceneState.edgesById[edge.edgeId] = edgeMesh;
      sceneState.interactiveRoots.push(edgeMesh);
      sceneMeshes.push(edgeMesh);
    }

    bindCanvasClick(shell, level);
    bindActionButtons(shell, level);
    narrateLevel(level, shell);
  }

  function isPulseActive() {
    var pulse = sceneState.pulse;
    var phase = Date.now() % pulse.cycleMs;
    return phase <= pulse.activeWindowMs;
  }

  function updatePulseVisuals(shell) {
    var pulse = sceneState.pulse;
    var activeNow = isPulseActive();
    var edgeMesh = sceneState.edgesById[pulse.edgeId];
    var nodeMesh = sceneState.nodesById[pulse.nodeId];

    if (edgeMesh && edgeMesh.material) {
      edgeMesh.material.color.setHex(activeNow ? 0xfb7185 : 0xef4444);
      edgeMesh.material.emissive.setHex(activeNow ? 0xbe123c : 0x7f1d1d);
      edgeMesh.material.emissiveIntensity = activeNow ? 0.92 : 0.35;
    }
    if (nodeMesh && nodeMesh.material) {
      nodeMesh.material.color.setHex(activeNow ? 0xfda4af : colorForDevice('external-host'));
      nodeMesh.material.emissive.setHex(activeNow ? 0xbe123c : 0x7f1d1d);
      nodeMesh.material.emissiveIntensity = activeNow ? 1.0 : 0.28;
    }

    if (activeNow && !pulse.active && shell && shell.state.currentLevel === 4) {
      if (!pulse.announcedAt || Date.now() - pulse.announcedAt > 3000) {
        shell.appendOut('[PULSE] C2 burst active for ~2.3s.');
        pulse.announcedAt = Date.now();
      }
    }
    pulse.active = activeNow;
  }

  function calcSkillScore(base, elapsedMs, penalties) {
    var decay = Math.floor(elapsedMs / 40);
    var adjusted = base - decay - penalties;
    return Math.max(0, adjusted);
  }

  function runSkillNodeHandlers(shell, nodeId) {
    var active = sceneState.activeSkill;
    if (!active) return;

    if (active.id === 'speedTrial') {
      if (Date.now() > active.deadlineAt) {
        active.failed = true;
        shell.appendOut('[SKILL] Speed Trial failed: timeout on ' + active.sequence[active.index] + '.');
        sceneState.activeSkill = null;
        return;
      }
      if (nodeId === active.sequence[active.index]) {
        active.index += 1;
        if (active.index >= active.sequence.length) {
          var elapsed = Date.now() - active.startedAt;
          var speedScore = calcSkillScore(1400, elapsed, active.mistakes * 60);
          shell.submitScore('speedTrial', speedScore);
          shell.appendOut('[SKILL] Speed Trial complete. Score: ' + speedScore);
          sceneState.activeSkill = null;
        } else {
          active.deadlineAt = Date.now() + 5000;
          shell.setTaskText('Speed Trial: click ' + active.sequence[active.index] + ' within 5s.');
        }
      } else {
        active.mistakes += 1;
        shell.appendOut('[SKILL] Wrong node for Speed Trial. Expected ' + active.sequence[active.index] + '.');
      }
      return;
    }

    if (active.id === 'c2Pattern') {
      if (nodeId === sceneState.pulse.nodeId && isPulseActive()) {
        active.hits += 1;
        shell.appendOut('[SKILL] C2 pulse hit ' + active.hits + '/' + active.requiredHits + '.');
        if (active.hits >= active.requiredHits) {
          var patternScore = calcSkillScore(1500, Date.now() - active.startedAt, active.misses * 75);
          shell.submitScore('c2Pattern', patternScore);
          shell.appendOut('[SKILL] C2 Pattern complete. Score: ' + patternScore);
          sceneState.activeSkill = null;
        }
      } else {
        active.misses += 1;
      }
    }
  }

  function runSkillEdgeHandlers(shell, edgeId, edgeMeta) {
    var active = sceneState.activeSkill;
    if (!active) return;

    if (active.id === 'anomalyHunt') {
      if (!active.allowedEdges[edgeId]) {
        shell.appendOut('[SKILL] Edge is outside anomaly set: ' + edgeId);
        active.falsePositives += 1;
        return;
      }
      if (active.remainingAnomalies[edgeId]) {
        delete active.remainingAnomalies[edgeId];
        shell.appendOut('[SKILL] Correct anomaly: ' + edgeId + ' (' + Object.keys(active.remainingAnomalies).length + ' left)');
      } else {
        active.falsePositives += 1;
        shell.appendOut('[SKILL] Already cleared or benign edge clicked.');
      }
      if (!Object.keys(active.remainingAnomalies).length) {
        var penalty = active.falsePositives * 85;
        var huntScore = calcSkillScore(1600, Date.now() - active.startedAt, penalty);
        shell.submitScore('anomalyHunt', huntScore);
        shell.appendOut('[SKILL] Anomaly Hunt complete. Score: ' + huntScore);
        sceneState.activeSkill = null;
      }
      return;
    }

    if (active.id === 'c2Pattern') {
      if (edgeId === sceneState.pulse.edgeId && isPulseActive()) {
        active.hits += 1;
        shell.appendOut('[SKILL] C2 pulse edge hit ' + active.hits + '/' + active.requiredHits + '.');
        if (active.hits >= active.requiredHits) {
          var timingScore = calcSkillScore(1500, Date.now() - active.startedAt, active.misses * 75);
          shell.submitScore('c2Pattern', timingScore);
          shell.appendOut('[SKILL] C2 Pattern complete. Score: ' + timingScore);
          sceneState.activeSkill = null;
        }
      } else if (edgeMeta && edgeMeta.anomaly) {
        active.misses += 1;
      }
    }
  }

  function startSpeedTrial(shell) {
    var sequence = ['WS-003', 'WEB-01', 'APP-01', 'DB-01', 'DC-01'];
    sceneState.activeSkill = {
      id: 'speedTrial',
      startedAt: Date.now(),
      sequence: sequence,
      index: 0,
      deadlineAt: Date.now() + 5000,
      mistakes: 0,
      failed: false
    };
    shell.appendOut('[SKILL] Speed Trial started. Sequence: ' + sequence.join(' -> '));
    shell.setTaskText('Speed Trial: click ' + sequence[0] + ' within 5s.');
  }

  function startAnomalyHunt(shell) {
    var challengeEdges = EDGE_DATA.slice(0, 10);
    var allowed = {};
    var anomalies = {};
    for (var i = 0; i < challengeEdges.length; i++) {
      allowed[challengeEdges[i].edgeId] = true;
      if (challengeEdges[i].anomaly) anomalies[challengeEdges[i].edgeId] = true;
    }
    sceneState.activeSkill = {
      id: 'anomalyHunt',
      startedAt: Date.now(),
      allowedEdges: allowed,
      remainingAnomalies: anomalies,
      falsePositives: 0
    };
    shell.appendOut('[SKILL] Anomaly Hunt started. Inspect 10 edges and click only anomalous ones.');
    shell.setTaskText('Anomaly Hunt: clear ' + Object.keys(anomalies).length + ' anomalous connections.');
  }

  function startC2Pattern(shell) {
    sceneState.activeSkill = {
      id: 'c2Pattern',
      startedAt: Date.now(),
      hits: 0,
      misses: 0,
      requiredHits: 3
    };
    shell.appendOut('[SKILL] C2 Pattern started. Click the pulsing C2 edge/node during active windows.');
    shell.setTaskText('C2 Pattern: land 3 pulse-timed clicks.');
  }

  var config = {
    gameId: GAME_ID,
    title: 'GHOST NETWORK',
    achievementId: 'network_master',
    leaderboardChallenge: 'speedTrial',
    engine: { bg: 0x0b1220, physics: true },
    moveSpeed: 2.5,
    buildScene: buildScene,
    levels: {
      1: {
        name: LEVEL_DETAILS[1].name,
        hint: LEVEL_DETAILS[1].hint,
        tasks: [{
          id: 'L1_main',
          hint: 'Validate DC-01 by clicking the correct node.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            var extras = shell.levelState && shell.levelState.extras;
            return !!extras && extras.nodeValidated === 'L1_main';
          },
          output: '[OK] Domain controller objective confirmed.',
          onSuccess: function () {
            score += 120;
            updateScoreDisplay();
          }
        }],
        branch: makeBranch(1)
      },
      2: {
        name: LEVEL_DETAILS[2].name,
        hint: LEVEL_DETAILS[2].hint,
        timeLimit: 300,
        tasks: [{
          id: 'L2_main',
          hint: 'Validate RDP anomaly edge WS-003->DC-01.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            var extras = shell.levelState && shell.levelState.extras;
            return !!extras && extras.nodeValidated === 'L2_main';
          },
          output: '[OK] RDP anomaly path validated.',
          onSuccess: function () {
            score += 130;
            updateScoreDisplay();
          }
        }],
        branch: makeBranch(2)
      },
      3: {
        name: LEVEL_DETAILS[3].name,
        hint: LEVEL_DETAILS[3].hint,
        timeLimit: 360,
        tasks: [{
          id: 'L3_main',
          hint: 'Click DB-01 as the lateral objective.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            var extras = shell.levelState && shell.levelState.extras;
            return !!extras && extras.nodeValidated === 'L3_main';
          },
          output: '[OK] Database pivot objective confirmed.',
          onSuccess: function () {
            score += 140;
            updateScoreDisplay();
          }
        }],
        branch: makeBranch(3)
      },
      4: {
        name: LEVEL_DETAILS[4].name,
        hint: LEVEL_DETAILS[4].hint,
        timeLimit: LEVEL_DETAILS[4].timeLimit,
        tasks: [{
          id: 'L4_main',
          hint: 'Click the pulsing C2 edge/node during active burst.',
          errorType: 'wrong_command',
          validate: function (cmd, shell) {
            var extras = shell.levelState && shell.levelState.extras;
            return !!extras && extras.nodeValidated === 'L4_main';
          },
          output: '[OK] Active C2 channel confirmed.',
          onSuccess: function () {
            score += 170;
            updateScoreDisplay();
          }
        }]
      },
      5: {
        name: LEVEL_DETAILS[5].name,
        epilogue: true
      }
    },
    skills: [
      { id: 'speedTrial', name: 'Speed Trial', unlockAfter: 1, desc: 'Click 5 nodes in sequence, each under 5 seconds.', start: startSpeedTrial },
      { id: 'anomalyHunt', name: 'Anomaly Hunt', unlockAfter: 2, desc: 'Inspect 10 edges and click only pre-marked anomalies.', start: startAnomalyHunt },
      { id: 'c2Pattern', name: 'C2 Pattern', unlockAfter: 3, desc: 'Time your clicks to the beacon pulse cadence.', start: startC2Pattern }
    ],
    onLevelStart: function (levelNum, shell) {
      var details = LEVEL_DETAILS[levelNum];
      var extras = shell.levelState.extras || {};
      extras.nodeValidated = '';
      extras.pairStart = null;
      extras.pairStartedAt = 0;
      shell.levelState.extras = extras;

      if (details && !details.epilogue) {
        shell.setTaskText('Task: ' + details.hint);
        shell.appendOut('[MISSION] ' + details.hint);
      } else {
        shell.setTaskText('Epilogue - complete debrief.');
      }

      score += levelNum * 8;
      updateScoreDisplay();
      narrateLevel(levelNum, shell);
    },
    onLevelComplete: function (levelNum, shell) {
      var story = STORY_BEATS[levelNum];
      if (story) shell.appendOut('[NARRATIVE] ' + story.closing);
      sceneState.activeSkill = null;
    }
  };

  config.onTick = function (dt, shell) {
    for (var i = 0; i < sceneMeshes.length; i++) {
      var mesh = sceneMeshes[i];
      if (!mesh || !mesh.userData) continue;
      if (mesh.userData.interactiveType === 'node') {
        mesh.rotation.y += dt * 0.12;
      }
    }
    updatePulseVisuals(shell);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var shell = new HabibiGameShell(config);
    shell.score = 0;
    shell.updateScore = updateScoreDisplay;
    shell.appendOut = function (text) {
      var out = document.getElementById('action-log');
      if (!out) return;
      out.textContent += text + '\n';
      out.scrollTop = out.scrollHeight;
    };
    shell.setTaskText = function (text) {
      var task = document.getElementById('task-text');
      if (task) task.textContent = text;
    };

    shell.init();
    updateScoreDisplay();
  });
})();
