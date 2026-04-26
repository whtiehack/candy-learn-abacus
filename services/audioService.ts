// Audio Service - 本地音效文件 (public/sounds/)

const SOUND_SOURCES = {
  click: ['/sounds/click.mp3'],
  bead: ['/sounds/bead.mp3'],
  success: ['/sounds/success-1.mp3', '/sounds/success-2.mp3'],
  wrong: ['/sounds/wrong.mp3'],
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

  public setGlobalEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public play(type: SoundType) {
    if (!this.enabled || !this.initialized) return;
    if (type === 'click') return; // click 暂时不播放音效

    const sounds = this.soundPool[type];
    if (!sounds || sounds.length === 0) return;

    const audio = sounds[Math.floor(Math.random() * sounds.length)];
    try {
      if (audio.readyState >= 2) {
        audio.currentTime = 0;
      }
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }
}

export const audioService = new AudioService();
