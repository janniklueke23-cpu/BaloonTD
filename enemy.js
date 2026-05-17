// enemy.js – Basisklasse für alle Ballon-Gegner mit BTD5-Schichtensystem

// Farben für alle Ballontypen als globale Konstante
const BALLON_FARBEN = { // Objekt mit Farben pro Typ
  'rot':    [220, 50,  50],  // Erstklässler: Rotes Ballon
  'blau':   [50,  100, 220], // Sophomore: Blaues Ballon
  'gruen':  [50,  180, 70],  // Junior: Grünes Ballon
  'gelb':   [230, 200, 40],  // Senior: Gelbes Ballon (gepanzert)
  'schwarz':[40,  40,  40],  // Klassenprecher: Schwarzes Ballon (Boss)
  'rosa':   [255, 130, 200], // Streber: Pinkes Ballon (langsam aber zäh)
  'weiss':  [240, 240, 245]  // Schulsprecher: weißer Tank (extrem zäh)
};

// Geschwindigkeiten für alle Ballontypen (Pixel pro Frame bei 60fps)
const BALLON_GESCHWINDIGKEIT = { // Objekt mit Geschwindigkeit pro Typ
  'rot':    1.5,  // Erstklässler: langsam
  'blau':   2.0,  // Sophomore: mittel
  'gruen':  2.5,  // Junior: schnell
  'gelb':   1.5,  // Senior: langsam (aber gepanzert)
  'schwarz':1.2,  // Klassenprecher: sehr langsam aber stark
  'rosa':   0.85, // Streber: sehr langsam, viele HP
  'weiss':  0.65  // Schulsprecher: schleicht, gigantische HP
};

// Maximale HP (Schichten) pro Ballontyp
const BALLON_HP = { // Objekt mit HP pro Typ
  'rot':    1,  // Erstklässler: 1 HP
  'blau':   1,  // Blue Schicht hat auch 1 HP (aber wird aus einem roten geboren)
  'gruen':  1,  // Junior: 1 HP in dieser Schicht
  'gelb':   1,  // Senior: 1 HP (aber gepanzert – nimmt halben Schaden)
  'schwarz':10, // Boss: 10 HP
  'rosa':   25, // Streber: 25 HP (langsam aber zäh)
  'weiss':  60  // Schulsprecher: 60 HP (Tank-Boss)
};

// Größen (Radius) der Ballons pro Typ
const BALLON_RADIUS = { // Objekt mit Radius in Pixel pro Typ
  'rot':    13, // Erstklässler: kleiner Ballon
  'blau':   14, // Sophomore: etwas größer
  'gruen':  15, // Junior: mittelgroß
  'gelb':   17, // Senior: größer (gepanzert)
  'schwarz':22, // Klassenprecher: großer Boss-Ballon
  'rosa':   26, // Streber: deutlich größer
  'weiss':  32  // Schulsprecher: gigantisch
};

// Reihenfolge der Schichten (von stark nach schwach)
const SCHICHTEN_REIHENFOLGE = ['weiss', 'rosa', 'schwarz', 'gelb', 'gruen', 'blau', 'rot']; // Vom Schulsprecher zum Erstklässler

class Ballon { // Hauptklasse für alle Ballon-Gegner
  constructor(typ, pfad, versatz) { // Konstruktor: erstellt einen neuen Ballon
    this.typ = typ; // Ballontyp (z.B. 'rot', 'blau', 'schwarz')
    this.pfad = pfad; // Array von Wegpunkten [{x,y}, ...] die der Ballon entlangläuft
    this.pfadIndex = 0; // Aktueller Wegpunkt-Index (wo auf dem Pfad der Ballon ist)
    this.fortschritt = 0; // Fortschritt zum nächsten Wegpunkt (0 bis 1)
    this.x = pfad[0].x; // Startposition X (erster Wegpunkt)
    this.y = pfad[0].y; // Startposition Y (erster Wegpunkt)
    this.hp = BALLON_HP[typ] || 1; // Aktuelle HP aus der Tabelle laden
    // Boss-HP skalieren mit Level: in höheren Leveln deutlich mehr HP für echte Herausforderung
    if (typ === 'schwarz' || typ === 'rosa' || typ === 'weiss') { // Nur für Bosse skalieren
      let level = (window.gs && window.gs.level) || 1; // Aktuelles Level (fallback 1)
      const hpMultPerLevel = [1, 1, 1, 1.6, 2.5, 4, 7, 12]; // Skalierung je Level (Index 0 = Level 1)
      let mult = hpMultPerLevel[level - 1] || 1; // Multiplikator holen
      this.hp = Math.max(1, Math.floor(this.hp * mult)); // HP entsprechend erhöhen
    }
    this.maxHp = this.hp; // Maximale HP merken (für Boss-Lebensanzeige)
    this.radius = BALLON_RADIUS[typ] || 13; // Radius des Ballons
    this.basisGeschwindigkeit = BALLON_GESCHWINDIGKEIT[typ] || 1.5; // Grundgeschwindigkeit
    this.geschwindigkeit = this.basisGeschwindigkeit; // Aktuelle Geschwindigkeit (kann verändert werden)
    this.gepanzert = (typ === 'gelb'); // Gelbe Ballons sind gepanzert (halber Schaden)
    this.id = ++Ballon.zaehler; // Einzigartige ID für diesen Ballon
    this.aktiv = true; // Ob der Ballon noch lebt und aktiv ist
    this.amZiel = false; // Ob der Ballon das Ende des Pfades erreicht hat
    this.verlangsamt = 0; // Timer für Verlangsamungseffekt (in Frames)
    this.betaeubt = 0; // Timer für Betäubungseffekt (in Frames)
    this.vergiftet = 0; // Timer für Gift-Schaden-über-Zeit
    this.giftSchaden = 0; // Wie viel Schaden Gift pro Tick macht
    this.giftStapel = 0; // Anzahl der Gift-Stapel (mehrere Biologielehrer)
    this.blinkTimer = 0; // Timer für Blink-Effekt wenn getroffen
    this.gesamtDistanz = 0; // Zurückgelegte Gesamtdistanz (für Sortierung/Priorisierung)
    // Boss-Aura: Klassensprecher (schwarz) und Streber (rosa) beschleunigen nahe Ballons,
    // Schulsprecher (weiss) noch stärker.
    this.boostRadius = (typ === 'schwarz' || typ === 'rosa' || typ === 'weiss') ? 120 : 0; // Aura-Radius
    this.boostFaktor = (typ === 'weiss') ? 1.5 : (typ === 'rosa' || typ === 'schwarz') ? 1.3 : 1.0; // Boost-Faktor
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
    if (this.verlangsamt > 0) { // Verlangsamungs-Timer herunterzählen
      this.verlangsamt--; // Eine Frame weniger
      if (this.verlangsamt <= 0) this.verlangsamStaerke = undefined; // Effekt-Stärke zurücksetzen
    }
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
    if (this.verlangsamt > 0) { // Bei aktiver Verlangsamung
      let staerke = (typeof this.verlangsamStaerke === 'number') ? this.verlangsamStaerke : 0.5; // Verlangsamungs-Faktor
      aktuellGeschwindigkeit *= staerke; // Geschwindigkeit reduzieren (z.B. 0.5 = halbe Speed)
    }
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
        // Boss-Mechaniken: zusätzliche schwächere Ballons spawnen
        let extras = []; // Konfiguration für extra Spawns
        if (this.typ === 'weiss')   extras = [{ typ: 'rosa', anzahl: 2 }]; // Schulsprecher → 2 Streber
        else if (this.typ === 'rosa')   extras = [{ typ: 'schwarz', anzahl: 1 }]; // Streber → 1 Klassensprecher
        else if (this.typ === 'schwarz') extras = [{ typ: 'gelb', anzahl: 2 }]; // Klassensprecher → 2 Senioren
        for (let cfg of extras) { // Alle Extra-Spawns ausführen
          for (let i = 0; i < cfg.anzahl; i++) { // Je nach konfigurierter Anzahl
            let extra = new Ballon(cfg.typ, this.pfad, 0); // Extra-Ballon erstellen
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

  verlangsamen(dauer, staerke) { // Verlangsamungseffekt anwenden (staerke optional, default 0.5)
    this.verlangsamt = Math.max(this.verlangsamt, dauer); // Längere Dauer behalten
    let s = (typeof staerke === 'number') ? staerke : 0.5; // Standard 50% Verlangsamung
    if (typeof this.verlangsamStaerke !== 'number') this.verlangsamStaerke = s; // Erste Anwendung
    else this.verlangsamStaerke = Math.min(this.verlangsamStaerke, s); // Stärkster Effekt gewinnt
  }

  betaeuben(dauer) { // Betäubungseffekt anwenden (Ballon stoppt kurz)
    this.betaeubt = Math.max(this.betaeubt, dauer); // Längere Dauer behalten
  }

  draw() { // Schüler-Figur zeichnen (animiert mit Geh-Bewegung)
    if (!this.aktiv) return; // Inaktive Schüler nicht zeichnen
    push(); // p5.js Zustand sichern
    translate(this.x, this.y); // Koordinatensystem zum Schüler verschieben
    let farbe = BALLON_FARBEN[this.typ] || [200, 200, 200]; // Farbe (= Hemdfarbe und Haare) für diesen Typ
    let r = farbe[0]; // Rot-Anteil
    let g = farbe[1]; // Grün-Anteil
    let b = farbe[2]; // Blau-Anteil
    if (this.blinkTimer > 0 && this.blinkTimer % 2 === 0) { // Blink-Effekt: jedes zweite Frame hell
      r = min(255, r + 100); // Rot aufhellen
      g = min(255, g + 100); // Grün aufhellen
      b = min(255, b + 100); // Blau aufhellen
    }
    let rad = this.radius; // Schüler-Größe (Skalierungsfaktor)
    let geh = sin(this.winkelAnimation * 3.0); // Geh-Phase für Beine/Arme
    let huepf = abs(sin(this.winkelAnimation * 3.0)) * 1.5; // Hüpfen beim Laufen
    // Schatten unter dem Schüler
    noStroke(); // Kein Rand
    fill(0, 0, 0, 50); // Halbtransparenter Schatten
    ellipse(0, rad * 0.95, rad * 1.4, rad * 0.45); // Boden-Schatten
    // Beine (zwei kleine Rechtecke, animiert)
    let beinFarbe = [60, 60, 90]; // Dunkelblaue Hose
    stroke(max(0, beinFarbe[0]-20), max(0, beinFarbe[1]-20), max(0, beinFarbe[2]-20)); // Dunklere Kontur
    strokeWeight(1.2); // Dünne Kontur
    fill(beinFarbe[0], beinFarbe[1], beinFarbe[2]); // Hose
    let beinH = rad * 0.7; // Beinhöhe relativ zum Radius
    rect(-rad * 0.32 - 1, rad * 0.25 - huepf, 4, beinH + geh * 2, 1); // Linkes Bein (mit Schwung)
    rect(rad * 0.32 - 3, rad * 0.25 - huepf, 4, beinH - geh * 2, 1); // Rechtes Bein (gegenläufig)
    // Schuhe
    fill(30, 30, 40); // Dunkle Schuhe
    noStroke(); // Kein Rand
    ellipse(-rad * 0.32 + 1, rad * 0.95 + beinH * 0.4 - huepf + geh * 2, 6, 3); // Linker Schuh
    ellipse(rad * 0.32 - 1, rad * 0.95 + beinH * 0.4 - huepf - geh * 2, 6, 3); // Rechter Schuh
    push(); // Für Hüpf-Animation des Oberkörpers
    translate(0, -huepf); // Oberkörper hüpft mit
    // Körper (Hemd in Schüler-Farbe)
    stroke(max(0, r - 60), max(0, g - 60), max(0, b - 60)); // Dunklere Kontur
    strokeWeight(1.5); // Mittelkräftige Linie
    fill(r, g, b); // Hemdfarbe
    rect(-rad * 0.55, -rad * 0.1, rad * 1.1, rad * 0.7, 3); // Oberkörper als Rechteck
    // Hemd-Detail: kleiner Kragen
    fill(max(0, r - 30), max(0, g - 30), max(0, b - 30)); // Etwas dunkler
    noStroke(); // Kein Rand
    triangle(-3, -rad * 0.1, 3, -rad * 0.1, 0, -rad * 0.1 + 5); // Dreieckiger Kragen
    // Arme (animiert: schwingen entgegen den Beinen)
    stroke(max(0, r - 60), max(0, g - 60), max(0, b - 60)); // Arm-Konturfarbe
    strokeWeight(3.2); // Dicke Arme
    let armSchwung = geh * 4; // Arm-Schwung-Stärke
    line(-rad * 0.55, 0, -rad * 0.7, rad * 0.35 - armSchwung); // Linker Arm
    line(rad * 0.55, 0, rad * 0.7, rad * 0.35 + armSchwung); // Rechter Arm
    // Hände
    let kpf = [240, 210, 175]; // Hautfarbe
    fill(kpf[0], kpf[1], kpf[2]); // Hände hautfarben
    noStroke(); // Kein Rand
    ellipse(-rad * 0.7, rad * 0.35 - armSchwung, 4, 4); // Linke Hand
    ellipse(rad * 0.7, rad * 0.35 + armSchwung, 4, 4); // Rechte Hand
    // Rucksack für Senior (gelb) und Junior (gruen)
    if (this.typ === 'gelb' || this.typ === 'gruen') { // Schüler mit Rucksack
      fill(this.typ === 'gelb' ? color(140, 80, 40) : color(60, 100, 50)); // Braun oder dunkelgrün
      stroke(40, 30, 20); // Dunkle Kontur
      strokeWeight(1); // Dünne Kontur
      rect(-rad * 0.4, -rad * 0.05, rad * 0.8, rad * 0.55, 3); // Rucksack hinten (etwas seitlich)
    }
    // Kopf
    let kopfR = rad * 0.85; // Kopfradius
    stroke(max(0, kpf[0]-50), max(0, kpf[1]-50), max(0, kpf[2]-50)); // Dunklere Hautkontur
    strokeWeight(1.5); // Konturstärke
    fill(kpf[0], kpf[1], kpf[2]); // Hautfarbe
    ellipse(0, -rad * 0.55, kopfR, kopfR); // Kopf-Ellipse
    // Haare (in Schüler-Farbe als Käppchen)
    noStroke(); // Kein Rand
    fill(r, g, b); // Haarfarbe = Schüler-Typ-Farbe
    arc(0, -rad * 0.55, kopfR, kopfR, PI + 0.2, TWO_PI - 0.2, OPEN); // Bogen oben als Frisur
    fill(max(0, r - 40), max(0, g - 40), max(0, b - 40)); // Etwas dunklere Haarsträhne
    arc(0, -rad * 0.55, kopfR, kopfR * 0.7, PI + 0.4, TWO_PI - 0.4, OPEN); // Akzentstreifen
    // Gesicht zeichnen (Augen und Mund) auf dem Kopf
    this._gesichtZeichnen(0, -rad * 0.55, kopfR); // Gesicht auf dem Kopf
    // Krone für den Klassensprecher (Boss)
    if (this.typ === 'schwarz' || this.typ === 'rosa' || this.typ === 'weiss') this._kroneZeichnen(0, -rad * 0.55, kopfR); // Krone für alle Boss-Typen
    pop(); // Hüpfender Oberkörper-Stack schließen
    // Gift-Anzeige (grüne Wolke wenn vergiftet)
    if (this.vergiftet > 0) { // Nur anzeigen wenn vergiftet
      noStroke(); // Keine Kontur
      fill(80, 200, 80, 100); // Halbdurchsichtiges Grün
      ellipse(0, 0, rad * 2.5, rad * 2.5); // Leuchtendes Gift-Aura
    }
    // Verlangsamungs-Anzeige (blaues Aura + Schneeflocken-Symbol)
    if (this.verlangsamt > 0) { // Nur anzeigen wenn verlangsamt
      noStroke(); // Keine Kontur
      fill(120, 200, 255, 80); // Halbtransparentes Eisblau
      ellipse(0, 0, rad * 2.4, rad * 2.4); // Eis-Aura um den Schüler
      stroke(220, 240, 255, 220); // Helle Schneeflocken-Linien
      strokeWeight(1.4); // Dünne Strichstärke
      let sx = rad * 0.95, sy = -rad * 1.1; // Position oben rechts
      for (let i = 0; i < 3; i++) { // Drei Strahlen für die Schneeflocke
        let w = (PI / 3) * i; // Winkel
        line(sx + cos(w) * 4, sy + sin(w) * 4, sx - cos(w) * 4, sy - sin(w) * 4); // Strahl
      }
    }
    // Leben-Balken für den Boss
    if (this.typ === 'schwarz' || this.typ === 'rosa' || this.typ === 'weiss') { // Lebensanzeige für alle Bosse
      this._lebensBalkneZeichnen(rad); // Lebensanzeige zeichnen
    }
    pop(); // p5.js Zustand wiederherstellen
  }

  _gesichtZeichnen(cx, cy, kopfR) { // Gesichtsausdruck auf dem Schüler-Kopf
    let augenY = cy - kopfR * 0.05; // Y-Position der Augen (leicht über Kopfmitte)
    let augenAbstand = kopfR * 0.22; // Abstand der Augen vom Zentrum
    // Augen-Weiß
    fill(255, 255, 255); // Weiß für Augäpfel
    noStroke(); // Keine Kontur
    ellipse(cx - augenAbstand, augenY, kopfR * 0.28, kopfR * 0.32); // Linker Augapfel
    ellipse(cx + augenAbstand, augenY, kopfR * 0.28, kopfR * 0.32); // Rechter Augapfel
    fill(20, 20, 80); // Dunkelblaue Pupillen
    ellipse(cx - augenAbstand, augenY + 1, kopfR * 0.13, kopfR * 0.16); // Linke Pupille
    ellipse(cx + augenAbstand, augenY + 1, kopfR * 0.13, kopfR * 0.16); // Rechte Pupille
    // Mund zeichnen (Ausdruck je nach Typ)
    stroke(20, 20, 20); // Dunkel für den Mund
    strokeWeight(1.3); // Linienstärke
    noFill(); // Kein Füll für den Mund
    let mundY = cy + kopfR * 0.22; // Y-Position des Mundes
    if (this.typ === 'schwarz') { // Klassensprecher hat breites Grinsen
      arc(cx, mundY, kopfR * 0.55, kopfR * 0.45, 0, PI); // Breites Grinsen
    } else if (this.typ === 'gelb') { // Senior schaut entschlossen
      line(cx - kopfR * 0.18, mundY, cx + kopfR * 0.18, mundY); // Gerade Linie
    } else { // Alle anderen lächeln leicht
      arc(cx, mundY, kopfR * 0.4, kopfR * 0.3, 0.1, PI - 0.1); // Leichtes Lächeln
    }
  }

  _kroneZeichnen(cx, cy, kopfR) { // Krone für den Klassensprecher auf dem Kopf
    fill(255, 215, 0); // Goldfarbe für die Krone
    stroke(180, 130, 0); // Dunkelgold für die Kontur
    strokeWeight(1.5); // Linienstärke
    let kronenY = cy - kopfR * 0.55; // Y-Position der Krone (über dem Kopf)
    let kronenB = kopfR * 0.9; // Breite der Krone
    // Krone als Polygon zeichnen
    beginShape(); // Polygon starten
    vertex(cx - kronenB / 2, kronenY); // Linke untere Ecke
    vertex(cx - kronenB / 2, kronenY - 7); // Linke obere Ecke
    vertex(cx - kronenB / 4, kronenY - 3); // Erster Einzug
    vertex(cx, kronenY - 10); // Mittlere Spitze
    vertex(cx + kronenB / 4, kronenY - 3); // Zweiter Einzug
    vertex(cx + kronenB / 2, kronenY - 7); // Rechte obere Ecke
    vertex(cx + kronenB / 2, kronenY); // Rechte untere Ecke
    endShape(CLOSE); // Polygon schließen und füllen
    // Edelsteine auf der Krone
    fill(200, 50, 50); // Rot für den mittleren Edelstein
    noStroke(); // Keine Kontur
    ellipse(cx, kronenY - 10, 4, 4); // Mittlerer Edelstein oben
    fill(100, 200, 255); // Blau für die seitlichen Edelsteine
    ellipse(cx - kronenB / 2, kronenY - 3, 3, 3); // Linker Edelstein
    ellipse(cx + kronenB / 2, kronenY - 3, 3, 3); // Rechter Edelstein
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
