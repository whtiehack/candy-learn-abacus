// Local sound files
// Please ensure you have created a 'sounds' folder in your project root
// and added 'click.mp3', 'bead.mp3', and 'success.mp3'.

const SOUND_URLS = {
  // Common formats: .mp3 is best for cross-browser/iOS compatibility.
  // If you downloaded .ogg files, either convert them to .mp3 
  // or change the extensions below to .ogg
  click: './sounds/click.mp3', 
  bead: './sounds/bead.mp3',
  success: './sounds/success.mp3',
};

type SoundType = keyof typeof SOUND_URLS;

class AudioService {
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    // Preload audios
    if (typeof window !== 'undefined') {
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        
        // Add simple error handling to help developer
        audio.onerror = () => {
          console.warn(`[AudioService] Failed to load sound: ${url}. Please ensure the file exists in the 'sounds' folder.`);
        };

        this.sounds[key] = audio;
      });
      this.initialized = true;
    }
  }

  /**
   * Update the global enabled state based on user settings
   */
  public setGlobalEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Play a specific sound effect
   */
  public play(type: SoundType) {
    if (!this.enabled || !this.initialized) return;

    const audio = this.sounds[type];
    if (audio) {
      // Clone node allows overlapping sounds (e.g. rapid typing/bead movement)
      // However, cloning requests the file again which might cause lag on some devices.
      // For simple games, resetting currentTime is usually efficient enough.
      try {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
            audio.currentTime = 0;
            const promise = audio.play();
            if (promise !== undefined) {
              promise.catch(error => {
                // Auto-play policy or file loading error
                // console.warn('Audio play failed', error);
              });
            }
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }
}

export const audioService = new AudioService();