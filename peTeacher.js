class Pfingsten extends Turm { // Pfingsten-Klasse erbt von der Turm-Basisklasse
  constructor(x, y) { // Konstruktor mit Positions-Parametern
    super(x, y, 'pfingsten', 130); // Basisklasse mit Typ und Kosten initialisieren
    this.name = 'Herr Pfingsten'; // Anzeigename des Lehrers
    this.reichweite = 135; // Wirkungsbereich in Pixeln
    this.feuerRate = 12; // Häufiger Auslöser für Flächeneffekt
    this.schaden = 0; // Kein direkter Schaden
    this.kopfFarbe = [230, 200, 170]; // Hautfarbe des Kopfes
    this.koerperFarbe = [70, 100, 50]; // Dunkelgrüne Körperfarbe
    this.maxVerlangsamt = 3; // Maximale Anzahl verlangsamter Schüler
    this.verlangsamDauer = 80; // Dauer der Verlangsamung in Frames
    this.verlangsamStaerke = 0.5; // Ziel bewegt sich mit 50% Geschwindigkeit
    this.machSchaden = false; // Stufe 2: Macht Langeweile-Schaden
    this.allesVerlangsamt = false; // Stufe 3: Unbegrenzte Verlangsamungsziele
    this.stehenBleiben = false; // Stufe 3: Zufällige Schüler frieren ein
  }

  _schiessen() { // Überschriebene Schuss-Methode ohne Projektil
    let anzahl = 0; // Zähler für verlangsame Gegner
    let maxN = this.allesVerlangsamt ? 9999 : this.maxVerlangsamt; // Maximale Zielanzahl bestimmen
    for (let g of (window.gs ? window.gs.gegner : [])) { // Alle aktiven Gegner durchlaufen
      if (!g || !g.aktiv) continue; // Inaktive oder fehlende Gegner überspringen
      if (anzahl >= maxN) break; // Maximale Anzahl erreicht, Schleife beenden
      if (dist(this.x, this.y, g.x, g.y) <= this.reichweite) { // Gegner im Wirkungsbereich prüfen
        g.verlangsamen(this.verlangsamDauer, this.verlangsamStaerke); // Gegner verlangsamen
        if (this.machSchaden && Math.random() < 0.15) { // 15% Chance auf Langeweile-Schaden
          let ng = g.schadennehmen(1, 'normal'); // Einen Schadenspunkt verursachen
          if (ng) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(ng); // Neue Gegner in Puffer aufnehmen
        }
        if (this.stehenBleiben && Math.random() < 0.08) { // 8% Chance auf Einfrieren
          g.betaeuben(300); // 5 Sekunden bei 60fps einfrieren
        }
        anzahl++; // Zähler für verlangsame Gegner erhöhen
      }
    }
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Masse – mehr Ziele gleichzeitig verlangsamen
        name: 'Masse',
        upgrades: [
          { name: 'Mehr Zuhörer',    beschreibung: '6 Schüler gleichzeitig',           kosten: 65  },
          { name: 'Langeweile',      beschreibung: 'Macht kleinen Schaden',             kosten: 130 },
          { name: 'Totale Langweile',beschreibung: 'Alle Schüler verlangsamt',          kosten: 220 }
        ]
      },
      { // Pfad 1: Tiefe – stärkere Verlangsamung bis zum Einfrieren
        name: 'Tiefe',
        upgrades: [
          { name: 'Tiefe Stimme', beschreibung: 'Verlangsamung 75% statt 50%',          kosten: 65  },
          { name: 'Schlafstunde', beschreibung: 'Schüler bleiben manchmal stehen',       kosten: 130 },
          { name: 'Hypnose',      beschreibung: 'Alle einfrieren, macht Schaden',        kosten: 220 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach gewähltem Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Masse
      if (this.upgradeStufe === 1) { // Stufe 1: Mehr Zuhörer
        this.maxVerlangsamt = 6; // Mehr Schüler gleichzeitig verlangsamen
        this.verlangsamDauer = 100; // Verlangsamungsdauer erhöhen
      } else if (this.upgradeStufe === 2) { // Stufe 2: Langeweile
        this.machSchaden = true; // Langeweile-Schaden aktivieren
        this.verlangsamDauer = 120; // Verlangsamungsdauer weiter erhöhen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Totale Langweile
        this.allesVerlangsamt = true; // Unbegrenzte Verlangsamungsziele aktivieren
      }
    } else { // Pfad 1: Tiefe
      if (this.upgradeStufe === 1) { // Stufe 1: Tiefe Stimme – stärkere Verlangsamung
        this.verlangsamStaerke = 0.25; // Auf 25% der Geschwindigkeit verlangsamen
      } else if (this.upgradeStufe === 2) { // Stufe 2: Schlafstunde – manchmal einfrieren
        this.stehenBleiben = true; // Zufälliges Einfrieren aktivieren (8% Chance)
      } else if (this.upgradeStufe === 3) { // Stufe 3: Hypnose – alles einfrieren + Schaden
        this.allesVerlangsamt = true; // Alle Schüler betreffen
        this.machSchaden = true; // Schaden aktivieren
        this.verlangsamDauer = 200; // Verlangsamungsdauer stark erhöhen
      }
    }
  }

  _symbolZeichnen() { // Sprechblase als Symbol über dem Turm zeichnen
    noStroke(); // Kein Rand für die Sprechblase
    fill(255, 255, 255, 180); // Halbtransparentes Weiß für Hauptkörper
    ellipse(0, -54, 20, 12); // Ovaler Hauptkörper der Sprechblase
    fill(255, 255, 255, 180); // Gleiche Farbe für den Schweif
    triangle(-2, -47, -5, -44, 3, -47); // Schweif-Dreieck der Sprechblase
    fill(80, 80, 80); // Dunkelgraue Farbe für Text
    textSize(7); // Kleine Schriftgröße für Symbol
    textAlign(CENTER, CENTER); // Text horizontal und vertikal zentrieren
    text('...', 0, -54); // Auslassungspunkte als Gesprächssymbol
  }

  draw() { // Überschriebene Zeichenmethode mit pulsierendem Ring
    super.draw(); // Basisturm zuerst zeichnen
    if (window.gs && window.gs.gegner && window.gs.gegner.some(g => g.aktiv && dist(this.x, this.y, g.x, g.y) <= this.reichweite)) { // Prüfen ob aktive Gegner im Bereich
      noFill(); // Keine Füllung für den Ring
      stroke(70, 180, 70, 60); // Halbtransparenter grüner Rand
      strokeWeight(2); // Randbreite auf 2 Pixel setzen
      let pulse = sin(frameCount * 0.05) * 10; // Pulsierender Versatz basierend auf Frame
      ellipse(this.x, this.y, (this.reichweite + pulse) * 2, (this.reichweite + pulse) * 2); // Pulsierender Wirkungsbereichsring
    }
  }
}
