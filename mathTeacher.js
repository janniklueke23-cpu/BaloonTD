class Blech extends Turm { // Blech erbt von der Turm-Basisklasse
  constructor(x, y) { // Konstruktor: erstellt einen neuen Blech-Turm
    super(x, y, 'blech', 100); // Elternkonstruktor mit Typ 'blech' und Kosten 100 aufrufen
    this.name = 'Herr Blech'; // Anzeigename des Turms
    this.reichweite = 120; // Reichweite in Pixel
    this.feuerRate = 55; // Frames zwischen Schüssen
    this.schaden = 1; // Schaden pro Kreidegeschoss
    this.schussTyp = 'blech'; // Geschoss-Typ für spezielle Darstellung
    this.kopfFarbe = [235, 215, 175]; // Hautfarbe für den Kopf
    this.koerperFarbe = [55, 55, 75]; // Dunkelgrauer Anzug für Herr Blech
    this.splashRadius = 0; // Anfangs kein Explosionsradius
    this.doppelwurf = false; // Pfad 1 Stufe 3: zweites Ziel beschießen
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Schnellfeuer – Fokus auf hohe Feuerrate
        name: 'Schnellfeuer',
        upgrades: [
          { name: 'Schneller Schießen',  beschreibung: 'Feuerrate +40%',                kosten: 50  },
          { name: 'Kreidestrom',         beschreibung: 'Nochmals schneller, Schaden x2', kosten: 100 },
          { name: 'Doppelwurf',          beschreibung: 'Trifft 2 Ziele gleichzeitig',   kosten: 200 }
        ]
      },
      { // Pfad 1: Sprengkraft – Fokus auf Schaden und Explosionen
        name: 'Sprengkraft',
        upgrades: [
          { name: 'Größere Kreide',  beschreibung: 'Schaden x3, trifft 2 Ballons',     kosten: 50  },
          { name: 'Mehr Reichweite', beschreibung: 'Reichweite +40px',                  kosten: 100 },
          { name: 'Kreidebombe',     beschreibung: 'Explosionsschaden beim Aufprall',   kosten: 200 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach gewähltem Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Schnellfeuer
      if (this.upgradeStufe === 1) { // Stufe 1: Feuerrate erhöhen
        this.feuerRate = Math.floor(this.feuerRate * 0.6); // 40% schneller
      } else if (this.upgradeStufe === 2) { // Stufe 2: Noch schneller + mehr Schaden
        this.feuerRate = Math.floor(this.feuerRate * 0.55); // Nochmals schneller
        this.schaden = 2; // Schaden verdoppeln
      } else if (this.upgradeStufe === 3) { // Stufe 3: Zweites Ziel beschießen
        this.doppelwurf = true; // Doppelwurf aktivieren
      }
    } else { // Pfad 1: Sprengkraft
      if (this.upgradeStufe === 1) { // Stufe 1: Größere Kreide
        this.schaden = 3; // Schaden verdreifachen
        this.durchdringen = true; // Durchdringen aktivieren
        this.durchdrigenAnzahl = 2; // Bis zu 2 Ballons treffen
      } else if (this.upgradeStufe === 2) { // Stufe 2: Mehr Reichweite
        this.reichweite += 40; // Reichweite erhöhen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Kreidebombe
        this.splashRadius = 45; // Explosionsradius aktivieren
      }
    }
  }

  _schiessen() { // Kreide abfeuern – ggf. zweites Ziel bei Doppelwurf
    if (!this.ziel || !this.ziel.aktiv) return; // Kein gültiges Ziel: abbrechen
    this.geschosse.push(new KreideGeschoss( // Hauptgeschoss erstellen
      this.x, this.y, this.ziel, this.schaden,
      this.durchdringen, this.durchdrigenAnzahl, this.splashRadius
    ));
    if (this.doppelwurf && window.gs && window.gs.gegner) { // Doppelwurf: zweites Ziel suchen
      let zweitbestes = null; // Zweibestes Ziel
      let zweitDistanz = -1; // Beste zurückgelegte Distanz des zweiten Ziels
      for (let g of window.gs.gegner) { // Alle Gegner nach zweitem Ziel durchsuchen
        if (!g.aktiv || g === this.ziel) continue; // Inaktive oder Hauptziel überspringen
        let ab = dist(this.x, this.y, g.x, g.y); // Abstand prüfen
        if (ab <= this.reichweite && g.gesamtDistanz > zweitDistanz) { // In Reichweite und weiter vorne?
          zweitDistanz = g.gesamtDistanz; // Neue zweitbeste Distanz merken
          zweitbestes = g; // Zweites Ziel merken
        }
      }
      if (zweitbestes) { // Zweites Ziel gefunden?
        this.geschosse.push(new KreideGeschoss( // Zweites Geschoss auf zweites Ziel
          this.x, this.y, zweitbestes, this.schaden,
          this.durchdringen, this.durchdrigenAnzahl, this.splashRadius
        ));
      }
    }
  }

  _symbolZeichnen() { // Kleines Kreidesymbol über dem Turm zeichnen
    push(); // Transformationsmatrix sichern
    rotate(-0.4); // Kreide leicht schräg drehen
    fill(255, 255, 255); // Weiß für die Kreide
    noStroke(); // Keine Kontur
    rect(-4, -56, 8, 14, 2); // Kreide als Rechteck mit abgerundeten Ecken zeichnen
    pop(); // Transformationsmatrix wiederherstellen
  }
}

class KreideGeschoss extends Geschoss { // Spezifisches Kreidegeschoss von Herr Blech
  constructor(x, y, ziel, schaden, durchdringen, maxTreffer, splashRadius) { // Konstruktor
    super(x, y, ziel, schaden, 'blech', durchdringen, maxTreffer); // Elternkonstruktor aufrufen
    this.splashRadius = splashRadius; // Explosionsradius speichern
    this.geschwindigkeit = 9; // Kreidegeschosse sind schnell
    this.partikelFarbe = [220, 220, 220]; // Weiße Partikel bei Treffer
  }

  _treffer(gegner) { // Trefferlogik: mit oder ohne Splash
    if (this.splashRadius > 0) { // Splash-Modus: Explosionsschaden
      for (let g of gegner) { // Alle aktiven Gegner prüfen
        if (!g.aktiv) continue; // Inaktive Gegner überspringen
        if (dist(this.x, this.y, g.x, g.y) <= this.splashRadius) { // Im Radius?
          let neueGegner = g.schadennehmen(1, 'normal'); // Splashschaden anwenden
          if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner); // Puffern
        }
      }
      this.aktiv = false; // Geschoss nach Explosion deaktivieren
    } else { // Normaler Modus: Standard-Treffer
      super._treffer(gegner); // Eltern-Trefferlogik verwenden
    }
  }

  _projektilZeichnen() { // Kreidegeschoss zeichnen
    push(); // Transformationsmatrix sichern
    rotate(-0.3); // Kreide leicht schräg drehen
    fill(255, 255, 255); // Weißer Kreidekörper
    noStroke(); // Keine Kontur
    rect(-3, -7, 6, 14, 1); // Kreidekörper als Rechteck zeichnen
    fill(240, 220, 180); // Hautfarbene Kreidekappe
    rect(-3, -8, 6, 4, 1); // Kreidekappe oben zeichnen
    pop(); // Transformationsmatrix wiederherstellen
  }
}
