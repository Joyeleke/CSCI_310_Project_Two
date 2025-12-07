import { gameState, personalBests, formatTime, checkAndSavePersonalBest } from '../state/gameState.js';

// ========================================
// UI MANAGER
// ========================================

// UI elements cache
const elements = {
  overlay: document.getElementById("overlay"),
  startBtn: document.getElementById("start-btn"),
  restartGameBtn: document.getElementById("restart-game-btn"),
  difficultySection: document.getElementById("difficulty-section"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayText: document.getElementById("overlay-text"),
  overlayMsg: document.getElementById("overlay-msg"),
  counterDiv: document.getElementById("counter"),
  timerDiv: document.getElementById("timer"),
  levelDiv: document.getElementById("level"),
  pbTableSection: document.getElementById("pb-table-section"),
  // Multiplayer UI elements
  connectionOverlay: document.getElementById('connection-overlay'),
  connectionStatus: document.getElementById('connection-status'),
  cancelMatchmakingBtn: document.getElementById('cancel-matchmaking'),
  countdownDisplay: document.getElementById('countdown-display'),
  opponentHud: document.getElementById('opponent-hud'),
  opponentHeightSpan: document.getElementById('opponent-height'),
  raceResultOverlay: document.getElementById('race-result-overlay'),
  raceResultTitle: document.getElementById('race-result-title'),
  raceResultMessage: document.getElementById('race-result-message'),
  rematchBtn: document.getElementById('rematch-btn'),
  backToMenuBtn: document.getElementById('back-to-menu-btn'),
  multiplayerBtn: document.getElementById('multiplayer-btn'),
};

export function getUIElements() {
  return elements;
}

// ========================================
// OVERLAY MANAGEMENT
// ========================================

export function hideOverlay() {
  if (elements.overlay) elements.overlay.style.display = "none";
}

export function showOverlay() {
  if (elements.overlay) elements.overlay.style.display = "flex";
}

// ========================================
// PERSONAL BEST DISPLAY
// ========================================

export function updatePBDisplay() {
  const pbEasy = document.getElementById('pb-easy');
  const pbMedium = document.getElementById('pb-medium');
  const pbHard = document.getElementById('pb-hard');

  if (pbEasy) pbEasy.textContent = formatTime(personalBests.easy) || '-';
  if (pbMedium) pbMedium.textContent = formatTime(personalBests.medium) || '-';
  if (pbHard) pbHard.textContent = formatTime(personalBests.hard) || '-';
}

// ========================================
// HUD UPDATES
// ========================================

export function updateLevelDisplay(currentLevel, totalLevels, difficultyLabel) {
  if (elements.levelDiv) {
    elements.levelDiv.textContent = `Level ${currentLevel}/${totalLevels} • ${difficultyLabel}`;
  }
}

export function updateCounter(playerY) {
  if (elements.counterDiv) {
    const displayY = playerY > 0 ? playerY : 0;
    elements.counterDiv.textContent = `${displayY.toFixed(2)} m`;
  }
}

export function updateTimer(currentTime, gameStartTime, totalPausedTime) {
  if (elements.timerDiv && gameStartTime > 0) {
    const currentGameTime = currentTime - gameStartTime - totalPausedTime;
    const seconds = Math.floor(currentGameTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    const milliseconds = Math.floor((currentGameTime % 1000) / 10);

    elements.timerDiv.textContent = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
}

export function updateOpponentHeight(opponentY) {
  if (elements.opponentHeightSpan) {
    const displayOpponentY = opponentY > 0 ? opponentY : 0;
    elements.opponentHeightSpan.textContent = displayOpponentY.toFixed(2);
  }
}

// ========================================
// GAME OVERLAYS
// ========================================

export function showPauseMenu() {
  gameState.pausedTime = performance.now();
  gameState.isPauseMenuOpen = true;
  gameState.isPaused = true;

  if (elements.overlayTitle) elements.overlayTitle.textContent = "Game Paused";
  if (elements.overlayText) elements.overlayText.textContent = "Take a break! You can resume or restart the entire game.";
  if (elements.overlayMsg) elements.overlayMsg.textContent = "Press ESC to Resume";
  if (elements.startBtn) elements.startBtn.textContent = "Resume";
  if (elements.restartGameBtn) elements.restartGameBtn.style.display = "inline-block";
  if (elements.difficultySection) elements.difficultySection.style.display = "none";
  if (elements.pbTableSection) elements.pbTableSection.style.display = "block";

  updatePBDisplay();
  showOverlay();
}

export function showWinOverlay() {
  if (gameState.gameStartTime > 0) {
    const completionTime = performance.now() - gameState.gameStartTime - gameState.totalPausedTime;
    const isNewRecord = checkAndSavePersonalBest(completionTime, gameState.selectedDifficultyLabel);

    if (isNewRecord) {
      if (elements.overlayTitle) elements.overlayTitle.textContent = "New Personal Best!";
      if (elements.overlayText) elements.overlayText.textContent = `Congratulations! You completed ${gameState.selectedDifficultyLabel} difficulty in ${formatTime(completionTime)}. Want to try again or attempt a different difficulty?`;
    } else {
      if (elements.overlayTitle) elements.overlayTitle.textContent = "You Win!";
      if (elements.overlayText) elements.overlayText.textContent = `Great climb! You completed ${gameState.selectedDifficultyLabel} difficulty in ${formatTime(completionTime)}. Want to run it again or try a different difficulty?`;
    }
  } else {
    if (elements.overlayTitle) elements.overlayTitle.textContent = "You Win!";
    if (elements.overlayText) elements.overlayText.textContent = "Great climb. Want to run it again or try a different difficulty?";
  }

  if (elements.overlayMsg) elements.overlayMsg.textContent = "Press Space or Click Restart";
  if (elements.startBtn) elements.startBtn.textContent = "Restart";
  if (elements.restartGameBtn) elements.restartGameBtn.style.display = "none";
  if (elements.difficultySection) elements.difficultySection.style.display = "block";
  if (elements.pbTableSection) elements.pbTableSection.style.display = "none";

  showOverlay();
}

export function showStartOverlay() {
  if (elements.overlayTitle) elements.overlayTitle.textContent = "Blocky's Big Adventure";
  if (elements.overlayText) elements.overlayText.textContent = "Blocky, a small adventurous block, is swept away into a mysterious world of floating platforms and deadly spikes. With courage and precision, you must guide Blocky through each perilous level to find the way back home.";
  if (elements.overlayMsg) elements.overlayMsg.textContent = "Press Space or Click Start";
  if (elements.startBtn) elements.startBtn.textContent = "Start";
  if (elements.restartGameBtn) elements.restartGameBtn.style.display = "none";
  if (elements.difficultySection) elements.difficultySection.style.display = "block";
  if (elements.pbTableSection) elements.pbTableSection.style.display = "none";

  showOverlay();
}

// ========================================
// MULTIPLAYER UI
// ========================================

export function showConnectionOverlay(message) {
  if (elements.connectionStatus) elements.connectionStatus.textContent = message;
  if (elements.connectionOverlay) elements.connectionOverlay.style.display = 'flex';
}

export function hideConnectionOverlay() {
  if (elements.connectionOverlay) elements.connectionOverlay.style.display = 'none';
}

export function showCountdown(count) {
  if (elements.countdownDisplay) {
    elements.countdownDisplay.textContent = count === 0 ? 'GO!' : count.toString();
    elements.countdownDisplay.style.display = 'flex';
  }
}

export function hideCountdown() {
  if (elements.countdownDisplay) elements.countdownDisplay.style.display = 'none';
}

export function showOpponentHud() {
  if (elements.opponentHud) elements.opponentHud.style.display = 'block';
}

export function hideOpponentHud() {
  if (elements.opponentHud) elements.opponentHud.style.display = 'none';
}

export function showRaceResult(isWinner, reason) {
  if (elements.raceResultTitle) {
    elements.raceResultTitle.textContent = isWinner ? '🎉 You Win!' : '😔 You Lose';
    elements.raceResultTitle.style.color = isWinner ? '#00ff88' : '#ff6666';
  }
  if (elements.raceResultMessage) {
    if (reason === 'opponent_disconnected') {
      elements.raceResultMessage.textContent = 'Your opponent disconnected.';
    } else if (reason === 'reached_top') {
      elements.raceResultMessage.textContent = isWinner
        ? 'You reached the top first!'
        : 'Your opponent reached the top first.';
    } else {
      elements.raceResultMessage.textContent = '';
    }
  }
  if (elements.raceResultOverlay) elements.raceResultOverlay.style.display = 'flex';
}

export function hideRaceResult() {
  if (elements.raceResultOverlay) elements.raceResultOverlay.style.display = 'none';
}

export function showCancelMatchmaking() {
  if (elements.cancelMatchmakingBtn) elements.cancelMatchmakingBtn.style.display = 'inline-block';
}

export function hideCancelMatchmaking() {
  if (elements.cancelMatchmakingBtn) elements.cancelMatchmakingBtn.style.display = 'none';
}

