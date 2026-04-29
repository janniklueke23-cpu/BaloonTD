class Pfister extends Turm { // Pfister-Klasse erbt von der Turm-Basisklasse
  constructor(x, y) { // Konstruktor mit Positions-Parametern
    super(x, y, 'pfister', 140); // Basisklasse mit Typ und Kosten initialisieren
    this.name = 'Herr Pfister'; // Anzeigename des Lehrers
    this.reichweite = 115; // Wirkungsbereich in Pixeln
    this.feuerRate = 85; // Feuerrate in Frames zwischen Schüssen
    this.schaden = 1; // Direktschaden pro Treffer
    this.kopfFarbe = [240, 200, 160]; // Hautfarbe des Kopfes
    this.koerperFarbe = [120, 80, 30]; // Braune bierbefleckte Körperfarbe
    this.saeureSchaden = 1; // Schaden der Säurewolke pro Tick
    this.saeureDauer = 150; // Dauer der Säurewolke in Frames
    this.saeureRadius = 38; // Radius der Säurewolke in Pixel
    this.saeureVerlangsamt = false; // Säure verlangsamt noch nicht
    this.mehrfachSpritzer = false; // Pfad 1 Stufe 2: drei Wolken beim Einschlag
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Stärke – mehr Schaden und längere Wirkung
        name: 'Stärke',
        upgrades: [
          { name: 'Stärkere Säure', beschreibung: 'Säure-Schaden x2',            kosten: 60  },
          { name: 'Zähe Säure',     beschreibung: 'Säure bleibt länger liegen',  kosten: 120 },
          { name: 'Klebrige Säure', beschreibung: 'Säure verlangsamt Schüler',   kosten: 210 }
        ]
      },
      { // Pfad 1: Explosion – größere Fläche und mehrere Wolken
        name: 'Explosion',
        upgrades: [
          { name: 'Größere Wolke',      beschreibung: 'Säureradius +22px',           kosten: 60  },
          { name: 'Mehrfach-Spritzer',  beschreibung: '3 Wolken beim Einschlag',     kosten: 120 },
          { name: 'Toxischer Nebel',    beschreibung: 'Schaden x3, verlangsamt immer', kosten: 210 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach gewähltem Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Stärke
      if (this.upgradeStufe === 1) { // Stufe 1: Stärkere Säure
        this.saeureSchaden = 2; // Säureschaden verdoppeln
      } else if (this.upgradeStufe === 2) { // Stufe 2: Zähe Säure
        this.saeureDauer = 240; // Säuredauer stark erhöhen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Klebrige Säure
        this.saeureVerlangsamt = true; // Verlangsamungseffekt aktivieren
      }
    } else { // Pfad 1: Explosion
      if (this.upgradeStufe === 1) { // Stufe 1: Größere Wolke
        this.saeureRadius += 22; // Radius vergrößern
      } else if (this.upgradeStufe === 2) { // Stufe 2: Mehrfach-Spritzer
        this.mehrfachSpritzer = true; // Drei Wolken beim Einschlag aktivieren
      } else if (this.upgradeStufe === 3) { // Stufe 3: Toxischer Nebel
        this.saeureSchaden = 3; // Schaden verdreifachen
        this.saeureVerlangsamt = true; // Verlangsamt immer
      }
    }
  }

  _schiessen() { // Bierflasche als Geschoss abfeuern
    this.geschosse.push(new BierflascheGeschoss( // Neues Bierflaschen-Geschoss erstellen und hinzufügen
      this.x, this.y, this.ziel, this.schaden,
      this.saeureSchaden, this.saeureDauer, this.saeureRadius,
      this.saeureVerlangsamt, this.mehrfachSpritzer
    ));
  }

  _symbolZeichnen() { // Braune Flasche als Symbol über dem Turm zeichnen
    noStroke(); // Kein Rand für die Flasche
    fill(120, 70, 20); // Dunkelbraune Flaschenfarbe
    rect(-3, -58, 6, 16, 2); // Flaschen-Körper mit abgerundeten Ecken
    rect(-5, -44, 10, 4, 1); // Flaschen-Etikett in der Mitte
    fill(180, 130, 60, 150); // Halbtransparente helle Farbe für Glasschimmer
    rect(-2, -57, 4, 12, 1); // Glanzeffekt auf der Flasche
  }
}

class BierflascheGeschoss extends Geschoss { // Bierflaschen-Geschoss des Pfister-Turms
  constructor(x, y, ziel, schaden, saeureSchaden, saeureDauer, saeureRadius, saeureVerlangsamt, mehrfachSpritzer) { // Konstruktor
    super(x, y, ziel, schaden, 'pfister', false, 1); // Basisgeschoss initialisieren
    this.saeureSchaden = saeureSchaden; // Schaden der Säurewolke speichern
    this.saeureDauer = saeureDauer; // Dauer der Säurewolke speichern
    this.saeureRadius = saeureRadius || 38; // Radius der Säurewolke speichern
    this.saeureVerlangsamt = saeureVerlangsamt; // Verlangsamungs-Flag speichern
    this.mehrfachSpritzer = mehrfachSpritzer || false; // Mehrfach-Spritzer-Flag speichern
    this.geschwindigkeit = 5; // Fluggeschwindigkeit der Flasche
    this.partikelFarbe = [150, 200, 50]; // Gelbgrüne Partikel beim Aufprall
    this.rotation = 0; // Startwinkeldrehung der Flasche
  }

  update(gegner, spielGeschwindigkeit) { // Eigene Update-Methode mit Rotation
    this.rotation += 0.12 * spielGeschwindigkeit; // Flasche rotiert während des Flugs
    super.update(gegner, spielGeschwindigkeit); // Standardbewegung der Basisklasse ausführen
  }

  _treffer(gegner) { // Trefferlogik: Direktschaden und Säurewolke(n) erzeugen
    let neueGegner = this.ziel.schadennehmen(this.schaden, 'normal'); // Direktschaden auf Ziel anwenden
    if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner); // Neue Gegner puffern
    window._saeurewolkenBuffer = window._saeurewolkenBuffer || []; // Säurewolken-Puffer sicherstellen
    if (this.mehrfachSpritzer) { // Drei Wolken im Dreieck erzeugen
      for (let i = 0; i < 3; i++) { // Drei Wolken um den Aufprallpunkt
        let winkel = (TWO_PI / 3) * i; // Gleichmäßig verteilt
        let ox = cos(winkel) * 24; // X-Versatz
        let oy = sin(winkel) * 24; // Y-Versatz
        window._saeurewolkenBuffer.push({ x: this.x + ox, y: this.y + oy, radius: this.saeureRadius, schaden: this.saeureSchaden, dauer: this.saeureDauer });
      }
    } else { // Einzelne Wolke am Aufprallpunkt erzeugen
      window._saeurewolkenBuffer.push({ x: this.x, y: this.y, radius: this.saeureRadius, schaden: this.saeureSchaden, dauer: this.saeureDauer });
    }
    if (this.saeureVerlangsamt && this.ziel && this.ziel.aktiv) this.ziel.verlangsamen(120); // Ziel verlangsamen
    this.aktiv = false; // Geschoss nach Aufprall deaktivieren
  }

  _projektilZeichnen() { // Fliegende rotierende Bierflasche zeichnen
    push(); // Transformations-Zustand sichern
    rotate(this.rotation); // Flasche um aktuellen Winkel drehen
    fill(100, 60, 20); // Dunkelbraune Flaschenfarbe
    noStroke(); // Kein Rand
    rect(-3, -8, 6, 16, 2); // Flaschen-Körper mit abgerundeten Ecken
    rect(-5, -9, 10, 4, 1); // Flaschen-Etikett
    fill(60, 130, 40, 160); // Halbtransparente grüne Flüssigkeit sichtbar
    rect(-2, -7, 4, 10, 1); // Säureinhalt in der Flasche
    pop(); // Transformations-Zustand wiederherstellen
  }
}

class SaeureWolke { // Temporäre Säure-Wolke die Schüler vergiftet
  constructor(x, y, radius, schaden, dauer) { // Konstruktor mit Position, Radius, Schaden und Dauer
    this.x = x; this.y = y; this.radius = radius; this.schaden = schaden; // Grundeigenschaften setzen
    this.dauer = dauer; this.maxDauer = dauer; this.tickTimer = 30; this.aktiv = true; // Zeitwerte und Status setzen
  }
  update(gegner, spielGeschwindigkeit) { // Wolke pro Frame aktualisieren
    this.dauer -= spielGeschwindigkeit; // Verbleibende Dauer reduzieren
    if (this.dauer <= 0) { this.aktiv = false; return; } // Wolke deaktivieren wenn Zeit abgelaufen
    this.tickTimer -= spielGeschwindigkeit; // Tick-Timer für Schadens-Intervall reduzieren
    if (this.tickTimer <= 0) { // Schaden-Tick fällig
      this.tickTimer = 30; // Timer auf halbe Sekunde zurücksetzen
      for (let g of gegner) { // Alle Gegner auf Überschneidung prüfen
        if (!g.aktiv) continue; // Inaktive Gegner überspringen
        if (dist(this.x, this.y, g.x, g.y) <= this.radius) g.giftAnwenden(this.schaden, 60); // Gift auf Gegner in der Wolke anwenden
      }
    }
  }
  draw() { // Säure-Wolke zeichnen
    if (!this.aktiv) return; // Inaktive Wolke nicht zeichnen
    let anteil = this.dauer / this.maxDauer; // Verblassungs-Anteil berechnen
    noStroke(); // Kein Rand für die Wolkenkreise
    fill(120, 180, 40, 55 * anteil); // Gelbgrüne Wolkenfarbe die mit der Zeit verblasst
    for (let i = 0; i < 6; i++) { // Sechs überlappende Kreise für Wolken-Optik
      let winkel = (i/6)*TWO_PI + frameCount*0.02; // Winkel mit langsamer Rotation
      ellipse(this.x+cos(winkel)*this.radius*0.3, this.y+sin(winkel)*this.radius*0.3, this.radius*1.2, this.radius*1.1); // Versetzter Wolkenkreis
    }
  }
}
