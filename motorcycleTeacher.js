class Fight extends Turm { // Hr. Fight – fährt mit dem Motorrad und überfährt Schüler
  constructor(x, y) { // Konstruktor mit Positions-Parametern
    super(x, y, 'fight', 280); // Basisklasse mit Typ und Kosten initialisieren
    this.name = 'Hr. Fight'; // Anzeigename des Lehrers
    this.reichweite = 70; // Wirkungsbereich = Fahrtradius des Motorrads
    this.feuerRate = 30; // Frames zwischen Schadens-Ticks bei Berührung
    this.schaden = 2; // Direktschaden beim Überfahren
    this.kopfFarbe = [240, 210, 175]; // Hautfarbe des Kopfes
    this.koerperFarbe = [40, 40, 50]; // Schwarze Lederjacke
    this.fahrRadius = 50; // Radius des Fahrtkreises
    this.fahrGeschwindigkeit = 0.04; // Winkelgeschwindigkeit des Motorrads
    this.fahrWinkel = 0; // Aktueller Winkel auf dem Fahrtkreis
    this.bikeX = x + this.fahrRadius; // Aktuelle Bike-Position X
    this.bikeY = y; // Aktuelle Bike-Position Y
    this.kontaktSchaden = 1; // Schaden pro Berührung mit Schüler
    this.kontaktTimer = 0; // Cooldown-Timer für Berührungsschaden
    this.stachel = false; // Stachelräder aktiv? (extra Schaden)
    this.feuerSpur = false; // BBQ-Feuerspur aktiv?
    this.bombenSpur = false; // Geschenk-Bomben auf der Strecke?
    this.feuerSpurPunkte = []; // Liste der Feuerspur-Punkte
    this.bombenAblauf = 0; // Timer für nächste Geschenk-Bombe
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Power – schneller, mehr Schaden
        name: 'Power',
        upgrades: [
          { name: 'Mehr Schaden',     beschreibung: 'Kontakt-Schaden x2',         kosten: 90  },
          { name: 'Schneller Fahren', beschreibung: 'Höhere Fahrgeschwindigkeit', kosten: 180 },
          { name: 'Stachelräder',     beschreibung: 'Schaden x3, größerer Kreis', kosten: 320 }
        ]
      },
      { // Pfad 1: Geschenke – wirft Bomben und hinterlässt Feuerspur
        name: 'Geschenke',
        upgrades: [
          { name: 'Christbaumkugeln', beschreibung: 'Wirft Bomben beim Fahren',     kosten: 90  },
          { name: 'BBQ-Feuerspur',    beschreibung: 'Hinterlässt brennende Spur',   kosten: 180 },
          { name: 'Weihnachtsmann',   beschreibung: 'Größere Bomben + Feuer',       kosten: 320 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte je nach Pfad und Stufe anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Power
      if (this.upgradeStufe === 1) { // Stufe 1: Mehr Schaden
        this.kontaktSchaden = 2; // Doppelter Kontakt-Schaden
      } else if (this.upgradeStufe === 2) { // Stufe 2: Schneller Fahren
        this.fahrGeschwindigkeit = 0.07; // Höhere Winkelgeschwindigkeit
        this.fahrRadius = 60; // Etwas größerer Radius
      } else if (this.upgradeStufe === 3) { // Stufe 3: Stachelräder
        this.kontaktSchaden = 3; // Dreifacher Schaden
        this.fahrRadius = 75; // Großer Fahrtkreis
        this.stachel = true; // Stacheln aktivieren (visueller Effekt + Bonus)
      }
    } else { // Pfad 1: Geschenke
      if (this.upgradeStufe === 1) { // Stufe 1: Christbaumkugeln werfen
        this.bombenSpur = true; // Bombenwürfe aktivieren
      } else if (this.upgradeStufe === 2) { // Stufe 2: Feuerspur
        this.feuerSpur = true; // Feuerspur aktivieren
      } else if (this.upgradeStufe === 3) { // Stufe 3: Weihnachtsmann
        this.kontaktSchaden = 2; // Mehr Kontakt-Schaden
        this.bombenSpur = true; // Bomben aktiv
        this.feuerSpur = true; // Feuer aktiv
        this.fahrRadius = 70; // Größerer Fahrkreis
      }
    }
  }

  update(gegner, spielGeschwindigkeit) { // Eigene Update-Methode: Bike fahren und Schaden
    let s = spielGeschwindigkeit; // Spielgeschwindigkeit (1 oder 2)
    this.fahrWinkel += this.fahrGeschwindigkeit * s; // Winkel weiterdrehen
    this.bikeX = this.x + cos(this.fahrWinkel) * this.fahrRadius; // Neue Bike-Position X
    this.bikeY = this.y + sin(this.fahrWinkel) * this.fahrRadius; // Neue Bike-Position Y
    if (this.kontaktTimer > 0) this.kontaktTimer -= s; // Cooldown herunterzählen
    // Kollision mit Schülern prüfen
    for (let g of gegner) { // Alle Gegner durchlaufen
      if (!g.aktiv) continue; // Inaktive überspringen
      if (dist(this.bikeX, this.bikeY, g.x, g.y) < g.radius + 14) { // Berührung?
        if (this.kontaktTimer <= 0) { // Cooldown abgelaufen?
          let neue = g.schadennehmen(this.kontaktSchaden, 'normal'); // Schaden anwenden
          if (neue) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neue); // Neue Gegner puffern
          this.kontaktTimer = 8; // Kurzer Cooldown bis zum nächsten Treffer
        }
      }
    }
    // Bomben werfen entlang des Fahrtkreises
    if (this.bombenSpur) { // Bombenwurf aktiv?
      this.bombenAblauf -= s; // Timer für Bombenwurf
      if (this.bombenAblauf <= 0) { // Zeit für eine Bombe?
        this.geschosse.push(new GeschenkBombe(this.bikeX, this.bikeY)); // Bombe an aktueller Bike-Position
        this.bombenAblauf = 60; // Alle 1 Sekunde eine Bombe
      }
    }
    // Feuerspur erzeugen
    if (this.feuerSpur) { // Feuerspur aktiv?
      this.feuerSpurPunkte.push({ x: this.bikeX, y: this.bikeY, leben: 90 }); // Neuen Spur-Punkt setzen
      if (this.feuerSpurPunkte.length > 80) this.feuerSpurPunkte.shift(); // Älteste Punkte entfernen
    }
    // Feuerspur-Punkte aktualisieren und Schaden anwenden
    for (let i = this.feuerSpurPunkte.length - 1; i >= 0; i--) { // Rückwärts durchgehen
      this.feuerSpurPunkte[i].leben -= s; // Lebensdauer verringern
      if (this.feuerSpurPunkte[i].leben <= 0) { // Abgelaufen?
        this.feuerSpurPunkte.splice(i, 1); // Entfernen
        continue; // Weiter mit nächstem
      }
      if (frameCount % 12 === 0) { // Periodisch Schaden anwenden
        for (let g of gegner) { // Alle Gegner prüfen
          if (!g.aktiv) continue; // Inaktive überspringen
          if (dist(this.feuerSpurPunkte[i].x, this.feuerSpurPunkte[i].y, g.x, g.y) < g.radius + 12) { // In Feuer?
            let n = g.schadennehmen(1, 'normal'); // 1 Schaden pro Tick
            if (n) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(n); // Neue puffern
          }
        }
      }
    }
    // Bomben-Geschosse aktualisieren
    for (let i = this.geschosse.length - 1; i >= 0; i--) { // Rückwärts durch Geschosse
      this.geschosse[i].update(gegner, s); // Bombe aktualisieren
      if (!this.geschosse[i].aktiv) this.geschosse.splice(i, 1); // Inaktive entfernen
    }
  }

  _schiessen() { /* Fight schießt nicht – Schaden durch Bike-Kontakt */ }

  draw() { // Überschriebene Zeichenmethode: Lehrer auf Sockel + Bike auf Kreisbahn
    push(); // Zustand sichern
    translate(this.x, this.y); // Zum Turm verschieben
    if (this.ausgewaehlt) { // Reichweiten-Kreis (Fahrkreis) zeigen
      noFill(); stroke(255, 255, 255, 60); strokeWeight(1.5); // Halbtransparente Linie
      ellipse(0, 0, this.fahrRadius * 2, this.fahrRadius * 2); // Fahr-Kreis
    }
    fill(120, 120, 120); stroke(60, 60, 60); strokeWeight(1); // Sockel-Stil
    rect(-18, -5, 36, 16, 4); // Sockel-Rechteck
    let kf = this.koerperFarbe; // Körperfarbe
    fill(kf[0], kf[1], kf[2]); stroke(max(0,kf[0]-60), max(0,kf[1]-60), max(0,kf[2]-60)); strokeWeight(1.5); // Körper
    rect(-11, -28, 22, 24, 3); // Körper
    stroke(max(0,kf[0]-40), max(0,kf[1]-40), max(0,kf[2]-40)); strokeWeight(3); // Arme
    line(-11, -22, -20, -12); line(11, -22, 20, -12); // Arme schräg
    let kpf = this.kopfFarbe; fill(kpf[0], kpf[1], kpf[2]); stroke(max(0,kpf[0]-50), max(0,kpf[1]-50), max(0,kpf[2]-50)); strokeWeight(1.5); // Kopf
    ellipse(0, -38, 20, 20); // Kopf
    if (this.upgradeStufe > 0) { // Upgrade-Abzeichen
      let af = this.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100]; // Pfad-Farbe
      fill(af[0], af[1], af[2]); noStroke(); ellipse(12, -48, 14, 14); // Abzeichen
      fill(255); textAlign(CENTER, CENTER); textSize(9); text(this.upgradeStufe, 12, -48); // Stufe
    }
    pop(); // Zustand wiederherstellen
    // Feuerspur zeichnen (unter dem Bike)
    for (let p of this.feuerSpurPunkte) { // Jeden Spur-Punkt
      let alpha = map(p.leben, 0, 90, 0, 200); // Transparenz basierend auf Alter
      noStroke(); fill(255, 120, 30, alpha); // Orangefeuer
      ellipse(p.x, p.y, 18, 18); // Feuerball
      fill(255, 220, 60, alpha * 0.6); // Heller Kern
      ellipse(p.x, p.y, 10, 10); // Innerer Kern
    }
    // Bike zeichnen
    push(); // Zustand sichern
    translate(this.bikeX, this.bikeY); // Zur Bike-Position
    rotate(this.fahrWinkel + HALF_PI); // In Fahrtrichtung drehen
    if (this.stachel) { // Stachel-Aufsatz
      stroke(150, 150, 150); strokeWeight(1.5); // Silberne Stacheln
      for (let i = 0; i < 6; i++) { // 6 Stacheln rund um das Rad
        let w = (TWO_PI / 6) * i; // Winkel
        line(0, 0, cos(w) * 14, sin(w) * 14); // Stachel-Linie
      }
    }
    fill(40, 40, 50); stroke(20, 20, 30); strokeWeight(1.5); // Bike-Rahmen
    rect(-5, -10, 10, 20, 3); // Rahmen
    fill(70, 70, 80); ellipse(0, -10, 12, 12); // Vorderrad
    ellipse(0, 10, 12, 12); // Hinterrad
    fill(180, 50, 50); noStroke(); rect(-3, -3, 6, 6); // Roter Tank
    pop(); // Zustand wiederherstellen
    // Bombe(n) zeichnen
    for (let g of this.geschosse) g.draw(); // Bomben zeichnen
  }
}

class GeschenkBombe { // Geschenk-Bombe die nach kurzer Zeit explodiert
  constructor(x, y) { // Konstruktor mit Position
    this.x = x; this.y = y; // Position der Bombe
    this.aktiv = true; // Aktivitäts-Flag
    this.timer = 90; // Bombe explodiert nach 1.5 Sekunden
    this.explosionsRadius = 40; // Explosionsradius
    this.schaden = 2; // Explosionsschaden
    this.exploding = false; // Aktuell explodierend?
    this.explosionsAnimation = 0; // Animations-Timer für Explosion
  }
  update(gegner, spielGeschwindigkeit) { // Pro Frame aktualisieren
    if (!this.aktiv) return; // Inaktiv: nichts tun
    this.timer -= spielGeschwindigkeit; // Timer herunterzählen
    if (this.timer <= 0 && !this.exploding) { // Zeit explodiert
      this.exploding = true; // Explosionsphase aktivieren
      for (let g of gegner) { // Alle Gegner prüfen
        if (!g.aktiv) continue; // Inaktive überspringen
        if (dist(this.x, this.y, g.x, g.y) <= this.explosionsRadius) { // Im Radius?
          let n = g.schadennehmen(this.schaden, 'normal'); // Schaden anwenden
          if (n) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(n); // Neue puffern
        }
      }
    }
    if (this.exploding) { // Explosion läuft
      this.explosionsAnimation += spielGeschwindigkeit; // Animation voranschreiten
      if (this.explosionsAnimation > 18) this.aktiv = false; // Nach kurzer Zeit deaktivieren
    }
  }
  draw() { // Bombe oder Explosion zeichnen
    if (!this.aktiv) return; // Inaktiv: nicht zeichnen
    if (this.exploding) { // Explosionsphase
      let r = (this.explosionsAnimation / 18) * this.explosionsRadius; // Wachsender Radius
      noStroke(); fill(255, 180, 50, 200 - this.explosionsAnimation * 10); // Orange-Explosion
      ellipse(this.x, this.y, r * 2, r * 2); // Äußerer Ring
      fill(255, 240, 100, 220 - this.explosionsAnimation * 11); // Heller Kern
      ellipse(this.x, this.y, r * 1.4, r * 1.4); // Innerer Kern
    } else { // Bomben-Geschenk-Stil
      push(); // Zustand sichern
      translate(this.x, this.y); // Zur Bombe
      noStroke(); fill(50, 180, 70); rect(-7, -7, 14, 14, 2); // Geschenk grün
      fill(220, 50, 50); rect(-7, -1, 14, 2); rect(-1, -7, 2, 14); // Rote Schleife
      fill(220, 50, 50); ellipse(0, -7, 6, 4); // Schleife oben
      pop(); // Zustand wiederherstellen
    }
  }
}
