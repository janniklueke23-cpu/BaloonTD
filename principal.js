class Koch extends Turm { // Koch erbt von der Turm-Basisklasse
  constructor(x, y) { // Konstruktor: erstellt einen neuen Koch-Turm
    super(x, y, 'koch', 175); // Elternkonstruktor mit Typ 'koch' und Kosten 175 aufrufen
    this.name = 'Herr Koch'; // Anzeigename des Turms
    this.reichweite = 145; // Reichweite in Pixel (größer als Standard)
    this.feuerRate = 135; // Frames zwischen Schüssen (sehr langsam)
    this.schaden = 4; // Hoher Schaden pro Verweis-Geschoss
    this.schussTyp = 'koch'; // Geschoss-Typ für spezielle Darstellung
    this.kopfFarbe = [240, 210, 170]; // Hautfarbe für den Kopf
    this.koerperFarbe = [160, 40, 40]; // Roter Anzug für Herr Koch
    this.panzerbrechend = false; // Anfangs kein Panzerbrechend-Effekt
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Reichweite – größere Wirkungsfläche und Durchdringen
        name: 'Reichweite',
        upgrades: [
          { name: 'Höhere Reichweite', beschreibung: 'Reichweite +50px',              kosten: 80  },
          { name: 'Durchbohrend',      beschreibung: 'Trifft bis zu 4 Ballons',       kosten: 160 },
          { name: 'Megaschaden',       beschreibung: 'Schaden x3, panzerbrechend',    kosten: 280 }
        ]
      },
      { // Pfad 1: Tempo – häufigere Schüsse und mehr Einzelschaden
        name: 'Tempo',
        upgrades: [
          { name: 'Schneller Verweis', beschreibung: 'Feuerrate +35%',                kosten: 80  },
          { name: 'Härterer Verweis',  beschreibung: 'Schaden x2',                    kosten: 160 },
          { name: 'Aktenmappe',        beschreibung: 'Panzerbrechend, nochmals schneller', kosten: 280 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach gewähltem Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Reichweite
      if (this.upgradeStufe === 1) { // Stufe 1: Größere Reichweite
        this.reichweite += 50; // Reichweite um 50 Pixel erhöhen
      } else if (this.upgradeStufe === 2) { // Stufe 2: Durchbohrende Schüsse
        this.durchdringen = true; // Durchdringen aktivieren
        this.durchdrigenAnzahl = 4; // Bis zu 4 Ballons treffen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Megaschaden mit Panzerbrechend
        this.schaden *= 3; // Schaden verdreifachen
        this.panzerbrechend = true; // Panzerbrechend aktivieren
      }
    } else { // Pfad 1: Tempo
      if (this.upgradeStufe === 1) { // Stufe 1: Schnellere Schüsse
        this.feuerRate = Math.floor(this.feuerRate * 0.65); // 35% schneller
      } else if (this.upgradeStufe === 2) { // Stufe 2: Mehr Schaden
        this.schaden *= 2; // Schaden verdoppeln
      } else if (this.upgradeStufe === 3) { // Stufe 3: Aktenmappe – panzerbrechend + noch schneller
        this.panzerbrechend = true; // Panzerbrechend aktivieren
        this.feuerRate = Math.floor(this.feuerRate * 0.7); // Nochmals schneller
      }
    }
  }

  _schiessen() { // Spezifischer Schuss von Herr Koch
    if (!this.ziel || !this.ziel.aktiv) return; // Kein gültiges Ziel: abbrechen
    let g = new VerweisGeschoss( // Neues Verweis-Geschoss erstellen
      this.x, // Startposition X
      this.y, // Startposition Y
      this.ziel, // Ziel-Ballon
      this.schaden, // Schaden des Geschosses
      this.durchdringen, // Durchdringen aktiv?
      this.durchdrigenAnzahl, // Anzahl möglicher Treffer
      this.panzerbrechend // Panzerbrechend aktiv?
    );
    this.geschosse.push(g); // Geschoss in die Liste einfügen
  }

  _symbolZeichnen() { // Kleines Dokument-Symbol über dem Turm zeichnen
    noStroke(); // Keine Kontur für das Papier
    fill(255, 255, 240); // Cremeweiß für das Papier
    rect(-5, -57, 14, 16, 1); // Papierdokument als Rechteck zeichnen
    stroke(180, 50, 50); // Rote Linien für den Text auf dem Verweis
    strokeWeight(1); // Dünne Linienbreite
    line(-2, -54, 6, -54); // Erste Textlinie auf dem Dokument
    line(-2, -51, 6, -51); // Zweite Textlinie auf dem Dokument
    line(-2, -48, 6, -48); // Dritte Textlinie auf dem Dokument
    noStroke(); // Kontur zurücksetzen
  }
}

class VerweisGeschoss extends Geschoss { // Spezifisches Verweisgeschoss von Herr Koch
  constructor(x, y, ziel, schaden, durchdringen, maxTreffer, panzerbrechend) { // Konstruktor
    super(x, y, ziel, schaden, 'koch', durchdringen, maxTreffer); // Elternkonstruktor aufrufen
    this.panzerbrechend = panzerbrechend; // Panzerbrechend-Flag speichern
    this.geschwindigkeit = 7; // Verweisgeschosse sind etwas langsamer
    this.partikelFarbe = [220, 100, 100]; // Rötliche Partikel bei Treffer
    this.rotation = 0; // Anfangsrotation des fliegenden Papiers
  }

  update(gegner, spielGeschwindigkeit) { // Update pro Frame: Rotation und Bewegung
    this.rotation += 0.1 * spielGeschwindigkeit; // Papier rotiert während des Fluges
    super.update(gegner, spielGeschwindigkeit); // Eltern-Update aufrufen
  }

  _treffer(gegner) { // Trefferlogik: normal oder panzerbrechend
    let typ = this.panzerbrechend ? 'panzerbrechend' : 'normal'; // Schadenstyp bestimmen
    let neueGegner = this.ziel.schadennehmen(this.schaden, typ); // Schaden am Ziel anwenden
    if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner); // Neue Gegner puffern
    if (this.durchdringen) { // Durchdringen aktiv: weitere Gegner treffen
      for (let g of gegner) { // Alle Gegner in der Nähe prüfen
        if (!g.aktiv || g === this.ziel) continue; // Inaktive oder Hauptziel überspringen
        if (dist(this.x, this.y, g.x, g.y) < 30) { // Nahe genug für Durchdringen?
          let ng = g.schadennehmen(this.schaden, typ); // Durchdringschaden anwenden
          if (ng) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(ng); // Neue Gegner puffern
        }
      }
    }
    this.aktiv = false; // Geschoss nach Treffer deaktivieren
  }

  _projektilZeichnen() { // Verweisgeschoss als rotierendes Papier zeichnen
    push(); // Transformationsmatrix sichern
    rotate(this.rotation); // Aktuellen Rotationswinkel anwenden
    fill(this.panzerbrechend ? color(255, 200, 50) : color(255, 255, 220)); // Gold bei Panzerbrechend, sonst Cremeweiß
    stroke(200, 100, 100); // Rote Kontur für den Verweis
    strokeWeight(1); // Dünne Konturlinie
    rect(-7, -5, 14, 10, 1); // Papierrechteck zeichnen
    noStroke(); // Kontur für Text deaktivieren
    fill(180, 50, 50); // Rote Farbe für das Ausrufezeichen
    textSize(6); // Kleine Schriftgröße
    textAlign(CENTER, CENTER); // Text zentrieren
    text('!', 0, 0); // Ausrufezeichen auf dem Verweis
    pop(); // Transformationsmatrix wiederherstellen
  }
}
