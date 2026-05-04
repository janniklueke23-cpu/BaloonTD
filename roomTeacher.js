class Raum extends Turm { // Herr Raum: Support-Turm der Geld produziert und Lehrer in Reichweite verstärkt
  constructor(x, y) { // Konstruktor mit Positions-Parametern
    super(x, y, 'raum', 200); // Basisklasse mit Typ und Kosten initialisieren
    this.name = 'Hr. Raum'; // Anzeigename des Lehrers
    this.reichweite = 110; // Wirkungsbereich in Pixeln (auch Buff-Reichweite)
    this.feuerRate = 240; // Geld wird alle 4 Sekunden produziert (60 fps * 4)
    this.schaden = 0; // Kein Direktschaden – Support-Lehrer
    this.kopfFarbe = [225, 200, 170]; // Hautfarbe des Kopfes
    this.koerperFarbe = [40, 130, 180]; // IT-Hemd in hellem Blau
    this.geldProTick = 5; // Münzen pro Produktionszyklus
    this.schadenBuff = 0.10; // +10% Schaden für Lehrer in Reichweite
    this.feuerRateBuff = 0; // Feuerrate-Bonus (0 = kein Bonus, 0.2 = 20% schneller)
    this.detektion = false; // Visualisiert versteckte Schüler (Spielfeature optional)
    this.trefferBonus = 0; // Münzen-Bonus wenn Lehrer in Reichweite Schüler treffen
    this._lastBallonsGeknallt = 0; // Vorheriger Ballon-Zähler für Treffer-Bonus
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Geld – mehr Münzen produzieren
        name: 'Geld',
        upgrades: [
          { name: 'Aktien',         beschreibung: 'Doppelt so viel Geld pro Tick',  kosten: 80  },
          { name: 'Treffer-Bonus',  beschreibung: 'Geld bei jedem Treffer in Reichweite', kosten: 160 },
          { name: 'Fußballwette',   beschreibung: 'Vierfache Geldproduktion',        kosten: 280 }
        ]
      },
      { // Pfad 1: Buff – verstärkt Lehrer in Reichweite
        name: 'Buff',
        upgrades: [
          { name: 'Stärkere Aura', beschreibung: '+20% Schaden für Lehrer in Reichweite', kosten: 80  },
          { name: 'Schnellfeuer',  beschreibung: '20% schnelleres Schießen für alle',     kosten: 160 },
          { name: 'Hacker-Modus',  beschreibung: '+30% Schaden, 30% schneller, +Geld',    kosten: 280 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach gewähltem Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Geld
      if (this.upgradeStufe === 1) { // Stufe 1: Aktien – mehr Geld
        this.geldProTick = 10; // Doppelte Geldproduktion
      } else if (this.upgradeStufe === 2) { // Stufe 2: Treffer-Bonus
        this.trefferBonus = 1; // Bonus-Münze pro Ballon-Treffer
      } else if (this.upgradeStufe === 3) { // Stufe 3: Fußballwette
        this.geldProTick = 20; // Vierfache Geldproduktion
        this.feuerRate = 180; // Etwas häufigere Auszahlung
      }
    } else { // Pfad 1: Buff
      if (this.upgradeStufe === 1) { // Stufe 1: Stärkere Aura
        this.schadenBuff = 0.20; // +20% Schaden
      } else if (this.upgradeStufe === 2) { // Stufe 2: Schnellfeuer
        this.feuerRateBuff = 0.20; // 20% schneller schießen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Hacker-Modus
        this.schadenBuff = 0.30; // +30% Schaden
        this.feuerRateBuff = 0.30; // 30% schneller
        this.geldProTick = 8; // Kleiner Geldbonus
      }
    }
  }

  update(gegner, spielGeschwindigkeit) { // Eigene Update-Methode: Buff anwenden, Geld produzieren
    this.feuerTimer -= spielGeschwindigkeit; // Timer für Geldauszahlung
    if (this.feuerTimer <= 0) { // Zeit für Geld-Tick?
      this._geldAuszahlen(); // Münzen ans Konto schreiben
      this.feuerTimer = this.feuerRate; // Timer zurücksetzen
    }
    if (this.trefferBonus > 0 && window.gs) { // Treffer-Bonus aktiv?
      let aktuell = window.gs.ballonsGeknallt || 0; // Aktuellen Stand holen
      if (aktuell > this._lastBallonsGeknallt) { // Neue Ballons geplatzt?
        let differenz = aktuell - this._lastBallonsGeknallt; // Anzahl neuer Treffer
        for (let i = 0; i < differenz; i++) { // Pro Treffer prüfen
          if (window.gs.wirtschaft) window.gs.wirtschaft.muenzenHinzufuegen(this.trefferBonus); // Bonus
        }
        this._lastBallonsGeknallt = aktuell; // Stand aktualisieren
      }
    } else if (window.gs) { // Treffer-Bonus inaktiv: Stand trotzdem nachführen
      this._lastBallonsGeknallt = window.gs.ballonsGeknallt || 0; // Stand merken
    }
  }

  _geldAuszahlen() { // Geld auf das Spielerkonto buchen mit kleinem Popup
    if (!window.gs || !window.gs.wirtschaft) return; // Sicherheitscheck
    window.gs.wirtschaft.muenzenHinzufuegen(this.geldProTick); // Münzen hinzufügen
    if (window.gs.spielSzene && window.gs.spielSzene._muenzPopupErstellen) { // Popup-Methode vorhanden?
      window.gs.spielSzene._muenzPopupErstellen(this.x, this.y - 20, '+' + this.geldProTick); // Popup erzeugen
    }
    if (window.gs.sound) window.gs.sound.muenzGewonnen(); // Sound: Münze
  }

  _schiessen() { /* Raum schießt nicht – Geld wird in update() ausgezahlt */ }

  _symbolZeichnen() { // Laptop-Symbol über dem Turm zeichnen
    noStroke(); // Kein Rand
    fill(60, 60, 70); // Dunkelgrau für den Laptop
    rect(-9, -55, 18, 12, 1); // Bildschirm-Rechteck
    fill(120, 220, 240); // Hellblauer Bildschirm
    rect(-7, -53, 14, 8, 1); // Bildschirm-Inhalt
    fill(40, 40, 50); // Tastatur dunkelgrau
    rect(-10, -44, 20, 3, 1); // Tastatur-Sockel
    fill(0, 200, 100); // Grüner "Hacker"-Text
    textSize(5); // Mini-Schrift
    textAlign(CENTER, CENTER); // Zentriert
    text('$', 0, -49); // Dollarzeichen als Symbol
  }

  draw() { // Überschriebene Zeichenmethode mit pulsierendem Buff-Ring
    super.draw(); // Basisturm zuerst zeichnen
    let zeigeRing = (this.schadenBuff > 0 || this.feuerRateBuff > 0); // Buff aktiv?
    if (zeigeRing && window.gs && window.gs.tuerme) { // Buff-Ring nur zeichnen wenn andere Lehrer in Reichweite
      let buffActive = window.gs.tuerme.some(t => t !== this && dist(this.x, this.y, t.x, t.y) <= this.reichweite); // Lehrer im Bereich?
      if (buffActive) { // Pulsierender Ring zur Visualisierung des Buffs
        noFill(); // Keine Füllung
        stroke(80, 200, 240, 70); // Halbtransparentes Cyan
        strokeWeight(2); // Linienstärke
        let pulse = sin(frameCount * 0.06) * 8; // Pulsations-Versatz
        ellipse(this.x, this.y, (this.reichweite + pulse) * 2, (this.reichweite + pulse) * 2); // Buff-Ring
      }
    }
  }
}
