/**
 * HABIBI-SIEM Experience Modules — shared progression persistence (LocalStorage)
 */
(function (global) {
  'use strict';

  var PREFIX = 'habibi-xp-';
  var SEQUENCE = [
    'the_terminal', 'the_breach', 'the_ghost_network', 'the_cipher', 'the_simulation',
    'the_interrogation_room', 'the_forge', 'the_deep_archive', 'the_heist', 'the_lab',
    'the_cartography', 'the_memorial', 'the_resonance'
  ];

  function defaultState(gameId) {
    return {
      gameId: gameId,
      currentLevel: 1,
      completedLevels: [],
      skillChallenges: {},
      storyChoices: {},
      achievements: [],
      leaderboardSubmissions: [],
      totalPlayTime: 0,
      lastPlayed: null,
      unlocked: true,
      failureLog: {}
    };
  }

  function load(gameId) {
    try {
      var raw = localStorage.getItem(PREFIX + gameId);
      if (!raw) return defaultState(gameId);
      var data = JSON.parse(raw);
      var merged = Object.assign(defaultState(gameId), data);
      merged.unlocked = true; // always unlocked — no gates
      return merged;
    } catch (_) {
      return defaultState(gameId);
    }
  }

  function save(gameId, state) {
    state.lastPlayed = new Date().toISOString();
    try {
      localStorage.setItem(PREFIX + gameId, JSON.stringify(state));
    } catch (_) { /* quota */ }
    return state;
  }

  function markLevelComplete(gameId, levelNum, state) {
    if (!state) state = load(gameId);
    if (state.completedLevels.indexOf(levelNum) === -1) {
      state.completedLevels.push(levelNum);
      state.completedLevels.sort(function (a, b) { return a - b; });
    }
    if (levelNum >= state.currentLevel && levelNum < 5) {
      state.currentLevel = levelNum + 1;
    }
    return save(gameId, state);
  }

  function recordStoryChoice(gameId, levelKey, branchId, state) {
    if (!state) state = load(gameId);
    state.storyChoices[levelKey] = branchId;
    return save(gameId, state);
  }

  function unlockSkillChallenge(gameId, challengeId, state) {
    if (!state) state = load(gameId);
    if (!state.skillChallenges[challengeId]) {
      state.skillChallenges[challengeId] = { bestScore: 0, difficulty: 'easy', unlocked: true };
    } else {
      state.skillChallenges[challengeId].unlocked = true;
    }
    return save(gameId, state);
  }

  function recordSkillScore(gameId, challengeId, score, difficulty, state) {
    if (!state) state = load(gameId);
    var ch = state.skillChallenges[challengeId] || { bestScore: 0, difficulty: difficulty || 'easy', unlocked: true };
    if (score > ch.bestScore) ch.bestScore = score;
    ch.difficulty = difficulty || ch.difficulty;
    ch.unlocked = true;
    state.skillChallenges[challengeId] = ch;
    return save(gameId, state);
  }

  function logFailure(gameId, levelNum, objectiveKey, state) {
    if (!state) state = load(gameId);
    var key = 'L' + levelNum + ':' + objectiveKey;
    state.failureLog[key] = (state.failureLog[key] || 0) + 1;
    return save(gameId, state);
  }

  function getFailureCount(gameId, levelNum, objectiveKey, state) {
    if (!state) state = load(gameId);
    var key = 'L' + levelNum + ':' + objectiveKey;
    return state.failureLog[key] || 0;
  }

  function addAchievement(gameId, badgeId, state) {
    if (!state) state = load(gameId);
    if (state.achievements.indexOf(badgeId) === -1) state.achievements.push(badgeId);
    return save(gameId, state);
  }

  function unlockNextGame(completedGameId) {
    var idx = SEQUENCE.indexOf(completedGameId);
    if (idx === -1 || idx >= SEQUENCE.length - 1) return null;
    var nextId = SEQUENCE[idx + 1];
    var next = load(nextId);
    next.unlocked = true;
    save(nextId, next);
    return nextId;
  }

  function isGameUnlocked(gameId) {
    return true; // all games always accessible
  }

  function getCarriedStoryContext(fromGameId) {
    var state = load(fromGameId);
    return {
      choices: Object.assign({}, state.storyChoices),
      posture: inferPosture(state.storyChoices)
    };
  }

  function inferPosture(choices) {
    var vals = Object.values(choices || {});
    var aggressive = vals.filter(function (v) { return /aggressive|hurried|fast|block/i.test(v); }).length;
    var defensive = vals.filter(function (v) { return /defensive|thorough|investigate|monitor/i.test(v); }).length;
    if (aggressive > defensive) return 'aggressive';
    if (defensive > aggressive) return 'defensive';
    return 'balanced';
  }

  function addPlayTime(gameId, seconds, state) {
    if (!state) state = load(gameId);
    state.totalPlayTime += seconds;
    return save(gameId, state);
  }

  global.HabibiProgression = {
    PREFIX: PREFIX,
    SEQUENCE: SEQUENCE,
    load: load,
    save: save,
    markLevelComplete: markLevelComplete,
    recordStoryChoice: recordStoryChoice,
    unlockSkillChallenge: unlockSkillChallenge,
    recordSkillScore: recordSkillScore,
    logFailure: logFailure,
    getFailureCount: getFailureCount,
    addAchievement: addAchievement,
    unlockNextGame: unlockNextGame,
    isGameUnlocked: isGameUnlocked,
    getCarriedStoryContext: getCarriedStoryContext,
    addPlayTime: addPlayTime
  };
})(typeof window !== 'undefined' ? window : globalThis);
