// menuScene.js – Zeichnet alle Menü-Bildschirme: Hauptmenü, Level-Auswahl, Einstellungen,
//               Upgrades, Bestenliste, Game-Over, Sieg

class MenuSzene { // Klasse für alle Menü-Bildschirme
  constructor(spielZustand) { // Konstruktor
    this.gs = spielZustand; // Spielzustand-Referenz
    this.ballons = []; // Hintergrund-Dekorationsballons
    this._hintergrundBallonsErstellen(); // Ballons erstellen
    this.animationsTimer = 0; // Timer für Animationen
    // Hauptmenü-Buttons (4 Stück, vertikal angeordnet)
    this.menuBtns = { // Alle Hauptmenü-Buttons
      spielen:       { x: 340, y: 265, b: 280, h: 52 }, // Spielen-Button
      levelWaehlen:  { x: 340, y: 327, b: 280, h: 52 }, // Level-Auswahl
      einstellungen: { x: 340, y: 389, b: 280, h: 52 }, // Einstellungen-Button
      upgrades:      { x: 340, y: 451, b: 280, h: 52 }, // Upgrades-Button
      bestenliste:   { x: 340, y: 513, b: 280, h: 52 }  // Bestenliste-Button
    };
    // Level-Auswahl-Buttons
    this.levelBtns = [ // Level 1, 2, 3
      { x: 130, y: 200, b: 200, h: 260, level: 1 }, // Level 1
      { x: 380, y: 200, b: 200, h: 260, level: 2 }, // Level 2
      { x: 630, y: 200, b: 200, h: 260, level: 3 }  // Level 3
    ];
    this.zurueckBtn = { x: 380, y: 555, b: 200, h: 45 }; // Zurück-Button für alle Submenüs
    // Einstellungen-Slider-Zustand
    this.sliderAktiv = false; // Wird gerade ein Slider gezogen?
    this.einstellungenGespeichertTimer = 0; // Timer für "Gespeichert"-Feedback
  }

  // ─── Hintergrundballons ────────────────────────────────────────────────────

  _hintergrundBallonsErstellen() { // 15 animierte Deko-Ballons erstellen
    for (let i = 0; i < 15; i++) { // 15 Ballons
      this.ballons.push({ // Ballon-Objekt
        x: random(960), // Zufällige X-Startposition
        y: random(640) + 640, // Startet unter dem Bildschirm
        farbe: random(['rot', 'blau', 'gruen', 'gelb']), // Zufällige Farbe
        geschwindigkeit: random(0.5, 2.0), // Driftgeschwindigkeit
        wackel: random(TWO_PI), // Start-Wackelwinkel
        wackelGeschw: random(0.01, 0.04), // Wackelgeschwindigkeit
        groesse: random(20, 45) // Zufällige Größe
      });
    }
  }

  _hintergrundBallonsUpdaten() { // Deko-Ballons animieren
    for (let b of this.ballons) { // Jeden Ballon
      b.y -= b.geschwindigkeit; // Nach oben driften
      b.wackel += b.wackelGeschw; // Wackelwinkel erhöhen
      b.x += sin(b.wackel) * 0.8; // Seitlich wackeln
      if (b.y < -60) { b.y = 700; b.x = random(960); } // Von unten wieder starten
    }
  }

  _hintergrundBallonsZeichnen() { // Deko-Ballons zeichnen
    for (let b of this.ballons) { // Jeden Ballon zeichnen
      let f = BALLON_FARBEN[b.farbe]; // Farbe holen
      push(); // Zustand sichern
      translate(b.x, b.y); // Zur Ballon-Position
      noStroke(); fill(f[0], f[1], f[2], 110); ellipse(0, 0, b.groesse, b.groesse * 1.1); // Ballon-Körper
      fill(255, 255, 255, 35); ellipse(-b.groesse * 0.15, -b.groesse * 0.2, b.groesse * 0.35, b.groesse * 0.25); // Glanzpunkt
      stroke(max(0,f[0]-50), max(0,f[1]-50), max(0,f[2]-50), 110); strokeWeight(1.5); // Kontur
      line(0, b.groesse * 0.55, 0, b.groesse * 0.55 + 14); // Faden
      pop(); // Zustand wiederherstellen
    }
  }

  _menuHintergrundZeichnen() { // Gemeinsamer Hintergrund für alle Menü-Screens
    this._hintergrundBallonsUpdaten(); // Ballons bewegen
    this.animationsTimer += 0.02; // Timer erhöhen
    for (let y = 0; y < 640; y += 4) { // Gradient-Hintergrund
      let a = y / 640; // Anteil (0 = oben, 1 = unten)
      stroke(lerp(8,35,a), lerp(8,8,a), lerp(38,65,a)); // Dunkelblau → Violett
      strokeWeight(4); line(0, y, 960, y); // Horizontale Linie
    }
    this._hintergrundBallonsZeichnen(); // Ballons über Hintergrund
  }

  _menuTitel() { // Spiel-Titel zeichnen (oben im Hauptmenü)
    noStroke(); fill(255, 200, 50, 18 + sin(this.animationsTimer) * 10); // Pulsierender Schimmer
    rect(80, 55, 800, 185, 18); // Hintergrunds-Panel für Titel
    textAlign(CENTER, CENTER); fill(255, 230, 80); textSize(58); textStyle(BOLD); // Goldgelb, Groß
    text('Lehrer vs. Schüler', 480, 128); textStyle(NORMAL); // Haupttitel
    fill(175, 175, 215); textSize(20); // Untertitel
    text('Tower Defense – Schule mal anders!', 480, 185); // Untertitel-Text
    stroke(255, 200, 50, 140); strokeWeight(2); line(180, 218, 780, 218); // Goldene Trennlinie
  }

  _menuButton(key, label, farbe) { // Einen Hauptmenü-Button zeichnen
    let btn = this.menuBtns[key]; // Button-Daten holen
    let hover = skMx() >= btn.x && skMx() <= btn.x+btn.b && skMy() >= btn.y && skMy() <= btn.y+btn.h; // Hover
    fill(hover ? color(farbe[0]+20, farbe[1]+20, farbe[2]+20) : color(farbe[0], farbe[1], farbe[2])); // Farbe
    stroke(farbe[0]+50, farbe[1]+50, farbe[2]+50); strokeWeight(2); // Kontur
    rect(btn.x, btn.y, btn.b, btn.h, 10); // Button-Rechteck
    noStroke(); fill(hover ? 255 : 230); // Weißer Text
    textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD); // Schrift
    text(label, btn.x + btn.b/2, btn.y + btn.h/2); textStyle(NORMAL); // Button-Text
  }

  _zurueckButton() { // Zurück-Button zeichnen (in allen Submenüs)
    let btn = this.zurueckBtn; // Button-Daten
    let hover = skMx() >= btn.x && skMx() <= btn.x+btn.b && skMy() >= btn.y && skMy() <= btn.y+btn.h; // Hover
    fill(hover ? color(90,90,130) : color(55,55,80)); // Grau mit Hover-Effekt
    stroke(90, 90, 130); strokeWeight(1.5); rect(btn.x, btn.y, btn.b, btn.h, 8); // Button
    noStroke(); fill(200, 200, 220); textAlign(CENTER, CENTER); textSize(15); // Text-Style
    textStyle(BOLD); text(T('zurueckZumMenue'), btn.x+btn.b/2, btn.y+btn.h/2); textStyle(NORMAL); // Text
  }

  _submenüTitel(titel) { // Überschrift für Unterseiten zeichnen
    textAlign(CENTER, TOP); fill(255, 230, 80); textSize(44); textStyle(BOLD); // Goldgelb
    text(titel, 480, 55); textStyle(NORMAL); // Titel anzeigen
    stroke(255, 200, 50, 140); strokeWeight(2); line(150, 115, 810, 115); // Trennlinie
  }

  // ─── Hauptmenü ────────────────────────────────────────────────────────────

  drawMenu() { // Hauptmenü zeichnen
    this._menuHintergrundZeichnen(); // Hintergrund
    this._menuTitel(); // Spieltitel
    // Gesamtmünzen-Anzeige (persistenter Counter)
    noStroke(); fill(255, 215, 0); textAlign(RIGHT, TOP); textSize(15); // Gold
    text('🪙 Gesamt: ' + (gs.upgrades ? gs.upgrades.daten.gesamtMuenzen : 0), 950, 10); // Anzeige
    // 4 Hauptmenü-Buttons
    this._menuButton('spielen',       '▶ ' + T('spielen'),        [45, 165, 65]); // Grüner Spielen-Button
    this._menuButton('einstellungen', '⚙ ' + T('einstellungen'),  [55, 85, 160]); // Blauer Einstellungen-Button
    this._menuButton('upgrades',      '⬆ ' + T('upgrades'),       [155, 100, 40]); // Oranger Upgrades-Button
    this._menuButton('bestenliste',   '🏆 ' + T('bestenliste'),   [80, 55, 130]); // Violetter Bestenliste-Button
    // Kleine Steuerungs-Hilfe
    noStroke(); fill(110, 110, 155); textSize(11); textAlign(CENTER, BOTTOM); // Grau, klein
    text('[Space] Welle  |  [Esc] Pause  |  [R] Neustart', 480, 636); // Hinweis
  }

  // ─── Level-Auswahl ────────────────────────────────────────────────────────

  drawLevelSelect() { // Level-Auswahl zeichnen
    this._menuHintergrundZeichnen(); // Hintergrund
    this._submenüTitel(T('levelWaehlen')); // Überschrift
    for (let btn of this.levelBtns) this._levelButtonZeichnen(btn); // Alle Level-Buttons
    this._zurueckButton(); // Zurück-Button
  }

  _levelButtonZeichnen(btn) { // Einen Level-Button zeichnen
    let frei = this.gs.highscoreManager.levelFreigeschaltet(btn.level); // Freigeschaltet?
    let mx = skMx(), my = skMy(); // Mausposition
    let hover = frei && mx >= btn.x && mx <= btn.x+btn.b && my >= btn.y && my <= btn.y+btn.h; // Hover
    let scores = this.gs.highscoreManager.getScores(btn.level); // Scores
    // Button-Hintergrund
    fill(!frei ? color(28,28,48) : hover ? color(48,78,158) : color(32,42,98)); // Farbe je Status
    stroke(!frei ? color(48,48,68) : hover ? color(98,148,255) : color(65,88,158)); strokeWeight(2); // Kontur
    rect(btn.x, btn.y, btn.b, btn.h, 12); // Button-Rechteck
    noStroke(); // Kein Strich für Text
    // Level-Nummer
    fill(frei ? color(255,230,80) : color(75,75,95)); // Gold oder Grau
    textAlign(CENTER, TOP); textSize(36); textStyle(BOLD); // Schrift
    text(frei ? btn.level : '🔒', btn.x+btn.b/2, btn.y+16); textStyle(NORMAL); // Zahl oder Schloss
    // Level-Name und Infos
    let namen = ['Der Flur', 'Die Mensa', 'Der Schulhof']; // Level-Namen
    let schwierigkeit = ['Einfach', 'Mittel', 'Schwer']; // Schwierigkeiten
    let wellen = [8, 12, 15]; // Wellen je Level
    let schwFarben = [[80,210,90],[240,190,40],[210,70,70]]; // Farben je Schwierigkeit
    let sf = schwFarben[btn.level-1]; // Farbe für dieses Level
    fill(frei ? color(195,215,255) : color(65,65,85)); textSize(15); textAlign(CENTER, TOP);
    text(namen[btn.level-1], btn.x+btn.b/2, btn.y+68); // Level-Name
    fill(frei ? color(sf[0],sf[1],sf[2]) : color(55,55,75)); textSize(12);
    text(schwierigkeit[btn.level-1], btn.x+btn.b/2, btn.y+92); // Schwierigkeit
    fill(frei ? color(145,165,215) : color(55,55,75));
    text(wellen[btn.level-1] + ' Wellen', btn.x+btn.b/2, btn.y+112); // Wellenanzahl
    // Upgrade-Boni anzeigen (Startmünzen/Leben aus permanenten Upgrades)
    if (frei && gs.upgrades) { // Upgrades vorhanden und Level freigeschaltet?
      let boniText = []; // Bonus-Texte sammeln
      let sm = gs.upgrades.getStartMuenzen(); // Extra-Startmünzen
      let sl = gs.upgrades.getStartLeben(); // Extra-Startleben
      if (sm > 0) boniText.push('+🪙' + sm); // Münzen-Bonus hinzufügen
      if (sl > 0) boniText.push('+❤️' + sl); // Leben-Bonus hinzufügen
      if (boniText.length > 0) { // Boni vorhanden?
        fill(80, 200, 120); textSize(11); // Grüne Schrift für Boni
        text(boniText.join(' '), btn.x+btn.b/2, btn.y+135); // Boni anzeigen
      }
    }
    // Bester Score
    if (frei && scores.length > 0) { // Score vorhanden?
      fill(255, 215, 0); textSize(11); // Gold
      text('Best: ' + scores[0].punkte + ' ' + T('pkt'), btn.x+btn.b/2, btn.y+155); // Bestpunktzahl
    }
    // Abschluss-Checkmark
    if (frei && scores.length > 0) { // Abgeschlossen?
      fill(80, 220, 100); noStroke(); textSize(16); textAlign(LEFT, TOP); // Grün
      text('✓', btn.x+8, btn.y+8); // Häkchen
    }
  }

  // ─── Einstellungen ────────────────────────────────────────────────────────

  drawEinstellungen() { // Einstellungs-Bildschirm zeichnen
    this._menuHintergrundZeichnen(); // Hintergrund
    this._submenüTitel(T('einstellungen')); // Überschrift
    let eins = this.gs.einstellungen; // Einstellungen-Manager
    let cx = 480; // Mittel-X
    let y = 145; // Start-Y
    // ── Lautstärke-Slider ──────────────────────────────────────────────────
    noStroke(); fill(190, 190, 230); textAlign(LEFT, CENTER); textSize(18); // Label
    text(T('lautstaerke'), 200, y); // Label anzeigen
    let vol = eins.get('lautstaerke'); // Aktueller Wert (0-100)
    this._sliderZeichnen(280, y, 400, 22, vol, 0, 100, 'lautstaerke'); // Slider zeichnen
    fill(255, 215, 0); textAlign(RIGHT, CENTER); textSize(16); // Wert-Anzeige
    text(vol + '%', 755, y); // Prozentzahl
    y += 80; // Nächste Zeile
    // ── Soundeffekte Toggle ────────────────────────────────────────────────
    fill(190, 190, 230); textAlign(LEFT, CENTER); textSize(18);
    text(T('soundEffekte'), 200, y); // Label
    this._toggleZeichnen(640, y, eins.get('soundEin'), 'soundEin'); // Toggle zeichnen
    y += 80; // Nächste Zeile
    // ── Musik Toggle ──────────────────────────────────────────────────────
    fill(190, 190, 230); textAlign(LEFT, CENTER); textSize(18);
    text(T('musik'), 200, y); // Label
    this._toggleZeichnen(640, y, eins.get('musikEin'), 'musikEin'); // Toggle zeichnen
    y += 80; // Nächste Zeile
    // ── Sprache Toggle ────────────────────────────────────────────────────
    fill(190, 190, 230); textAlign(LEFT, CENTER); textSize(18);
    text(T('sprache'), 200, y); // Label
    this._spracheButtonsZeichnen(y); // Sprache-Auswahl zeichnen
    y += 80; // Nächste Zeile
    // ── Gespeichert-Feedback ──────────────────────────────────────────────
    if (this.einstellungenGespeichertTimer > 0) { // Feedback anzeigen?
      this.einstellungenGespeichertTimer--; // Timer herunterzählen
      let alpha = min(255, this.einstellungenGespeichertTimer * 8); // Transparenz
      fill(100, 220, 100, alpha); textAlign(CENTER, CENTER); textSize(16); // Grün
      text(T('speichernOk'), cx, y); // "Gespeichert"-Text
    }
    this._zurueckButton(); // Zurück-Button
  }

  _sliderZeichnen(x, y, breite, hoehe, wert, min_, max_, schluessel) { // Slider zeichnen
    let anteil = (wert - min_) / (max_ - min_); // Anteil (0-1)
    let handleX = x + anteil * breite; // Handle-Position berechnen
    // Schiene
    fill(45, 45, 70); noStroke(); rect(x, y - hoehe/2, breite, hoehe, hoehe/2); // Hintergrund-Schiene
    fill(80, 130, 220); rect(x, y - hoehe/2, anteil * breite, hoehe, hoehe/2); // Gefüllter Teil
    // Handle
    let isHover = abs(skMx() - handleX) < 14 && abs(skMy() - y) < 16; // Handle-Hover?
    fill(isHover || (this.aktiverSliderKey === schluessel) ? color(255,255,255) : color(200,220,255)); // Farbe
    noStroke(); ellipse(handleX, y, 22, 22); // Runder Handle
    // Speichern der aktiven Slider-Info für Dragging
    if (!this.aktiverSliderInfo) this.aktiverSliderInfo = {}; // Info-Objekt erstellen
    this.aktiverSliderInfo[schluessel] = { x: x, breite: breite, min: min_, max: max_ }; // Slider-Daten
  }

  _toggleZeichnen(x, y, aktiv, schluessel) { // An/Aus-Toggle zeichnen
    let breite = 80, hoehe = 32; // Größe des Toggles
    // Hintergrund
    fill(aktiv ? color(50, 150, 80) : color(50, 50, 70)); noStroke(); // Grün wenn an, grau wenn aus
    rect(x, y - hoehe/2, breite, hoehe, hoehe/2); // Toggle-Schiene
    // Handle
    let handleX = aktiv ? x + breite - hoehe/2 : x + hoehe/2; // Handle-Position (links=aus, rechts=an)
    fill(255); ellipse(handleX, y, hoehe - 6, hoehe - 6); // Weißer runder Handle
    // Label
    fill(aktiv ? color(200, 255, 200) : color(150, 150, 180)); textAlign(LEFT, CENTER); textSize(14); // Text
    text(aktiv ? T('an') : T('aus'), x + breite + 12, y); // An/Aus-Text
    // Klick-Detektion (im Toggle-Bereich)
    if (!this.toggleKlickInfo) this.toggleKlickInfo = {}; // Info-Objekt
    this.toggleKlickInfo[schluessel] = { x: x, y: y, b: breite, h: hoehe }; // Klick-Bereich speichern
  }

  _spracheButtonsZeichnen(y) { // Sprache-Auswahl (zwei Buttons) zeichnen
    let sprache = this.gs.einstellungen.get('sprache'); // Aktuelle Sprache
    // Deutsch-Button
    let deAktiv = sprache === 'de'; // Aktiv wenn Deutsch eingestellt
    fill(deAktiv ? color(80,130,220) : color(40,40,70)); stroke(80, 120, 200); strokeWeight(1.5); // Farbe
    rect(450, y - 20, 100, 38, 8); // Button
    noStroke(); fill(deAktiv ? 255 : 150); textAlign(CENTER, CENTER); textSize(14); textStyle(BOLD); // Text
    text(T('deutsch'), 500, y); textStyle(NORMAL); // "Deutsch"
    // Englisch-Button
    let enAktiv = sprache === 'en'; // Aktiv wenn Englisch eingestellt
    fill(enAktiv ? color(80,130,220) : color(40,40,70)); stroke(80, 120, 200); strokeWeight(1.5); // Farbe
    rect(560, y - 20, 110, 38, 8); // Button
    noStroke(); fill(enAktiv ? 255 : 150); textAlign(CENTER, CENTER); textSize(14); textStyle(BOLD); // Text
    text(T('englisch'), 615, y); textStyle(NORMAL); // "Englisch"
    // Klick-Bereich speichern für einstellungenKlick()
    this._spracheY = y; // Y-Position merken
  }

  einstellungenKlick(mx, my) { // Klick im Einstellungs-Bildschirm verarbeiten
    let eins = this.gs.einstellungen; // Einstellungen-Manager
    let y = 145; // Startposition der Elemente (muss mit drawEinstellungen übereinstimmen)
    // Slider-Bereich prüfen (Lautstärke)
    let sliderInfo = this.aktiverSliderInfo && this.aktiverSliderInfo['lautstaerke'];
    if (sliderInfo && my >= y - 20 && my <= y + 20) { // Im Lautstärke-Bereich?
      this.aktiverSliderKey = 'lautstaerke'; // Aktiven Slider merken
      this._sliderWertSetzen(mx, sliderInfo); // Wert berechnen und setzen
      this.einstellungenGespeichertTimer = 50; // Gespeichert-Feedback zeigen
    }
    y += 80; // Nächste Zeile: Soundeffekte-Toggle
    if (this.toggleKlickInfo && this.toggleKlickInfo['soundEin']) { // Toggle-Bereich vorhanden?
      let t = this.toggleKlickInfo['soundEin']; // Toggle-Info
      if (mx >= t.x && mx <= t.x+t.b+40 && my >= t.y-t.h/2-5 && my <= t.y+t.h/2+5) { // Geklickt?
        eins.set('soundEin', !eins.get('soundEin')); // Umschalten
        this.einstellungenGespeichertTimer = 50; // Feedback
      }
    }
    y += 80; // Nächste Zeile: Musik-Toggle
    if (this.toggleKlickInfo && this.toggleKlickInfo['musikEin']) { // Toggle vorhanden?
      let t = this.toggleKlickInfo['musikEin']; // Toggle-Info
      if (mx >= t.x && mx <= t.x+t.b+40 && my >= t.y-t.h/2-5 && my <= t.y+t.h/2+5) { // Geklickt?
        eins.set('musikEin', !eins.get('musikEin')); // Umschalten
        this.einstellungenGespeichertTimer = 50; // Feedback
      }
    }
    y += 80; // Nächste Zeile: Sprache
    if (this._spracheY) { // Sprache-Bereich vorhanden?
      if (mx >= 450 && mx <= 550 && my >= this._spracheY-20 && my <= this._spracheY+18) { // Deutsch?
        eins.set('sprache', 'de'); // Deutsch setzen
        this.einstellungenGespeichertTimer = 50; // Feedback
      }
      if (mx >= 560 && mx <= 670 && my >= this._spracheY-20 && my <= this._spracheY+18) { // Englisch?
        eins.set('sprache', 'en'); // Englisch setzen
        this.einstellungenGespeichertTimer = 50; // Feedback
      }
    }
  }

  sliderDraggen(mx, my) { // Slider-Dragging verarbeiten (beim Ziehen der Maus)
    if (!this.aktiverSliderKey) return; // Kein aktiver Slider: nichts tun
    let info = this.aktiverSliderInfo && this.aktiverSliderInfo[this.aktiverSliderKey]; // Slider-Info
    if (!info) return; // Keine Info: nichts tun
    this._sliderWertSetzen(mx, info); // Neuen Wert setzen
  }

  sliderLoslassen() { // Maus losgelassen: Slider-Drag beenden
    this.aktiverSliderKey = null; // Aktiven Slider freigeben
  }

  _sliderWertSetzen(mx, info) { // Slider-Wert aus Mausposition berechnen und setzen
    let anteil = constrain((mx - info.x) / info.breite, 0, 1); // Anteil berechnen (0-1, begrenzt)
    let neuerWert = Math.round(info.min + anteil * (info.max - info.min)); // Wert berechnen
    this.gs.einstellungen.set('lautstaerke', neuerWert); // Neuen Wert speichern
  }

  // ─── Upgrades ─────────────────────────────────────────────────────────────

  drawUpgrades() { // Upgrade-Bildschirm zeichnen
    this._menuHintergrundZeichnen(); // Hintergrund
    this._submenüTitel(T('upgrades')); // Überschrift
    // Verfügbare Münzen anzeigen
    noStroke(); fill(255, 215, 0); textAlign(CENTER, TOP); textSize(16); // Gold
    let verfuegbar = this.gs.upgrades.verfuegbareMuenzen(); // Verfügbare Münzen holen
    text(T('verfuegbar') + ' 🪙 ' + verfuegbar + '  (Gesamt gesammelt: ' + this.gs.upgrades.daten.gesamtMuenzen + ')', 480, 128); // Anzeige
    // Upgrade-Karten über den Upgrade-Manager zeichnen
    this.gs.upgrades.drawUpgradeScreen(); // Upgrade-Manager zeichnet die Karten
    this._zurueckButton(); // Zurück-Button
  }

  // ─── Bestenliste ──────────────────────────────────────────────────────────

  drawBestenliste() { // Bestenlisten-Bildschirm zeichnen
    this._menuHintergrundZeichnen(); // Hintergrund
    this._submenüTitel(T('bestenliste')); // Überschrift
    let levelNamen = ['Der Flur', 'Die Mensa', 'Der Schulhof']; // Level-Namen
    let levelFarben = [[80,210,90],[240,190,40],[210,70,70]]; // Farben je Level
    for (let level = 1; level <= 3; level++) { // Alle 3 Level
      let scores = this.gs.highscoreManager.getScores(level); // Scores für Level
      let lx = 85 + (level - 1) * 270; // X-Position der Spalte
      let lf = levelFarben[level-1]; // Spalten-Farbe
      // Spalten-Hintergrund
      fill(20, 20, 40, 200); noStroke(); rect(lx, 130, 250, 370, 10); // Panel
      stroke(lf[0]*0.6, lf[1]*0.6, lf[2]*0.6); strokeWeight(2); rect(lx, 130, 250, 370, 10); // Kontur
      // Level-Titel
      noStroke(); fill(lf[0], lf[1], lf[2]); textAlign(CENTER, TOP); textSize(20); textStyle(BOLD); // Farbe
      text('Level ' + level, lx+125, 145); textStyle(NORMAL); // Level-Nummer
      fill(175, 195, 230); textSize(14); text(levelNamen[level-1], lx+125, 173); // Level-Name
      stroke(lf[0]*0.4, lf[1]*0.4, lf[2]*0.4); strokeWeight(1); line(lx+20, 198, lx+230, 198); // Trennlinie
      // Scores anzeigen
      if (scores.length === 0) { // Keine Scores
        noStroke(); fill(80, 85, 110); textAlign(CENTER, TOP); textSize(13); // Grau
        text(T('nochNichtGespielt'), lx+125, 225); // Hinweis
      } else { // Scores vorhanden
        for (let i = 0; i < scores.length; i++) { // Alle Scores
          let s = scores[i]; // Score-Objekt
          let medalFarbe = [[255,215,0],[192,192,192],[180,110,50]][i]; // Gold, Silber, Bronze
          noStroke(); fill(medalFarbe[0], medalFarbe[1], medalFarbe[2]); // Medaillen-Farbe
          textAlign(LEFT, TOP); textSize(22); text(['🥇','🥈','🥉'][i], lx+20, 210+i*95); // Medaille
          fill(medalFarbe[0], medalFarbe[1], medalFarbe[2]); textSize(14); textStyle(BOLD); // Schrift
          text('#' + (i+1) + ' ' + s.punkte + ' ' + T('pkt'), lx+55, 213+i*95); textStyle(NORMAL); // Punkte
          fill(155, 160, 195); textSize(12); // Grau für Details
          text(T('welle') + ' ' + s.welle + ' · ' + s.datum, lx+55, 234+i*95); // Welle und Datum
        }
      }
    }
    this._zurueckButton(); // Zurück-Button
  }

  // ─── Game Over ────────────────────────────────────────────────────────────

  drawGameOver() { // Game-Over-Bildschirm zeichnen
    fill(0,0,0,185); noStroke(); rect(0,0,960,640); // Dunkler Overlay
    fill(55,8,8); stroke(175,48,48); strokeWeight(3); rect(220,175,520,295,16); // Rotes Panel
    noStroke(); fill(215,55,55); textAlign(CENTER,CENTER); textSize(52); textStyle(BOLD); // Titel
    text(T('niederlage'), 480, 272); textStyle(NORMAL); // Niederlage-Text
    fill(200,175,175); textSize(19); text(T('schuelerHaben'), 480, 320); // Untertitel
    fill(255,215,0); textSize(18); text(T('punkte') + ' ' + this.gs.punkte, 480, 360); // Punkte
    this._grosserButton(480, 418, 220, 44, T('nochmal'), [48,175,68]); // Retry-Button
    this._grosserButton(480, 475, 200, 40, T('menue'), [58,58,88]); // Menü-Button
  }

  // ─── Sieg ─────────────────────────────────────────────────────────────────

  drawSieg() { // Sieg-Bildschirm zeichnen
    fill(0,0,0,165); noStroke(); rect(0,0,960,640); // Overlay
    fill(38,48,8); stroke(215,175,28); strokeWeight(3); rect(175,155,610,335,16); // Goldenes Panel
    noStroke(); fill(255,228,48); textAlign(CENTER,CENTER); textSize(52); textStyle(BOLD); // Titel
    text(T('gewonnen'), 480, 250); textStyle(NORMAL); // Gewonnen-Text
    fill(195,228,195); textSize(19); text(T('alleBesiegt'), 480, 300); // Untertitel
    fill(255,215,0); textSize(17); // Goldene Info-Texte
    text(T('gesamtPunkte') + ' ' + this.gs.punkte, 480, 340); // Punkte
    text(T('ballonsGeknallt') + ' ' + this.gs.ballonsGeknallt, 480, 365); // Ballons
    text(T('level') + ' ' + this.gs.level + ' ' + T('levelAbgeschl'), 480, 390); // Level
    let nl = this.gs.level + 1; // Nächstes Level
    if (nl <= 3) this._grosserButton(480, 435, 230, 44, T('naechstesLevel') + nl, [48,128,215]); // Weiter
    this._grosserButton(480, nl <= 3 ? 490 : 435, 230, 44, T('levelAuswahl'), [58,58,88]); // Auswahl
  }

  // ─── Hilfsmethoden ────────────────────────────────────────────────────────

  _grosserButton(x, y, b, h, text_, farbe) { // Großen zentrierten Button zeichnen
    let mx = skMx(), my = skMy(); // Skalierte Mausposition
    let hover = mx >= x-b/2 && mx <= x+b/2 && my >= y-h/2 && my <= y+h/2; // Hover
    fill(hover ? color(farbe[0]+28,farbe[1]+28,farbe[2]+28) : color(farbe[0],farbe[1],farbe[2])); // Farbe
    stroke(farbe[0]+48,farbe[1]+48,farbe[2]+48); strokeWeight(2); rect(x-b/2,y-h/2,b,h,10); // Button
    noStroke(); fill(255); textAlign(CENTER,CENTER); textSize(15); textStyle(BOLD); // Text
    text(text_, x, y); textStyle(NORMAL); // Button-Text
  }

  // ─── Klick-Detektions-Methoden ────────────────────────────────────────────

  isMenuSpielen(mx, my) { // Spielen-Button geklickt?
    let b = this.menuBtns.spielen; return mx>=b.x && mx<=b.x+b.b && my>=b.y && my<=b.y+b.h;
  }
  isMenuEinstellungen(mx, my) { // Einstellungen-Button geklickt? (NEU)
    let b = this.menuBtns.einstellungen; return mx>=b.x && mx<=b.x+b.b && my>=b.y && my<=b.y+b.h;
  }
  isMenuUpgrades(mx, my) { // Upgrades-Button geklickt? (NEU)
    let b = this.menuBtns.upgrades; return mx>=b.x && mx<=b.x+b.b && my>=b.y && my<=b.y+b.h;
  }
  isMenuBestenliste(mx, my) { // Bestenliste-Button geklickt? (NEU)
    let b = this.menuBtns.bestenliste; return mx>=b.x && mx<=b.x+b.b && my>=b.y && my<=b.y+b.h;
  }
  isZurueckKlick(mx, my) { // Zurück-Button geklickt?
    let b = this.zurueckBtn; return mx>=b.x && mx<=b.x+b.b && my>=b.y && my<=b.y+b.h;
  }
  getLevelKlick(mx, my) { // Level-Button geklickt? – gibt Level-Nummer zurück
    for (let btn of this.levelBtns) {
      if (mx>=btn.x && mx<=btn.x+btn.b && my>=btn.y && my<=btn.y+btn.h) {
        if (this.gs.highscoreManager.levelFreigeschaltet(btn.level)) return btn.level;
      }
    }
    return null;
  }
  isRetryKlick(mx, my)         { return mx>=370 && mx<=590 && my>=396 && my<=440; } // Retry geklickt?
  isMenuBtnGameOver(mx, my)     { return mx>=380 && mx<=580 && my>=455 && my<=495; } // Menü im Game-Over?
  isNaechstesLevelKlick(mx, my) { return mx>=365 && mx<=595 && my>=413 && my<=457; } // Nächstes Level?
  isLevelAuswahlSiegKlick(mx, my) { // Level-Auswahl im Sieg-Screen?
    let y = (this.gs.level+1 <= 3) ? 490 : 435; // Y-Position je nach ob weiteres Level
    return mx>=365 && mx<=595 && my>=y-22 && my<=y+22;
  }
}
