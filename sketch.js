// sketch.js – Hauptdatei: p5.js Einstiegspunkt, Skalierung, Szenen-Verwaltung und Eingabe

// ─────────────────────────────────────────────────────────────────────────────
// Globale Skalierungs-Variablen (für Vollbild-Unterstützung)
// ─────────────────────────────────────────────────────────────────────────────
let SKF = 1; // Skalierungsfaktor: wie stark das 960×640-Spielfeld gestreckt wird
let SKX = 0; // Horizontaler Versatz zum Zentrieren des Spiels im Fenster
let SKY = 0; // Vertikaler Versatz zum Zentrieren des Spiels im Fenster

function skMx() { return (mouseX - SKX) / SKF; } // Maus-X in Spielkoordinaten umrechnen
function skMy() { return (mouseY - SKY) / SKF; } // Maus-Y in Spielkoordinaten umrechnen

// ─────────────────────────────────────────────────────────────────────────────
// Zentraler Spielzustand
// ─────────────────────────────────────────────────────────────────────────────
let gs = { // Globales Zustandsobjekt (gs = "game state")
  szene:               'menu',  // Aktuelle Szene
  level:               1,       // Ausgewähltes Level (1-3)
  leben:               20,      // Verbleibende Leben
  muenzen:             150,     // Aktuelle Münzen
  welle:               0,       // Nummer der aktuellen Welle
  maxWellen:           8,       // Maximale Wellen im Level
  welleAktiv:          false,   // True wenn Welle läuft
  geschwindigkeit:     1,       // Spielgeschwindigkeit (1 oder 2)
  pausiert:            false,   // True wenn pausiert
  ausgewaehlteTurmTyp: null,    // Turmtyp zum Platzieren
  angeklickterTurm:    null,    // Ausgewählter platzierter Turm
  tuerme:              [],      // Liste platzierter Türme
  gegner:              [],      // Liste aktiver Gegner
  punkte:              0,       // Aktuelle Punktzahl
  ballonsGeknallt:     0,       // Geplatzter Ballons gesamt
  wellenBonus:         0,       // Wellenbonus (für Anzeige)
  pfad:                [],      // Wegpunkte des Pfades
  // Manager-Objekte (werden in setup() erstellt)
  highscoreManager: null, // Highscore-System
  einstellungen:    null, // Einstellungs-Manager (NEU)
  sound:            null, // Sound-Manager (NEU)
  upgrades:         null, // Upgrade-Manager (NEU)
  wirtschaft:       null, // Wirtschafts-Manager
  wellenManager:    null, // Wellen-Manager
  ui:               null, // UI-Manager
  spielSzene:       null, // Spiel-Szene
  menuSzene:        null, // Menü-Szene
  platzierungGueltig: function(mx, my) { // Prüft ob Turmposition gültig
    return this.spielSzene ? this.spielSzene.platzierungGueltig(mx, my) : false; // Delegieren
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Slider-Zustand (für Einstellungen-Bildschirm)
// ─────────────────────────────────────────────────────────────────────────────
let _aktiverSlider = null; // Welcher Einstellungs-Slider gerade gezogen wird

// ─────────────────────────────────────────────────────────────────────────────
// p5.js Hauptfunktionen
// ─────────────────────────────────────────────────────────────────────────────

function setup() { // p5.js: wird einmal beim Programmstart aufgerufen
  let cnv = createCanvas(windowWidth, windowHeight); // Canvas auf Fenstergröße setzen
  cnv.parent(document.body); // Canvas zum Body hinzufügen
  frameRate(60); // Ziel-Framerate 60fps
  textFont('monospace'); // Monospace-Schriftart setzen
  _berechneSkalierung(); // Skalierungsfaktor für aktuelle Fenstergröße berechnen
  // Manager in der richtigen Reihenfolge erstellen
  gs.highscoreManager = new HighscoreManager(); // Highscore-System
  gs.einstellungen    = new EinstellungsManager(); // Einstellungen-Manager erstellen
  gs.sound            = new SoundManager(gs.einstellungen); // Sound-Manager mit Einstellungen
  gs.upgrades         = new UpgradeManager(); // Upgrade-Manager erstellen
  gs.wirtschaft       = new EconomyManager(gs); // Wirtschafts-Manager
  gs.wellenManager    = new WellenManager(gs);  // Wellen-Manager
  gs.spielSzene       = new SpielSzene(gs);     // Spiel-Szene
  gs.menuSzene        = new MenuSzene(gs);      // Menü-Szene
  gs.ui               = new UIManager(gs);      // UI-Manager
  // Globale Buffer für Inter-System-Kommunikation initialisieren
  window._neueGegnerBuffer        = []; // Puffer für neue Gegner aus dem Schichten-System
  window._neueStellvertreterBuffer = []; // Puffer für Stellvertreter-Türme
  window._saeurewolkenBuffer       = []; // Puffer für Säure-Wolken
}

function windowResized() { // p5.js: wird aufgerufen wenn das Browserfenster geändert wird
  resizeCanvas(windowWidth, windowHeight); // Canvas auf neue Fenstergröße anpassen
  _berechneSkalierung(); // Skalierungsfaktor neu berechnen
}

function _berechneSkalierung() { // Berechnet Skalierungsfaktor und Versatz für Vollbild
  SKF = min(windowWidth / 960, windowHeight / 640); // Kleinster Faktor (kein Abschneiden)
  SKX = (windowWidth  - 960 * SKF) / 2; // Horizontalen Versatz zum Zentrieren berechnen
  SKY = (windowHeight - 640 * SKF) / 2; // Vertikalen Versatz zum Zentrieren berechnen
}

function draw() { // p5.js: wird jeden Frame aufgerufen (~60 mal/Sekunde)
  background(8, 8, 20); // Äußerer Hintergrund (sichtbar bei nicht-16:9-Fenstern)
  push(); // p5.js Zustand sichern
  translate(SKX, SKY); // Spielbereich im Fenster zentrieren
  scale(SKF); // Spielbereich auf Fenstergröße skalieren
  switch (gs.szene) { // Je nach Szene anders rendern
    case 'menu': // Hauptmenü
      gs.menuSzene.drawMenu(); // Hauptmenü zeichnen
      break;
    case 'levelSelect': // Level-Auswahl
      gs.menuSzene.drawLevelSelect(); // Level-Auswahl zeichnen
      break;
    case 'einstellungen': // Einstellungs-Bildschirm (NEU)
      gs.menuSzene.drawEinstellungen(); // Einstellungen zeichnen
      break;
    case 'upgrades': // Upgrade-Bildschirm (NEU)
      gs.menuSzene.drawUpgrades(); // Upgrades zeichnen
      break;
    case 'bestenliste': // Bestenlisten-Bildschirm (NEU)
      gs.menuSzene.drawBestenliste(); // Bestenliste zeichnen
      break;
    case 'spiel': // Spielszene
      background(30, 30, 50); // Spielhintergrund
      gs.spielSzene.update(); // Spiellogik aktualisieren
      gs.spielSzene.draw(); // Spielfeld zeichnen
      gs.ui.draw(); // UI zeichnen
      break;
    case 'gameOver': // Niederlage
      background(30, 30, 50);
      gs.spielSzene.draw(); // Spielfeld im Hintergrund (eingefroren)
      gs.ui.draw();
      gs.menuSzene.drawGameOver(); // Overlay zeichnen
      break;
    case 'sieg': // Sieg
      background(30, 30, 50);
      gs.spielSzene.draw();
      gs.ui.draw();
      gs.menuSzene.drawSieg(); // Overlay zeichnen
      break;
  }
  pop(); // p5.js Zustand wiederherstellen
}

// ─────────────────────────────────────────────────────────────────────────────
// Eingabe-Verarbeitung
// ─────────────────────────────────────────────────────────────────────────────

function mousePressed() { // p5.js: bei jedem Mausklick aufgerufen
  gs.sound.aktivieren(); // Audio-Kontext nach erster Interaktion starten
  let mx = skMx(); // Maus-X in Spielkoordinaten
  let my = skMy(); // Maus-Y in Spielkoordinaten

  // ── Hauptmenü ──────────────────────────────────────────────────────────────
  if (gs.szene === 'menu') { // Im Hauptmenü
    gs.sound.menuKlick(); // Klick-Sound
    if (gs.menuSzene.isMenuSpielen(mx, my))       { gs.szene = 'levelSelect';    } // Spielen geklickt
    if (gs.menuSzene.isMenuEinstellungen(mx, my)) { gs.szene = 'einstellungen';  } // Einstellungen geklickt
    if (gs.menuSzene.isMenuUpgrades(mx, my))      { gs.szene = 'upgrades';       } // Upgrades geklickt
    if (gs.menuSzene.isMenuBestenliste(mx, my))   { gs.szene = 'bestenliste';    } // Bestenliste geklickt
    return;
  }

  // ── Level-Auswahl ──────────────────────────────────────────────────────────
  if (gs.szene === 'levelSelect') { // In der Level-Auswahl
    let level = gs.menuSzene.getLevelKlick(mx, my); // Level-Button geklickt?
    if (level) { // Level ausgewählt?
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(level); // Level direkt starten
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isZurueckKlick(mx, my)) { // Zurück-Button
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Einstellungen (NEU) ────────────────────────────────────────────────────
  if (gs.szene === 'einstellungen') { // Im Einstellungs-Bildschirm
    gs.menuSzene.einstellungenKlick(mx, my); // Klick an Einstellungen delegieren
    if (gs.menuSzene.isZurueckKlick(mx, my)) { // Zurück-Button
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Upgrades (NEU) ─────────────────────────────────────────────────────────
  if (gs.szene === 'upgrades') { // Im Upgrade-Bildschirm
    gs.upgrades.upgradeKlick(mx, my); // Klick an Upgrade-Manager delegieren
    if (!gs.upgrades.bestaetigungsDialog && gs.menuSzene.isZurueckKlick(mx, my)) { // Zurück (wenn kein Dialog)
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Bestenliste (NEU) ──────────────────────────────────────────────────────
  if (gs.szene === 'bestenliste') { // Im Bestenlisten-Bildschirm
    if (gs.menuSzene.isZurueckKlick(mx, my)) { // Zurück-Button
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Game Over ──────────────────────────────────────────────────────────────
  if (gs.szene === 'gameOver') { // Im Game-Over-Bildschirm
    if (gs.menuSzene.isRetryKlick(mx, my)) { // Nochmal versuchen
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(gs.level);
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isMenuBtnGameOver(mx, my)) { // Zum Menü
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Sieg ───────────────────────────────────────────────────────────────────
  if (gs.szene === 'sieg') { // Im Sieg-Bildschirm
    if (gs.menuSzene.isNaechstesLevelKlick(mx, my) && gs.level < 3) { // Nächstes Level
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(gs.level + 1);
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isLevelAuswahlSiegKlick(mx, my)) { // Level-Auswahl
      gs.sound.menuKlick();
      gs.szene = 'levelSelect';
    }
    return;
  }

  // ── Spielszene ─────────────────────────────────────────────────────────────
  if (gs.szene === 'spiel') { // Im Spielmodus
    if (gs.pausiert) return; // Bei Pause keine Eingaben
    if (gs.ui.isNaechsteWelleKlick(mx, my)) { // Nächste-Welle-Button
      if (!gs.welleAktiv && gs.welle < gs.maxWellen) {
        gs.spielSzene.naechsteWelleStarten();
      }
      return;
    }
    if (gs.ui.isZweiXKlick(mx, my)) { // 2x-Geschwindigkeit-Button
      gs.geschwindigkeit = gs.geschwindigkeit === 1 ? 2 : 1;
      return;
    }
    let shopTyp = gs.ui.getShopKlick(mx, my); // Shop-Klick prüfen
    if (shopTyp) { // Turm-Typ aus Shop geklickt
      if (gs.ausgewaehlteTurmTyp === shopTyp) { // Selber Typ: Auswahl aufheben
        gs.ausgewaehlteTurmTyp = null;
      } else { // Neuer Typ auswählen
        let kosten = gs.wirtschaft.turmKosten(shopTyp); // Kosten mit Rabatt berechnen
        if (gs.wirtschaft.kannKaufen(kosten)) {
          gs.ausgewaehlteTurmTyp = shopTyp;
        }
      }
      return;
    }
    if (gs.angeklickterTurm) { // Upgrade-Panel-Klick prüfen
      let klick = gs.ui.getUpgradePanelKlick(mx, my);
      if (klick) {
        if (klick.typ === 'pfad') { // Pfad gewählt
          gs.spielSzene.turmUpgraden(gs.angeklickterTurm, klick.pfad);
        } else if (klick.typ === 'upgrade') { // Nächstes Upgrade kaufen
          gs.spielSzene.turmUpgraden(gs.angeklickterTurm);
        } else if (klick.typ === 'verkauf') { // Turm verkaufen
          gs.spielSzene.turmVerkaufen(gs.angeklickterTurm);
        }
        return;
      }
    }
    if (mx < 740 && my > 50) { // Klick im Spielfeld
      if (gs.ausgewaehlteTurmTyp) { // Turm platzieren
        gs.spielSzene.turmPlatzieren(mx, my);
      } else { // Turm anklicken
        gs.angeklickterTurm = null;
        gs.tuerme.forEach(t => t.ausgewaehlt = false);
        gs.spielSzene.turmAnklicken(mx, my);
      }
    }
  }
}

function mouseDragged() { // p5.js: wird aufgerufen während die Maus bei gedrückter Taste bewegt wird
  if (gs.szene !== 'einstellungen') return; // Nur im Einstellungs-Bildschirm
  gs.menuSzene.sliderDraggen(skMx(), skMy()); // Slider-Dragging an Menü-Szene delegieren
}

function mouseReleased() { // p5.js: wird aufgerufen wenn die Maustaste losgelassen wird
  _aktiverSlider = null; // Aktiven Slider freigeben
  if (gs.menuSzene) gs.menuSzene.sliderLoslassen(); // Slider-Zustand zurücksetzen
}

function keyPressed() { // p5.js: bei jedem Tastendruck aufgerufen
  if (key === ' ' || keyCode === 32) { // Leertaste
    if (gs.szene === 'spiel' && !gs.welleAktiv && gs.welle < gs.maxWellen) {
      gs.spielSzene.naechsteWelleStarten();
    }
    return false; // Browser-Scrollen durch Leertaste verhindern
  }
  if (keyCode === ESCAPE) { // Escape-Taste
    if (gs.szene === 'spiel') {
      if (gs.ausgewaehlteTurmTyp) {
        gs.ausgewaehlteTurmTyp = null; // Turmauswahl abbrechen
      } else if (gs.angeklickterTurm) {
        gs.angeklickterTurm = null; // Turmauswahl aufheben
        gs.tuerme.forEach(t => t.ausgewaehlt = false);
      } else {
        gs.pausiert = !gs.pausiert; // Pause umschalten
      }
    } else if (['levelSelect', 'einstellungen', 'upgrades', 'bestenliste'].includes(gs.szene)) {
      if (gs.upgrades && gs.upgrades.bestaetigungsDialog) { // Dialog offen?
        gs.upgrades.bestaetigungsDialog = null; // Dialog schließen
      } else {
        gs.szene = 'menu'; // Zurück zum Menü
      }
    }
  }
  if ((key === 'r' || key === 'R') && (gs.szene === 'spiel' || gs.szene === 'gameOver')) { // R = Neustart
    gs.spielSzene.levelStarten(gs.level);
    gs.szene = 'spiel';
  }
}

function mouseWheel(event) { // Mausrad: Shop scrollen wenn Maus über dem Panel ist
  if (gs.szene === 'spiel' && gs.ui && skMx() > 740) { // Nur im Spiel über dem Shop-Panel
    gs.ui.shopScroll(event.delta); // Scroll-Event an UI-Manager weitergeben
    return false; // Standard-Scroll verhindern
  }
}

function touchStarted() { // Touchscreen-Unterstützung: behandelt wie Mausklick
  mousePressed(); // Mausklick-Logik aufrufen
  return false; // Standard-Touch-Verhalten unterdrücken
}
