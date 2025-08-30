class AudioService {
  constructor() {
    this.audio = null;
    this.isEnabled = true;
    this.hasUserInteracted = false;
    this.volume = 0.3;
  }

  // Initialize audio on first user interaction
  initialize() {
    if (!this.audio) {
      this.audio = new Audio('/notification-subtle.mp3');
      this.audio.volume = this.volume;
      this.audio.load(); // Preload the audio
      console.log("🔊 Audio service initialized");
    }
    this.hasUserInteracted = true;
  }

  // Play notification sound
  async playNotification() {
    if (!this.hasUserInteracted || !this.isEnabled) {
      console.log("🔊 Audio not available: user hasn't interacted or audio disabled");
      return;
    }

    if (!this.audio) {
      this.initialize();
    }

    try {
      // Reset audio to beginning
      this.audio.currentTime = 0;
      await this.audio.play();
      console.log("🔊 Notification sound played successfully");
    } catch (error) {
      console.error("🔊 Audio play failed:", error);
      
      // Handle browser audio policy restrictions
      if (error.name === 'NotAllowedError') {
        console.log("🔊 Audio blocked by browser policy - user interaction required");
        this.isEnabled = false;
      }
    }
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    console.log("🔊 Audio volume set to:", this.volume);
  }

  // Enable/disable sound
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log("🔊 Audio", enabled ? "enabled" : "disabled");
  }

  // Check if audio is ready to play
  isReady() {
    return this.hasUserInteracted && this.isEnabled;
  }
}

// Create singleton instance
export const audioService = new AudioService();

// Auto-initialize on first user interaction
const initializeOnInteraction = () => {
  audioService.initialize();
  // Remove listeners after first interaction
  document.removeEventListener('click', initializeOnInteraction);
  document.removeEventListener('keydown', initializeOnInteraction);
  document.removeEventListener('touchstart', initializeOnInteraction);
};

// Listen for various interaction events
document.addEventListener('click', initializeOnInteraction, { once: true });
document.addEventListener('keydown', initializeOnInteraction, { once: true });
document.addEventListener('touchstart', initializeOnInteraction, { once: true });