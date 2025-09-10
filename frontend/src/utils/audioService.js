class AudioService {
  constructor() {
    this.audio = null;
    this.sentAudio = null;
    this.isEnabled = true;
    this.hasUserInteracted = false;
    this.volume = 0.5;
    this.initAttempts = 0;
    this.maxInitAttempts = 3;
    this.initialized = false;
  }

  // Initialize audio on first user interaction
  initialize() {
    // Prevent excessive initialization attempts
    if (this.initAttempts >= this.maxInitAttempts) return;
    this.initAttempts++;
    
    if (!this.audio) {
      console.log("🔊 Initializing audio service (attempt " + this.initAttempts + ")");
      
      // Create audio elements
      this.audio = new Audio('/notification-subtle.mp3');
      this.sentAudio = new Audio('/notification-subtle.mp3');
      
      // Set properties
      this.audio.volume = this.volume;
      this.sentAudio.volume = this.volume;
      this.audio.preload = 'auto';
      this.sentAudio.preload = 'auto';
      
      // Load audio
      this.audio.load();
      this.sentAudio.load();
      
      // Try playing silently to unlock audio
      this.unlockAudio();
      
      console.log("🔊 Audio service initialized");
      this.initialized = true;
    }
    
    this.hasUserInteracted = true;
  }
  
  // Try to unlock audio by playing silently
  unlockAudio() {
    const unlockPlay = (audioElement) => {
      if (!audioElement) return Promise.resolve();
      
      // Save current volume
      const originalVolume = audioElement.volume;
      
      // Set to silent
      audioElement.volume = 0;
      
      // Try to play
      return audioElement.play()
        .then(() => {
          // Immediately pause
          audioElement.pause();
          audioElement.currentTime = 0;
          
          // Restore volume
          audioElement.volume = originalVolume;
          console.log("🔊 Audio unlocked successfully");
          return true;
        })
        .catch(err => {
          console.log("🔊 Could not unlock audio:", err.message);
          audioElement.volume = originalVolume;
          return false;
        });
    };
    
    // Try to unlock both audio objects
    Promise.all([
      unlockPlay(this.audio),
      unlockPlay(this.sentAudio)
    ]).then(results => {
      if (results.some(success => success)) {
        console.log("🔊 Audio system unlocked");
      } else {
        console.log("🔊 Audio unlock unsuccessful, will try again on user interaction");
      }
    });
  }

  // Play notification sound for received messages
  async playNotification() {
    try {
      // Auto-initialize if needed
      if (!this.audio) {
        this.initialize();
      }
      
      if (!this.isEnabled) return; // Don't play if disabled
      
      // Reset audio to beginning and play
      this.audio.currentTime = 0;
      await this.audio.play();
      console.log("🔊 Notification sound played successfully");
    } catch (error) {
      console.error("🔊 Audio play failed:", error);
      // Try to initialize again on failure
      this.initialize();
    }
  }

  // Play notification for sent messages
  async playSentSound() {
    try {
      // Auto-initialize if needed
      if (!this.sentAudio) {
        this.initialize();
      }
      
      if (!this.isEnabled) return; // Don't play if disabled

      // If we don't have a dedicated sent sound yet, use the regular notification sound
      const soundToPlay = this.sentAudio || this.audio;
      
      // Reset audio to beginning and play
      soundToPlay.currentTime = 0;
      await soundToPlay.play();
      console.log("🔊 Message sent sound played successfully");
    } catch (error) {
      console.error("🔊 Sent sound play failed:", error);
      // Try to initialize again on failure
      this.initialize();
    }
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    if (this.sentAudio) {
      this.sentAudio.volume = this.volume;
    }
  }

  // Enable/disable sound
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Create singleton instance
export const audioService = new AudioService();

// Make it globally available
window.audioService = audioService;

// Auto-initialize on first user interaction - MORE AGGRESSIVE
const initializeAudioOnUserAction = () => audioService.initialize();

// Add more event listeners to catch any user interaction
document.addEventListener('click', initializeAudioOnUserAction);
document.addEventListener('keydown', initializeAudioOnUserAction);
document.addEventListener('touchstart', initializeAudioOnUserAction);
document.addEventListener('mousedown', initializeAudioOnUserAction);
document.addEventListener('pointerdown', initializeAudioOnUserAction);