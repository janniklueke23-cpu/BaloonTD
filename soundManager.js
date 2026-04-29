// soundManager.js – Erzeugt alle Spielgeräusche programmatisch mit p5.js Oscillator/Envelope

class SoundManager { // Klasse für alle Spielgeräusche
  constructor(einstellungsManager) { // Konstruktor: erhält den Einstellungs-Manager
    this.einstellungen = einstellungsManager; // Einstellungen-Referenz speichern
    this.audioKontextGestartet = false; // Ob der Audio-Kontext bereits läuft (Browser-Richtlinie)
    this.letzterBossSound = 0; // Zeitstempel des letzten Boss-Sounds (verhindert Mehrfach-Abspielen)
  }

  aktivieren() { // Audio-Kontext nach Nutzerinteraktion starten (Browser-Sicherheitsrichtlinie)
    if (this.audioKontextGestartet) return; // Bereits aktiviert: nichts tun
    try { // Versuche den Audio-Kontext zu starten
      if (typeof getAudioContext === 'function') { // p5.sound API vorhanden?
        getAudioContext().resume(); // Audio-Kontext fortsetzen/starten
        this.audioKontextGestartet = true; // Als gestartet markieren
      }
    } catch (e) { // Fehler beim Starten (Browser blockiert möglicherweise)
      console.warn('Audio-Kontext konnte nicht gestartet werden:', e); // Warnung ausgeben
    }
  }

  _lautstaerke() { // Aktuelle Lautstärke aus den Einstellungen lesen (0.0 bis 1.0)
    if (!this.einstellungen.get('soundEin')) return 0; // Sound ausgeschaltet: Lautstärke 0
    return this.einstellungen.get('lautstaerke') / 100; // Prozent zu Dezimalzahl umrechnen
  }

  _spieleTon(freq, wellenform, attack, abklingen, lautstaerke, verzoegerungMs) { // Einen Ton abspielen
    let vol = this._lautstaerke() * lautstaerke; // Effektive Lautstärke berechnen
    if (vol <= 0) return; // Lautlos: nichts tun
    if (!this.audioKontextGestartet) return; // Audio nicht bereit: nichts tun
    let spielen = () => { // Innere Funktion zum tatsächlichen Abspielen
      try { // Fehlerbehandlung für Audio-Fehler
        let osc = new p5.Oscillator(freq, wellenform); // Neuen Oszillator mit Frequenz und Wellenform erstellen
        let env = new p5.Envelope(); // Neue Hüllkurve (ADSR) erstellen
        env.setADSR(attack, abklingen, 0.0, abklingen * 0.3); // Hüllkurve: Attack, Decay, Sustain(0), Release
        env.setRange(vol, 0); // Lautstärke: von vol bis 0 (klingt ab)
        osc.amp(env); // Lautstärke des Oszillators mit Hüllkurve steuern
        osc.start(); // Oszillator starten
        env.play(osc); // Hüllkurve auf Oszillator anwenden
        let gesamtDauer = (attack + abklingen * 1.5) * 1000 + 300; // Gesamtdauer in Millisekunden
        setTimeout(() => { // Nach der Dauer den Oszillator stoppen
          try { osc.stop(); osc.disconnect(); } catch (e2) {} // Sicher stoppen und trennen
        }, gesamtDauer); // Timeout setzen
      } catch (e) { // Fehler beim Abspielen
        // Fehler still ignorieren (kein Crash wegen Audio-Problemen)
      }
    };
    if (verzoegerungMs > 0) { // Verzögerung gewünscht?
      setTimeout(spielen, verzoegerungMs); // Verzögert abspielen
    } else { // Keine Verzögerung
      spielen(); // Sofort abspielen
    }
  }

  // ─── Öffentliche Sound-Methoden ───────────────────────────────────────────

  ballonPlatzen(typ) { // Ballon-Platzen-Sound (unterschiedlich je nach Typ)
    const configs = { // Frequenz je nach Ballontyp
      rot:    [900, 'triangle', 0.005, 0.12, 0.35], // Hoch und kurz für rote Ballons
      blau:   [700, 'triangle', 0.005, 0.14, 0.35], // Etwas tiefer für blaue
      gruen:  [580, 'triangle', 0.005, 0.16, 0.35], // Mittel für grüne
      gelb:   [420, 'sine',     0.008, 0.20, 0.40], // Tiefer für gepanzerte gelbe
      schwarz:[180, 'sawtooth', 0.01,  0.40, 0.55]  // Sehr tief und lang für den Boss
    };
    let c = configs[typ] || configs['blau']; // Konfiguration holen, Fallback auf Blau
    this._spieleTon(c[0], c[1], c[2], c[3], c[4], 0); // Ton abspielen
  }

  turmSchiessen(typ) { // Turm-Schuss-Sound (je nach Turmtyp unterschiedlich)
    const configs = { // Frequenz und Wellenform je nach Turmtyp
      blech:    [480, 'square',   0.004, 0.07, 0.13], // Helles Kratzen für Kreide
      pfister:  [220, 'sine',     0.012, 0.20, 0.20], // Dumpfes Klirren für Bierflasche
      koch:     [160, 'sawtooth', 0.008, 0.28, 0.30], // Tiefes Rascheln für Verweis-Papier
      pfingsten:[340, 'sine',     0.006, 0.15, 0.10]  // Weiches Murmeln für Geschichten
    };
    let c = configs[typ] || [440, 'sine', 0.01, 0.1, 0.15]; // Konfiguration holen, Fallback
    this._spieleTon(c[0], c[1], c[2], c[3], c[4], 0); // Ton abspielen
  }

  welleBeginn() { // Aufsteigender Dreiklang wenn eine neue Welle beginnt
    this._spieleTon(440, 'sine', 0.05, 0.25, 0.45, 0);   // Erste Note: A4
    this._spieleTon(554, 'sine', 0.05, 0.25, 0.45, 160); // Zweite Note: C#5
    this._spieleTon(659, 'sine', 0.05, 0.35, 0.45, 320); // Dritte Note: E5 (Dreiklang)
  }

  welleEnde() { // Kleine Fanfare wenn eine Welle abgeschlossen wird
    this._spieleTon(523, 'sine', 0.04, 0.18, 0.38, 0);   // C5
    this._spieleTon(659, 'sine', 0.04, 0.18, 0.38, 180); // E5
    this._spieleTon(784, 'sine', 0.04, 0.35, 0.38, 360); // G5 (C-Dur Dreiklang)
  }

  spielEnde(gewonnen) { // Abschluss-Sound: Sieg-Fanfare oder Niederlage-Melodie
    if (gewonnen) { // Sieg-Fanfare: aufsteigend und feierlich
      this._spieleTon(523,  'sine', 0.05, 0.25, 0.55, 0);   // C5
      this._spieleTon(659,  'sine', 0.05, 0.25, 0.55, 200); // E5
      this._spieleTon(784,  'sine', 0.05, 0.25, 0.55, 400); // G5
      this._spieleTon(1047, 'sine', 0.05, 0.55, 0.55, 600); // C6 (Oktave höher)
    } else { // Niederlage-Melodie: absteigend und düster
      this._spieleTon(440, 'sine', 0.05, 0.45, 0.55, 0);   // A4
      this._spieleTon(349, 'sine', 0.05, 0.45, 0.55, 380); // F4
      this._spieleTon(220, 'sine', 0.05, 0.75, 0.55, 760); // A3 (tief und endgültig)
    }
  }

  muenzGewonnen() { // Kurzes "Ding" wenn Münzen verdient werden
    this._spieleTon(1047, 'sine', 0.005, 0.08, 0.20, 0); // Heller kurzer Ton
  }

  turmPlatziert() { // Zweistufiger Klick-Sound wenn ein Turm gesetzt wird
    this._spieleTon(330, 'square', 0.005, 0.08, 0.22, 0);  // Erster Klick-Teil
    this._spieleTon(440, 'square', 0.005, 0.08, 0.22, 75); // Zweiter Klick-Teil (leicht höher)
  }

  upgradeGekauft() { // Level-Up-Jingle wenn ein Upgrade gekauft wird
    this._spieleTon(440, 'sine', 0.04, 0.15, 0.42, 0);   // Note 1
    this._spieleTon(554, 'sine', 0.04, 0.15, 0.42, 120); // Note 2
    this._spieleTon(659, 'sine', 0.04, 0.15, 0.42, 240); // Note 3
    this._spieleTon(880, 'sine', 0.04, 0.35, 0.42, 360); // Note 4 (Oktave)
  }

  bossErscheint() { // Dramatischer tiefer Ton wenn ein Boss erscheint
    let jetzt = Date.now(); // Aktuellen Zeitstempel holen
    if (jetzt - this.letzterBossSound < 3000) return; // Nicht öfter als alle 3 Sekunden
    this.letzterBossSound = jetzt; // Zeitstempel aktualisieren
    this._spieleTon(110, 'sawtooth', 0.08, 0.55, 0.62, 0);   // Tiefer dramatischer Ton
    this._spieleTon(82,  'sawtooth', 0.08, 0.75, 0.62, 450); // Noch tieferer zweiter Ton
  }

  menuKlick() { // Kurzer Klick-Sound für Menü-Buttons
    this._spieleTon(660, 'square', 0.004, 0.06, 0.18, 0); // Kurzer Klick
  }
}
