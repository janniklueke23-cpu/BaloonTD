// upgradeManager.js – Verwaltet permanente Spieler-Upgrades die über alle Spielrunden erhalten bleiben

// Definitionen aller verfügbaren Upgrade-Kategorien mit ihren Stufen
const UPGRADE_DEFS = { // Objekt mit allen Upgrade-Definitionen
  startgeld: { // Kategorie: Extra-Startmünzen
    name:   'Startkapital', // Anzeigename
    symbol: '💰',           // Symbol für das Icon
    farbe:  [220, 180, 40], // Farbe der Karte (RGB)
    stufen: [ // Drei Upgrade-Stufen
      { kosten: 50,  beschreibung: '+50 Startmünzen',  kurztext: '+50 🪙' }, // Stufe 1
      { kosten: 150, beschreibung: '+150 Startmünzen', kurztext: '+150 🪙' }, // Stufe 2
      { kosten: 300, beschreibung: '+300 Startmünzen', kurztext: '+300 🪙' }  // Stufe 3
    ]
  },
  leben: { // Kategorie: Extra-Startleben
    name:   'Zähigkeit',   // Anzeigename
    symbol: '❤️',          // Symbol
    farbe:  [200, 60, 60], // Rote Farbe
    stufen: [ // Drei Stufen
      { kosten: 75,  beschreibung: '+2 Startleben',  kurztext: '+2 ❤️' }, // Stufe 1
      { kosten: 200, beschreibung: '+5 Startleben',  kurztext: '+5 ❤️' }, // Stufe 2
      { kosten: 400, beschreibung: '+10 Startleben', kurztext: '+10 ❤️' } // Stufe 3
    ]
  },
  rabatt: { // Kategorie: Rabatt auf Turmkosten
    name:   'Sparlehrer', // Anzeigename
    symbol: '🏷️',         // Symbol
    farbe:  [60, 140, 200], // Blaue Farbe
    stufen: [ // Drei Stufen
      { kosten: 100, beschreibung: '10% Rabatt auf alle Türme', kurztext: '-10% Kosten' }, // Stufe 1
      { kosten: 250, beschreibung: '20% Rabatt auf alle Türme', kurztext: '-20% Kosten' }, // Stufe 2
      { kosten: 500, beschreibung: '30% Rabatt auf alle Türme', kurztext: '-30% Kosten' }  // Stufe 3
    ]
  },
  muenzbonus: { // Kategorie: Bonus-Münzen pro geplatztem Ballon
    name:   'Schatzsucher', // Anzeigename
    symbol: '🪙',           // Symbol
    farbe:  [80, 180, 80],  // Grüne Farbe
    stufen: [ // Drei Stufen
      { kosten: 80,  beschreibung: '+10% Münzen pro Ballon', kurztext: 'x1.10 🪙' }, // Stufe 1
      { kosten: 200, beschreibung: '+25% Münzen pro Ballon', kurztext: 'x1.25 🪙' }, // Stufe 2
      { kosten: 450, beschreibung: '+50% Münzen pro Ballon', kurztext: 'x1.50 🪙' }  // Stufe 3
    ]
  }
};

class UpgradeManager { // Klasse für das permanente Upgrade-System
  constructor() { // Konstruktor: lädt gespeicherte Upgrade-Daten
    this.schluessel = 'lvs_upgrades_v2'; // localStorage-Schlüssel
    this.daten = this._laden(); // Gespeicherte Daten laden
    this.bestaetigungsDialog = null; // Aktiver Bestätigungs-Dialog (null = kein Dialog)
    this.kaufErfolgTimer = 0; // Timer für die "Kauf erfolgreich"-Animation
    this.kaufErfolgKat = ''; // Kategorie des letzten erfolgreichen Kaufs
  }

  _standard() { // Standard-Datenstruktur zurückgeben
    return { // Leere Datenstruktur
      gesamtMuenzen: 0, // Gesamt verdiente Münzen über alle Spielrunden
      gekauft: { // Welche Upgrade-Stufen gekauft wurden (0 = keine)
        startgeld:  0, // Startkapital-Stufe
        leben:      0, // Zähigkeit-Stufe
        rabatt:     0, // Sparlehrer-Stufe
        muenzbonus: 0  // Schatzsucher-Stufe
      }
    };
  }

  _laden() {
    try {
      let json = localStorage.getItem(this.schluessel);
      if (!json) return this._standard();
      let parsed = JSON.parse(json);
      let std = this._standard();
      std.gesamtMuenzen = parsed.gesamtMuenzen || 0;
      std.gekauft = Object.assign(std.gekauft, parsed.gekauft || {});
      return std;
    } catch (e) {
      return this._standard();
    }
  }

  _speichern() {
    try { localStorage.setItem(this.schluessel, JSON.stringify(this.daten)); } catch (e) {}
  }

  gesamtMuenzenErhoehen(betrag) { // Erhöht den Gesamt-Münzen-Zähler (wird beim Verdienen aufgerufen)
    this.daten.gesamtMuenzen += Math.floor(betrag); // Betrag hinzufügen (nur ganze Zahlen)
    this._speichern(); // Sofort speichern
  }

  _ausgegeben() { // Berechnet wie viele Münzen insgesamt für Upgrades ausgegeben wurden
    let summe = 0; // Summenvariable
    for (let kat in this.daten.gekauft) { // Alle Kategorien durchgehen
      let stufe = this.daten.gekauft[kat]; // Gekaufte Stufe
      let def = UPGRADE_DEFS[kat]; // Definition dieser Kategorie
      if (!def) continue; // Unbekannte Kategorie überspringen
      for (let i = 0; i < stufe; i++) { // Alle gekauften Stufen durchgehen
        summe += def.stufen[i].kosten; // Kosten addieren
      }
    }
    return summe; // Gesamtausgaben zurückgeben
  }

  verfuegbareMuenzen() { // Verfügbare Münzen = Gesamtmünzen minus Ausgaben
    return Math.max(0, this.daten.gesamtMuenzen - this._ausgegeben()); // Nie negativ
  }

  naechsteKosten(kategorie) { // Kosten der nächsten Upgrade-Stufe für eine Kategorie
    let stufe = this.daten.gekauft[kategorie]; // Aktuelle Stufe
    let def = UPGRADE_DEFS[kategorie]; // Definition
    if (!def || stufe >= def.stufen.length) return null; // Max-Stufe oder ungültig: null
    return def.stufen[stufe].kosten; // Kosten der nächsten Stufe zurückgeben
  }

  kaufen(kategorie) { // Upgrade kaufen: gibt true zurück wenn erfolgreich
    let stufe = this.daten.gekauft[kategorie]; // Aktuelle Stufe
    let def = UPGRADE_DEFS[kategorie]; // Definition
    if (!def || stufe >= def.stufen.length) return false; // Max-Stufe oder ungültig
    let kosten = def.stufen[stufe].kosten; // Kosten der nächsten Stufe
    if (this.verfuegbareMuenzen() < kosten) return false; // Nicht genug Münzen
    this.daten.gekauft[kategorie]++; // Stufe erhöhen
    this._speichern(); // Kauf speichern
    this.kaufErfolgTimer = 80; // Erfolgs-Animation starten (80 Frames ≈ 1,3 Sekunden)
    this.kaufErfolgKat = kategorie; // Kategorie für Animation merken
    return true; // Erfolg melden
  }

  // ─── Getter für Spiel-Boni ────────────────────────────────────────────────

  getStartMuenzen() { // Gibt die zusätzlichen Startmünzen zurück
    const boni = [50, 150, 300]; // Boni pro Stufe
    let stufe = this.daten.gekauft['startgeld']; // Aktuelle Stufe
    return stufe > 0 ? boni[stufe - 1] : 0; // Bonus zurückgeben (0 wenn keine Stufe)
  }

  getStartLeben() { // Gibt die zusätzlichen Startleben zurück
    const boni = [2, 5, 10]; // Boni pro Stufe
    let stufe = this.daten.gekauft['leben']; // Aktuelle Stufe
    return stufe > 0 ? boni[stufe - 1] : 0; // Bonus zurückgeben
  }

  getRabatt() { // Gibt den Turmkosten-Rabatt als Dezimalzahl zurück (0.0 bis 0.3)
    const rabatte = [0.10, 0.20, 0.30]; // Rabatt pro Stufe
    let stufe = this.daten.gekauft['rabatt']; // Aktuelle Stufe
    return stufe > 0 ? rabatte[stufe - 1] : 0; // Rabatt zurückgeben
  }

  getMuenzFaktor() { // Gibt den Münz-Multiplikator zurück (1.0 = kein Bonus)
    const faktoren = [1.10, 1.25, 1.50]; // Faktor pro Stufe
    let stufe = this.daten.gekauft['muenzbonus']; // Aktuelle Stufe
    return stufe > 0 ? faktoren[stufe - 1] : 1.0; // Faktor zurückgeben
  }

  // ─── UI-Logik (wird von menuScene genutzt) ───────────────────────────────

  upgradeKlick(mx, my) { // Verarbeitet einen Klick im Upgrade-Bildschirm
    // Wird von menuScene.js aufgerufen – hier wird der Bestätigungs-Dialog geöffnet
    let kategorien = Object.keys(UPGRADE_DEFS); // Alle Kategorien
    let karten = this._kartenPositionen(); // Positionen der Karten berechnen
    for (let i = 0; i < kategorien.length; i++) { // Alle Karten prüfen
      let kat = kategorien[i]; // Aktuelle Kategorie
      let k = karten[i]; // Kartenposition
      let stufe = this.daten.gekauft[kat]; // Aktuelle Stufe
      let def = UPGRADE_DEFS[kat]; // Definition
      if (stufe >= def.stufen.length) continue; // Max-Stufe: nicht klickbar
      let kosten = def.stufen[stufe].kosten; // Nächste Kosten
      // Kaufen-Button-Bereich prüfen
      if (mx >= k.x + 10 && mx <= k.x + k.b - 10 && my >= k.y + k.h - 45 && my <= k.y + k.h - 10) { // Kauf-Button getroffen?
        if (this.verfuegbareMuenzen() >= kosten) { // Genug Münzen?
          this.bestaetigungsDialog = { kategorie: kat, kosten: kosten, name: def.name }; // Dialog öffnen
        }
        return; // Nichts weiteres
      }
    }
    // Bestätigungs-Dialog: Ja/Nein
    if (this.bestaetigungsDialog) { // Dialog ist offen?
      if (mx >= 340 && mx <= 480 && my >= 340 && my <= 378) { // "Ja, kaufen"-Button
        if (this.kaufen(this.bestaetigungsDialog.kategorie)) { // Kauf versuchen
          if (window.gs && window.gs.sound) gs.sound.upgradeGekauft(); // Kauf-Sound
        }
        this.bestaetigungsDialog = null; // Dialog schließen
      } else if (mx >= 490 && mx <= 620 && my >= 340 && my <= 378) { // "Abbrechen"-Button
        this.bestaetigungsDialog = null; // Dialog schließen
      }
    }
  }

  _kartenPositionen() { // Berechnet die Positionen aller Upgrade-Karten im 2x2-Raster
    return [ // Array mit Kartenkoordinaten
      { x: 100, y: 170, b: 350, h: 200 }, // Karte 1 (oben links)
      { x: 510, y: 170, b: 350, h: 200 }, // Karte 2 (oben rechts)
      { x: 100, y: 390, b: 350, h: 200 }, // Karte 3 (unten links)
      { x: 510, y: 390, b: 350, h: 200 }  // Karte 4 (unten rechts)
    ];
  }

  drawUpgradeScreen() { // Zeichnet den kompletten Upgrade-Bildschirm
    let kategorien = Object.keys(UPGRADE_DEFS); // Alle Kategorien
    let karten = this._kartenPositionen(); // Kartenposition berechnen
    for (let i = 0; i < kategorien.length; i++) { // Alle Karten zeichnen
      this._karteZeichnen(kategorien[i], karten[i]); // Einzelne Karte zeichnen
    }
    if (this.kaufErfolgTimer > 0) this.kaufErfolgTimer--; // Erfolgs-Timer herunterzählen
    if (this.bestaetigungsDialog) this._dialogZeichnen(); // Bestätigungs-Dialog zeichnen
  }

  _karteZeichnen(kategorie, k) { // Eine Upgrade-Karte zeichnen
    let def = UPGRADE_DEFS[kategorie]; // Definition laden
    let stufe = this.daten.gekauft[kategorie]; // Aktuelle Stufe
    let maxStufe = def.stufen.length; // Maximale Stufe
    let farbe = def.farbe; // Kartenfarbe
    let hatMehr = stufe < maxStufe; // Gibt es weitere Stufen?
    let naechsteKosten = hatMehr ? def.stufen[stufe].kosten : 0; // Kosten der nächsten Stufe
    let kannKaufen = hatMehr && this.verfuegbareMuenzen() >= naechsteKosten; // Kaufbar?
    let istErfolgKarte = this.kaufErfolgKat === kategorie && this.kaufErfolgTimer > 0; // Erfolgsanimation?
    // Karten-Hintergrund
    let helligkeit = istErfolgKarte ? 80 : 25; // Heller bei Erfolgsanimation
    fill(helligkeit, helligkeit + 8, helligkeit + 15); // Dunkler Hintergrund
    stroke(farbe[0] * 0.6, farbe[1] * 0.6, farbe[2] * 0.6); // Gedämpfte Konturfarbe
    strokeWeight(istErfolgKarte ? 3 : 1.5); // Dickere Kontur bei Erfolg
    rect(k.x, k.y, k.b, k.h, 10); // Karten-Rechteck
    // Symbol und Name
    noStroke(); // Keine Kontur
    fill(farbe[0], farbe[1], farbe[2]); // Kategoriefarbe
    textAlign(LEFT, TOP); // Links oben
    textSize(22); // Große Schrift für Symbol
    text(def.symbol, k.x + 14, k.y + 12); // Symbol anzeigen
    textSize(16); // Name etwas kleiner
    textStyle(BOLD); // Fett
    text(def.name, k.x + 44, k.y + 14); // Name anzeigen
    textStyle(NORMAL); // Normal zurücksetzen
    // Stufen-Punkte anzeigen (3 Kreise)
    for (let i = 0; i < maxStufe; i++) { // Alle Stufen-Indikatoren
      let kreisX = k.x + k.b - 20 - (maxStufe - 1 - i) * 22; // X-Position von rechts
      let kreisY = k.y + 22; // Y-Position oben rechts
      if (i < stufe) { // Gekaufte Stufe
        fill(farbe[0], farbe[1], farbe[2]); // Volle Farbe für gekaufte Stufen
      } else { // Noch nicht gekaufte Stufe
        fill(50, 50, 65); // Dunkel für nicht gekaufte
      }
      noStroke(); // Keine Kontur
      ellipse(kreisX, kreisY, 14, 14); // Stufen-Kreis zeichnen
    }
    // Aktuelle Stufen-Beschreibung
    fill(160, 165, 185); // Helles Grau
    textSize(12); // Kleine Schrift
    textAlign(LEFT, TOP); // Links oben
    if (stufe > 0) { // Mindestens eine Stufe gekauft?
      let aktBeschr = def.stufen[stufe - 1].beschreibung; // Aktuelle Beschreibung
      text('Aktiv: ' + aktBeschr, k.x + 14, k.y + 50); // Aktive Beschreibung anzeigen
    } else { // Noch nichts gekauft
      text('Noch nicht aktiviert', k.x + 14, k.y + 50); // Hinweis
    }
    // Nächste Stufe Beschreibung
    if (hatMehr) { // Weitere Stufe verfügbar?
      fill(140, 185, 140); // Hellgrün für nächste Stufe
      text('Nächste Stufe: ' + def.stufen[stufe].beschreibung, k.x + 14, k.y + 70); // Nächste Beschreibung
    }
    // Kaufen-Button
    if (hatMehr) { // Kaufen-Button nur wenn nicht Max-Stufe
      let btnFarbe = kannKaufen ? farbe : [50, 50, 60]; // Farbe je nach Kaufbarkeit
      fill(btnFarbe[0] * 0.7, btnFarbe[1] * 0.7, btnFarbe[2] * 0.7); // Gedämpfte Button-Farbe
      stroke(btnFarbe[0], btnFarbe[1], btnFarbe[2]); // Kontur in voller Farbe
      strokeWeight(1.5); // Konturstärke
      rect(k.x + 10, k.y + k.h - 45, k.b - 20, 32, 6); // Kaufen-Button
      noStroke(); // Keine Kontur für Text
      fill(kannKaufen ? 255 : 120); // Weißer Text wenn kaufbar, grau wenn nicht
      textAlign(CENTER, CENTER); // Zentriert
      textSize(13); // Schriftgröße
      textStyle(BOLD); // Fett
      text(T('kaufen') + '  🪙' + naechsteKosten, k.x + k.b / 2, k.y + k.h - 29); // Button-Text mit Preis
      textStyle(NORMAL); // Normal
    } else { // Max-Stufe erreicht
      noStroke(); // Keine Kontur
      fill(farbe[0], farbe[1], farbe[2]); // Kategoriefarbe
      textAlign(CENTER, CENTER); // Zentriert
      textSize(13); // Schriftgröße
      textStyle(BOLD); // Fett
      text(T('maxStufe'), k.x + k.b / 2, k.y + k.h - 29); // "Max Stufe" anzeigen
      textStyle(NORMAL); // Normal
    }
    // Erfolgsanimation (kurzes Aufleuchten der Karte)
    if (istErfolgKarte) { // Karte leuchtet auf?
      let alpha = map(this.kaufErfolgTimer, 0, 80, 0, 100); // Transparenz abnehmen
      noStroke(); // Keine Kontur
      fill(farbe[0], farbe[1], farbe[2], alpha); // Aufleuchten in Kategoriefarbe
      rect(k.x, k.y, k.b, k.h, 10); // Leuchtendes Overlay
    }
  }

  _dialogZeichnen() { // Bestätigungs-Dialog zeichnen
    let d = this.bestaetigungsDialog; // Dialog-Daten holen
    // Halbtransparenter Overlay
    noStroke(); // Keine Kontur
    fill(0, 0, 0, 160); // Dunkler Overlay
    rect(0, 0, 960, 640); // Gesamten Bildschirm abdunkeln
    // Dialog-Box
    fill(25, 25, 45); // Dunkles Blau
    stroke(100, 100, 180); // Helle Kontur
    strokeWeight(2); // Konturstärke
    rect(300, 260, 360, 160, 12); // Dialog-Rechteck
    // Dialog-Titel
    noStroke(); // Keine Kontur
    fill(200, 200, 255); // Hellblau
    textAlign(CENTER, TOP); // Oben zentriert
    textSize(18); // Schriftgröße
    textStyle(BOLD); // Fett
    text(T('bestaetigen'), 480, 276); // Dialog-Titel anzeigen
    textStyle(NORMAL); // Normal
    // Upgrade-Name und Kosten
    fill(180, 180, 220); // Helles Grau
    textSize(14); // Schrift
    text(d.name + ' – 🪙' + d.kosten, 480, 304); // Name und Kosten anzeigen
    // "Ja"-Button
    let mausx = skMx(); // Skalierte Mausposition X
    let mausy = skMy(); // Skalierte Mausposition Y
    let jaHover = mausx >= 340 && mausx <= 480 && mausy >= 340 && mausy <= 378; // Hover prüfen
    fill(jaHover ? color(80, 180, 80) : color(50, 140, 50)); // Grün bei Hover
    stroke(100, 200, 100); // Grüne Kontur
    strokeWeight(1.5); // Konturstärke
    rect(340, 340, 140, 38, 8); // Ja-Button
    noStroke(); // Keine Kontur
    fill(255); // Weißer Text
    textSize(13); // Schrift
    textStyle(BOLD); // Fett
    text(T('ja'), 410, 359); // Ja-Button-Text
    textStyle(NORMAL); // Normal
    // "Nein"-Button
    let neinHover = mausx >= 490 && mausx <= 620 && mausy >= 340 && mausy <= 378; // Hover prüfen
    fill(neinHover ? color(160, 60, 60) : color(120, 40, 40)); // Rot bei Hover
    stroke(180, 80, 80); // Rote Kontur
    strokeWeight(1.5); // Konturstärke
    rect(490, 340, 130, 38, 8); // Nein-Button
    noStroke(); // Keine Kontur
    fill(255); // Weißer Text
    textSize(13); // Schrift
    textStyle(BOLD); // Fett
    text(T('nein'), 555, 359); // Nein-Button-Text
    textStyle(NORMAL); // Normal
  }
}
