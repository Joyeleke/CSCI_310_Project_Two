// ========================================
// MULTIPLAYER STATE
// ========================================

export const multiplayerState = {
  isMultiplayerMode: false,
  state: 'none', // none, connecting, waiting, countdown, racing, finished
  remotePlayer: null,
  localPlayerNumber: 1,
  lastPositionSendTime: 0,
  lastCollisionTime: 0,
};

// Reset multiplayer state
export function resetMultiplayerState() {
  multiplayerState.isMultiplayerMode = false;
  multiplayerState.state = 'none';
  multiplayerState.remotePlayer = null;
  multiplayerState.localPlayerNumber = 1;
  multiplayerState.lastPositionSendTime = 0;
  multiplayerState.lastCollisionTime = 0;
}

