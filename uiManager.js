// uiManager.js – Zeichnet alle UI-Elemente: HUD, Shop-Panel, Upgrade-Panel, Buttons

const TURMSHOP_EINTRAEGE = [ // Liste aller kaufbaren Türme im Shop
  { typ: 'blech',    name: 'Hr. Blech',    kosten: 100, farbe: [55, 55, 75]   }, // Blech: Kreide-Werfer
  { typ: 'pfingsten',name: 'Hr. Pfingsten',kosten: 130, farbe: [70, 100, 50]  }, // Pfingsten: Verlangsamer
  { typ: 'koch',     name: 'Hr. Koch',     kosten: 175, farbe: [160, 40, 40]  }, // Koch: Verweis-Werfer
  { typ: 'pfister',  name: 'Hr. Pfister',  kosten: 140, farbe: [120, 80, 30]  }  // Pfister: Säure-Flaschen
];

class UIManager { // Klasse für alle Spieloberflächen-Elemente
  constructor(spielZustand) { // Konstruktor: erhält den Spielzustand
    this.gs = spielZustand; // Spielzustand-Referenz speichern
    this.panelX = 740; // X-Position des rechten UI-Panels
    this.panelBreite = 220; // Breite des UI-Panels
    this.hudHoehe = 50; // Höhe des oberen Info-Balkens (HUD)
    this.shopEintragHoehe = 90; // Höhe jedes Eintrags im Turmshop
    this.welleAbschlussTimer = 0; // Timer für die Wellen-Abschluss-Nachricht
    this.welleAbschlussBonus = 0; // Wieviel Bonus beim Abschluss vergeben wurde
    this.nesteWelleBtn = { x: 748, y: 430, b: 204, h: 40 }; // Button "Nächste Welle" (Position und Größe)
    this.zweiXBtn = { x: 748, y: 478, b: 204, h: 35 }; // Button "2x Geschwindigkeit"
    this.upgradePanel = null; // Aktuelles Upgrade-Panel (null wenn nicht sichtbar)
    this.shopScrollY = 0; // Scroll-Offset des Turmshops (nach oben scrollen = positiv)
  }

  shopScroll(delta) { // Shop nach oben/unten scrollen
    let maxScroll = Math.max(0, TURMSHOP_EINTRAEGE.length * this.shopEintragHoehe - 355); // Maximaler Scroll
    this.shopScrollY = Math.max(0, Math.min(this.shopScrollY + delta * 0.4, maxScroll)); // Scroll begrenzen
  }

  draw() { // Alle UI-Elemente zeichnen
    this._hudZeichnen(); // Oberen Info-Balken zeichnen
    this._shopPanelZeichnen(); // Rechtes Shop-Panel zeichnen
    this._naechsteWelleBtnZeichnen(); // "Nächste Welle starten"-Button zeichnen
    this._geschwindigkeitsBtnZeichnen(); // 2x-Geschwindigkeit-Button zeichnen
    if (this.gs.ausgewaehlteTurmTyp) { // Wenn ein Turm zum Platzieren ausgewählt
      this._platzierungsVorschauZeichnen(); // Vorschau-Modus anzeigen
    }
    if (this.gs.angeklickterTurm) { // Wenn ein Turm angeklickt wurde
      this._upgradePanelZeichnen(this.gs.angeklickterTurm); // Upgrade-Panel zeigen
    }
    if (this.welleAbschlussTimer > 0) { // Wenn Wellen-Abschluss-Nachricht aktiv
      this._welleAbschlussZeichnen(); // Nachricht zeichnen
    }
    this._hochscoreHinweisZeichnen(); // Kleinen Highscore-Hinweis zeichnen
  }

  _hudZeichnen() { // Oberen Informations-Balken zeichnen
    fill(20, 20, 40); // Dunkelblaues HUD
    noStroke(); // Keine Kontur
    rect(0, 0, 960, this.hudHoehe); // HUD-Hintergrundrechteck
    // Trennlinie
    stroke(80, 80, 120); // Mittelblaue Linie
    strokeWeight(1); // Linienstärke
    line(0, this.hudHoehe, 960, this.hudHoehe); // Trennlinie zwischen HUD und Spielfeld
    // Münzen-Anzeige
    noStroke(); // Keine Kontur
    fill(255, 215, 0); // Goldfarbe für Münzen
    textSize(22); // Große Schrift
    textAlign(LEFT, CENTER); // Links ausrichten
    text('🪙 ' + this.gs.muenzen, 10, 25); // Münz-Symbol und Anzahl
    // Leben-Anzeige
    fill(220, 80, 80); // Rot für Leben
    textSize(22); // Große Schrift
    text('❤️ ' + this.gs.leben, 180, 25); // Herz-Symbol und Leben
    // Wellen-Anzeige
    fill(150, 220, 255); // Hellblau für Wellen-Info
    textSize(18); // Mittlere Schrift
    textAlign(CENTER, CENTER); // Zentriert
    text('Welle ' + this.gs.welle + ' / ' + this.gs.maxWellen, 500, 25); // Wellen-Info
    // Fortschrittsbalken (Wellen-Fortschritt)
    let wellenFortschritt = this.gs.maxWellen > 0 ? this.gs.welle / this.gs.maxWellen : 0; // Fortschritt berechnen
    fill(40, 40, 60); // Dunkler Hintergrund des Fortschrittsbalkens
    rect(380, 38, 240, 8, 4); // Hintergrunds-Balken
    fill(100, 200, 100); // Grüner Fortschrittsbalken
    rect(380, 38, 240 * wellenFortschritt, 8, 4); // Fortschritts-Füllung
    // Pausiert-Anzeige
    if (this.gs.pausiert) { // Wenn das Spiel pausiert ist
      fill(255, 200, 50); // Gelbe Farbe
      textSize(16); // Mittlere Schrift
      text('⏸ PAUSIERT', 680, 25); // Pause-Anzeige
    }
    // Level-Anzeige
    fill(200, 200, 200); // Hellgrau
    textSize(14); // Kleine Schrift
    textAlign(RIGHT, CENTER); // Rechts ausrichten
    text('Level ' + this.gs.level, 730, 25); // Level-Nummer
  }

  _shopPanelZeichnen() { // Rechtes Shop-Panel zeichnen
    fill(15, 15, 35); // Sehr dunkles Blau als Hintergrund
    noStroke(); // Keine Kontur
    rect(this.panelX, 0, this.panelBreite, 440); // Hintergrund des Panels
    stroke(60, 60, 100); // Blaue Trennlinie links
    strokeWeight(2); // Linien-Dicke
    line(this.panelX, 0, this.panelX, 640); // Vertikale Trennlinie
    // Panel-Titel
    noStroke(); // Keine Kontur
    fill(180, 180, 220); // Hellblau-Weiß für Titel
    textSize(15); // Mittlere Schrift
    textAlign(CENTER, TOP); // Oben-Mitte
    text('Türme platzieren', this.panelX + this.panelBreite / 2, 58); // Panel-Überschrift
    stroke(60, 60, 100); // Trennlinie
    strokeWeight(1); // Dicke
    line(this.panelX + 10, 78, this.panelX + this.panelBreite - 10, 78); // Horizontale Linie
    // Einträge mit Scroll-Clipping zeichnen
    drawingContext.save(); // Canvas-Zustand sichern für Clipping
    drawingContext.beginPath(); // Clipping-Pfad beginnen
    drawingContext.rect(this.panelX, 80, this.panelBreite, 356); // Sichtbarer Bereich des Shops
    drawingContext.clip(); // Clipping anwenden
    for (let i = 0; i < TURMSHOP_EINTRAEGE.length; i++) { // Alle Turmtypen durchgehen
      let eintrag = TURMSHOP_EINTRAEGE[i]; // Aktuellen Eintrag holen
      let eintragY = 85 + i * this.shopEintragHoehe - this.shopScrollY; // Y-Position mit Scroll
      this._shopEintragZeichnen(eintrag, eintragY); // Eintrag zeichnen
    }
    drawingContext.restore(); // Clipping aufheben
    // Scroll-Indikator (kleiner Balken rechts, wenn scrollbar)
    let maxScroll = Math.max(0, TURMSHOP_EINTRAEGE.length * this.shopEintragHoehe - 355);
    if (maxScroll > 0) { // Nur anzeigen wenn scrollbar
      let scrollAnteil = this.shopScrollY / maxScroll; // Position 0–1
      noStroke(); fill(60, 60, 100);
      rect(this.panelX + this.panelBreite - 6, 82, 4, 352, 2); // Spur
      fill(120, 120, 200);
      let knopfH = max(30, 352 * 355 / (TURMSHOP_EINTRAEGE.length * this.shopEintragHoehe));
      rect(this.panelX + this.panelBreite - 6, 82 + scrollAnteil * (352 - knopfH), 4, knopfH, 2); // Knopf
    }
  }

  _shopEintragZeichnen(eintrag, y) { // Einen einzelnen Turm-Eintrag im Shop zeichnen
    let istAusgewaehlt = this.gs.ausgewaehlteTurmTyp === eintrag.typ; // Ist dieser Turm ausgewählt?
    let kannKaufen = this.gs.muenzen >= eintrag.kosten; // Hat der Spieler genug Münzen?
    let x = this.panelX + 8; // X-Startposition mit Abstand
    let breite = this.panelBreite - 16; // Breite des Eintrags
    // Hintergrund des Eintrags
    if (istAusgewaehlt) { // Ausgewählter Eintrag
      fill(50, 80, 160); // Blaues Highlight
    } else if (kannKaufen) { // Kaufbar
      fill(25, 25, 50); // Dunkler Hintergrund
    } else { // Zu teuer
      fill(20, 20, 30); // Sehr dunkler Hintergrund (nicht kaufbar)
    }
    stroke(istAusgewaehlt ? color(100, 150, 255) : color(50, 50, 80)); // Kontur je nach Status
    strokeWeight(1.5); // Konturstärke
    rect(x, y, breite, this.shopEintragHoehe - 4, 6); // Eintrag-Rechteck mit abgerundeten Ecken
    // Kleines Turm-Vorschau-Bild (farbiger Kreis mit Buchstabe)
    let farbe = eintrag.farbe; // Turmfarbe holen
    fill(farbe[0], farbe[1], farbe[2]); // Farbe setzen
    noStroke(); // Keine Kontur
    ellipse(x + 25, y + 35, 28, 28); // Farbiger Kreis als Vorschau
    // Buchstabe des Turmtyps auf dem Kreis
    fill(255); // Weißer Text
    textAlign(CENTER, CENTER); // Zentriert
    textSize(11); // Kleine Schrift
    text(eintrag.name.charAt(0), x + 25, y + 35); // Ersten Buchstaben des Namens anzeigen
    // Name des Turms
    fill(kannKaufen ? color(220, 220, 255) : color(100, 100, 120)); // Farbe je nach Kaufbarkeit
    textAlign(LEFT, TOP); // Links oben
    textSize(13); // Mittlere Schrift
    textStyle(BOLD); // Fett
    text(eintrag.name, x + 42, y + 10); // Turmname
    textStyle(NORMAL); // Normal
    // Beschreibung des Turms (kurz)
    fill(kannKaufen ? color(160, 160, 200) : color(80, 80, 100)); // Grauer Text
    textSize(10); // Kleine Schrift
    this._turmBeschreibung(eintrag.typ, x + 42, y + 27); // Beschreibungstext
    // Preis-Anzeige
    fill(kannKaufen ? color(255, 215, 0) : color(150, 100, 50)); // Gold wenn kaufbar, braun wenn nicht
    textSize(13); // Mittlere Schrift
    textAlign(RIGHT, BOTTOM); // Rechts unten
    text('🪙 ' + eintrag.kosten, x + breite - 8, y + this.shopEintragHoehe - 8); // Preis anzeigen
  }

  _turmBeschreibung(typ, x, y) { // Kurze Beschreibung des Turmtyps
    let beschreibungen = { // Tabelle mit Kurzfassungen
      'blech':    'Kreide · Schnell · Bombe', // Blech: Kreide-Werfer
      'pfingsten':'Support · Verlangsamt',    // Pfingsten: Verlangsamer
      'koch':     'Verweise · Langsam · Stark', // Koch: hoher Schaden
      'pfister':  'Bierflaschen · Säure'     // Pfister: Säureschaden
    };
    text(beschreibungen[typ] || '', x, y); // Beschreibungstext anzeigen
  }

  _naechsteWelleBtnZeichnen() { // "Nächste Welle starten"-Button zeichnen
    let btn = this.nesteWelleBtn; // Button-Daten holen
    let welleBeendet = !this.gs.welleAktiv; // Ist gerade keine Welle aktiv?
    let alleWellenGespielt = this.gs.welle >= this.gs.maxWellen; // Alle Wellen gespielt?
    let aktiv = welleBeendet && !alleWellenGespielt; // Button nur aktiv wenn Welle beendet und noch Wellen offen
    if (aktiv) { // Aktiver Button
      fill(50, 180, 80); // Grüner Button
      stroke(30, 220, 80); // Hellgrüne Kontur
    } else if (alleWellenGespielt) { // Alle Wellen gespielt
      fill(80, 80, 100); // Grauer Button
      stroke(60, 60, 80); // Dunkle Kontur
    } else { // Welle läuft noch
      fill(40, 40, 60); // Sehr dunkler Button (inaktiv)
      stroke(60, 60, 80); // Dunkle Kontur
    }
    strokeWeight(2); // Konturstärke
    rect(btn.x, btn.y, btn.b, btn.h, 8); // Button-Rechteck
    noStroke(); // Keine Kontur für Text
    fill(aktiv ? color(255, 255, 255) : color(120, 120, 140)); // Weißer Text wenn aktiv
    textAlign(CENTER, CENTER); // Zentriert
    textSize(13); // Schriftgröße
    textStyle(BOLD); // Fett
    text(alleWellenGespielt ? 'Alle Wellen!' : (this.gs.welleAktiv ? 'Welle läuft...' : '▶ Nächste Welle [Space]'), btn.x + btn.b / 2, btn.y + btn.h / 2); // Button-Text
    textStyle(NORMAL); // Normal zurücksetzen
  }

  _geschwindigkeitsBtnZeichnen() { // "2x Geschwindigkeit"-Button zeichnen
    let btn = this.zweiXBtn; // Button-Daten holen
    let istSchnell = this.gs.geschwindigkeit === 2; // Ist 2x-Geschwindigkeit aktiv?
    fill(istSchnell ? color(200, 120, 20) : color(40, 40, 60)); // Orange wenn aktiv, dunkel wenn nicht
    stroke(istSchnell ? color(255, 160, 30) : color(60, 60, 80)); // Konturfarbe
    strokeWeight(1.5); // Konturstärke
    rect(btn.x, btn.y, btn.b, btn.h, 8); // Button-Rechteck
    noStroke(); // Keine Kontur für Text
    fill(istSchnell ? color(255, 255, 200) : color(140, 140, 160)); // Helle Farbe wenn aktiv
    textAlign(CENTER, CENTER); // Zentriert
    textSize(14); // Schriftgröße
    textStyle(BOLD); // Fett
    text(istSchnell ? '⚡ 2x AKTIV' : '⚡ 2x Geschw.', btn.x + btn.b / 2, btn.y + btn.h / 2); // Button-Text
    textStyle(NORMAL); // Normal
  }

  _upgradePanelZeichnen(turm) { // Upgrade-Panel für einen ausgewählten Turm zeichnen
    let px = 748, pb = 204; // Panel X und Breite
    let pfadeInfo = turm.getPfadeInfo(); // Pfad-Definitionen holen
    let pfadGewaehlt = turm.upgradePfad !== null; // Ist bereits ein Pfad gewählt?
    let voll = turm.upgradeStufe >= turm.maxUpgrades; // Voll ausgebaut?

    // Panel-Höhe dynamisch: größer wenn Pfadwahl nötig
    let py = pfadGewaehlt ? 518 : 494;
    let ph = pfadGewaehlt ? 120 : 144;

    // Panel-Hintergrund
    fill(20, 20, 45);
    stroke(100, 100, 180);
    strokeWeight(2);
    rect(px, py, pb, ph, 8);

    // ── Turm-Name ─────────────────────────────────────────────────────────────
    noStroke();
    fill(200, 200, 255);
    textAlign(LEFT, TOP);
    textSize(13);
    textStyle(BOLD);
    text(turm.name, px + 10, py + 10);
    textStyle(NORMAL);

    // ── Upgrade-Kreise (rechts oben) ──────────────────────────────────────────
    for (let i = 0; i < turm.maxUpgrades; i++) {
      let erreicht = i < turm.upgradeStufe;
      if (erreicht) {
        let af = turm.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100];
        fill(af[0], af[1], af[2]);
      } else {
        fill(50, 50, 70);
      }
      stroke(100, 100, 150);
      strokeWeight(1);
      ellipse(px + 148 + i * 18, py + 16, 12, 12);
    }

    if (!pfadGewaehlt && pfadeInfo) {
      // ── Pfad-Auswahl ─────────────────────────────────────────────────────────
      noStroke();
      fill(160, 160, 200);
      textAlign(CENTER, TOP);
      textSize(10);
      text('— Pfad wählen —', px + pb / 2, py + 28);

      let bw = (pb - 20) / 2 - 3; // Breite jedes Pfad-Buttons
      for (let pi = 0; pi < 2; pi++) { // Linken und rechten Pfad-Button zeichnen
        let bx = px + 8 + pi * (bw + 6); // X-Position
        let by = py + 40; // Y-Position
        let bh = 62; // Höhe
        let pfad = pfadeInfo[pi]; // Pfad-Daten
        let erstesUpgrade = pfad.upgrades[0]; // Erstes Upgrade als Vorschau
        let pfadFarbe = pi === 0 ? [60, 100, 200] : [40, 140, 70]; // Blau / Grün

        fill(pfadFarbe[0], pfadFarbe[1], pfadFarbe[2]);
        stroke(pi === 0 ? color(100, 150, 255) : color(80, 220, 100));
        strokeWeight(1.5);
        rect(bx, by, bw, bh, 5);

        noStroke();
        fill(255, 255, 255);
        textAlign(CENTER, TOP);
        textSize(10);
        textStyle(BOLD);
        text(pfad.name, bx + bw / 2, by + 6);
        textStyle(NORMAL);
        fill(200, 220, 255);
        textSize(9);
        text(erstesUpgrade.name, bx + bw / 2, by + 22);
        fill(160, 180, 220);
        textSize(8);
        text(erstesUpgrade.beschreibung, bx + bw / 2, by + 35);
        fill(255, 215, 0);
        textSize(9);
        text('🪙 ' + erstesUpgrade.kosten, bx + bw / 2, by + 49);
      }

    } else if (pfadGewaehlt && !voll) {
      // ── Gewählter Pfad + Upgrade-Button ──────────────────────────────────────
      let pfadFarbe = turm.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100];
      noStroke();
      fill(pfadFarbe[0], pfadFarbe[1], pfadFarbe[2]);
      textSize(9);
      textAlign(LEFT, TOP);
      text('Pfad: ' + pfadeInfo[turm.upgradePfad].name, px + 10, py + 27);

      let upInfo = turm.getUpgradeInfo();
      let kannUpgraden = upInfo && this.gs.muenzen >= upInfo.kosten;
      fill(kannUpgraden ? color(50, 140, 210) : color(40, 40, 60));
      stroke(kannUpgraden ? color(80, 180, 255) : color(50, 50, 70));
      strokeWeight(1.5);
      rect(px + 8, py + 38, pb - 16, 34, 6);
      noStroke();
      fill(kannUpgraden ? color(220, 240, 255) : color(100, 100, 120));
      textAlign(LEFT, CENTER);
      textSize(10);
      text('⬆ ' + upInfo.name, px + 14, py + 49);
      textSize(9);
      fill(kannUpgraden ? color(160, 200, 240) : color(80, 80, 100));
      text(upInfo.beschreibung, px + 14, py + 62);
      fill(kannUpgraden ? color(255, 215, 0) : color(150, 100, 50));
      textAlign(RIGHT, CENTER);
      textSize(12);
      text('🪙' + upInfo.kosten, px + pb - 12, py + 55);

    } else if (voll) {
      // ── Voll ausgebaut ────────────────────────────────────────────────────────
      let pfadFarbe = turm.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100];
      noStroke();
      fill(pfadFarbe[0], pfadFarbe[1], pfadFarbe[2]);
      textSize(9);
      textAlign(LEFT, TOP);
      text('Pfad: ' + (pfadeInfo ? pfadeInfo[turm.upgradePfad].name : ''), px + 10, py + 27);
      fill(100, 220, 100);
      textAlign(CENTER, CENTER);
      textSize(13);
      textStyle(BOLD);
      text('✓ Voll ausgebaut!', px + pb / 2, py + 55);
      textStyle(NORMAL);
    }

    // ── Verkaufs-Button ────────────────────────────────────────────────────────
    let verkaufsPreis = this._verkaufsPreisBerechnen(turm);
    let vby = py + ph - 38; // Verkauf-Button Y-Position
    fill(160, 60, 60);
    stroke(200, 80, 80);
    strokeWeight(1.5);
    rect(px + 8, vby, pb - 16, 26, 6);
    noStroke();
    fill(255, 200, 200);
    textAlign(CENTER, CENTER);
    textSize(11);
    text('🗑 Verkaufen  +🪙' + verkaufsPreis, px + pb / 2, vby + 13);

    // ── Schließen-Hinweis ─────────────────────────────────────────────────────
    noStroke();
    fill(100, 100, 130);
    textSize(9);
    textAlign(CENTER, BOTTOM);
    text('[Escape] zum Schließen', px + pb / 2, py + ph - 2);
  }

  _verkaufsPreisBerechnen(turm) { // Berechnet den Verkaufspreis (60% der Ausgaben)
    let gesamt = turm.basisKosten; // Grundpreis des Turms
    for (let i = 0; i < turm.upgradeStufe; i++) { // Bezahlte Upgrades hinzurechnen
      gesamt += this.gs.wirtschaft.upgradeKosten(turm.typ, i + 1); // Upgrade-Kosten addieren
    }
    return Math.floor(gesamt * 0.6); // 60% der Gesamtkosten zurückgeben
  }

  _platzierungsVorschauZeichnen() { // Zeigt den ausgewählten Turm an der Mausposition (Vorschau)
    let mx = mouseX; // Aktuelle Mausposition X
    let my = mouseY; // Aktuelle Mausposition Y
    if (mx > this.panelX) return; // Maus im Panel: keine Vorschau
    if (my < this.hudHoehe) return; // Maus im HUD: keine Vorschau
    let gueltig = this.gs.platzierungGueltig(mx, my); // Ist diese Position gültig?
    noStroke(); // Keine Kontur
    fill(gueltig ? color(100, 255, 100, 60) : color(255, 80, 80, 60)); // Grün wenn gültig, Rot wenn nicht
    ellipse(mx, my, 50, 50); // Vorschau-Kreis
    stroke(gueltig ? color(100, 255, 100, 180) : color(255, 80, 80, 180)); // Kontur
    strokeWeight(2); // Konturstärke
    noFill(); // Kein Füll
    ellipse(mx, my, 44, 44); // Äußerer Kreis
    // Reichweiten-Vorschau
    let turmDaten = TURMSHOP_EINTRAEGE.find(e => e.typ === this.gs.ausgewaehlteTurmTyp); // Turmtyp holen
    // Reichweite je nach Typ
    let vorschauReichweite = { mathe: 120, sport: 105, direktor: 160, bio: 110 }[this.gs.ausgewaehlteTurmTyp] || 100; // Reichweite
    noFill(); // Kein Füll
    stroke(gueltig ? color(100, 255, 100, 60) : color(255, 80, 80, 60)); // Kontur-Farbe
    strokeWeight(1); // Dünne Linie
    ellipse(mx, my, vorschauReichweite * 2, vorschauReichweite * 2); // Reichweiten-Kreis
  }

  _welleAbschlussZeichnen() { // Wellen-Abschluss-Popup zeichnen
    this.welleAbschlussTimer--; // Timer herunterzählen
    let alpha = min(255, this.welleAbschlussTimer * 6); // Transparenz basierend auf Timer
    noStroke(); // Keine Kontur
    fill(20, 60, 20, alpha); // Halbdurchsichtiger dunkler Hintergrund
    rect(250, 200, 280, 100, 12); // Popup-Hintergrund
    stroke(100, 220, 100, alpha); // Grüne Kontur
    strokeWeight(2); // Konturstärke
    noFill(); // Kein Füll
    rect(250, 200, 280, 100, 12); // Kontur-Rechteck
    noStroke(); // Keine Kontur
    fill(150, 255, 150, alpha); // Hellgrüner Text
    textAlign(CENTER, CENTER); // Zentriert
    textSize(20); // Große Schrift
    textStyle(BOLD); // Fett
    text('✓ Welle ' + (this.gs.welle - 1) + ' bestanden!', 390, 235); // Wellen-Abschluss-Text
    textStyle(NORMAL); // Normal
    fill(255, 215, 0, alpha); // Goldfarbe für Bonus
    textSize(16); // Mittlere Schrift
    text('+🪙' + this.welleAbschlussBonus + ' Wellenbonus', 390, 268); // Bonus-Text
  }

  welleAbgeschlossenZeigen(welleNummer, bonus) { // Wird aufgerufen wenn eine Welle endet
    this.welleAbschlussTimer = 120; // Popup für 2 Sekunden anzeigen
    this.welleAbschlussBonus = bonus; // Bonus für Anzeige speichern
  }

  _hochscoreHinweisZeichnen() { // Highscore-Hinweis am unteren Rand
    fill(80, 80, 110); // Grau
    noStroke(); // Keine Kontur
    textAlign(CENTER, BOTTOM); // Zentriert unten
    textSize(10); // Sehr kleine Schrift
    text('Punkte: ' + this.gs.punkte, 850, 638); // Aktuelle Punktzahl
  }

  getShopKlick(mx, my) { // Prüft ob ein Shop-Eintrag angeklickt wurde – gibt Turmtyp zurück
    if (my < 80 || my > 436) return null; // Außerhalb des Shop-Bereichs
    for (let i = 0; i < TURMSHOP_EINTRAEGE.length; i++) { // Alle Einträge prüfen
      let eintrag = TURMSHOP_EINTRAEGE[i]; // Aktuellen Eintrag holen
      let eintragY = 85 + i * this.shopEintragHoehe - this.shopScrollY; // Y-Position mit Scroll
      let x = this.panelX + 8; // X-Start
      let b = this.panelBreite - 16; // Breite
      if (mx >= x && mx <= x + b && my >= eintragY && my <= eintragY + this.shopEintragHoehe - 4) { // Geklickt?
        return eintrag.typ; // Turmtyp zurückgeben
      }
    }
    return null; // Kein Eintrag getroffen
  }

  isNaechsteWelleKlick(mx, my) { // Prüft ob der "Nächste Welle"-Button geklickt wurde
    let btn = this.nesteWelleBtn;
    return mx >= btn.x && mx <= btn.x + btn.b && my >= btn.y && my <= btn.y + btn.h;
  }

  isZweiXKlick(mx, my) { // Prüft ob der "2x Geschwindigkeit"-Button geklickt wurde
    let btn = this.zweiXBtn;
    return mx >= btn.x && mx <= btn.x + btn.b && my >= btn.y && my <= btn.y + btn.h;
  }

  // Gibt zurück was im Upgrade-Panel geklickt wurde:
  // { typ: 'pfad', pfad: 0|1 }  – Pfad-Auswahl-Button
  // { typ: 'upgrade' }          – Upgrade kaufen
  // { typ: 'verkauf' }          – Turm verkaufen
  // null                        – nichts
  getUpgradePanelKlick(mx, my) {
    let turm = this.gs.angeklickterTurm;
    if (!turm) return null;

    let px = 748, pb = 204;
    let pfadGewaehlt = turm.upgradePfad !== null;
    let py = pfadGewaehlt ? 518 : 494;
    let ph = pfadGewaehlt ? 120 : 144;

    if (mx < px + 8 || mx > px + pb - 8) return null; // Links/rechts außerhalb

    // Verkauf-Button (immer unten)
    let vby = py + ph - 38;
    if (my >= vby && my <= vby + 26) return { typ: 'verkauf' };

    if (!pfadGewaehlt && turm.getPfadeInfo()) {
      // Pfad-Auswahl-Buttons
      let bw = (pb - 20) / 2 - 3;
      let by = py + 40, bh = 62;
      if (my >= by && my <= by + bh) {
        if (mx >= px + 8 && mx <= px + 8 + bw) return { typ: 'pfad', pfad: 0 };
        if (mx >= px + 8 + bw + 6 && mx <= px + pb - 8) return { typ: 'pfad', pfad: 1 };
      }
    } else if (pfadGewaehlt && turm.upgradeStufe < turm.maxUpgrades) {
      // Upgrade-Button
      if (my >= py + 38 && my <= py + 72) return { typ: 'upgrade' };
    }

    return null;
  }

  // Rückwärtskompatibilität für gameScene
  isUpgradeKlick(mx, my) {
    let k = this.getUpgradePanelKlick(mx, my);
    return k && k.typ === 'upgrade';
  }

  isVerkaufKlick(mx, my) {
    let k = this.getUpgradePanelKlick(mx, my);
    return k && k.typ === 'verkauf';
  }
}
