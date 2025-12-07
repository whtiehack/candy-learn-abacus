// Audio Service
// 使用本地文件 (需要在项目根目录下或 public 目录下存在 sounds 文件夹)

const SOUND_URLS = {
  // 使用绝对路径 (以 / 开头)，确保在任何路由下都能找到文件
  // 请确保文件路径为: [项目根目录]/sounds/click.mp3 (或 public/sounds/click.mp3)
  click: '/sounds/click.mp3', 
  bead: '/sounds/bead.mp3',
  success: '/sounds/success.mp3',
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
        
        // Error handling
        audio.onerror = () => {
          console.warn(`[AudioService] 无法加载音效文件: ${url}. 请检查 'sounds' 文件夹是否在 public 目录或项目根目录下，且文件名正确 (click.mp3, bead.mp3, success.mp3)。`);
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
      try {
        // 尝试重置播放进度以支持快速连点
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
            audio.currentTime = 0;
            const promise = audio.play();
            if (promise !== undefined) {
              promise.catch(error => {
                // 忽略 "用户未交互前无法播放音频" 的标准浏览器错误
                // console.debug('Audio auto-play prevented', error);
              });
            }
        } else {
            // 如果音频还没加载完，尝试直接播放
            audio.play().catch(() => {});
        }
      } catch (e) {
        // Ignore critical errors
      }
    }
  }
}

export const audioService = new AudioService();