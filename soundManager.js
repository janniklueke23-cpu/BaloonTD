// soundManager.js – Erzeugt alle Spielgeräusche programmatisch mit nativer Web Audio API

class SoundManager {
  constructor(einstellungsManager) {
    this.einstellungen = einstellungsManager;
    this.audioKontextGestartet = false;
    this.letzterBossSound = 0;
    this._ctx = null;
  }

  aktivieren() {
    if (this.audioKontextGestartet) return;
    try {
      if (!this._ctx) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      this._ctx.resume();
      this.audioKontextGestartet = true;
    } catch (e) {
      console.warn('Audio-Kontext konnte nicht gestartet werden:', e);
    }
  }

  _lautstaerke() {
    if (!this.einstellungen.get('soundEin')) return 0;
    return this.einstellungen.get('lautstaerke') / 100;
  }

  _spieleTon(freq, wellenform, attack, abklingen, lautstaerke, verzoegerungMs) {
    let vol = this._lautstaerke() * lautstaerke;
    if (vol <= 0) return;
    if (!this.audioKontextGestartet || !this._ctx) return;
    let spielen = () => {
      try {
        let ctx = this._ctx;
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.type = wellenform;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        let now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + attack);
        gain.gain.linearRampToValueAtTime(0, now + attack + abklingen);
        osc.start(now);
        osc.stop(now + attack + abklingen * 1.5 + 0.1);
      } catch (e) {}
    };
    if (verzoegerungMs > 0) {
      setTimeout(spielen, verzoegerungMs);
    } else {
      spielen();
    }
  }

  // ─── Öffentliche Sound-Methoden ───────────────────────────────────────────

  ballonPlatzen(typ) {
    const configs = {
      rot:    [900, 'triangle', 0.005, 0.12, 0.35],
      blau:   [700, 'triangle', 0.005, 0.14, 0.35],
      gruen:  [580, 'triangle', 0.005, 0.16, 0.35],
      gelb:   [420, 'sine',     0.008, 0.20, 0.40],
      schwarz:[180, 'sawtooth', 0.01,  0.40, 0.55]
    };
    let c = configs[typ] || configs['blau'];
    this._spieleTon(c[0], c[1], c[2], c[3], c[4], 0);
  }

  turmSchiessen(typ) {
    const configs = {
      blech:    [480, 'square',   0.004, 0.07, 0.13],
      pfister:  [220, 'sine',     0.012, 0.20, 0.20],
      koch:     [160, 'sawtooth', 0.008, 0.28, 0.30],
      pfingsten:[340, 'sine',     0.006, 0.15, 0.10]
    };
    let c = configs[typ] || [440, 'sine', 0.01, 0.1, 0.15];
    this._spieleTon(c[0], c[1], c[2], c[3], c[4], 0);
  }

  welleBeginn() {
    this._spieleTon(440, 'sine', 0.05, 0.25, 0.45, 0);
    this._spieleTon(554, 'sine', 0.05, 0.25, 0.45, 160);
    this._spieleTon(659, 'sine', 0.05, 0.35, 0.45, 320);
  }

  welleEnde() {
    this._spieleTon(523, 'sine', 0.04, 0.18, 0.38, 0);
    this._spieleTon(659, 'sine', 0.04, 0.18, 0.38, 180);
    this._spieleTon(784, 'sine', 0.04, 0.35, 0.38, 360);
  }

  spielEnde(gewonnen) {
    if (gewonnen) {
      this._spieleTon(523,  'sine', 0.05, 0.25, 0.55, 0);
      this._spieleTon(659,  'sine', 0.05, 0.25, 0.55, 200);
      this._spieleTon(784,  'sine', 0.05, 0.25, 0.55, 400);
      this._spieleTon(1047, 'sine', 0.05, 0.55, 0.55, 600);
    } else {
      this._spieleTon(440, 'sine', 0.05, 0.45, 0.55, 0);
      this._spieleTon(349, 'sine', 0.05, 0.45, 0.55, 380);
      this._spieleTon(220, 'sine', 0.05, 0.75, 0.55, 760);
    }
  }

  muenzGewonnen() {
    this._spieleTon(1047, 'sine', 0.005, 0.08, 0.20, 0);
  }

  turmPlatziert() {
    this._spieleTon(330, 'square', 0.005, 0.08, 0.22, 0);
    this._spieleTon(440, 'square', 0.005, 0.08, 0.22, 75);
  }

  upgradeGekauft() {
    this._spieleTon(440, 'sine', 0.04, 0.15, 0.42, 0);
    this._spieleTon(554, 'sine', 0.04, 0.15, 0.42, 120);
    this._spieleTon(659, 'sine', 0.04, 0.15, 0.42, 240);
    this._spieleTon(880, 'sine', 0.04, 0.35, 0.42, 360);
  }

  bossErscheint() {
    let jetzt = Date.now();
    if (jetzt - this.letzterBossSound < 3000) return;
    this.letzterBossSound = jetzt;
    this._spieleTon(110, 'sawtooth', 0.08, 0.55, 0.62, 0);
    this._spieleTon(82,  'sawtooth', 0.08, 0.75, 0.62, 450);
  }

  menuKlick() {
    this._spieleTon(660, 'square', 0.004, 0.06, 0.18, 0);
  }
}
