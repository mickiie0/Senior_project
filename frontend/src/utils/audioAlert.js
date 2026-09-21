// Web Audio API Synthesizer for Emergency Fire & Smoke Alerts
// No external MP3/WAV files required. Works completely offline and synchronously.

class AudioAlertManager {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.currentOscillators = [];
  }

  isMuted() {
    return localStorage.getItem('fire_alarm_muted') === 'true';
  }

  setMuted(muted) {
    localStorage.setItem('fire_alarm_muted', muted ? 'true' : 'false');
    if (muted) {
      this.stop();
    }
  }

  toggleMute() {
    const next = !this.isMuted();
    this.setMuted(next);
    return next;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Dual-frequency emergency siren (Hi-Lo alarm sound)
  playFireAlert(durationSec = 4) {
    if (this.isMuted()) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      this.stop();
      this.isPlaying = true;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.18, ctx.currentTime);

      // Modulate frequency between 960Hz and 650Hz every 0.35s
      const now = ctx.currentTime;
      const cycleTime = 0.35;
      const cycles = Math.floor(durationSec / cycleTime);

      for (let i = 0; i < cycles; i++) {
        const time = now + i * cycleTime;
        const freq = i % 2 === 0 ? 960 : 660;
        osc.frequency.setValueAtTime(freq, time);
      }

      // Smooth fade out at the end
      gainNode.gain.setValueAtTime(0.18, now + durationSec - 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec);

      this.currentOscillators.push(osc);

      osc.onended = () => {
        this.isPlaying = false;
        this.currentOscillators = this.currentOscillators.filter((o) => o !== osc);
      };
    } catch (err) {
      console.warn('Unable to play audio alert:', err);
    }
  }

  // Quick double warning beep
  playWarningBeep() {
    if (this.isMuted()) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const playBeepAt = (startTime, freq = 880, duration = 0.12) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playBeepAt(now, 880, 0.12);
      playBeepAt(now + 0.18, 1100, 0.18);
    } catch (err) {
      console.warn('Unable to play warning beep:', err);
    }
  }

  stop() {
    this.currentOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // ignore if already stopped
      }
    });
    this.currentOscillators = [];
    this.isPlaying = false;
  }
}

export const audioAlert = new AudioAlertManager();
export default audioAlert;
