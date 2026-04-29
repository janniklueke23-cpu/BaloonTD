// enemy.js – Basisklasse für alle Ballon-Gegner mit BTD5-Schichtensystem

// Farben für alle Ballontypen als globale Konstante
const BALLON_FARBEN = { // Objekt mit Farben pro Typ
  'rot':    [220, 50,  50],  // Erstklässler: Rotes Ballon
  'blau':   [50,  100, 220], // Sophomore: Blaues Ballon
  'gruen':  [50,  180, 70],  // Junior: Grünes Ballon
  'gelb':   [230, 200, 40],  // Senior: Gelbes Ballon (gepanzert)
  'schwarz':[40,  40,  40]   // Klassenprecher: Schwarzes Ballon (Boss)
};

// Geschwindigkeiten für alle Ballontypen (Pixel pro Frame bei 60fps)
const BALLON_GESCHWINDIGKEIT = { // Objekt mit Geschwindigkeit pro Typ
  'rot':    1.5,  // Erstklässler: langsam
  'blau':   2.0,  // Sophomore: mittel
  'gruen':  2.5,  // Junior: schnell
  'gelb':   1.5,  // Senior: langsam (aber gepanzert)
  'schwarz':1.2   // Klassenprecher: sehr langsam aber stark
};

// Maximale HP (Schichten) pro Ballontyp
const BALLON_HP = { // Objekt mit HP pro Typ
  'rot':    1,  // Erstklässler: 1 HP
  'blau':   1,  // Blue Schicht hat auch 1 HP (aber wird aus einem roten geboren)
  'gruen':  1,  // Junior: 1 HP in dieser Schicht
  'gelb':   1,  // Senior: 1 HP (aber gepanzert – nimmt halben Schaden)
  'schwarz':10  // Boss: 10 HP
};

// Größen (Radius) der Ballons pro Typ
const BALLON_RADIUS = { // Objekt mit Radius in Pixel pro Typ
  'rot':    13, // Erstklässler: kleiner Ballon
  'blau':   14, // Sophomore: etwas größer
  'gruen':  15, // Junior: mittelgroß
  'gelb':   17, // Senior: größer (gepanzert)
  'schwarz':22  // Klassenprecher: großer Boss-Ballon
};

// Reihenfolge der Schichten (von stark nach schwach)
const SCHICHTEN_REIHENFOLGE = ['schwarz', 'gelb', 'gruen', 'blau', 'rot']; // Von Boss zu Erstklässler

class Ballon { // Hauptklasse für alle Ballon-Gegner
  constructor(typ, pfad, versatz) { // Konstruktor: erstellt einen neuen Ballon
    this.typ = typ; // Ballontyp (z.B. 'rot', 'blau', 'schwarz')
    this.pfad = pfad; // Array von Wegpunkten [{x,y}, ...] die der Ballon entlangläuft
    this.pfadIndex = 0; // Aktueller Wegpunkt-Index (wo auf dem Pfad der Ballon ist)
    this.fortschritt = 0; // Fortschritt zum nächsten Wegpunkt (0 bis 1)
    this.x = pfad[0].x; // Startposition X (erster Wegpunkt)
    this.y = pfad[0].y; // Startposition Y (erster Wegpunkt)
    this.hp = BALLON_HP[typ] || 1; // Aktuelle HP aus der Tabelle laden
    this.maxHp = this.hp; // Maximale HP merken (für Boss-Lebensanzeige)
    this.radius = BALLON_RADIUS[typ] || 13; // Radius des Ballons
    this.basisGeschwindigkeit = BALLON_GESCHWINDIGKEIT[typ] || 1.5; // Grundgeschwindigkeit
    this.geschwindigkeit = this.basisGeschwindigkeit; // Aktuelle Geschwindigkeit (kann verändert werden)
    this.gepanzert = (typ === 'gelb'); // Gelbe Ballons sind gepanzert (halber Schaden)
    this.id = ++Ballon.zaehler; // Einzigartige ID für diesen Ballon
    this.aktiv = true; // Ob der Ballon noch lebt und aktiv ist
    this.amZiel = false; // Ob der Ballon das Ende des Pfades erreicht hat
    this.verlangsamt = 0; // Timer für Verlangsamungseffekt (in Frames)
    this.verlangsamFaktor = 0.5; // Geschwindigkeitsfaktor bei Verlangsamung (0.5 = 50%)
    this.betaeubt = 0; // Timer für Betäubungseffekt (in Frames)
    this.vergiftet = 0; // Timer für Gift-Schaden-über-Zeit
    this.giftSchaden = 0; // Wie viel Schaden Gift pro Tick macht
    this.giftStapel = 0; // Anzahl der Gift-Stapel (mehrere Biologielehrer)
    this.blinkTimer = 0; // Timer für Blink-Effekt wenn getroffen
    this.gesamtDistanz = 0; // Zurückgelegte Gesamtdistanz (für Sortierung/Priorisierung)
    this.boostRadius = (typ === 'schwarz') ? 120 : 0; // Boss beschleunigt Ballons in diesem Radius
    this.boostFaktor = (typ === 'schwarz') ? 1.3 : 1.0; // Um diesen Faktor werden nahe Ballons schneller
    this.winkelAnimation = 0; // Animations-Winkel für wackelnde Bewegung
    if (versatz !== undefined) this.fortschritt = versatz; // Startversatz auf dem Pfad setzen (für gestaffelte Spawn)
  }

  update(spielGeschwindigkeit) { // Wird jeden Frame aufgerufen: Bewegung und Effekte aktualisieren
    if (!this.aktiv) return; // Inaktive Ballons überspringen
    let schritte = spielGeschwindigkeit; // Anzahl der Bewegungsschritte (1 oder 2 bei 2x-Geschwindigkeit)
    for (let s = 0; s < schritte; s++) { // Mehrfach updaten bei 2x-Geschwindigkeit
      this._bewegungSchritt(); // Einen Bewegungsschritt ausführen
    }
    this.winkelAnimation += 0.05; // Animations-Winkel für wackeln erhöhen
    if (this.verlangsamt > 0) this.verlangsamt--; // Verlangsamungs-Timer herunterzählen
    if (this.betaeubt > 0) this.betaeubt--; // Betäubungs-Timer herunterzählen
    if (this.blinkTimer > 0) this.blinkTimer--; // Blink-Timer herunterzählen
    if (this.vergiftet > 0) { // Falls Ballon vergiftet ist
      this.vergiftet -= spielGeschwindigkeit; // Gift-Timer herunterzählen
      if (frameCount % (15 / spielGeschwindigkeit) === 0) { // Alle ~0,25 Sekunden Gift-Schaden
        this.schadennehmen(this.giftSchaden, 'gift'); // Gift-Schaden anwenden
      }
    }
  }

  _bewegungSchritt() { // Einen einzelnen Bewegungsschritt ausführen (intern)
    if (this.betaeubt > 0) return; // Bei Betäubung nicht bewegen
    if (this.pfadIndex >= this.pfad.length - 1) { // Letzten Wegpunkt erreicht?
      this.amZiel = true; // Als "am Ziel" markieren
      this.aktiv = false; // Ballon deaktivieren
      return; // Keine weitere Bewegung
    }
    let ziel = this.pfad[this.pfadIndex + 1]; // Nächster Wegpunkt ist das Ziel
    let aktuell = this.pfad[this.pfadIndex]; // Aktueller Wegpunkt
    let dx = ziel.x - aktuell.x; // Differenz in X-Richtung
    let dy = ziel.y - aktuell.y; // Differenz in Y-Richtung
    let distanz = Math.sqrt(dx * dx + dy * dy); // Abstand zum nächsten Wegpunkt berechnen
    if (distanz === 0) { // Falls Wegpunkte identisch sind
      this.pfadIndex++; // Nächsten Wegpunkt nehmen
      return; // Schritt beenden
    }
    let aktuellGeschwindigkeit = this.geschwindigkeit; // Aktuelle Geschwindigkeit holen
    if (this.verlangsamt > 0) aktuellGeschwindigkeit *= this.verlangsamFaktor; // Bei Verlangsamung reduzierte Geschwindigkeit
    let bewegung = aktuellGeschwindigkeit; // Pixel die diesen Frame zurückgelegt werden
    let schrittFortschritt = bewegung / distanz; // Fortschritt als Anteil der Wegpunkt-Distanz
    this.fortschritt += schrittFortschritt; // Fortschritt addieren
    this.gesamtDistanz += bewegung; // Zurückgelegte Distanz erhöhen
    if (this.fortschritt >= 1) { // Nächsten Wegpunkt erreicht?
      this.fortschritt -= 1; // Überschuss für präzise Position behalten
      this.pfadIndex++; // Zum nächsten Wegpunkt weitergehen
    }
    if (this.pfadIndex < this.pfad.length - 1) { // Noch nicht am Ende?
      let aktPunkt = this.pfad[this.pfadIndex]; // Aktuellen Wegpunkt
      let naePunkt = this.pfad[this.pfadIndex + 1]; // Nächsten Wegpunkt
      this.x = lerp(aktPunkt.x, naePunkt.x, this.fortschritt); // X-Position interpolieren
      this.y = lerp(aktPunkt.y, naePunkt.y, this.fortschritt); // Y-Position interpolieren
    } else { // Am letzten Wegpunkt angekommen
      this.x = this.pfad[this.pfad.length - 1].x; // X auf Endposition setzen
      this.y = this.pfad[this.pfad.length - 1].y; // Y auf Endposition setzen
      this.amZiel = true; // Als am Ziel markieren
      this.aktiv = false; // Deaktivieren
    }
  }

  schadennehmen(schaden, schadensTyp) { // Schaden verarbeiten und ggf. nächste Schicht spawnen
    if (!this.aktiv) return []; // Inaktive Ballons ignorieren
    let effektiverSchaden = schaden; // Tatsächlichen Schaden berechnen
    if (this.gepanzert && schadensTyp !== 'panzerbrechend') { // Gepanzert und kein AP-Schaden?
      effektiverSchaden = Math.floor(schaden * 0.5); // Halber Schaden durch Panzerung
      if (effektiverSchaden < 1) effektiverSchaden = 1; // Mindestens 1 Schaden
    }
    this.hp -= effektiverSchaden; // HP reduzieren
    this.blinkTimer = 6; // Blink-Effekt für 6 Frames auslösen
    let neueGegner = []; // Liste der neu gespawnten Ballons (nächste Schicht)
    if (this.hp <= 0) { // Alle HP dieser Schicht aufgebraucht?
      this.aktiv = false; // Diesen Ballon deaktivieren (er ist geplatzt)
      let naechsteSchicht = this._naechsteSchicht(); // Nächste schwächere Schicht bestimmen
      if (naechsteSchicht) { // Gibt es eine nächste Schicht?
        let neuerBallon = new Ballon(naechsteSchicht, this.pfad, 0); // Neuen schwächeren Ballon erstellen
        neuerBallon.pfadIndex = this.pfadIndex; // Selbe Position auf dem Pfad übernehmen
        neuerBallon.fortschritt = this.fortschritt; // Selben Fortschritt übernehmen
        neuerBallon.gesamtDistanz = this.gesamtDistanz; // Selbe Gesamtdistanz übernehmen
        neuerBallon.x = this.x; // X-Position übernehmen
        neuerBallon.y = this.y; // Y-Position übernehmen
        neueGegner.push(neuerBallon); // Neuen Ballon zur Rückgabeliste hinzufügen
        if (this.typ === 'schwarz') { // Wenn der Boss platzt
          for (let i = 0; i < 2; i++) { // Spawnt er 3 gelbe Ballons (Boss-Spezialfähigkeit)
            let extra = new Ballon('gelb', this.pfad, 0); // Extra-Ballon erstellen
            extra.pfadIndex = this.pfadIndex; // Position übernehmen
            extra.fortschritt = this.fortschritt + i * 0.05; // Leicht versetzt spawnen
            extra.gesamtDistanz = this.gesamtDistanz; // Distanz übernehmen
            extra.x = this.x; // X übernehmen
            extra.y = this.y; // Y übernehmen
            neueGegner.push(extra); // Zur Rückgabeliste hinzufügen
          }
        }
      }
    }
    return neueGegner; // Neu gespawnte Ballons zurückgeben (werden ins Spiel eingefügt)
  }

  _naechsteSchicht() { // Bestimmt die nächste schwächere Schicht (BTD5-Schichtensystem)
    let index = SCHICHTEN_REIHENFOLGE.indexOf(this.typ); // Position in der Schichtenliste finden
    if (index === -1 || index === SCHICHTEN_REIHENFOLGE.length - 1) return null; // Kein Nachfolger
    return SCHICHTEN_REIHENFOLGE[index + 1]; // Nächste Schicht zurückgeben
  }

  giftAnwenden(schaden, dauer) { // Gift-Effekt auf den Ballon anwenden
    this.giftSchaden = Math.max(this.giftSchaden, schaden); // Stärkeren Gift-Schaden behalten
    this.vergiftet = Math.max(this.vergiftet, dauer); // Längere Dauer behalten
    this.giftStapel = Math.min(this.giftStapel + 1, 3); // Gift-Stapel erhöhen (max 3)
  }

  verlangsamen(dauer, faktor = 0.5) { // Verlangsamungseffekt anwenden
    if (dauer > this.verlangsamt) { // Nur stärkere/längere Verlangsamung übernehmen
      this.verlangsamt = dauer;
      this.verlangsamFaktor = faktor;
    } else if (faktor < this.verlangsamFaktor) { // Stärkerer Effekt gewinnt auch bei gleicher Dauer
      this.verlangsamFaktor = faktor;
    }
  }

  betaeuben(dauer) { // Betäubungseffekt anwenden (Ballon stoppt kurz)
    this.betaeubt = Math.max(this.betaeubt, dauer); // Längere Dauer behalten
  }

  draw() { // Ballon zeichnen
    if (!this.aktiv) return; // Inaktive Ballons nicht zeichnen
    push(); // p5.js Zustand sichern
    translate(this.x, this.y); // Koordinatensystem zum Ballon verschieben
    let farbe = BALLON_FARBEN[this.typ] || [200, 200, 200]; // Farbe für diesen Typ holen
    let r = farbe[0]; // Rot-Anteil
    let g = farbe[1]; // Grün-Anteil
    let b = farbe[2]; // Blau-Anteil
    if (this.blinkTimer > 0 && this.blinkTimer % 2 === 0) { // Blink-Effekt: jedes zweite Frame hell
      r = min(255, r + 100); // Rot aufhellen
      g = min(255, g + 100); // Grün aufhellen
      b = min(255, b + 100); // Blau aufhellen
    }
    let rad = this.radius; // Radius des Ballons
    let wackel = sin(this.winkelAnimation) * 1.5; // Leichte Wackelbewegung berechnen
    // Ballon-Schatten zeichnen
    noStroke(); // Keine Konturlinie für den Schatten
    fill(0, 0, 0, 40); // Halbdurchsichtiges Schwarz für Schatten
    ellipse(3, 5, rad * 2 + 4, rad * 2 + 2); // Schatten leicht versetzt zeichnen
    // Ballon-Körper (Kreis)
    stroke(max(0, r - 60), max(0, g - 60), max(0, b - 60)); // Dunklere Konturlinie
    strokeWeight(2); // Konturstärke setzen
    fill(r, g, b); // Ballonfarbe setzen
    ellipse(wackel, 0, rad * 2, rad * 2.1); // Ballon als leicht ovale Ellipse zeichnen
    // Glanzlicht auf dem Ballon (macht ihn rund/plastisch)
    noStroke(); // Keine Kontur für das Glanzlicht
    fill(255, 255, 255, 80); // Halbdurchsichtiges Weiß
    ellipse(wackel - rad * 0.25, -rad * 0.3, rad * 0.7, rad * 0.5); // Kleines Glanzlicht oben links
    // Ballon-Knoten (kleines Dreieck unten)
    fill(max(0, r - 40), max(0, g - 40), max(0, b - 40)); // Etwas dunklere Farbe für Knoten
    noStroke(); // Keine Kontur
    triangle(wackel - 4, rad - 2, wackel + 4, rad - 2, wackel, rad + 8); // Dreieck als Knoten
    // Ballon-Faden (Linie vom Knoten nach unten)
    stroke(max(0, r - 60), max(0, g - 60), max(0, b - 60)); // Fadenfarbe
    strokeWeight(1); // Dünne Linie
    line(wackel, rad + 8, wackel + sin(this.winkelAnimation * 0.7) * 5, rad + 18); // Gewundener Faden
    // Gesicht zeichnen (Augen und Mund)
    this._gesichtZeichnen(wackel, rad); // Gesicht auf dem Ballon zeichnen
    // Krone für den Boss
    if (this.typ === 'schwarz') this._kroneZeichnen(wackel, rad); // Krone des Klassensprechers
    // Gift-Anzeige (grüne Wolke wenn vergiftet)
    if (this.vergiftet > 0) { // Nur anzeigen wenn vergiftet
      noStroke(); // Keine Kontur
      fill(80, 200, 80, 100); // Halbdurchsichtiges Grün
      ellipse(wackel, 0, rad * 2.5, rad * 2.5); // Leuchtendes Gift-Aura
    }
    // Leben-Balken für den Boss
    if (this.typ === 'schwarz') { // Nur für den Boss
      this._lebensBalkneZeichnen(rad); // Lebensanzeige über dem Boss zeichnen
    }
    pop(); // p5.js Zustand wiederherstellen
  }

  _gesichtZeichnen(wackel, rad) { // Gesichtsausdruck auf dem Ballon zeichnen
    let augenY = -rad * 0.25; // Y-Position der Augen
    let augenAbstand = rad * 0.35; // Abstand der Augen vom Zentrum
    // Augen zeichnen
    fill(255, 255, 255); // Weiß für Augäpfel
    noStroke(); // Keine Kontur
    ellipse(wackel - augenAbstand, augenY, rad * 0.4, rad * 0.45); // Linker Augapfel
    ellipse(wackel + augenAbstand, augenY, rad * 0.4, rad * 0.45); // Rechter Augapfel
    fill(20, 20, 80); // Dunkelblaue Pupillen
    ellipse(wackel - augenAbstand, augenY + 1, rad * 0.2, rad * 0.25); // Linke Pupille
    ellipse(wackel + augenAbstand, augenY + 1, rad * 0.2, rad * 0.25); // Rechte Pupille
    // Mund zeichnen (böser/frecher Ausdruck je nach Typ)
    stroke(20, 20, 20); // Dunkel für den Mund
    strokeWeight(1.5); // Linienstärke
    noFill(); // Kein Füll für den Mund
    if (this.typ === 'schwarz') { // Boss hat breites böses Grinsen
      arc(wackel, rad * 0.15, rad * 0.9, rad * 0.6, 0, PI); // Breites Grinsen
    } else if (this.typ === 'gelb') { // Senior hat entschlossenen Gesichtsausdruck
      line(wackel - rad * 0.3, rad * 0.2, wackel + rad * 0.3, rad * 0.2); // Gerade Linie als Mund
    } else { // Alle anderen haben normalen leichten Smile
      arc(wackel, rad * 0.1, rad * 0.6, rad * 0.4, 0.1, PI - 0.1); // Leichtes Lächeln
    }
  }

  _kroneZeichnen(wackel, rad) { // Krone auf dem Boss-Ballon zeichnen
    fill(255, 215, 0); // Goldfarbe für die Krone
    stroke(180, 130, 0); // Dunkelgold für die Kontur
    strokeWeight(1.5); // Linienstärke
    let kronenY = -rad - 4; // Y-Position der Krone (über dem Ballon)
    let kronenB = rad * 1.2; // Breite der Krone
    // Krone als Polygon zeichnen (4 Zacken)
    beginShape(); // Polygon starten
    vertex(wackel - kronenB / 2, kronenY); // Linke untere Ecke
    vertex(wackel - kronenB / 2, kronenY - 8); // Linke obere Ecke
    vertex(wackel - kronenB / 4, kronenY - 4); // Erster Einzug
    vertex(wackel, kronenY - 12); // Mittlere Spitze
    vertex(wackel + kronenB / 4, kronenY - 4); // Zweiter Einzug
    vertex(wackel + kronenB / 2, kronenY - 8); // Rechte obere Ecke
    vertex(wackel + kronenB / 2, kronenY); // Rechte untere Ecke
    endShape(CLOSE); // Polygon schließen und füllen
    // Edelsteine auf der Krone
    fill(200, 50, 50); // Rot für den mittleren Edelstein
    noStroke(); // Keine Kontur
    ellipse(wackel, kronenY - 12, 5, 5); // Mittlerer Edelstein oben
    fill(100, 200, 255); // Blau für die seitlichen Edelsteine
    ellipse(wackel - kronenB / 2, kronenY - 4, 4, 4); // Linker Edelstein
    ellipse(wackel + kronenB / 2, kronenY - 4, 4, 4); // Rechter Edelstein
  }

  _lebensBalkneZeichnen(rad) { // Lebensanzeige über dem Boss zeichnen
    let balkenB = rad * 2.5; // Breite des Lebensbalkens
    let balkenH = 6; // Höhe des Lebensbalkens
    let balkenY = -rad - 22; // Y-Position (über der Krone)
    let anteil = this.hp / this.maxHp; // Anteil der verbleibenden HP
    noStroke(); // Keine Kontur
    fill(60, 60, 60); // Grauer Hintergrund
    rect(-balkenB / 2, balkenY, balkenB, balkenH, 3); // Hintergrunds-Balken
    fill(220, 50, 50); // Rot für verbleibende HP
    rect(-balkenB / 2, balkenY, balkenB * anteil, balkenH, 3); // HP-Balken proportional
  }
}

Ballon.zaehler = 0; // Klassen-Variable: Zähler für eindeutige Ballon-IDs
