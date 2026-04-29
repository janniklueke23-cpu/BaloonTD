// tower.js – Basisklasse für alle Türme (Lehrer)

class Turm { // Abstrakte Basisklasse – alle Lehrertürme erben davon
  constructor(x, y, typ, basisKosten) { // Konstruktor: erstellt einen neuen Turm
    this.x = x; // X-Position auf der Spielfläche
    this.y = y; // Y-Position auf der Spielfläche
    this.typ = typ; // Turmtyp als String (z.B. 'mathe', 'sport')
    this.basisKosten = basisKosten; // Ursprünglicher Kaufpreis des Turms
    this.upgradeStufe = 0; // Aktuelle Upgrade-Stufe (0 = keine Upgrades)
    this.upgradePfad = null; // Gewählter Upgrade-Pfad: null = noch nicht gewählt, 0 = Pfad 1, 1 = Pfad 2
    this.maxUpgrades = 3; // Maximale Anzahl an Upgrades pro Pfad
    this.reichweite = 100; // Reichweite in Pixel (wie weit schießt der Turm)
    this.feuerRate = 60; // Frames zwischen zwei Schüssen (60 = einmal pro Sekunde)
    this.schaden = 1; // Schaden pro Treffer
    this.feuerTimer = 0; // Countdown-Timer bis zum nächsten Schuss
    this.ziel = null; // Aktuelles Ziel (Ballon-Objekt)
    this.ausgewaehlt = false; // Ob der Turm gerade angeklickt/ausgewählt ist
    this.radius = 22; // Kollisions-/Darstellungsradius des Turms
    this.geschosse = []; // Liste der aktiven Geschosse dieses Turms
    this.schussTyp = 'normal'; // Typ des Geschosses (beeinflusst Darstellung)
    this.durchdringen = false; // Ob Geschosse mehrere Ballons treffen
    this.durchdrigenAnzahl = 1; // Wie viele Ballons das Geschoss treffen kann
    this.kopfFarbe = [200, 200, 200]; // Kopffarbe des Lehrer-Strichmännchens
    this.koerperFarbe = [100, 100, 200]; // Körperfarbe des Lehrer-Strichmännchens
    this.id = ++Turm.zaehler; // Eindeutige ID für diesen Turm
  }

  update(gegner, spielGeschwindigkeit) { // Jeden Frame: Ziel suchen und schießen
    this.feuerTimer -= spielGeschwindigkeit; // Timer herunterzählen (schneller bei 2x)
    this.ziel = this._besteZielFinden(gegner); // Bestes Ziel in Reichweite suchen
    if (this.ziel && this.feuerTimer <= 0) { // Wenn Ziel vorhanden und Feuer-Timer abgelaufen
      this._schiessen(); // Schuss abfeuern
      if (this.typ !== 'pfingsten' && window.gs && window.gs.sound) window.gs.sound.turmSchiessen(this.typ); // Sound (außer Support-Türme)
      this.feuerTimer = this.feuerRate; // Timer zurücksetzen
    }
    for (let i = this.geschosse.length - 1; i >= 0; i--) { // Alle Geschosse rückwärts durchgehen
      this.geschosse[i].update(gegner, spielGeschwindigkeit); // Geschoss aktualisieren
      if (!this.geschosse[i].aktiv) { // Wenn Geschoss inaktiv (getroffen oder verfehlt)
        this.geschosse.splice(i, 1); // Geschoss aus der Liste entfernen
      }
    }
  }

  _besteZielFinden(gegner) { // Findet den am weitesten fortgeschrittenen Ballon in Reichweite
    let besteDistanz = -1; // Beste (größte) zurückgelegte Distanz
    let besteZiel = null; // Bestes gefundenes Ziel
    for (let g of gegner) { // Alle Gegner durchsuchen
      if (!g.aktiv) continue; // Inaktive Ballons überspringen
      let abstand = dist(this.x, this.y, g.x, g.y); // Abstand zum Gegner berechnen
      if (abstand <= this.reichweite) { // Gegner in Reichweite?
        if (g.gesamtDistanz > besteDistanz) { // Weiter fortgeschritten als bisheriges Ziel?
          besteDistanz = g.gesamtDistanz; // Neue beste Distanz speichern
          besteZiel = g; // Neues bestes Ziel speichern
        }
      }
    }
    return besteZiel; // Bestes Ziel zurückgeben (oder null wenn keins in Reichweite)
  }

  _schiessen() { // Erstellt ein neues Geschoss (wird in Unterklassen überschrieben)
    if (!this.ziel || !this.ziel.aktiv) return; // Kein gültiges Ziel: abbrechen
    let g = new Geschoss( // Neues Geschoss-Objekt erstellen
      this.x, // Startposition X (Turmposition)
      this.y, // Startposition Y (Turmposition)
      this.ziel, // Ziel-Ballon
      this.schaden, // Schaden des Geschosses
      this.schussTyp, // Darstellungstyp
      this.durchdringen, // Ob es durchdringt
      this.durchdrigenAnzahl // Wie viele Treffer
    );
    this.geschosse.push(g); // Geschoss zur Liste hinzufügen
  }

  upgrade(pfadIndex) { // Upgrade kaufen; pfadIndex (0 oder 1) beim ersten Kauf angeben
    if (this.upgradeStufe >= this.maxUpgrades) return false; // Max-Stufe: abbrechen
    if (this.upgradePfad === null) { // Erster Kauf: Pfad dauerhaft festlegen
      if (pfadIndex !== 0 && pfadIndex !== 1) return false; // Ungültiger Pfad: abbrechen
      this.upgradePfad = pfadIndex; // Pfad festschreiben
    }
    this.upgradeStufe++; // Upgrade-Stufe erhöhen
    this._upgradeAnwenden(); // Spezifische Upgrade-Effekte anwenden
    return true; // Upgrade erfolgreich
  }

  _upgradeAnwenden() { // Upgrade-Effekte anwenden (in Unterklassen überschrieben)
    // Wird von jeder Unterklasse spezifisch implementiert
  }

  getPfadeInfo() { // Gibt beide Upgrade-Pfade zurück (in Unterklassen überschrieben)
    return null; // Basisklasse hat keine Pfade
  }

  draw() { // Turm zeichnen: Lehrer-Strichmännchen
    push(); // p5.js Zustand sichern
    translate(this.x, this.y); // Koordinatensystem zum Turm verschieben
    // Reichweiten-Kreis anzeigen wenn ausgewählt
    if (this.ausgewaehlt) { // Nur bei Selektion zeichnen
      noFill(); // Kein Füll
      stroke(255, 255, 255, 60); // Halbdurchsichtiges Weiß
      strokeWeight(1.5); // Dünne Linie
      ellipse(0, 0, this.reichweite * 2, this.reichweite * 2); // Reichweiten-Kreis
    }
    // Sockel des Turms (Graues Rechteck)
    fill(120, 120, 120); // Grau für den Sockel
    stroke(60, 60, 60); // Dunkelgrau-Kontur
    strokeWeight(1); // Konturstärke
    rect(-18, -5, 36, 16, 4); // Sockel-Rechteck mit abgerundeten Ecken
    // Körper des Lehrers (farbiges Rechteck)
    let kf = this.koerperFarbe; // Körperfarbe aus der Unterklasse
    fill(kf[0], kf[1], kf[2]); // Körperfarbe setzen
    stroke(max(0, kf[0]-60), max(0, kf[1]-60), max(0, kf[2]-60)); // Dunklere Kontur
    strokeWeight(1.5); // Konturstärke
    rect(-11, -28, 22, 24, 3); // Körper-Rechteck
    // Arme (als Linien links und rechts)
    stroke(max(0, kf[0]-40), max(0, kf[1]-40), max(0, kf[2]-40)); // Arm-Farbe
    strokeWeight(3); // Dicke Linien für Arme
    line(-11, -22, -20, -12); // Linker Arm schräg nach unten
    line(11, -22, 20, -12); // Rechter Arm schräg nach unten
    // Kopf des Lehrers (farbige Ellipse)
    let kpf = this.kopfFarbe; // Kopffarbe aus der Unterklasse
    fill(kpf[0], kpf[1], kpf[2]); // Kopffarbe setzen
    stroke(max(0, kpf[0]-50), max(0, kpf[1]-50), max(0, kpf[2]-50)); // Dunklere Kontur
    strokeWeight(1.5); // Konturstärke
    ellipse(0, -38, 20, 20); // Kopf-Ellipse
    // Upgrade-Abzeichen: Farbe zeigt den gewählten Pfad (Blau = Pfad 1, Grün = Pfad 2)
    if (this.upgradeStufe > 0) { // Nur wenn Upgrades vorhanden
      let af = this.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100]; // Pfad-Farbe
      fill(af[0], af[1], af[2]); // Abzeichen in Pfad-Farbe
      noStroke(); // Keine Kontur
      ellipse(12, -48, 14, 14); // Abzeichen oben rechts
      fill(255); // Weißer Text
      textAlign(CENTER, CENTER); // Zentrierte Ausrichtung
      textSize(9); // Kleine Schriftgröße
      text(this.upgradeStufe, 12, -48); // Upgrade-Stufe als Zahl anzeigen
    }
    // Spezielle Symbole (in Unterklassen überschrieben)
    this._symbolZeichnen(); // Symbol über dem Turm zeichnen
    pop(); // p5.js Zustand wiederherstellen
    // Geschosse zeichnen
    for (let g of this.geschosse) { // Alle Geschosse dieses Turms
      g.draw(); // Jedes Geschoss zeichnen
    }
  }

  _symbolZeichnen() { // Optionales Symbol (in Unterklassen überschrieben)
    // Standardmäßig kein Symbol – wird in Unterklassen implementiert
  }

  getUpgradeInfo() { // Gibt Info über das nächste Upgrade im gewählten Pfad zurück
    if (this.upgradePfad === null) return null; // Kein Pfad gewählt: null
    let pfade = this.getPfadeInfo(); // Pfad-Definitionen holen
    if (!pfade) return null; // Keine Pfade definiert: null
    return pfade[this.upgradePfad].upgrades[this.upgradeStufe] || null; // Nächstes Upgrade
  }
}

Turm.zaehler = 0; // Klassenweiter Zähler für eindeutige Turm-IDs

// ─────────────────────────────────────────────────────────────────────────────
// Geschoss-Klasse: Bewegt sich von Turm zu Ziel und richtet Schaden an
// ─────────────────────────────────────────────────────────────────────────────

class Geschoss { // Klasse für alle fliegenden Projektile
  constructor(x, y, ziel, schaden, typ, durchdringen, maxTreffer) { // Konstruktor
    this.x = x; // Startposition X
    this.y = y; // Startposition Y
    this.ziel = ziel; // Ziel-Ballon-Objekt
    this.zielId = ziel ? ziel.id : -1; // ID des Ziels merken (falls Ziel entfernt wird)
    this.schaden = schaden; // Schaden bei Treffer
    this.typ = typ || 'normal'; // Darstellungstyp (beeinflusst Aussehen)
    this.durchdringen = durchdringen || false; // Kann das Geschoss durchdringen?
    this.maxTreffer = maxTreffer || 1; // Maximale Anzahl Treffer (bei Durchdringen)
    this.trefferZaehler = 0; // Wie viele Ballons bisher getroffen
    this.getroffene = new Set(); // Set der bereits getroffenen Ballon-IDs
    this.geschwindigkeit = 7; // Geschwindigkeit des Geschosses in Pixel/Frame
    this.aktiv = true; // Ob das Geschoss noch aktiv ist
    this.winkel = 0; // Flugwinkel (für Darstellung)
    this.splashRadius = 0; // Explosionsradius (0 = kein Splash)
    this.kritisch = false; // Ob dieser Schuss ein kritischer Treffer ist
    this.schadensTyp = 'normal'; // Schadenstyp (für Panzerungsprüfung)
    this.partikelFarbe = [255, 200, 50]; // Partikelfarbe bei Treffer
  }

  update(gegner, spielGeschwindigkeit) { // Jeden Frame: Bewegen und Treffer prüfen
    if (!this.aktiv) return; // Inaktive Geschosse überspringen
    let schritte = spielGeschwindigkeit; // Bewegungsschritte (1 oder 2 bei 2x)
    for (let s = 0; s < schritte; s++) { // Bei 2x-Geschwindigkeit doppelt bewegen
      this._bewegungsSchritt(gegner); // Einen Schritt ausführen
    }
  }

  _bewegungsSchritt(gegner) { // Einen Bewegungsschritt des Geschosses ausführen
    let zielX, zielY; // Zielposition
    if (this.ziel && this.ziel.aktiv) { // Ziel noch lebendig?
      zielX = this.ziel.x; // Ziel-X-Position (Gegner bewegt sich)
      zielY = this.ziel.y; // Ziel-Y-Position
    } else { // Ziel ist weg
      this.aktiv = false; // Geschoss deaktivieren
      return; // Abbrechen
    }
    let dx = zielX - this.x; // Differenz in X-Richtung
    let dy = zielY - this.y; // Differenz in Y-Richtung
    let abstand = sqrt(dx * dx + dy * dy); // Abstand zum Ziel berechnen
    this.winkel = atan2(dy, dx); // Flugwinkel berechnen (für Darstellung)
    if (abstand < this.geschwindigkeit + 2) { // Ziel erreicht?
      this._treffer(gegner); // Treffer verarbeiten
      return; // Bewegungsschritt beenden
    }
    let nx = dx / abstand; // Normalisierte Richtung X
    let ny = dy / abstand; // Normalisierte Richtung Y
    this.x += nx * this.geschwindigkeit; // X-Position um einen Schritt verschieben
    this.y += ny * this.geschwindigkeit; // Y-Position um einen Schritt verschieben
    // Falls Geschoss außerhalb des Bildschirms
    if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 700) { // Außerhalb?
      this.aktiv = false; // Deaktivieren
    }
  }

  _treffer(gegner) { // Verarbeitet einen Treffer auf dem Ziel
    if (this.splashRadius > 0) { // Splash-Schaden (Flächenschaden)?
      for (let g of gegner) { // Alle Gegner durchsuchen
        if (!g.aktiv) continue; // Inaktive überspringen
        if (dist(this.x, this.y, g.x, g.y) <= this.splashRadius) { // Im Splash-Radius?
          if (!this.getroffene.has(g.id)) { // Noch nicht getroffen?
            let neueGegner = g.schadennehmen(this.schaden, this.schadensTyp); // Schaden anwenden
            this.getroffene.add(g.id); // Als getroffen markieren
            if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner); // Neue Ballons für Spielzustand
          }
        }
      }
    } else if (this.durchdringen && this.trefferZaehler < this.maxTreffer) { // Durchdringung?
      if (this.ziel && this.ziel.aktiv && !this.getroffene.has(this.ziel.id)) { // Ziel gültig?
        let neueGegner = this.ziel.schadennehmen(this.schaden, this.schadensTyp); // Schaden
        this.getroffene.add(this.ziel.id); // Als getroffen markieren
        this.trefferZaehler++; // Treffer-Zähler erhöhen
        if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner); // Neue Ballons
        // Nächstes Durchdringungs-Ziel suchen
        let naechstesZiel = this._naechstesNichtGetroffenes(gegner); // Nächsten Ballon suchen
        if (naechstesZiel && this.trefferZaehler < this.maxTreffer) { // Weiteres Ziel?
          this.ziel = naechstesZiel; // Neues Ziel setzen
          return; // Weiter fliegen
        }
      }
    } else { // Normaler Einzeltreffer
      if (this.ziel && this.ziel.aktiv) { // Ziel noch gültig?
        let effSchaden = this.kritisch ? this.schaden * 2 : this.schaden; // Kritischer Schaden?
        let neueGegner = this.ziel.schadennehmen(effSchaden, this.schadensTyp); // Schaden anwenden
        if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner); // Neue Ballons
      }
    }
    this.aktiv = false; // Geschoss nach Treffer deaktivieren
  }

  _naechstesNichtGetroffenes(gegner) { // Nächsten noch nicht getroffenen Ballon finden
    let nahestes = null; // Nächster Ballon
    let minAbstand = Infinity; // Minimale Distanz
    for (let g of gegner) { // Alle Gegner durchsuchen
      if (!g.aktiv) continue; // Inaktive überspringen
      if (this.getroffene.has(g.id)) continue; // Bereits getroffene überspringen
      let d = dist(this.x, this.y, g.x, g.y); // Abstand messen
      if (d < minAbstand) { // Näher als bisher?
        minAbstand = d; // Neuen minimalen Abstand merken
        nahestes = g; // Als nächstes Ziel merken
      }
    }
    return nahestes; // Nächsten Ballon zurückgeben
  }

  draw() { // Geschoss zeichnen
    if (!this.aktiv) return; // Inaktive Geschosse nicht zeichnen
    push(); // p5.js Zustand sichern
    translate(this.x, this.y); // Koordinatensystem zur Geschossposition verschieben
    rotate(this.winkel); // In Flugrichtung drehen
    this._projektilZeichnen(); // Spezifische Darstellung (in Unterklasse oder hier)
    pop(); // p5.js Zustand wiederherstellen
  }

  _projektilZeichnen() { // Standard-Geschoss zeichnen (kleines oranges Oval)
    noStroke(); // Keine Kontur
    fill(255, 180, 30); // Orange-Gelb für das Standardgeschoss
    ellipse(0, 0, 10, 6); // Kleines Oval als Geschoss
  }
}
