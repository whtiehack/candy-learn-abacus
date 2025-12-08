// Audio Service
// 使用在线音效链接

const SOUND_SOURCES = {
  click: [
    'https://downsc.chinaz.net/Files/DownLoad/sound1/202506/xm3756.mp3'
  ],
  bead: [
    'https://downsc.chinaz.net/Files/DownLoad/sound1/202505/xm3683.mp3'
  ],
  success: [
    'https://downsc.chinaz.net/Files/DownLoad/sound1/201702/8378.mp3',
    'https://downsc.chinaz.net/Files/DownLoad/sound1/202203/y684.mp3',
    //'https://downsc.chinaz.net/Files/DownLoad/sound1/202408/xm2990.mp3' // 这个音效不好，暂时不用
  ],
  wrong: [
     'https://downsc.chinaz.net/Files/DownLoad/sound1/202203/15478.mp3'
  ]
};

type SoundType = keyof typeof SOUND_SOURCES;

class AudioService {
  private soundPool: Record<string, HTMLAudioElement[]> = {};
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    Object.entries(SOUND_SOURCES).forEach(([key, urls]) => {
      this.soundPool[key] = urls.map(url => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.onerror = () => {
          console.warn(`[AudioService] Failed to load sound: ${url}`);
        };
        return audio;
      });
    });
    this.initialized = true;
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
    if(type == "click") {
      // click 暂时不播放音效
      return;
    }
    const sounds = this.soundPool[type];
    if (sounds && sounds.length > 0) {
      // Pick a random sound from the pool (useful for 'success' variations)
      const audio = sounds[Math.floor(Math.random() * sounds.length)];
      
      try {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
            audio.currentTime = 0;
            const promise = audio.play();
            if (promise !== undefined) {
              promise.catch(error => {
                // Ignore auto-play blocking errors
              });
            }
        } else {
            audio.play().catch(() => {});
        }
      } catch (e) {
        // Ignore critical errors
      }
    }
  }
}

export const audioService = new AudioService();