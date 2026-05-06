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

  _istUnterMaus(mx, my) { // Klick-Trefferprüfung: Bike-Position UND Orbit-Mitte zählen
    return dist(mx, my, this.bikeX, this.bikeY) <= 26 // Klick aufs Bike
        || dist(mx, my, this.x, this.y) <= this.radius + 8; // Klick auf Orbit-Mitte
  }

  draw() { // Lehrer sitzt selbst auf dem Bike – Bike + Lehrer fahren zusammen
    // Reichweiten-/Fahrkreis-Anzeige beim Auswählen
    if (this.ausgewaehlt) { // Auswahl-Indikator
      push(); translate(this.x, this.y); // Orbit-Mittelpunkt
      noFill(); stroke(255, 255, 255, 70); strokeWeight(1.5); // Halbtransparente Linie
      ellipse(0, 0, this.fahrRadius * 2, this.fahrRadius * 2); // Fahrkreis
      fill(255, 255, 255, 30); noStroke(); ellipse(0, 0, 8, 8); // Mittelpunkt-Punkt
      pop(); // Zustand zurück
    }
    // Feuerspur zeichnen (unter dem Bike)
    for (let p of this.feuerSpurPunkte) { // Jeden Spur-Punkt
      let alpha = map(p.leben, 0, 90, 0, 200); // Transparenz basierend auf Alter
      noStroke(); fill(255, 120, 30, alpha); // Orangefeuer
      ellipse(p.x, p.y, 18, 18); // Feuerball
      fill(255, 220, 60, alpha * 0.6); // Heller Kern
      ellipse(p.x, p.y, 10, 10); // Innerer Kern
    }
    // Bike + Lehrer als Einheit zeichnen
    push(); // Zustand sichern
    translate(this.bikeX, this.bikeY); // Zur aktuellen Position
    rotate(this.fahrWinkel + HALF_PI); // In Fahrtrichtung drehen
    // Bodenschatten unter Bike
    noStroke(); fill(0, 0, 0, 70); // Halbtransparenter Schatten
    ellipse(2, 2, 30, 18); // Schatten leicht versetzt
    // Stachelräder (Pfad-0-Stufe-3)
    if (this.stachel) { // Optionaler Stachel-Aufsatz
      stroke(170, 170, 175); strokeWeight(1.5); // Silberne Stacheln
      for (let wheelY of [-10, 10]) { // Beide Räder bestachelt
        for (let i = 0; i < 8; i++) { // 8 Stacheln pro Rad
          let w = (TWO_PI / 8) * i + this.fahrWinkel * 2; // Drehender Winkel
          line(0, wheelY, cos(w) * 12, wheelY + sin(w) * 12); // Stachel-Linie
        }
      }
    }
    // Räder
    fill(35, 35, 40); stroke(15, 15, 20); strokeWeight(1.5); // Reifen-Stil
    ellipse(0, -10, 14, 14); // Vorderrad
    ellipse(0, 10, 14, 14); // Hinterrad
    fill(120, 120, 130); noStroke(); // Felgen-Stil
    ellipse(0, -10, 6, 6); // Vorderfelge
    ellipse(0, 10, 6, 6); // Hinterfelge
    // Bike-Rahmen unter dem Lehrer
    fill(180, 40, 40); stroke(100, 20, 20); strokeWeight(1.5); // Roter Rahmen
    rect(-4, -8, 8, 16, 2); // Rahmen-Mittelteil
    // Lenker (vorne)
    stroke(40, 40, 50); strokeWeight(2.2); // Dunkler Lenker
    line(-7, -12, 7, -12); // Lenkerstange
    // Sitz hinten
    fill(30, 30, 35); noStroke(); // Schwarzer Sitz
    rect(-3, 0, 6, 8, 1); // Sattel
    // ── Lehrer auf dem Bike ──────────────────────────────────────────────
    let kf = this.koerperFarbe; // Körperfarbe (Lederjacke)
    let kpf = this.kopfFarbe; // Hautfarbe
    // Beine seitlich
    fill(40, 40, 60); stroke(20, 20, 30); strokeWeight(1.2); // Hose
    rect(-7, 0, 4, 8, 1); // Linkes Bein angewinkelt
    rect(3, 0, 4, 8, 1); // Rechtes Bein angewinkelt
    // Oberkörper (vorgebeugte Haltung)
    fill(kf[0], kf[1], kf[2]); stroke(max(0,kf[0]-60), max(0,kf[1]-60), max(0,kf[2]-60)); strokeWeight(1.5);
    rect(-7, -7, 14, 12, 3); // Oberkörper
    // Arme greifen den Lenker (nach vorne)
    stroke(max(0,kf[0]-40), max(0,kf[1]-40), max(0,kf[2]-40)); strokeWeight(3); // Arm-Stil
    line(-5, -5, -7, -12); // Linker Arm zum Lenker
    line(5, -5, 7, -12); // Rechter Arm zum Lenker
    // Helm (statt Kopf – schützt den Lehrer)
    fill(180, 40, 40); stroke(100, 20, 20); strokeWeight(1.5); // Roter Helm passend zum Bike
    ellipse(0, -14, 16, 16); // Helm-Kuppel
    // Helm-Visier (dunkles Glas)
    fill(30, 40, 60, 220); noStroke(); // Dunkles Visier
    arc(0, -13, 14, 8, PI + 0.2, TWO_PI - 0.2, CHORD); // Visier-Halbbogen
    // Hautfarbenes Kinn unter dem Helm
    fill(kpf[0], kpf[1], kpf[2]); noStroke(); // Hautfarbe
    rect(-3, -10, 6, 3); // Kinn
    pop(); // Bike+Lehrer-Stack schließen (Rotation wiederherstellen)
    // Upgrade-Abzeichen ohne Rotation über dem Helm zeichnen, damit der Text
    // immer aufrecht steht (sonst dreht es sich mit dem Bike mit)
    if (this.upgradeStufe > 0) { // Nur wenn Upgrades vorhanden
      let af = this.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100]; // Pfad-Farbe
      fill(af[0], af[1], af[2]); stroke(255); strokeWeight(1); // Abzeichen mit weißem Rand
      ellipse(this.bikeX + 14, this.bikeY - 14, 13, 13); // Abzeichen rechts oben am Helm
      noStroke(); fill(255); textAlign(CENTER, CENTER); textSize(9); textStyle(BOLD); // Stufe
      text(this.upgradeStufe, this.bikeX + 14, this.bikeY - 14); // Stufenzahl
      textStyle(NORMAL); // Normal
    }
    // Bomben/Geschenke zeichnen
    for (let g of this.geschosse) g.draw(); // Aktive Geschosse
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
