// gameScene.js – Haupt-Spielszene: Zeichnet Spielfeld, Pfad und verwaltet Spiellogik

// Feste Pfade pro Level
const LEVEL_PFADE = [
  [ // Level 1: L-Korridor
    { x: -40, y: 300 }, { x: 220, y: 300 },
    { x: 220, y: 470 }, { x: 780, y: 470 }
  ],
  [ // Level 2: S-Kurve
    { x: -40, y: 160 }, { x: 200, y: 160 },
    { x: 200, y: 350 }, { x: 500, y: 350 },
    { x: 500, y: 160 }, { x: 780, y: 160 }
  ],
  [ // Level 3: Zickzack
    { x: -40, y: 260 }, { x: 150, y: 260 },
    { x: 150, y: 130 }, { x: 360, y: 130 },
    { x: 360, y: 390 }, { x: 570, y: 390 },
    { x: 570, y: 200 }, { x: 780, y: 200 }
  ]
];

const PFAD_BREITE = 48; // Breite des gezeichneten Pfades in Pixel
const MIN_ABSTAND_VOM_PFAD = 42; // Mindestabstand vom Pfad-Mittelpunkt für Turmplatzierung

class SpielSzene { // Klasse für die Haupt-Spielszene
  constructor(spielZustand) { // Konstruktor: erhält den Spielzustand
    this.gs = spielZustand; // Spielzustand-Referenz speichern
    this.saeureWolken = []; // Liste aktiver Säure-Wolken (Biolehrer Stufe 3)
    this.partikel = []; // Liste aktiver Partikel (Explosionseffekte)
    this.temporaereTuerme = []; // Liste temporärer Türme (Direktor Stellvertreter)
    this.hintergrundPartikel = []; // Hintergrundpartikel für atmosphärische Effekte
    this._hintergrundErstellen(); // Hintergrund-Dekorationspartikel erstellen
    this.muenzenPopups = []; // Liste von "+Münzen"-Popup-Texten
  }

  _hintergrundErstellen() { // Atmosphärische Hintergrundpartikel erstellen
    for (let i = 0; i < 30; i++) { // 30 zufällige Hintergrundpunkte
      this.hintergrundPartikel.push({ // Neuen Partikel erstellen
        x: random(740), // Zufällige X-Position im Spielbereich
        y: random(50, 640), // Zufällige Y-Position (unter HUD)
        groesse: random(1, 3), // Zufällige Größe
        helligkeit: random(30, 80), // Zufällige Helligkeit
        blinkGeschw: random(0.01, 0.04) // Zufällige Blinkgeschwindigkeit
      });
    }
  }

  levelStarten(level) { // Ein neues Level vorbereiten und starten
    this.gs.level = level; // Level-Nummer setzen
    this.gs.pfad = LEVEL_PFADE[level - 1]; // Festen Pfad für dieses Level laden
    this.gs.maxWellen = this.gs.wellenManager.getMaxWellen(level); // Maximale Wellen für Level holen
    let bonusLeben = (this.gs.upgrades) ? this.gs.upgrades.getStartLeben() : 0; // Upgrade-Bonus für Startleben
    let bonusMuenzen = (this.gs.upgrades) ? this.gs.upgrades.getStartMuenzen() : 0; // Upgrade-Bonus für Startgeld
    this.gs.leben = 20 + bonusLeben; // Startleben zurücksetzen (mit Upgrade-Bonus)
    this.gs.muenzen = 150 + bonusMuenzen; // Startgeld zurücksetzen (mit Upgrade-Bonus)
    this.gs.welle = 0; // Wellen-Zähler zurücksetzen
    this.gs.welleAktiv = false; // Keine aktive Welle am Start
    this.gs.gegner = []; // Gegner-Liste leeren
    this.gs.tuerme = []; // Türme-Liste leeren
    this.gs.punkte = 0; // Punktzahl zurücksetzen
    this.gs.ballonsGeknallt = 0; // Ballon-Zähler zurücksetzen
    this.gs.geschwindigkeit = 1; // Normale Spielgeschwindigkeit
    this.gs.pausiert = false; // Nicht pausiert
    this.gs.angeklickterTurm = null; // Kein Turm ausgewählt
    this.gs.ausgewaehlteTurmTyp = null; // Kein Turmtyp ausgewählt
    this.saeureWolken = []; // Säure-Wolken zurücksetzen
    this.partikel = []; // Partikel zurücksetzen
    this.temporaereTuerme = []; // Temporäre Türme zurücksetzen
    this.muenzenPopups = []; // Popups zurücksetzen
    window._neueGegnerBuffer = []; // Gegner-Puffer zurücksetzen
    window._neueStellvertreterBuffer = []; // Stellvertreter-Puffer zurücksetzen
    window._saeurewolkenBuffer = []; // Säure-Wolken-Puffer zurücksetzen
  }

  naechsteWelleStarten() { // Die nächste Welle starten
    if (this.gs.welleAktiv) return; // Welle schon aktiv: abbrechen
    if (this.gs.welle >= this.gs.maxWellen) return; // Alle Wellen gespielt: abbrechen
    this.gs.welle++; // Wellen-Zähler erhöhen
    this.gs.welleAktiv = true; // Welle als aktiv markieren
    this.gs.wellenManager.welleStarten(this.gs.welle, this.gs.level); // Wellen-Manager starten
    if (this.gs.sound) this.gs.sound.welleBeginn(); // Sound: Welle beginnt
    this.gs.wirtschaft.muenzenDieseWelle = 0; // Wellen-Münzen-Zähler zurücksetzen
  }

  update() { // Jeden Frame: gesamte Spiellogik aktualisieren
    if (this.gs.pausiert) return; // Wenn pausiert: nichts aktualisieren
    let gs = this.gs.geschwindigkeit; // Spielgeschwindigkeit (1 oder 2)
    // Wellen-Manager: neue Ballons spawnen wenn Welle aktiv
    if (this.gs.welleAktiv) { // Nur wenn Welle läuft
      let neueGegner = this.gs.wellenManager.update(this.gs.pfad, gs); // Neue Ballons spawnen
      for (let ng of neueGegner) { // Neue Gegner auf Boss prüfen
        if (ng.typ === 'schwarz' && this.gs.sound) this.gs.sound.bossErscheint(); // Sound: Boss erscheint
      }
      this.gs.gegner = this.gs.gegner.concat(neueGegner); // Neue Ballons hinzufügen
    }
    // Externes Buffer für neue Gegner (aus Schicht-System)
    if (window._neueGegnerBuffer && window._neueGegnerBuffer.length > 0) { // Puffer vorhanden?
      this.gs.gegner = this.gs.gegner.concat(window._neueGegnerBuffer); // Aus Puffer hinzufügen
      window._neueGegnerBuffer = []; // Puffer leeren
    }
    // Stellvertreter-Puffer verarbeiten
    if (window._neueStellvertreterBuffer && window._neueStellvertreterBuffer.length > 0) { // Puffer vorhanden?
      for (let sv of window._neueStellvertreterBuffer) { // Jeden Stellvertreter prüfen
        if (this._platzierungGueltigIntern(sv.x, sv.y)) { // Position gültig?
          this.temporaereTuerme.push(sv); // Stellvertreter hinzufügen
        }
      }
      window._neueStellvertreterBuffer = []; // Puffer leeren
    }
    // Säure-Wolken-Puffer verarbeiten
    if (window._saeurewolkenBuffer && window._saeurewolkenBuffer.length > 0) { // Puffer vorhanden?
      for (let sw of window._saeurewolkenBuffer) { // Jede Säure-Wolke
        this.saeureWolken.push(new SaeureWolke(sw.x, sw.y, sw.radius, sw.schaden, sw.dauer)); // Erstellen
      }
      window._saeurewolkenBuffer = []; // Puffer leeren
    }
    // Alle Gegner aktualisieren
    for (let g of this.gs.gegner) { // Jeden Gegner durchgehen
      g.update(gs); // Gegner-Logik (Bewegung, Effekte)
      if (g.amZiel) { // Gegner hat das Ziel erreicht
        this.gs.leben--; // Ein Leben verlieren
        this._partikelErstellen(g.x, g.y, [220, 50, 50]); // Rote Partikel als Feedback
        if (this.gs.leben <= 0) { // Alle Leben verloren?
          this.gs.szene = 'gameOver'; // Game-Over-Szene aktivieren
          this.gs.highscoreManager.scoreEintragen(this.gs.level, this.gs.punkte, this.gs.welle); // Score speichern
          if (this.gs.sound) this.gs.sound.spielEnde(false); // Sound: Niederlage
          return; // Sofort aufhören zu updaten
        }
      }
    }
    // Inaktive Gegner entfernen (geplatzte oder am Ziel)
    this.gs.gegner = this.gs.gegner.filter(g => { // Nur aktive Gegner behalten
      if (!g.aktiv) { // Inaktiver Gegner?
        if (!g.amZiel) { // Nicht am Ziel (also geplatzt)?
          let belohnung = this.gs.wirtschaft.belohnungFuerBallon(g.typ); // Münzbelohnung holen
          this.gs.wirtschaft.muenzenHinzufuegen(belohnung); // Münzen vergeben
          this.gs.punkte += belohnung * 10; // Punkte vergeben
          this.gs.ballonsGeknallt++; // Ballon-Zähler erhöhen
          this._partikelErstellen(g.x, g.y, BALLON_FARBEN[g.typ] || [200, 200, 200]); // Partikel
          this._muenzPopupErstellen(g.x, g.y, '+' + belohnung); // Münz-Popup zeigen
          if (this.gs.sound) this.gs.sound.ballonPlatzen(g.typ); // Sound: Ballon platzt
          if (this.gs.sound) this.gs.sound.muenzGewonnen(); // Sound: Münze verdient
        }
        return false; // Entfernen
      }
      return true; // Behalten
    });
    // Boss-Aura: Bosse beschleunigen nahe Ballons
    for (let boss of this.gs.gegner) { // Alle Gegner als potenzielle Bosse prüfen
      if (boss.typ === 'schwarz' && boss.aktiv) { // Ist es ein Boss?
        for (let g of this.gs.gegner) { // Nahe Ballons suchen
          if (g !== boss && g.aktiv) { // Nicht den Boss selbst
            if (dist(boss.x, boss.y, g.x, g.y) <= boss.boostRadius) { // In Boost-Radius?
              g.geschwindigkeit = g.basisGeschwindigkeit * boss.boostFaktor; // Geschwindigkeit erhöhen
            } else { // Außerhalb des Radius
              g.geschwindigkeit = g.basisGeschwindigkeit; // Normale Geschwindigkeit
            }
          }
        }
      }
    }
    // Alle platzierten Türme aktualisieren
    for (let t of this.gs.tuerme) { // Jeden Turm durchgehen
      t.update(this.gs.gegner, gs); // Turm-Logik (Schießen etc.)
    }
    // Temporäre Türme (Stellvertreter) aktualisieren und ablaufende entfernen
    for (let i = this.temporaereTuerme.length - 1; i >= 0; i--) { // Rückwärts durch temporäre Türme
      this.temporaereTuerme[i].update(this.gs.gegner, gs); // Turm aktualisieren
      if (this.temporaereTuerme[i].istAbgelaufen()) { // Abgelaufen?
        this.temporaereTuerme.splice(i, 1); // Entfernen
      }
    }
    // Säure-Wolken aktualisieren
    for (let i = this.saeureWolken.length - 1; i >= 0; i--) { // Rückwärts durch Säure-Wolken
      this.saeureWolken[i].update(this.gs.gegner, gs); // Wolke aktualisieren
      if (!this.saeureWolken[i].aktiv) { // Wolke abgelaufen?
        this.saeureWolken.splice(i, 1); // Entfernen
      }
    }
    // Partikel aktualisieren und abgelaufene entfernen
    for (let i = this.partikel.length - 1; i >= 0; i--) { // Rückwärts durch Partikel
      this.partikel[i].leben -= gs; // Partikel-Lebensdauer verringern
      this.partikel[i].x += this.partikel[i].vx * gs; // Partikel bewegen X
      this.partikel[i].y += this.partikel[i].vy * gs; // Partikel bewegen Y
      this.partikel[i].vy += 0.1 * gs; // Schwerkraft auf Partikel anwenden
      if (this.partikel[i].leben <= 0) { // Partikel tot?
        this.partikel.splice(i, 1); // Entfernen
      }
    }
    // Münz-Popups aktualisieren
    for (let i = this.muenzenPopups.length - 1; i >= 0; i--) { // Rückwärts durch Popups
      this.muenzenPopups[i].leben -= gs; // Lebensdauer verringern
      this.muenzenPopups[i].y -= 1 * gs; // Nach oben driften
      if (this.muenzenPopups[i].leben <= 0) { // Abgelaufen?
        this.muenzenPopups.splice(i, 1); // Entfernen
      }
    }
    // Prüfen ob Welle abgeschlossen ist (alle Ballons gespawnt und besiegt)
    if (this.gs.welleAktiv && this.gs.wellenManager.alleGespawnt() && this.gs.gegner.length === 0) { // Welle fertig?
      this.gs.welleAktiv = false; // Welle als beendet markieren
      let bonus = this.gs.wirtschaft.welleAbgeschlossen(this.gs.welle); // Wellenbonus vergeben
      this.gs.ui.welleAbgeschlossenZeigen(this.gs.welle, bonus); // Popup anzeigen
      if (this.gs.sound) this.gs.sound.welleEnde(); // Sound: Welle abgeschlossen
      if (this.gs.welle >= this.gs.maxWellen) { // Alle Wellen geschafft?
        this.gs.highscoreManager.scoreEintragen(this.gs.level, this.gs.punkte, this.gs.welle); // Score speichern
        this.gs.szene = 'sieg'; // Sieg-Szene aktivieren
        if (this.gs.sound) this.gs.sound.spielEnde(true); // Sound: Sieg
      }
    }
  }

  draw() { // Alle Spielelemente zeichnen
    // Spielfeld-Hintergrund
    this._hintergrundZeichnen(); // Hintergrund zeichnen
    // Pfad zeichnen
    this._pfadZeichnen(); // Den Gegner-Weg zeichnen
    // Säure-Wolken zeichnen (unter den Gegnern)
    for (let sw of this.saeureWolken) sw.draw(); // Jede Säure-Wolke zeichnen
    // Partikel zeichnen
    this._partikelZeichnen(); // Explosionspartikel zeichnen
    // Alle Türme zeichnen
    for (let t of this.gs.tuerme) t.draw(); // Jeden Turm zeichnen
    for (let t of this.temporaereTuerme) t.draw(); // Temporäre Türme zeichnen
    // Alle Gegner zeichnen
    for (let g of this.gs.gegner) g.draw(); // Jeden Gegner zeichnen
    // Münz-Popups zeichnen
    this._muenzPopupsZeichnen(); // Popup-Texte zeichnen
    // Einschränkungsbereich (Pfad darf nicht bebaut werden – Vorschau)
    if (this.gs.ausgewaehlteTurmTyp) { // Nur wenn Turmplatzierungs-Modus aktiv
      this._pfadMarkierungenZeichnen(); // Pfad leicht hervorheben als Hinweis
    }
  }

  _hintergrundZeichnen() { // Spielfeld-Hintergrund zeichnen (grünes Schulgelände)
    fill(60, 100, 50); // Grüner Hintergrund (Gras/Schulhof)
    noStroke(); // Keine Kontur
    rect(0, 50, 740, 590); // Spielfeld-Rechteck (unter HUD)
    // Hintergrundpartikel (subtile Textur)
    for (let p of this.hintergrundPartikel) { // Jeden Hintergrundpartikel
      let hell = p.helligkeit + sin(frameCount * p.blinkGeschw) * 10; // Leicht blinkend
      fill(max(0, min(255, hell)), max(0, min(255, hell + 20)), max(0, min(255, hell - 10)), 80); // Leichte Farbe
      noStroke(); // Keine Kontur
      ellipse(p.x, p.y + 50, p.groesse, p.groesse); // Kleiner Punkt
    }
    // Spielfeld-Rand
    noFill(); // Kein Füll
    stroke(40, 70, 30); // Dunkles Grün
    strokeWeight(2); // Linienstärke
    rect(0, 50, 740, 590); // Rand-Rechteck
  }

  _pfadZeichnen() { // Den Gegner-Pfad zeichnen
    let pfad = this.gs.pfad; // Aktuellen Pfad aus dem Spielzustand
    if (!pfad || pfad.length < 2) return; // Kein Pfad vorhanden: abbrechen
    // Pfad-Schatten (Tiefe-Effekt)
    stroke(20, 40, 20); // Dunkler Schatten
    strokeWeight(PFAD_BREITE + 6); // Breiter als der Pfad
    noFill(); // Kein Füll
    beginShape(); // Pfad-Form beginnen
    for (let p of pfad) vertex(p.x + 3, p.y + 3); // Versetzter Schatten
    endShape(); // Form beenden
    // Eigentlicher Pfad (Asphalt/Flur-Textur)
    stroke(90, 80, 70); // Grau-Braun (Asphalt/Linoleum)
    strokeWeight(PFAD_BREITE); // Pfad-Breite
    beginShape(); // Pfad-Form beginnen
    for (let p of pfad) vertex(p.x, p.y); // Alle Wegpunkte
    endShape(); // Form beenden
    // Pfad-Streifen (Linienmarkierungen auf dem Weg)
    stroke(110, 100, 90); // Heller Streifen
    strokeWeight(3); // Dünner Streifen
    beginShape(); // Streifen-Form
    for (let p of pfad) vertex(p.x, p.y); // Selbe Wegpunkte
    endShape(); // Form beenden
    // Pfad-Kanten (hellere Randlinien)
    for (let kante = -1; kante <= 1; kante += 2) { // Linker und rechter Rand
      stroke(130, 120, 110); // Helle Kante
      strokeWeight(2); // Dünne Linie
      noFill(); // Kein Füll
      beginShape(); // Kanten-Form
      for (let p of pfad) vertex(p.x, p.y + kante * (PFAD_BREITE / 2 - 4)); // Leicht versetzt
      endShape(); // Form beenden
    }
    // Start-Markierung (grüner Kreis am Eingang)
    let start = pfad[0]; // Erster Wegpunkt
    noStroke(); // Keine Kontur
    fill(50, 200, 80, 200); // Grün
    ellipse(start.x + 30, start.y, PFAD_BREITE - 4, PFAD_BREITE - 4); // Grüner Kreis
    fill(255, 255, 255); // Weißer Text
    textAlign(CENTER, CENTER); // Zentriert
    textSize(10); // Kleine Schrift
    text('START', start.x + 30, start.y); // "START"-Text
    // End-Markierung (roter Kreis am Ausgang)
    let ende = pfad[pfad.length - 1]; // Letzter Wegpunkt
    fill(220, 50, 50, 200); // Rot
    ellipse(ende.x - 30, ende.y, PFAD_BREITE - 4, PFAD_BREITE - 4); // Roter Kreis
    fill(255, 255, 255); // Weißer Text
    text('ZIEL', ende.x - 30, ende.y); // "ZIEL"-Text
    // Wegpunkt-Pfeile (zeigen die Richtung an)
    this._pfeilZeichnen(pfad); // Richtungspfeile zeichnen
  }

  _pfeilZeichnen(pfad) { // Richtungspfeile auf dem Pfad zeichnen
    for (let i = 0; i < pfad.length - 1; i++) { // Alle Pfad-Segmente
      let p1 = pfad[i]; // Startpunkt des Segments
      let p2 = pfad[i + 1]; // Endpunkt des Segments
      let mx = (p1.x + p2.x) / 2; // Mittelpunkt X
      let my = (p1.y + p2.y) / 2; // Mittelpunkt Y
      let winkel = atan2(p2.y - p1.y, p2.x - p1.x); // Richtungs-Winkel
      push(); // Zustand sichern
      translate(mx, my); // Zur Pfad-Mitte verschieben
      rotate(winkel); // In Pfad-Richtung drehen
      fill(150, 140, 130, 180); // Halbdurchsichtiger Pfeil
      noStroke(); // Keine Kontur
      triangle(8, 0, -6, -7, -6, 7); // Dreieck als Pfeil
      pop(); // Zustand wiederherstellen
    }
  }

  _pfadMarkierungenZeichnen() { // Leichte Hervorhebung des Pfades im Platzierungs-Modus
    let pfad = this.gs.pfad; // Aktuellen Pfad
    noFill(); // Kein Füll
    stroke(255, 100, 100, 40); // Leichtes Rot (Warnung: nicht auf Pfad bauen)
    strokeWeight(PFAD_BREITE + MIN_ABSTAND_VOM_PFAD * 2); // Breite des Sperrbereichs
    beginShape(); // Form beginnen
    for (let p of pfad) vertex(p.x, p.y); // Wegpunkte
    endShape(); // Form beenden
  }

  _partikelErstellen(x, y, farbe) { // Explosionspartikel an einer Position erstellen
    for (let i = 0; i < 8; i++) { // 8 Partikel erstellen
      let winkel = random(TWO_PI); // Zufälliger Winkel
      let geschw = random(1.5, 4); // Zufällige Geschwindigkeit
      this.partikel.push({ // Neuen Partikel-Eintrag erstellen
        x: x, // Startposition X
        y: y, // Startposition Y
        vx: cos(winkel) * geschw, // Geschwindigkeit X
        vy: sin(winkel) * geschw - 2, // Geschwindigkeit Y (nach oben)
        r: farbe[0], // Rot-Kanal der Farbe
        g: farbe[1], // Grün-Kanal der Farbe
        b: farbe[2], // Blau-Kanal der Farbe
        groesse: random(4, 10), // Zufällige Partikel-Größe
        leben: random(20, 45) // Zufällige Lebensdauer in Frames
      });
    }
  }

  _partikelZeichnen() { // Alle Explosionspartikel zeichnen
    for (let p of this.partikel) { // Jeden Partikel durchgehen
      let alpha = map(p.leben, 0, 45, 0, 255); // Transparenz basierend auf Lebensdauer
      noStroke(); // Keine Kontur
      fill(p.r, p.g, p.b, alpha); // Partikel-Farbe mit Transparenz
      ellipse(p.x, p.y, p.groesse, p.groesse); // Partikel-Kreis zeichnen
    }
  }

  _muenzPopupErstellen(x, y, text_) { // Einen "+Münzen"-Popup-Text erstellen
    this.muenzenPopups.push({ // Neues Popup-Objekt
      x: x, // X-Position des Popups
      y: y, // Y-Position (driftet nach oben)
      text: text_, // Anzeigetext (z.B. "+5")
      leben: 50 // Lebensdauer des Popups in Frames
    });
  }

  _muenzPopupsZeichnen() { // Alle Münz-Popup-Texte zeichnen
    for (let p of this.muenzenPopups) { // Jeden Popup durchgehen
      let alpha = map(p.leben, 0, 50, 0, 255); // Transparenz
      fill(255, 215, 0, alpha); // Goldfarbe mit Transparenz
      noStroke(); // Keine Kontur
      textAlign(CENTER, CENTER); // Zentriert
      textSize(14); // Mittlere Schrift
      textStyle(BOLD); // Fett
      text(p.text, p.x, p.y); // Popup-Text zeichnen
      textStyle(NORMAL); // Normal zurücksetzen
    }
  }

  turmPlatzieren(mx, my) { // Versucht einen Turm an der Mausposition zu platzieren
    if (!this.gs.ausgewaehlteTurmTyp) return; // Kein Turmtyp ausgewählt: abbrechen
    if (mx > 740 || my < 50) return; // Im Panel oder HUD: abbrechen
    if (!this.gs.platzierungGueltig(mx, my)) return; // Ungültige Position: abbrechen
    let kosten = this.gs.wirtschaft.turmKosten(this.gs.ausgewaehlteTurmTyp); // Kosten holen
    if (!this.gs.wirtschaft.muenzenAbziehen(kosten)) return; // Nicht genug Münzen: abbrechen
    let neuerTurm = this._turmErstellen(this.gs.ausgewaehlteTurmTyp, mx, my); // Turm erstellen
    if (neuerTurm) { // Turm erfolgreich erstellt?
      this.gs.tuerme.push(neuerTurm); // Turm zur Liste hinzufügen
      if (this.gs.sound) this.gs.sound.turmPlatziert(); // Sound: Turm gesetzt
    }
    this.gs.ausgewaehlteTurmTyp = null; // Turmtyp-Auswahl zurücksetzen (nach Platzierung)
  }

  _turmErstellen(typ, x, y) { // Erstellt einen Turm des angegebenen Typs
    switch (typ) { // Turmtyp-Schalter
      case 'blech':    return new Blech(x, y);    // Blech: Kreide-Werfer erstellen
      case 'pfingsten':return new Pfingsten(x, y); // Pfingsten: Verlangsamer erstellen
      case 'koch':     return new Koch(x, y);     // Koch: Verweis-Werfer erstellen
      case 'pfister':  return new Pfister(x, y);  // Pfister: Säure-Flasche erstellen
      case 'raum':     return new Raum(x, y);     // Raum: Hacker – Geld + Buff
      case 'fight':    return new Fight(x, y);    // Fight: Motorrad-Lehrer
      case 'motsious': return new Motsious(x, y); // Motsious: Teilchenbeschleuniger
      case 'brust':    return new Brust(x, y);    // Brust: Blitze
      default:         return null;               // Unbekannter Typ: null zurückgeben
    }
  }

  turmAnklicken(mx, my) { // Prüft ob ein platzierter Turm angeklickt wurde
    this.gs.tuerme.forEach(t => t.ausgewaehlt = false); // Alle Türme deselektieren
    for (let t of this.gs.tuerme) { // Alle platzierten Türme prüfen
      if (dist(mx, my, t.x, t.y) <= t.radius + 8) { // Maus auf dem Turm?
        t.ausgewaehlt = true; // Turm als ausgewählt markieren
        this.gs.angeklickterTurm = t; // Im Spielzustand speichern
        return true; // Treffer zurückgeben
      }
    }
    return false; // Keinen Turm getroffen
  }

  turmUpgraden(turm, pfadIndex) { // Versucht einen Turm upzugraden; pfadIndex nötig beim ersten Kauf
    if (turm.upgradeStufe >= turm.maxUpgrades) return; // Max-Stufe: abbrechen
    if (turm.upgradePfad === null && (pfadIndex !== 0 && pfadIndex !== 1)) return; // Pfad fehlt
    let info = turm.upgradePfad !== null ? turm.getUpgradeInfo() : turm.getPfadeInfo()[pfadIndex].upgrades[0];
    if (!info || info.kosten <= 0) return; // Keine Infos: abbrechen
    if (this.gs.wirtschaft.muenzenAbziehen(info.kosten)) { // Münzen abziehen
      turm.upgrade(pfadIndex); // Upgrade mit optionalem Pfad durchführen
      if (this.gs.sound) this.gs.sound.upgradeGekauft(); // Sound
    }
  }

  turmVerkaufen(turm) { // Verkauft einen Turm und entfernt ihn aus der Liste
    let preis = this.gs.wirtschaft.turmVerkaufen(turm); // Verkaufspreis berechnen und Münzen gutschreiben
    this.gs.tuerme = this.gs.tuerme.filter(t => t !== turm); // Turm aus der Liste entfernen
    this.gs.angeklickterTurm = null; // Keine Auswahl mehr
    return preis; // Preis zurückgeben
  }

  platzierungGueltig(mx, my) { // Prüft ob eine Turmposition gültig ist
    return this._platzierungGueltigIntern(mx, my); // Interne Prüfung aufrufen
  }

  _platzierungGueltigIntern(mx, my) { // Interne Prüfung der Turmplatzierung
    // Prüfen ob Position auf dem Pfad liegt
    let pfad = this.gs.pfad; // Aktuellen Pfad holen
    for (let i = 0; i < pfad.length - 1; i++) { // Alle Pfad-Segmente prüfen
      let d = this._abstandZumSegment(mx, my, pfad[i].x, pfad[i].y, pfad[i + 1].x, pfad[i + 1].y); // Abstand berechnen
      if (d < MIN_ABSTAND_VOM_PFAD) return false; // Zu nah am Pfad: ungültig
    }
    // Prüfen ob Position mit einem anderen Turm überlappt
    for (let t of this.gs.tuerme) { // Alle platzierten Türme prüfen
      if (dist(mx, my, t.x, t.y) < t.radius * 2 + 5) return false; // Überlappung: ungültig
    }
    // Prüfen ob Position im HUD-Bereich liegt
    if (my < 55) return false; // Im HUD: ungültig
    // Prüfen ob Position im Spielbereich (nicht im Panel)
    if (mx > 735) return false; // Im Panel: ungültig
    return true; // Position ist gültig
  }

  _abstandZumSegment(px, py, ax, ay, bx, by) { // Berechnet den Abstand eines Punkts zu einem Liniensegment
    let laenge2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay); // Quadrat der Segmentlänge
    if (laenge2 === 0) return dist(px, py, ax, ay); // Segment hat keine Länge: Abstand zum Punkt
    let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / laenge2; // Parameterwert
    t = max(0, min(1, t)); // Parameterwert auf [0,1] begrenzen
    let naechstesX = ax + t * (bx - ax); // X des nächsten Punkts auf dem Segment
    let naechstesY = ay + t * (by - ay); // Y des nächsten Punkts auf dem Segment
    return dist(px, py, naechstesX, naechstesY); // Abstand zurückgeben
  }
}
