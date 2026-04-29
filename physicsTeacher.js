class Motsious extends Turm { // Hr. Motsious – sitzt am Teilchenbeschleuniger und streut Teilchen in eine Richtung
  constructor(x, y) { // Konstruktor mit Positions-Parametern
    super(x, y, 'motsious', 220); // Basisklasse mit Typ und Kosten initialisieren
    this.name = 'Hr. Motsious'; // Anzeigename des Lehrers
    this.reichweite = 200; // Lange Wirkungsweite (Strahl-Reichweite)
    this.feuerRate = 18; // Sehr hohe Schussfrequenz – Strahl-Effekt
    this.schaden = 1; // Schaden pro Teilchen
    this.kopfFarbe = [225, 200, 180]; // Hautfarbe des Kopfes
    this.koerperFarbe = [70, 70, 110]; // Lila-Hemd für Wissenschaftler
    this.streuung = 0.18; // Halber Streuwinkel der Teilchen in Radiant
    this.teilchenProSchuss = 1; // Anzahl Teilchen pro Schuss
    this.richtung = this._initialeRichtung(x, y); // Anfängliche Schussrichtung Richtung Pfad
    this.durchdringend = false; // Teilchen durchdringen Schüler?
    this.zielUmschalten = 0; // Timer für automatisches Neuausrichten
  }

  _initialeRichtung(x, y) { // Schießt Richtung Mitte des Spielfelds, falls kein Ziel da
    let zielX = 370; // Mitte des Spielfelds X
    let zielY = 345; // Mitte des Spielfelds Y
    return atan2(zielY - y, zielX - x); // Winkel zur Spielfeldmitte
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Energie – mehr Schaden, längere Reichweite
        name: 'Energie',
        upgrades: [
          { name: 'Stärkere Teilchen', beschreibung: 'Schaden x2',                 kosten: 80  },
          { name: 'Längerer Strahl',   beschreibung: 'Reichweite +80px',            kosten: 160 },
          { name: 'Plasma-Strom',      beschreibung: 'Schaden x4, durchdringend',   kosten: 290 }
        ]
      },
      { // Pfad 1: Streuung – mehr Teilchen pro Schuss
        name: 'Streuung',
        upgrades: [
          { name: 'Doppel-Strahl',  beschreibung: '2 Teilchen pro Schuss',       kosten: 80  },
          { name: 'Breiter Strahl', beschreibung: 'Größere Streuung, schneller', kosten: 160 },
          { name: 'Quanten-Strom',  beschreibung: '5 Teilchen, schnellfeuer',     kosten: 290 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Energie
      if (this.upgradeStufe === 1) { // Stufe 1: Stärkere Teilchen
        this.schaden = 2; // Doppelter Schaden
      } else if (this.upgradeStufe === 2) { // Stufe 2: Längerer Strahl
        this.reichweite += 80; // Reichweite erhöhen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Plasma
        this.schaden = 4; // Vierfacher Schaden
        this.durchdringend = true; // Teilchen durchdringen
      }
    } else { // Pfad 1: Streuung
      if (this.upgradeStufe === 1) { // Stufe 1: Doppelstrahl
        this.teilchenProSchuss = 2; // 2 Teilchen
      } else if (this.upgradeStufe === 2) { // Stufe 2: Breiter Strahl
        this.streuung = 0.32; // Größere Streuung
        this.feuerRate = 12; // Schneller schießen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Quanten
        this.teilchenProSchuss = 5; // Fünf Teilchen
        this.feuerRate = 9; // Sehr schnell
        this.streuung = 0.40; // Großer Streuwinkel
      }
    }
  }

  update(gegner, spielGeschwindigkeit) { // Eigene Update-Methode mit Richtungs-Anpassung
    this.zielUmschalten -= spielGeschwindigkeit; // Timer für Neuausrichtung
    if (this.zielUmschalten <= 0) { // Alle 30 Frames neu ausrichten
      this.zielUmschalten = 30; // Timer zurücksetzen
      let nahestes = this._nahestesZiel(gegner); // Nahesten Schüler in Reichweite suchen
      if (nahestes) { // Ziel gefunden?
        let dx = nahestes.x - this.x; // Differenz X
        let dy = nahestes.y - this.y; // Differenz Y
        this.richtung = atan2(dy, dx); // Richtung anpassen
      }
    }
    super.update(gegner, spielGeschwindigkeit); // Basis-Update (Schießen, Geschosse)
  }

  _nahestesZiel(gegner) { // Nahestes aktives Ziel finden
    let nahestes = null; // Bestes Ziel
    let minD = Infinity; // Minimaler Abstand
    for (let g of gegner) { // Alle Gegner durchsuchen
      if (!g.aktiv) continue; // Inaktive überspringen
      let d = dist(this.x, this.y, g.x, g.y); // Abstand
      if (d <= this.reichweite && d < minD) { // Näher als bisher?
        minD = d; // Neuen minimalen Abstand merken
        nahestes = g; // Als Ziel speichern
      }
    }
    return nahestes; // Ziel zurückgeben
  }

  _besteZielFinden(gegner) { // Überschreiben: Schießen wenn überhaupt ein Gegner in Reichweite ist
    return this._nahestesZiel(gegner); // Nahestes Ziel als Auslöser
  }

  _schiessen() { // Mehrere Teilchen in Schussrichtung mit Streuung abfeuern
    for (let i = 0; i < this.teilchenProSchuss; i++) { // Pro Teilchen einen Schuss
      let offset = this.teilchenProSchuss === 1 ? 0 : map(i, 0, this.teilchenProSchuss - 1, -this.streuung, this.streuung); // Streuwinkel
      let winkel = this.richtung + offset + random(-0.05, 0.05); // Endgültiger Winkel mit kleiner Zufallsstreuung
      this.geschosse.push(new TeilchenGeschoss(this.x, this.y, winkel, this.reichweite, this.schaden, this.durchdringend)); // Teilchen erzeugen
    }
  }

  _symbolZeichnen() { // Symbol über dem Turm: Atom-Modell
    noStroke(); // Kein Rand
    fill(220, 220, 240); // Hellgrauer Atomkern
    ellipse(0, -52, 8, 8); // Kern
    noFill(); stroke(180, 100, 220); strokeWeight(1.2); // Lila Elektronenbahn
    ellipse(0, -52, 18, 8); // Horizontale Bahn
    push(); translate(0, -52); rotate(PI / 3); ellipse(0, 0, 18, 8); pop(); // Diagonale Bahn 1
    push(); translate(0, -52); rotate(-PI / 3); ellipse(0, 0, 18, 8); pop(); // Diagonale Bahn 2
  }

  draw() { // Eigenständige Zeichenmethode mit Beschleuniger-Visualisierung
    super.draw(); // Basisturm zuerst
    push(); // Zustand sichern
    translate(this.x, this.y); // Zur Turmposition
    rotate(this.richtung); // In Schussrichtung drehen
    noStroke(); fill(60, 50, 90, 180); // Beschleuniger-Hülse
    rect(15, -6, 22, 12, 3); // Beschleuniger-Rohr
    fill(180, 100, 220, 200); // Lila Mündungs-Glühen
    ellipse(38, 0, 8, 8); // Mündung
    pop(); // Zustand wiederherstellen
  }
}

class TeilchenGeschoss extends Geschoss { // Teilchen das in feste Richtung fliegt (kein Ziel-Tracking)
  constructor(x, y, winkel, reichweite, schaden, durchdringend) { // Konstruktor mit Winkel statt Ziel
    super(x, y, null, schaden, 'motsious', durchdringend, durchdringend ? 99 : 1); // Basis-Geschoss ohne Ziel
    this.winkel = winkel; // Schussrichtung
    this.geschwindigkeit = 11; // Hohe Geschwindigkeit
    this.maxStrecke = reichweite; // Maximale Flugweite
    this.zurueckgelegt = 0; // Bisher zurückgelegte Strecke
    this.partikelFarbe = [200, 100, 255]; // Lila Partikel
    this.durchdringen = durchdringend; // Durchdringen-Flag
    this.maxTreffer = durchdringend ? 99 : 1; // Maximal 99 Treffer wenn durchdringend
  }

  _bewegungsSchritt(gegner) { // Eigener Bewegungsschritt: bewegt sich frei in Winkel-Richtung
    let dx = cos(this.winkel) * this.geschwindigkeit; // Bewegung X
    let dy = sin(this.winkel) * this.geschwindigkeit; // Bewegung Y
    this.x += dx; // Position X aktualisieren
    this.y += dy; // Position Y aktualisieren
    this.zurueckgelegt += this.geschwindigkeit; // Strecke addieren
    // Treffer prüfen
    for (let g of gegner) { // Alle Gegner prüfen
      if (!g.aktiv) continue; // Inaktive überspringen
      if (this.getroffene.has(g.id)) continue; // Schon getroffen
      if (dist(this.x, this.y, g.x, g.y) < g.radius + 4) { // Berührung?
        let n = g.schadennehmen(this.schaden, 'normal'); // Schaden anwenden
        this.getroffene.add(g.id); // Als getroffen markieren
        this.trefferZaehler++; // Treffer zählen
        if (n) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(n); // Neue puffern
        if (!this.durchdringen) { // Nicht-Durchdringend: deaktivieren
          this.aktiv = false; // Geschoss inaktiv
          return; // Bewegungsschritt beenden
        }
        if (this.trefferZaehler >= this.maxTreffer) { // Max Treffer erreicht?
          this.aktiv = false; // Deaktivieren
          return; // Beenden
        }
      }
    }
    if (this.zurueckgelegt > this.maxStrecke) this.aktiv = false; // Reichweite überschritten: deaktivieren
    if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 700) this.aktiv = false; // Außerhalb deaktivieren
  }

  _projektilZeichnen() { // Teilchen als leuchtenden Strich zeichnen
    push(); // Zustand sichern
    rotate(this.winkel); // In Flugrichtung drehen
    noStroke(); // Kein Rand
    fill(180, 100, 255, 180); // Halbtransparentes Lila
    ellipse(-6, 0, 14, 5); // Schweif
    fill(220, 180, 255); // Heller Kern
    ellipse(0, 0, 8, 4); // Hauptkörper
    pop(); // Zustand wiederherstellen
  }

  draw() { // Eigene draw-Methode da winkel als absolute Richtung gespeichert ist
    if (!this.aktiv) return; // Inaktiv: nicht zeichnen
    push(); // Zustand sichern
    translate(this.x, this.y); // Zur Geschoss-Position
    this._projektilZeichnen(); // Teilchen zeichnen
    pop(); // Zustand wiederherstellen
  }
}
