class Fight extends Turm { // Hr. Fight – fährt mit dem Motorrad zwischen 2 gewählten Punkten
  constructor(x, y, punktB) { // Erster Punkt = Grill, zweiter Punkt = Zigarre
    super(x, y, 'fight', 280); // Basisklasse mit Typ und Kosten initialisieren
    this.name = 'Hr. Fight'; // Anzeigename des Lehrers
    this.reichweite = 60; // Sichtradius (für Reichweiten-Anzeige bei Auswahl)
    this.feuerRate = 30; // Frames zwischen Berührungs-Schaden-Ticks
    this.schaden = 1; // Basis-Schaden (multipliziert mit Anlauf)
    this.kopfFarbe = [240, 210, 175]; // Hautfarbe
    this.koerperFarbe = [40, 40, 50]; // Schwarze Lederjacke
    // ── Zwei Punkte zwischen denen er fährt ──────────────────────────────
    this.punktA = { x: x, y: y }; // Erster Punkt (Grill)
    this.punktB = punktB || { x: x + 120, y: y }; // Zweiter Punkt (Zigarre)
    // ── Bewegungs-Status ─────────────────────────────────────────────────
    this.bikeX = x; // Aktuelle X-Position des Bikes
    this.bikeY = y; // Aktuelle Y-Position des Bikes
    this.aktuellesZiel = 'B'; // Bike fährt aktuell zu Punkt B
    this.kreisModus = false; // Gerade Drehung um einen Punkt?
    this.kreisWinkel = 0; // Aktueller Winkel auf dem Drehkreis
    this.kreisRadius = 26; // Radius des Wendekreises um Grill/Zigarre
    this.fahrTempo = 1.6; // Pixel pro Frame in der geraden Phase
    this.fahrWinkel = 0; // Aktuelle Fahrtrichtung
    this.anlauf = 0; // Akkumulierte Strecke seit letzter Wende (Schaden-Multiplikator)
    // ── Schaden / Upgrades ───────────────────────────────────────────────
    this.kontaktTimer = 0; // Cooldown zwischen Treffern
    this.fahrTempoBoost = 1; // Geschwindigkeitsfaktor (Upgrade)
    this.schadenBoost = 1; // Zusätzlicher Schaden-Multiplikator (Upgrade)
    this.stachel = false; // Stachelräder aktiv?
    this.feuerSpur = false; // BBQ-Feuerspur aktiv?
    this.bombenSpur = false; // Geschenk-Bomben aktiv?
    this.weihnachtsmann = false; // Weihnachtsmann-Modus (rote Mütze)
    this.feuerSpurPunkte = []; // Aktive Feuerspur-Punkte
    this.bombenAblauf = 0; // Timer bis zur nächsten Bombe
    this.geschosse = []; // Bomben werden hier gespeichert
  }

  getPfadeInfo() { // Beide Upgrade-Pfade beschreiben
    return [
      { // Pfad 0: Power – schneller, mehr Schaden
        name: 'Power',
        upgrades: [
          { name: 'Mehr Schaden',     beschreibung: 'Anlauf-Schaden x2',           kosten: 90  },
          { name: 'Schneller Fahren', beschreibung: 'Höhere Fahrgeschwindigkeit',  kosten: 180 },
          { name: 'Stachelräder',     beschreibung: 'Schaden x4, größere Wendekreise', kosten: 320 }
        ]
      },
      { // Pfad 1: Geschenke – Bomben & Feuer
        name: 'Geschenke',
        upgrades: [
          { name: 'Christbaumkugeln', beschreibung: 'Wirft Bomben beim Fahren',   kosten: 90  },
          { name: 'BBQ-Feuerspur',    beschreibung: 'Hinterlässt brennende Spur', kosten: 180 },
          { name: 'Weihnachtsmann',   beschreibung: 'Größere Bomben + Feuer + Mütze', kosten: 320 }
        ]
      }
    ];
  }

  _upgradeAnwenden() { // Upgrade-Effekte anwenden
    if (this.upgradePfad === 0) { // Pfad 0: Power
      if (this.upgradeStufe === 1) { // Stufe 1: Mehr Schaden
        this.schadenBoost = 2; // Doppelter Anlauf-Schaden
      } else if (this.upgradeStufe === 2) { // Stufe 2: Schneller Fahren
        this.fahrTempoBoost = 1.6; // 60% schneller fahren
      } else if (this.upgradeStufe === 3) { // Stufe 3: Stachelräder
        this.schadenBoost = 4; // Vierfacher Schaden
        this.kreisRadius = 38; // Größere Wendekreise
        this.stachel = true; // Stacheln aktivieren
      }
    } else { // Pfad 1: Geschenke
      if (this.upgradeStufe === 1) { // Stufe 1: Christbaumkugeln
        this.bombenSpur = true; // Bombenwürfe aktivieren
      } else if (this.upgradeStufe === 2) { // Stufe 2: BBQ-Feuerspur
        this.feuerSpur = true; // Feuerspur aktivieren
      } else if (this.upgradeStufe === 3) { // Stufe 3: Weihnachtsmann
        this.bombenSpur = true; // Bomben aktiv
        this.feuerSpur = true; // Feuer aktiv
        this.weihnachtsmann = true; // Rote Mütze
        this.fahrTempoBoost = Math.max(this.fahrTempoBoost, 1.3); // Etwas schneller
      }
    }
  }

  update(gegner, spielGeschwindigkeit) { // Pro Frame: Bewegung + Schaden + Effekte
    let s = spielGeschwindigkeit; // Spielgeschwindigkeit
    if (this.kontaktTimer > 0) this.kontaktTimer -= s; // Cooldown herunterzählen
    let tempo = this.fahrTempo * this.fahrTempoBoost; // Aktuelles Fahrtempo
    if (this.kreisModus) { // Drehung um den Endpunkt
      let zentrum = (this.aktuellesZiel === 'B') ? this.punktB : this.punktA; // Wo wir gerade abdrehen
      this.kreisWinkel += (tempo / this.kreisRadius) * s; // Winkel proportional zum Tempo erhöhen
      this.bikeX = zentrum.x + cos(this.kreisWinkel) * this.kreisRadius; // X auf Kreisbahn
      this.bikeY = zentrum.y + sin(this.kreisWinkel) * this.kreisRadius; // Y auf Kreisbahn
      this.fahrWinkel = this.kreisWinkel + HALF_PI; // Tangenten-Richtung
      if (this.kreisWinkel >= this._kreisStart + TWO_PI) { // Vollständige Runde gefahren?
        this.kreisModus = false; // Wieder gerade fahren
        this.aktuellesZiel = (this.aktuellesZiel === 'B') ? 'A' : 'B'; // Anderen Punkt anpeilen
        this.anlauf = 0; // Anlauf zurücksetzen
      }
    } else { // Geradeaus zum nächsten Punkt
      let ziel = (this.aktuellesZiel === 'B') ? this.punktB : this.punktA; // Aktuelles Ziel
      let dx = ziel.x - this.bikeX; // Differenz X
      let dy = ziel.y - this.bikeY; // Differenz Y
      let abstand = Math.sqrt(dx * dx + dy * dy); // Distanz zum Ziel
      this.fahrWinkel = atan2(dy, dx); // Fahrtrichtung
      let bewegung = tempo * s; // Wie weit dieses Frame
      if (abstand <= bewegung + this.kreisRadius) { // Punkt erreicht: Drehung beginnen
        this.bikeX = ziel.x + cos(this.fahrWinkel) * this.kreisRadius; // Auf Wendekreis-Rand starten
        this.bikeY = ziel.y + sin(this.fahrWinkel) * this.kreisRadius; // (gegenüberliegende Seite)
        this.kreisWinkel = atan2(this.bikeY - ziel.y, this.bikeX - ziel.x); // Aktuellen Winkel berechnen
        this._kreisStart = this.kreisWinkel; // Startwinkel für volle Runde merken
        this.kreisModus = true; // In Kreis-Modus wechseln
      } else { // Weiter geradeaus
        this.bikeX += cos(this.fahrWinkel) * bewegung; // Position aktualisieren
        this.bikeY += sin(this.fahrWinkel) * bewegung; // Position aktualisieren
        this.anlauf += bewegung; // Anlauf-Strecke akkumulieren
      }
    }
    // ── Kollision mit Schülern ──────────────────────────────────────────
    for (let g of gegner) { // Alle Gegner durchlaufen
      if (!g.aktiv) continue; // Inaktive überspringen
      if (dist(this.bikeX, this.bikeY, g.x, g.y) < g.radius + 16) { // Berührung?
        if (this.kontaktTimer <= 0) { // Cooldown abgelaufen?
          let anlaufFaktor = 1 + Math.min(this.anlauf / 80, 4); // Anlauf-Multiplikator (max 5x)
          let schaden = Math.max(1, Math.floor(this.schaden * this.schadenBoost * anlaufFaktor)); // Endschaden
          let neue = g.schadennehmen(schaden, 'normal'); // Schaden anwenden
          if (neue) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neue); // Neue Gegner puffern
          this.kontaktTimer = 8; // Kurzer Cooldown
        }
      }
    }
    // ── Bomben werfen ───────────────────────────────────────────────────
    if (this.bombenSpur) { // Bombenwurf aktiv?
      this.bombenAblauf -= s; // Timer
      if (this.bombenAblauf <= 0) { // Zeit für Bombe?
        let bombenRadius = this.weihnachtsmann ? 55 : 40; // Größere Bombe bei Weihnachtsmann
        let bombenSchaden = this.weihnachtsmann ? 3 : 2; // Mehr Schaden bei Weihnachtsmann
        this.geschosse.push(new GeschenkBombe(this.bikeX, this.bikeY, bombenRadius, bombenSchaden)); // Bombe legen
        this.bombenAblauf = 60; // Alle 1 Sekunde
      }
    }
    // ── Feuerspur erzeugen ──────────────────────────────────────────────
    if (this.feuerSpur) { // Feuerspur aktiv?
      this.feuerSpurPunkte.push({ x: this.bikeX, y: this.bikeY, leben: 90 }); // Neuer Spur-Punkt
      if (this.feuerSpurPunkte.length > 100) this.feuerSpurPunkte.shift(); // Älteste Punkte löschen
    }
    // ── Feuerspur-Punkte aktualisieren + Schaden ────────────────────────
    for (let i = this.feuerSpurPunkte.length - 1; i >= 0; i--) { // Rückwärts durchlaufen
      this.feuerSpurPunkte[i].leben -= s; // Lebensdauer verringern
      if (this.feuerSpurPunkte[i].leben <= 0) { // Abgelaufen?
        this.feuerSpurPunkte.splice(i, 1); // Entfernen
        continue; // Nächster
      }
      if (frameCount % 12 === 0) { // Alle 12 Frames: Schaden anwenden
        for (let g of gegner) { // Alle Gegner
          if (!g.aktiv) continue; // Inaktive überspringen
          if (dist(this.feuerSpurPunkte[i].x, this.feuerSpurPunkte[i].y, g.x, g.y) < g.radius + 12) { // Im Feuer?
            let n = g.schadennehmen(1, 'normal'); // 1 Schaden pro Tick
            if (n) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(n); // Neue puffern
          }
        }
      }
    }
    // ── Bomben-Geschosse aktualisieren ──────────────────────────────────
    for (let i = this.geschosse.length - 1; i >= 0; i--) { // Rückwärts durch Geschosse
      this.geschosse[i].update(gegner, s); // Bombe aktualisieren
      if (!this.geschosse[i].aktiv) this.geschosse.splice(i, 1); // Inaktive entfernen
    }
  }

  _schiessen() { /* Fight schießt nicht – Schaden durch Bike-Kontakt */ }

  _istUnterMaus(mx, my) { // Klick-Trefferprüfung: Bike + beide Endpunkte
    return dist(mx, my, this.bikeX, this.bikeY) <= 28 // Klick aufs Bike
        || dist(mx, my, this.punktA.x, this.punktA.y) <= 22 // Klick auf Grill
        || dist(mx, my, this.punktB.x, this.punktB.y) <= 22; // Klick auf Zigarre
  }

  draw() { // Gesamten Lehrer zeichnen: Grill, Zigarre, Strecke, Bike+Fahrer
    // ── Verbindungslinie zwischen den Endpunkten (Auswahl-Anzeige) ──────
    if (this.ausgewaehlt) { // Nur bei ausgewähltem Lehrer
      stroke(255, 255, 255, 70); // Halbtransparente Linie
      strokeWeight(2); // Linienbreite
      drawingContext.setLineDash([6, 5]); // Gestrichelt
      line(this.punktA.x, this.punktA.y, this.punktB.x, this.punktB.y); // A nach B
      drawingContext.setLineDash([]); // Strich-Muster zurücksetzen
      noFill(); stroke(255, 255, 255, 50); strokeWeight(1.2); // Wendekreise
      ellipse(this.punktA.x, this.punktA.y, this.kreisRadius * 2, this.kreisRadius * 2); // Kreis A
      ellipse(this.punktB.x, this.punktB.y, this.kreisRadius * 2, this.kreisRadius * 2); // Kreis B
    }
    // ── Feuerspur (unter dem Bike) ──────────────────────────────────────
    for (let p of this.feuerSpurPunkte) { // Jeden Spur-Punkt
      let alpha = map(p.leben, 0, 90, 0, 200); // Transparenz nach Alter
      noStroke(); fill(255, 120, 30, alpha); // Orangefeuer
      ellipse(p.x, p.y, 18, 18); // Feuerball
      fill(255, 220, 60, alpha * 0.6); // Heller Kern
      ellipse(p.x, p.y, 10, 10); // Innerer Kern
    }
    // ── Grill am Punkt A ────────────────────────────────────────────────
    this._grillZeichnen(this.punktA.x, this.punktA.y); // Grill mit Glut
    // ── Zigarre am Punkt B ──────────────────────────────────────────────
    this._zigarreZeichnen(this.punktB.x, this.punktB.y); // Zigarre mit Glut
    // ── Bike + Fahrer als ein Sprite ────────────────────────────────────
    this._bikeMitFahrerZeichnen(); // Harley + Lehrer
    // ── Bomben/Geschenke ────────────────────────────────────────────────
    for (let g of this.geschosse) g.draw(); // Bomben zeichnen
  }

  _grillZeichnen(x, y) { // Kleinen BBQ-Grill mit Glut und Rauch zeichnen
    noStroke(); // Kein Rand
    // Beine
    fill(60, 60, 70); // Dunkelgrau
    rect(x - 12, y + 6, 2, 10); // Linkes Bein
    rect(x + 10, y + 6, 2, 10); // Rechtes Bein
    // Topf (rund)
    fill(40, 40, 50); stroke(20, 20, 25); strokeWeight(1.5); // Schwarz mit dunklem Rand
    arc(x, y, 30, 24, PI, TWO_PI, CHORD); // Halbkreis-Topf (untere Hälfte)
    // Rost
    fill(140, 140, 150); noStroke(); // Silbern
    rect(x - 14, y - 1, 28, 2); // Rost-Linie
    // Glut innen
    fill(255, 90, 30, 200); // Orangerote Glut
    ellipse(x - 6, y - 1, 6, 3); // Glühen 1
    fill(255, 180, 60, 180); // Helle Glut
    ellipse(x + 4, y - 1, 5, 2.5); // Glühen 2
    // Rauchfähnchen
    let t = frameCount * 0.04; // Zeit-Variable
    for (let i = 0; i < 3; i++) { // Drei Rauchwölkchen
      let off = i * 6 + sin(t + i) * 3; // Versatz mit Wellenbewegung
      fill(180, 180, 190, 80 - i * 20); // Hellgrau, oben transparenter
      ellipse(x + sin(t * 0.6 + i) * 4, y - 8 - off, 6 + i * 1.5, 6 + i * 1.5); // Wölkchen
    }
  }

  _zigarreZeichnen(x, y) { // Liegende Zigarre mit glühendem Ende und Rauch
    push(); // Zustand sichern
    translate(x, y); // Zur Position
    rotate(-0.3); // Leicht schräg
    noStroke(); // Kein Rand
    fill(120, 75, 40); // Braun (Tabak-Hülle)
    rect(-14, -3, 28, 6, 1); // Zigarren-Körper
    fill(85, 50, 25); // Dunkelbraun für Detail
    rect(-14, -3, 6, 6, 1); // Mundstück-Bereich
    // Asche-Spitze rechts
    fill(180, 180, 185); // Hellgrau Asche
    rect(11, -3, 3, 6, 0.5); // Asche
    // Glut am Ende
    fill(255, 100, 20); // Orangerot
    ellipse(15, 0, 4, 4); // Glut-Ring
    fill(255, 220, 80); // Hell-gelb
    ellipse(15, 0, 2, 2); // Innerer Glut-Punkt
    pop(); // Zustand wiederherstellen
    // Rauchfähnchen (im Welt-Koordinaten-System, nach pop)
    let t = frameCount * 0.04; // Zeit
    for (let i = 0; i < 3; i++) { // Drei Wölkchen
      let off = i * 7 + sin(t + i + 1.2) * 3; // Versatz
      fill(180, 180, 190, 80 - i * 20); // Hellgrau
      noStroke(); // Kein Rand
      ellipse(x + 14 + sin(t * 0.7 + i) * 4, y - 6 - off, 5 + i * 1.5, 5 + i * 1.5); // Wölkchen
    }
  }

  _bikeMitFahrerZeichnen() { // Harley-Davidson-Stil Bike mit Lehrer
    push(); // Zustand sichern
    translate(this.bikeX, this.bikeY); // Zur Bike-Position
    rotate(this.fahrWinkel); // In Fahrtrichtung drehen (X-Achse = vorne)
    // Schatten unter dem Bike
    noStroke(); fill(0, 0, 0, 70); // Halbtransparent
    ellipse(0, 4, 50, 14); // Lang-ovaler Schatten
    // ── Bike (von hinten nach vorne) ────────────────────────────────────
    // Auspuff-Rohre rechts unten (typisch Harley)
    fill(180, 180, 185); stroke(80, 80, 85); strokeWeight(1.2); // Chrom-Look
    rect(-22, 4, 16, 3, 1.5); // Linker Auspuff
    rect(-22, 6, 16, 3, 1.5); // Doppelte Auspuff-Linie (zweiter darunter)
    // Hinteres Rad
    fill(35, 35, 40); stroke(15, 15, 20); strokeWeight(1.5); // Reifen
    ellipse(-18, 0, 16, 16); // Hinterrad
    fill(180, 180, 185); noStroke(); // Felge
    ellipse(-18, 0, 7, 7); // Felgen-Mitte
    // Stachelräder (Pfad-0-Stufe-3)
    if (this.stachel) { // Optionaler Stachel-Aufsatz
      stroke(200, 200, 205); strokeWeight(1.5); // Silberne Stacheln
      for (let i = 0; i < 8; i++) { // 8 Stacheln pro Rad
        let w = (TWO_PI / 8) * i + this.fahrWinkel * 3; // Drehender Winkel
        line(-18, 0, -18 + cos(w) * 13, sin(w) * 13); // Stachel hinten
      }
    }
    // Sattel (über Hinterrad)
    fill(25, 25, 30); stroke(10, 10, 15); strokeWeight(1); // Schwarzer Sattel
    rect(-18, -10, 14, 5, 2); // Sattelpolster
    // Tank (lang, typisch Harley)
    fill(180, 30, 30); stroke(110, 15, 15); strokeWeight(1.5); // Dunkles Rot mit Kontur
    rect(-6, -10, 16, 8, 3); // Großer Tank
    fill(220, 60, 60); noStroke(); // Heller Highlight
    rect(-4, -9, 12, 2, 2); // Glanz oben
    // Rahmen-Mittelteil
    fill(30, 30, 35); noStroke(); // Schwarzer Rahmen
    rect(-14, -2, 24, 3); // Rahmen-Linie
    // Vorderrad
    fill(35, 35, 40); stroke(15, 15, 20); strokeWeight(1.5); // Reifen
    ellipse(20, 0, 16, 16); // Vorderrad
    fill(180, 180, 185); noStroke(); // Felge
    ellipse(20, 0, 7, 7); // Felgen-Mitte
    if (this.stachel) { // Stacheln auch vorne
      stroke(200, 200, 205); strokeWeight(1.5); // Silberne Stacheln
      for (let i = 0; i < 8; i++) { // 8 Stacheln
        let w = (TWO_PI / 8) * i + this.fahrWinkel * 3; // Winkel
        line(20, 0, 20 + cos(w) * 13, sin(w) * 13); // Stachel vorne
      }
    }
    // Vordere Gabel (zum Lenker)
    stroke(180, 180, 185); strokeWeight(2.5); // Chrom-Gabel
    line(20, 0, 18, -10); // Linke Gabel
    line(20, 0, 22, -10); // Rechte Gabel
    // Apehanger-Lenker (typisch Harley: hoch)
    stroke(40, 40, 50); strokeWeight(2.5); // Schwarzer Lenker
    line(18, -10, 14, -16); // Linker Lenker-Aufstieg
    line(22, -10, 26, -16); // Rechter Lenker-Aufstieg
    line(14, -16, 12, -18); // Linker Griff
    line(26, -16, 28, -18); // Rechter Griff
    fill(80, 60, 40); noStroke(); // Lederne Griffe
    ellipse(11, -18, 4, 3); // Linker Griff-Punkt
    ellipse(29, -18, 4, 3); // Rechter Griff-Punkt
    // Scheinwerfer vorne
    fill(255, 240, 180); stroke(120, 100, 60); strokeWeight(1); // Hell-gelb
    ellipse(24, -3, 8, 6); // Scheinwerfer-Oval
    // ── Fahrer (Lehrer auf dem Bike) ────────────────────────────────────
    let kf = this.koerperFarbe; // Lederjacken-Farbe
    let kpf = this.kopfFarbe; // Hautfarbe
    // Bein hinten (rechts auf dem Bike, vom Betrachter aus links unten)
    fill(40, 40, 60); stroke(20, 20, 30); strokeWeight(1.2); // Jeans
    rect(-10, -5, 5, 9, 1.5); // Hinteres Bein
    rect(-2, -5, 5, 9, 1.5); // Vorderes Bein
    // Stiefel
    fill(50, 30, 20); noStroke(); // Braune Stiefel
    rect(-11, 4, 6, 3, 1); // Hinterer Stiefel
    rect(-3, 4, 6, 3, 1); // Vorderer Stiefel
    // Oberkörper (vorgebeugt)
    fill(kf[0], kf[1], kf[2]); stroke(max(0,kf[0]-60), max(0,kf[1]-60), max(0,kf[2]-60)); strokeWeight(1.5); // Lederjacke
    rect(-8, -16, 16, 12, 3); // Oberkörper-Block
    fill(180, 30, 30); noStroke(); // Roter Bandstreifen
    rect(-8, -10, 16, 2); // Streifen über der Jacke
    // Arme greifen den Lenker
    stroke(max(0,kf[0]-40), max(0,kf[1]-40), max(0,kf[2]-40)); strokeWeight(3.2); // Arm-Stil
    line(4, -14, 14, -16); // Vorderer Arm zum Lenker
    line(2, -14, 22, -16); // Hinterer Arm zum Lenker
    // Helm (rot, mit dunklem Visier)
    fill(180, 30, 30); stroke(110, 15, 15); strokeWeight(1.5); // Roter Helm
    ellipse(2, -22, 16, 14); // Helm-Kuppel
    fill(30, 40, 60, 230); noStroke(); // Dunkles Visier
    arc(4, -22, 12, 7, PI + 0.2, TWO_PI - 0.2, CHORD); // Visier-Halbbogen vorne
    fill(kpf[0], kpf[1], kpf[2]); noStroke(); // Hautfarbe Kinn
    rect(0, -20, 5, 3); // Kinn unter dem Helm
    // Weihnachtsmütze (rote Mütze + weiße Bommel)
    if (this.weihnachtsmann) { // Mütze obendrauf
      fill(200, 30, 30); stroke(120, 15, 15); strokeWeight(1.2); // Rote Mütze
      triangle(-4, -28, 8, -28, -2, -38); // Mützen-Kegel (nach links-oben)
      noStroke(); fill(240, 240, 245); // Weißer Pelz unten
      ellipse(2, -28, 14, 4); // Pelzrand
      fill(255, 255, 255); // Weiße Bommel
      ellipse(-2, -38, 5, 5); // Bommel an der Spitze
    }
    pop(); // Bike+Fahrer-Stack schließen
    // ── Upgrade-Abzeichen (immer aufrecht, nicht mit Bike gedreht) ──────
    if (this.upgradeStufe > 0) { // Nur wenn Upgrades vorhanden
      let af = this.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100]; // Pfad-Farbe
      fill(af[0], af[1], af[2]); stroke(255); strokeWeight(1); // Mit weißem Rand
      ellipse(this.bikeX + 18, this.bikeY - 18, 13, 13); // Abzeichen rechts oben
      noStroke(); fill(255); textAlign(CENTER, CENTER); textSize(9); textStyle(BOLD); // Stufe
      text(this.upgradeStufe, this.bikeX + 18, this.bikeY - 18); // Stufenzahl
      textStyle(NORMAL); // Normal
    }
  }
}

class GeschenkBombe { // Geschenk-Bombe die nach kurzer Zeit explodiert
  constructor(x, y, radius, schaden) { // Konstruktor mit Position, Radius und Schaden
    this.x = x; this.y = y; // Position der Bombe
    this.aktiv = true; // Aktivitäts-Flag
    this.timer = 90; // Bombe explodiert nach 1.5 Sekunden
    this.explosionsRadius = radius || 40; // Explosionsradius
    this.schaden = schaden || 2; // Explosionsschaden
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
