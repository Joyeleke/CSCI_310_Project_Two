// ========================================
// MUSIC MANAGER
// ========================================

// Base path for assets (matches vite.config.js base)
const BASE_PATH = import.meta.env.BASE_URL || '/';

class MusicManager {
  constructor() {
    this.audio = null;
    this.tracks = [];
    this.shuffledQueue = [];
    this.currentTrackIndex = 0;
    this.volume = 0.5;
    this.isPlaying = false;
    this.isInitialized = false;
  }

  /**
   * Initialize the music manager with available tracks
   * @param {string[]} trackFiles - Array of track filenames
   */
  init(trackFiles) {
    this.tracks = trackFiles;
    this.shuffleQueue();
    this.loadSavedVolume();
    this.isInitialized = true;

    // Create audio element
    this.audio = new Audio();
    this.audio.volume = this.volume;

    // When track ends, play next
    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    // Handle errors
    this.audio.addEventListener('error', (e) => {
      console.error('Error loading audio:', e);
      // Try next track on error
      this.playNext();
    });
  }

  /**
   * Shuffle the queue - Fisher-Yates shuffle
   */
  shuffleQueue() {
    this.shuffledQueue = [...this.tracks];
    for (let i = this.shuffledQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledQueue[i], this.shuffledQueue[j]] = [this.shuffledQueue[j], this.shuffledQueue[i]];
    }
    this.currentTrackIndex = 0;
  }

  /**
   * Get the current track path
   */
  getCurrentTrackPath() {
    if (this.shuffledQueue.length === 0) return null;
    const track = this.shuffledQueue[this.currentTrackIndex];
    return `${BASE_PATH}music/${track}`;
  }

  /**
   * Play the current track
   */
  play() {
    if (!this.isInitialized || this.tracks.length === 0) return;

    const trackPath = this.getCurrentTrackPath();
    if (!trackPath) return;

    // Only change source if it's different
    if (this.audio.src !== trackPath) {
      this.audio.src = trackPath;
    }

    this.audio.play()
      .then(() => {
        this.isPlaying = true;
        console.log(`[Music] Now playing: ${this.shuffledQueue[this.currentTrackIndex]}`);
      })
      .catch((error) => {
        console.log('[Music] Playback prevented:', error.message);
        // Browser may block autoplay, will play on user interaction
      });
  }

  /**
   * Pause the current track
   */
  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Toggle play/pause
   */
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Play the next track in the queue
   */
  playNext() {
    this.currentTrackIndex++;

    // If we've played all tracks, reshuffle and start over
    if (this.currentTrackIndex >= this.shuffledQueue.length) {
      console.log('[Music] All tracks played, reshuffling queue...');
      this.shuffleQueue();
    }

    this.play();
  }

  /**
   * Play the previous track
   */
  playPrevious() {
    this.currentTrackIndex--;
    if (this.currentTrackIndex < 0) {
      this.currentTrackIndex = this.shuffledQueue.length - 1;
    }
    this.play();
  }

  /**
   * Set the volume (0.0 to 1.0)
   * @param {number} value - Volume level
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.saveVolume();
  }

  /**
   * Get the current volume
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Save volume to localStorage
   */
  saveVolume() {
    localStorage.setItem('blocky-music-volume', this.volume.toString());
  }

  /**
   * Load volume from localStorage
   */
  loadSavedVolume() {
    const saved = localStorage.getItem('blocky-music-volume');
    if (saved !== null) {
      this.volume = parseFloat(saved);
    }
  }

  /**
   * Start playing music (call on user interaction to avoid autoplay issues)
   */
  start() {
    if (!this.isPlaying) {
      this.play();
    }
  }
}

// Export singleton instance
export const musicManager = new MusicManager();

// List of available tracks - add more tracks here as needed
const AVAILABLE_TRACKS = [
  'Midnight Rendezvous.mp3',
];

// Initialize with available tracks
musicManager.init(AVAILABLE_TRACKS);

