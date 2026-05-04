class Brust extends Turm { // Hr. Brust – schießt Blitze die zwischen mehreren Schülern springen
  constructor(x, y) { // Konstruktor mit Positions-Parametern
    super(x, y, 'brust', 240); // Basisklasse mit Typ und Kosten initialisieren
    this.name = 'Hr. Brust'; // Anzeigename des Lehrers
    this.reichweite = 130; // Wirkungsbereich in Pixeln
    this.feuerRate = 50; // Frames zwischen Blitzen
    this.schaden = 2; // Schaden pro Blitz
    this.kopfFarbe = [225, 200, 175]; // Hautfarbe des Kopfes
    this.koerperFarbe = [220, 180, 30]; // Gelbes Hemd – elektrisch
    this.kettenAnzahl = 2; // Anzahl Kettensprünge pro Blitz
    this.kettenReichweite = 80; // Maximaler Sprung-Abstand zwischen Schülern
    this.aktiveBlitze = []; // Liste sichtbarer Blitz-Animationen
    this.kontinuierlich = false; // Stufe 3 Pfad 1: Dauer-Blitz
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Schaden – mehr Schaden und Kettenglieder
        name: 'Schaden',
        upgrades: [
          { name: 'Stärkere Blitze', beschreibung: 'Schaden x2',                     kosten: 90  },
          { name: 'Mehr Ketten',     beschreibung: 'Springt zwischen 4 Schülern',     kosten: 175 },
          { name: 'Donnerschlag',    beschreibung: 'Schaden x4, panzerbrechend',      kosten: 310 }
        ]
      },
      { // Pfad 1: Tempo – schneller und größere Reichweite
        name: 'Tempo',
        upgrades: [
          { name: 'Schnellfeuer',  beschreibung: 'Feuerrate +40%',                  kosten: 90  },
          { name: 'Mehr Reichweite', beschreibung: 'Reichweite +50px',              kosten: 175 },
          { name: 'Gewitter',      beschreibung: 'Dauerblitz, springt 6 Schüler',   kosten: 310 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Schaden
      if (this.upgradeStufe === 1) { // Stufe 1: Stärkere Blitze
        this.schaden = 4; // Verdoppelter Schaden
      } else if (this.upgradeStufe === 2) { // Stufe 2: Mehr Ketten
        this.kettenAnzahl = 4; // Springt auf 4 Schüler
      } else if (this.upgradeStufe === 3) { // Stufe 3: Donnerschlag
        this.schaden = 8; // Vierfacher Schaden
        this.panzerbrechend = true; // Panzerbrechend
      }
    } else { // Pfad 1: Tempo
      if (this.upgradeStufe === 1) { // Stufe 1: Schnellfeuer
        this.feuerRate = Math.floor(this.feuerRate * 0.6); // 40% schneller
      } else if (this.upgradeStufe === 2) { // Stufe 2: Mehr Reichweite
        this.reichweite += 50; // Reichweite erhöhen
        this.kettenReichweite += 30; // Auch Sprung-Reichweite erhöhen
      } else if (this.upgradeStufe === 3) { // Stufe 3: Gewitter
        this.kettenAnzahl = 6; // 6 Sprünge
        this.feuerRate = Math.floor(this.feuerRate * 0.5); // Nochmal schneller
        this.kontinuierlich = true; // Dauerblitz
      }
    }
  }

  _schiessen() { // Blitz erzeugen und Kettensprung-Schaden verursachen
    if (!this.ziel || !this.ziel.aktiv) return; // Kein gültiges Ziel
    let getroffene = new Set(); // Schon getroffene Ballons
    let punkte = [{ x: this.x, y: this.y - 30 }]; // Blitzpunkte (vom Turm aus)
    let aktuell = this.ziel; // Aktueller Sprungpunkt
    let typ = this.panzerbrechend ? 'panzerbrechend' : 'normal'; // Schadenstyp
    for (let i = 0; i < this.kettenAnzahl && aktuell; i++) { // Bis zur maximalen Anzahl springen
      if (!aktuell.aktiv || getroffene.has(aktuell.id)) break; // Inaktiv oder schon getroffen
      let n = aktuell.schadennehmen(this.schaden, typ); // Schaden auf aktuellem Ziel
      if (n) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(n); // Neue Gegner puffern
      getroffene.add(aktuell.id); // Als getroffen markieren
      punkte.push({ x: aktuell.x, y: aktuell.y }); // Sprungpunkt sichern
      aktuell = this._naechstesKettenZiel(aktuell, getroffene); // Nächstes Sprungziel suchen
    }
    this.aktiveBlitze.push({ punkte: punkte, leben: 12 }); // Blitz-Animation hinzufügen
  }

  _naechstesKettenZiel(von, getroffene) { // Nächstes Sprungziel basierend auf Position
    let bestes = null; // Bestes nächstes Ziel
    let minD = Infinity; // Geringster Abstand
    if (!window.gs || !window.gs.gegner) return null; // Sicherheitsprüfung
    for (let g of window.gs.gegner) { // Alle Gegner durchsuchen
      if (!g.aktiv || getroffene.has(g.id)) continue; // Inaktive oder schon getroffene überspringen
      let d = dist(von.x, von.y, g.x, g.y); // Abstand vom letzten Punkt
      if (d <= this.kettenReichweite && d < minD) { // In Sprungreichweite und näher?
        minD = d; // Neuen minimalen Abstand merken
        bestes = g; // Als nächsten Sprung markieren
      }
    }
    return bestes; // Nächstes Ziel zurückgeben
  }

  update(gegner, spielGeschwindigkeit) { // Eigene Update mit Blitz-Animation
    super.update(gegner, spielGeschwindigkeit); // Basisturm aktualisieren (Schießen, Geschosse)
    for (let i = this.aktiveBlitze.length - 1; i >= 0; i--) { // Rückwärts durch Animationen
      this.aktiveBlitze[i].leben -= spielGeschwindigkeit; // Lebensdauer verringern
      if (this.aktiveBlitze[i].leben <= 0) this.aktiveBlitze.splice(i, 1); // Abgelaufen entfernen
    }
  }

  draw() { // Eigene Zeichenmethode mit Blitzen
    super.draw(); // Basisturm zeichnen
    for (let blitz of this.aktiveBlitze) { // Jede aktive Blitz-Animation
      let alpha = map(blitz.leben, 0, 12, 0, 255); // Transparenz
      stroke(255, 255, 80, alpha); // Helles gelbes Glühen
      strokeWeight(4); // Dickes Glühen
      noFill(); // Kein Füll
      this._blitzPfadZeichnen(blitz.punkte, 6); // Glüh-Pfad
      stroke(255, 255, 255, alpha); // Weißer Kern
      strokeWeight(1.5); // Dünner Kern
      this._blitzPfadZeichnen(blitz.punkte, 3); // Innerer Pfad
    }
  }

  _blitzPfadZeichnen(punkte, jitter) { // Zickzack-Blitz zwischen Punkten zeichnen
    for (let i = 0; i < punkte.length - 1; i++) { // Über alle Segmente
      let p1 = punkte[i]; // Startpunkt
      let p2 = punkte[i + 1]; // Endpunkt
      let segmente = 5; // Anzahl Zwischenpunkte für Zickzack
      beginShape(); // Linie beginnen
      vertex(p1.x, p1.y); // Erster Punkt
      for (let s = 1; s < segmente; s++) { // Zwischenpunkte mit Jitter
        let t = s / segmente; // Anteil
        let mx = lerp(p1.x, p2.x, t) + random(-jitter, jitter); // Versatz X
        let my = lerp(p1.y, p2.y, t) + random(-jitter, jitter); // Versatz Y
        vertex(mx, my); // Zwischenpunkt
      }
      vertex(p2.x, p2.y); // Endpunkt
      endShape(); // Linie beenden
    }
  }

  _symbolZeichnen() { // Blitz-Symbol über dem Turm zeichnen
    noStroke(); // Kein Rand
    fill(255, 220, 60); // Goldgelber Blitz
    beginShape(); // Blitz-Form
    vertex(-2, -58); vertex(4, -58); vertex(0, -50); // Obere Hälfte
    vertex(5, -50); vertex(-3, -42); vertex(0, -49); // Untere Hälfte
    vertex(-5, -49); endShape(CLOSE); // Schließen
  }
}
