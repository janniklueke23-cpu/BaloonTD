// ═══════════════════════════════════════════════════════════════════════════
// sketch.js – HERZSTÜCK DES SPIELS
// ═══════════════════════════════════════════════════════════════════════════
// Diese Datei ist der "Hauptbahnhof" des Spiels. Hier startet alles, hier
// werden alle Eingaben (Maus, Tastatur, Touch) entgegengenommen, und hier
// wird 60 Mal pro Sekunde entschieden welches Bild gerade gezeichnet wird.
// Die p5.js-Bibliothek ruft automatisch die Funktionen setup() und draw()
// auf, ohne dass wir das selbst tun müssen.
// ═══════════════════════════════════════════════════════════════════════════

// ── Skalierungs-Variablen ─────────────────────────────────────────────────
// Das Spiel ist "innen" auf einer Fläche von 960×640 Pixeln aufgebaut, kann
// aber auf jedem Bildschirm beliebig groß dargestellt werden. Diese drei
// Variablen merken sich: wie sehr muss vergrößert/verkleinert werden (SKF)
// und wie weit verschoben werden (SKX, SKY), damit alles zentriert passt.

let SKF = 1; // Skalierungs-Faktor (1 = Originalgröße, 0.5 = halb so groß, 2 = doppelt so groß)
let SKX = 0; // Verschiebung der Spielfläche nach rechts (in Pixeln auf dem echten Bildschirm)
let SKY = 0; // Verschiebung der Spielfläche nach unten (in Pixeln auf dem echten Bildschirm)

// Hilfsfunktion: rechnet die echte Mausposition (auf dem Bildschirm) zurück
// in die "Spielposition" (innerhalb der 960×640-Fläche). Notwendig, weil das
// Spiel skaliert wird – ein Klick "links oben" auf dem Bildschirm ist nicht
// unbedingt auch links oben im Spielfeld.
function skMx() { return (mouseX - SKX) / SKF; } // SKalierte Maus-X-Position
function skMy() { return (mouseY - SKY) / SKF; } // SKalierte Maus-Y-Position

// ── Zentraler Spielzustand ────────────────────────────────────────────────
// Das Objekt "gs" (= GameState/Spielzustand) hält ALLE wichtigen Informationen
// des Spiels an einem Ort. Statt diese Daten quer durch die Module zu reichen,
// können alle anderen Klassen einfach hier nachschauen oder Werte ändern.
// Vorteil: man weiß immer wo alles steht. Nachteil: globaler Zugriff, also
// muss man sorgsam sein, dass nicht zwei Stellen gleichzeitig verändern.

let gs = {
  szene:               'menu', // Aktueller Bildschirm: menu, levelSelect, spiel, gameOver, sieg, einstellungen, upgrades, bestenliste, mobileApp
  level:               1,      // Welches Level wird gerade gespielt (1-8)
  leben:               20,     // Wie viele Schüler darf der Spieler noch durchlassen, bevor er verliert
  muenzen:             150,    // Aktuelle Münzen für den Kauf von Lehrern und Upgrades (wird in levelStarten überschrieben)
  welle:               0,      // Welche Welle (Runde mit Schülern) gerade läuft
  maxWellen:           8,      // Wie viele Wellen das aktuelle Level insgesamt hat
  welleAktiv:          false,  // Läuft gerade eine Welle? (true = ja, dann darf man nicht die nächste starten)
  geschwindigkeit:     1,      // Spielgeschwindigkeit: 1 = normal, 2 = doppelt schnell (über den 2×-Button)
  pausiert:            false,  // Spiel angehalten? (über Escape)
  ausgewaehlteTurmTyp: null,   // Welcher Lehrer ist gerade im Shop angeklickt zum Platzieren (z.B. 'blech') – null wenn keiner
  angeklickterTurm:    null,   // Welcher bereits platzierte Lehrer ist gerade ausgewählt (für das Upgrade-Panel)
  fightPunkt1:         null,   // Bei Hr. Fight: speichert den ersten von zwei Klicks (Grill-Position) bis der zweite kommt
  motsiousPunkt1:      null,   // Bei Hr. Muzius: speichert den Lehrer-Standort (1. Klick) bis der Schuss-Zielpunkt (2. Klick) kommt
  tuerme:              [],     // Liste aller im Level platzierten Lehrer (Array, weil sich die Anzahl ändert)
  gegner:              [],     // Liste aller aktuell lebenden Schüler auf dem Pfad
  punkte:              0,      // Punktzahl in dieser Runde (für die Highscore-Liste)
  ballonsGeknallt:     0,      // Statistik: wie viele Schüler wurden in dieser Runde besiegt
  wellenBonus:         0,      // Letzter Wellenbonus (für die Anzeige im Popup)
  pfad:                [],     // Der Weg, den die Schüler im aktuellen Level laufen (Liste von Punkten)

  // ── Manager-Objekte (werden in setup() erst erstellt) ────────────────
  // Diese sind beim Start noch null, weil die Klassen noch nicht geladen sind.
  // In setup() werden sie dann mit "new XxxManager()" zum Leben erweckt.
  highscoreManager: null, // Verwaltet die Bestenlisten (gespeichert im Browser)
  einstellungen:    null, // Lautstärke, Sprache, Sound an/aus
  sound:            null, // Erzeugt alle Sound-Effekte (Schüsse, Klicks, etc.)
  upgrades:         null, // Permanente Meta-Upgrades, die über Runden hinweg bleiben
  wirtschaft:       null, // Münzen-Berechnungen (Belohnungen, Turmkosten)
  wellenManager:    null, // Spawnt die Schüler in der richtigen Reihenfolge
  ui:               null, // Zeichnet HUD, Shop, Upgrade-Panel
  spielSzene:       null, // Verwaltet das eigentliche Spiel (Update + Zeichnen)
  menuSzene:        null, // Verwaltet alle Menü-Bildschirme

  // Hilfsfunktion, damit andere Klassen einfach fragen können "darf ich hier
  // einen Lehrer platzieren?" ohne wissen zu müssen wie die Spielszene das
  // intern entscheidet.
  platzierungGueltig: function(mx, my) {
    return this.spielSzene ? this.spielSzene.platzierungGueltig(mx, my) : false; // Falls Spielszene existiert: fragen. Sonst: nein.
  }
};

// In JavaScript-Scripts (im Gegensatz zu Modulen) werden Variablen mit "let"
// NICHT automatisch ans window-Objekt gehängt. Andere Dateien wie peTeacher.js
// greifen aber über window.gs auf den Spielzustand zu. Deshalb hier explizit
// zuweisen. Sonst wäre window.gs undefined und z.B. Pfingsten würde nicht
// funktionieren (war wirklich ein Bug bevor diese Zeile eingebaut wurde).
window.gs = gs; // Spielzustand global verfügbar machen

let _aktiverSlider = null; // Merkt sich beim Einstellungs-Menü welcher Slider gerade gezogen wird (z.B. Lautstärke)

// ═══════════════════════════════════════════════════════════════════════════
// setup() – wird von p5.js EINMAL beim Start des Spiels aufgerufen
// ═══════════════════════════════════════════════════════════════════════════
// Hier wird die "Bühne aufgebaut": Zeichenfläche erstellen, alle Manager-
// Objekte erzeugen, Anfangswerte setzen. Danach startet automatisch die
// Spielschleife (draw-Funktion, 60 Mal pro Sekunde).

function setup() {
  // Ladetext im HTML (während des Ladens sichtbar) jetzt ausblenden
  let ladetext = document.getElementById('ladetext'); // HTML-Element mit der id="ladetext" suchen
  if (ladetext) ladetext.style.display = 'none'; // Falls vorhanden: unsichtbar machen

  // Zeichenfläche (Canvas) erstellen, so groß wie das Browser-Fenster ist
  let cnv = createCanvas(windowWidth, windowHeight); // p5.js-Funktion, gibt das fertige Canvas-Element zurück
  cnv.parent(document.body); // Canvas ins HTML einbauen (an den body-Tag hängen)

  frameRate(60);          // Spiel läuft mit 60 Bildern pro Sekunde (so wirken Bewegungen flüssig)
  textFont('monospace');  // Standard-Schriftart: Monospace (jeder Buchstabe gleich breit, gut für Spielinfos)
  _berechneSkalierung();  // Skalierungs-Faktoren berechnen (siehe Funktion unten)

  // Alle Manager-Objekte mit "new" erschaffen. Jeder Manager bekommt entweder
  // den Spielzustand "gs" oder andere Manager, die er braucht, als Parameter.
  gs.highscoreManager = new HighscoreManager();           // Lädt vorhandene Bestenlisten aus dem Browser
  gs.einstellungen    = new EinstellungsManager();        // Lädt Einstellungen (Sound an/aus etc.)
  gs.sound            = new SoundManager(gs.einstellungen); // Sound-Manager braucht die Einstellungen für die Lautstärke
  gs.upgrades         = new UpgradeManager();             // Meta-Upgrades laden
  gs.wirtschaft       = new EconomyManager(gs);           // Geld-Verwaltung
  gs.wellenManager    = new WellenManager(gs);            // Wellen-Definitionen verwalten
  gs.spielSzene       = new SpielSzene(gs);               // Die Spielszene (Hauptbildschirm wenn man spielt)
  gs.menuSzene        = new MenuSzene(gs);                // Alle Menüs
  gs.ui               = new UIManager(gs);                // HUD und Shop-Panel

  // Drei "Puffer" am Window-Objekt: Wenn z.B. ein Schüler platzt und Schichten
  // freigibt, kann man nicht direkt mitten in der Schüler-Liste neue Schüler
  // einfügen (das würde die Schleife durcheinanderbringen). Stattdessen werden
  // sie hier zwischengelagert und im nächsten Frame in die richtige Liste
  // verschoben.
  window._neueGegnerBuffer        = []; // Neu gespawnte Schichten (z.B. nach Platzen eines Bosses)
  window._neueStellvertreterBuffer = []; // Temporäre Helfer-Türme (aktuell nicht aktiv genutzt)
  window._saeurewolkenBuffer       = []; // Säurewolken vom Pfister-Lehrer
}

// ═══════════════════════════════════════════════════════════════════════════
// windowResized() – wird aufgerufen wenn der Spieler das Browser-Fenster
// verändert (oder das Handy gedreht wird)
// ═══════════════════════════════════════════════════════════════════════════
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Canvas an die neue Fenstergröße anpassen
  _berechneSkalierung();                   // Neue Skalierung berechnen, damit das Spiel wieder passt
}

// ═══════════════════════════════════════════════════════════════════════════
// _berechneSkalierung() – ermittelt wie groß das Spielfeld auf dem aktuellen
// Bildschirm dargestellt werden muss, damit es a) reinpasst und b) zentriert ist
// ═══════════════════════════════════════════════════════════════════════════
// Auf dem PC: Spielfeld soll komplett zu sehen sein, auch wenn schwarze Balken
//   am Rand entstehen ("contain"-Modus, wie bei Filmen im Kino).
// Auf dem Handy: Spielfeld soll den Bildschirm möglichst ausfüllen, auch wenn
//   ein bisschen am Rand abgeschnitten wird ("cover"-Modus).

function _berechneSkalierung() {
  // "contain": kleinster Faktor, mit dem alles reinpasst
  let containSKF = Math.min(windowWidth / 960, windowHeight / 640); // Klassisches "passt komplett rein"

  if (window.MOBILE_MODE) { // Falls die Mobile-Variante geladen ist (mobile.html setzt diese Variable)
    // "cover": größter Faktor, mit dem mindestens eine Seite voll ausgefüllt ist
    let coverSKF = Math.max(windowWidth / 960, windowHeight / 640); // Deckt komplett ab, einiges geht über den Bildschirm hinaus
    SKF = containSKF + (coverSKF - containSKF) * 0.55; // Mittelweg zwischen beiden (55% Richtung Cover)
  } else {
    SKF = containSKF; // Desktop: alles sichtbar
  }

  // Verschiebung berechnen: wenn das skalierte Spielfeld kleiner ist als der
  // Bildschirm, wird der Rest zentriert (links und rechts gleich viel Platz).
  SKX = (windowWidth  - 960 * SKF) / 2; // Horizontal zentriert
  SKY = (windowHeight - 640 * SKF) / 2; // Vertikal zentriert

  if (window.MOBILE_MODE) { // Auf dem Handy
    if (SKY < 0) SKY = 0; // Falls vertikaler Überstand: oben anliegen lassen (HUD bleibt sichtbar)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// draw() – wird von p5.js 60 Mal pro Sekunde automatisch aufgerufen
// ═══════════════════════════════════════════════════════════════════════════
// Das ist die "Spielschleife". In jedem Aufruf wird der ganze Bildschirm neu
// gezeichnet. Welche Szene aktuell zu sehen ist, hängt von gs.szene ab.

function draw() {
  background(8, 8, 20); // Bildschirm komplett mit fast-schwarzem Dunkelblau überpinseln (Reset)

  push();               // Aktuellen Zeichen-Zustand speichern (wie ein Lesezeichen)
  translate(SKX, SKY);  // Koordinatensystem verschieben (damit das Spielfeld zentriert wird)
  scale(SKF);           // Koordinatensystem strecken/stauchen (Skalierungs-Faktor anwenden)

  // Switch-Anweisung: je nach Wert von gs.szene wird ein anderer Bildschirm
  // gezeichnet. Das ist der "Szenen-Wechsler" des Spiels.
  switch (gs.szene) {
    case 'menu':         // Hauptmenü
      gs.menuSzene.drawMenu(); // Menü zeichnen
      break;
    case 'levelSelect':  // Level-Auswahl-Bildschirm
      gs.menuSzene.drawLevelSelect(); // Level-Karten zeichnen
      break;
    case 'einstellungen': // Einstellungs-Bildschirm
      gs.menuSzene.drawEinstellungen(); // Slider und Schalter zeichnen
      break;
    case 'upgrades':     // Meta-Upgrade-Bildschirm
      gs.menuSzene.drawUpgrades(); // Upgrade-Karten zeichnen
      break;
    case 'bestenliste':  // Bestenlisten-Bildschirm
      gs.menuSzene.drawBestenliste(); // Highscores zeichnen
      break;
    case 'mobileApp':    // Mobile-App-Anleitung
      gs.menuSzene.drawMobileApp(); // Anleitung zum "Zum Home-Bildschirm hinzufügen"
      break;
    case 'spiel':        // Eigentliches Spiel (das spannende!)
      background(30, 30, 50); // Dunkelblau-violetter Hintergrund für die Spielszene
      gs.spielSzene.update(); // Logik aktualisieren (Schüler bewegen, Lehrer schießen)
      gs.spielSzene.draw();   // Spielfeld zeichnen
      gs.ui.draw();           // HUD und Shop oben drüber zeichnen
      break;
    case 'gameOver':     // Verloren-Bildschirm
      background(30, 30, 50);     // Hintergrund
      gs.spielSzene.draw();       // Letzten Spielstand im Hintergrund anzeigen
      gs.ui.draw();               // HUD ebenfalls
      gs.menuSzene.drawGameOver(); // "Niederlage"-Popup drüber
      break;
    case 'sieg':         // Gewonnen-Bildschirm
      background(30, 30, 50);    // Hintergrund
      gs.spielSzene.draw();      // Letzten Spielstand
      gs.ui.draw();              // HUD
      gs.menuSzene.drawSieg();   // "Sieg"-Popup drüber
      break;
  }
  pop(); // Zeichen-Zustand wiederherstellen (Skalierung etc. zurücksetzen für nächsten Frame)
}

// ═══════════════════════════════════════════════════════════════════════════
// mousePressed() – wird automatisch von p5.js aufgerufen wenn der Spieler
// die Maustaste drückt (Klick)
// ═══════════════════════════════════════════════════════════════════════════
// Je nachdem welche Szene gerade aktiv ist, wird der Klick anders behandelt.
// Im Spiel z.B.: Klick auf Shop → Lehrer auswählen; Klick auf Spielfeld →
// Lehrer platzieren; Klick auf Lehrer → Upgrade-Panel öffnen; etc.

function mousePressed() {
  gs.sound.aktivieren(); // Web-Audio benötigt eine Nutzer-Interaktion bevor Töne abgespielt werden dürfen (Browser-Sicherheits-Regel)
  let mx = skMx(); // Skalierte Maus-X-Position (in Spielkoordinaten)
  let my = skMy(); // Skalierte Maus-Y-Position (in Spielkoordinaten)

  // ── Klick im Hauptmenü ────────────────────────────────────────────────
  if (gs.szene === 'menu') {
    gs.sound.menuKlick(); // Klick-Sound abspielen
    // Welcher Menü-Button wurde getroffen? Die Menüszene wissen das (Hit-Test)
    if (gs.menuSzene.isMenuSpielen(mx, my))       { gs.szene = 'levelSelect';    } // "Spielen" → Level-Auswahl öffnen
    if (gs.menuSzene.isMenuEinstellungen(mx, my)) { gs.szene = 'einstellungen';  } // "Einstellungen"
    if (gs.menuSzene.isMenuUpgrades(mx, my))      { gs.szene = 'upgrades';       } // "Upgrades"
    if (gs.menuSzene.isMenuBestenliste(mx, my))   { gs.szene = 'bestenliste';    } // "Bestenliste"
    if (gs.menuSzene.isMenuMobileApp(mx, my))     { gs.szene = 'mobileApp';      } // "Mobile App"
    return; // Wichtig: nach dem Menü-Klick aufhören, sonst würden noch andere Szenen reagieren
  }

  // ── Klick in der Level-Auswahl ────────────────────────────────────────
  if (gs.szene === 'levelSelect') {
    let level = gs.menuSzene.getLevelKlick(mx, my); // Welches Level wurde angeklickt? (gibt Level-Nummer oder null)
    if (level) { // Ein freigeschaltetes Level wurde getroffen
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(level); // Spielszene zurücksetzen und Level vorbereiten
      gs.szene = 'spiel'; // Szene wechseln
    }
    if (gs.menuSzene.isZurueckKlick(mx, my)) { // "Zurück"-Button
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Klick in den Einstellungen ────────────────────────────────────────
  if (gs.szene === 'einstellungen') {
    gs.menuSzene.einstellungenKlick(mx, my); // Slider/Toggle bearbeiten lassen
    if (gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Klick im Upgrade-Bildschirm ───────────────────────────────────────
  if (gs.szene === 'upgrades') {
    gs.upgrades.upgradeKlick(mx, my); // Upgrade kaufen / Dialog öffnen
    // Zurück-Klick nur wirksam wenn KEIN Bestätigungs-Dialog offen ist
    if (!gs.upgrades.bestaetigungsDialog && gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Klick in der Bestenliste ──────────────────────────────────────────
  if (gs.szene === 'bestenliste') {
    if (gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Klick im Mobile-App-Bildschirm ────────────────────────────────────
  if (gs.szene === 'mobileApp') {
    if (gs.menuSzene.mobileAppKlick(mx, my)) { // Klick auf "Öffnen" oder "Kopieren"-Button?
      gs.sound.menuKlick();
      return;
    }
    if (gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Klick im Game-Over-Bildschirm (Verloren) ─────────────────────────
  if (gs.szene === 'gameOver') {
    if (gs.menuSzene.isRetryKlick(mx, my)) { // "Nochmal versuchen"-Button
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(gs.level); // Selbes Level neu starten
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isMenuBtnGameOver(mx, my)) { // "Ins Menü"-Button
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  // ── Klick im Sieg-Bildschirm ─────────────────────────────────────────
  if (gs.szene === 'sieg') {
    // "Nächstes Level"-Button nur wenn es noch ein nächstes Level gibt
    if (gs.menuSzene.isNaechstesLevelKlick(mx, my) && gs.level < 8) {
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(gs.level + 1); // Nächstes Level laden
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isLevelAuswahlSiegKlick(mx, my)) { // "Level-Auswahl"-Button
      gs.sound.menuKlick();
      gs.szene = 'levelSelect';
    }
    return;
  }

  // ── Klick während des laufenden Spiels (das Wichtigste!) ─────────────
  if (gs.szene === 'spiel') {
    if (gs.pausiert) return; // Wenn pausiert: gar keine Klicks verarbeiten

    // 1) Wurde der "Nächste Welle"-Button geklickt?
    if (gs.ui.isNaechsteWelleKlick(mx, my)) {
      if (!gs.welleAktiv && gs.welle < gs.maxWellen) { // Nur wenn keine Welle läuft und noch Wellen übrig sind
        gs.spielSzene.naechsteWelleStarten();
      }
      return;
    }

    // 2) Wurde der "2× Geschwindigkeit"-Button geklickt?
    if (gs.ui.isZweiXKlick(mx, my)) {
      gs.geschwindigkeit = gs.geschwindigkeit === 1 ? 2 : 1; // Umschalten zwischen 1 und 2
      return;
    }

    // 3) Wurde im Shop-Panel auf einen Lehrer geklickt?
    let shopTyp = gs.ui.getShopKlick(mx, my); // gibt den Typ-String zurück (z.B. 'blech') oder null
    if (shopTyp) {
      gs.fightPunkt1 = null; // Falls gerade Hr. Fight platziert werden sollte: abbrechen
      gs.motsiousPunkt1 = null; // Falls gerade Hr. Muzius platziert werden sollte: ebenfalls abbrechen
      if (gs.ausgewaehlteTurmTyp === shopTyp) {
        gs.ausgewaehlteTurmTyp = null; // Schon ausgewählt? → erneuter Klick bricht die Auswahl ab
      } else {
        let kosten = gs.wirtschaft.turmKosten(shopTyp); // Was kostet der Lehrer?
        if (gs.wirtschaft.kannKaufen(kosten)) { // Hat der Spieler genug Geld?
          gs.ausgewaehlteTurmTyp = shopTyp; // Auswahl merken (Geld wird erst beim Platzieren abgezogen)
        }
      }
      return;
    }

    // 4) Wurde ein bereits platzierter Lehrer angeklickt und im Upgrade-Panel auf etwas geklickt?
    if (gs.angeklickterTurm) {
      let klick = gs.ui.getUpgradePanelKlick(mx, my); // Was wurde im Upgrade-Panel getroffen?
      if (klick) {
        if (klick.typ === 'pfad') {
          gs.spielSzene.turmUpgraden(gs.angeklickterTurm, klick.pfad); // Pfad wählen (erstes Upgrade)
        } else if (klick.typ === 'upgrade') {
          gs.spielSzene.turmUpgraden(gs.angeklickterTurm); // Nächste Stufe kaufen
        } else if (klick.typ === 'verkauf') {
          gs.spielSzene.turmVerkaufen(gs.angeklickterTurm); // Lehrer verkaufen
        }
        return;
      }
    }

    // 5) Klick auf das eigentliche Spielfeld (nicht im Shop und nicht im HUD)
    if (mx < 740 && my > 50) { // x < 740 = links vom Shop; y > 50 = unter dem HUD
      if (gs.ausgewaehlteTurmTyp) {
        gs.spielSzene.turmPlatzieren(mx, my); // Ein Lehrer wurde im Shop ausgewählt → hier platzieren
      } else {
        gs.angeklickterTurm = null; // Erst alle Auswahlen löschen
        gs.tuerme.forEach(t => t.ausgewaehlt = false); // Alle Lehrer "deselektieren"
        gs.spielSzene.turmAnklicken(mx, my); // Prüfen ob ein platzierter Lehrer angeklickt wurde
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// mouseDragged() – wird aufgerufen wenn der Spieler die Maus gedrückt hält
// und bewegt (z.B. zum Slider-Ziehen)
// ═══════════════════════════════════════════════════════════════════════════
function mouseDragged() {
  if (gs.szene !== 'einstellungen') return; // Nur in den Einstellungen relevant
  gs.menuSzene.sliderDraggen(skMx(), skMy()); // Slider an die neue Position bewegen
}

// ═══════════════════════════════════════════════════════════════════════════
// mouseReleased() – wird aufgerufen wenn die Maustaste losgelassen wird
// ═══════════════════════════════════════════════════════════════════════════
function mouseReleased() {
  _aktiverSlider = null; // Kein Slider mehr aktiv
  if (gs.menuSzene) gs.menuSzene.sliderLoslassen(); // Menüszene informieren (z.B. Wert speichern)
}

// ═══════════════════════════════════════════════════════════════════════════
// keyPressed() – wird aufgerufen wenn eine Taste gedrückt wird
// ═══════════════════════════════════════════════════════════════════════════
function keyPressed() {
  // Leertaste = Nächste Welle starten (Kurztaste, schneller als Klick auf Button)
  if (key === ' ' || keyCode === 32) {
    if (gs.szene === 'spiel' && !gs.welleAktiv && gs.welle < gs.maxWellen) {
      gs.spielSzene.naechsteWelleStarten();
    }
    return false; // Browser-Standard unterbinden (Leertaste würde sonst die Seite scrollen)
  }

  // Escape-Taste = Auswahl abbrechen / Pause / Menü zurück
  if (keyCode === ESCAPE) {
    if (gs.szene === 'spiel') {
      if (gs.ausgewaehlteTurmTyp) {
        gs.ausgewaehlteTurmTyp = null; // Auswahl im Shop aufheben
        gs.fightPunkt1 = null;          // Auch laufende Fight-Platzierung abbrechen
        gs.motsiousPunkt1 = null;       // Auch laufende Muzius-Platzierung abbrechen
      } else if (gs.angeklickterTurm) {
        gs.angeklickterTurm = null; // Upgrade-Panel schließen
        gs.tuerme.forEach(t => t.ausgewaehlt = false); // Alle Lehrer "deselektieren"
      } else {
        gs.pausiert = !gs.pausiert; // Pause umschalten (an/aus)
      }
    } else if (['levelSelect', 'einstellungen', 'upgrades', 'bestenliste', 'mobileApp'].includes(gs.szene)) {
      if (gs.upgrades && gs.upgrades.bestaetigungsDialog) {
        gs.upgrades.bestaetigungsDialog = null; // Dialog schließen
      } else {
        gs.szene = 'menu'; // Zurück ins Hauptmenü
      }
    }
  }

  // R-Taste = Level neu starten (Restart)
  if ((key === 'r' || key === 'R') && (gs.szene === 'spiel' || gs.szene === 'gameOver')) {
    gs.spielSzene.levelStarten(gs.level); // Level zurücksetzen und neu starten
    gs.szene = 'spiel';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// mouseWheel() – wird beim Scrollen mit dem Mausrad aufgerufen
// ═══════════════════════════════════════════════════════════════════════════
function mouseWheel(event) {
  // Im Spiel über dem Shop-Bereich: scrollen aktiviert das Shop-Scrollen
  if (gs.szene === 'spiel' && gs.ui && skMx() > 740) {
    gs.ui.shopScroll(event.delta); // event.delta ist die Scroll-Richtung (positiv = nach unten)
    return false; // Browser-Scroll der Seite unterbinden
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Touch-Handling für Mobile (Handy/Tablet)
// ═══════════════════════════════════════════════════════════════════════════
// Auf dem Handy gibt es kein Mausrad. Damit man im Shop scrollen kann, wird
// ein Wisch-Gesture erkannt. Wichtig: nicht jeden Touch sofort als Klick werten,
// sonst würde ein Wisch versehentlich einen Lehrer auswählen.

let _shopTouchStartY = null;   // Letzte Y-Position des Fingers (für Scroll-Berechnung von Frame zu Frame)
let _shopTouchInitialY = null; // Y-Position beim Berührungs-Start (für die Unterscheidung Tap vs. Wisch)
let _shopTouchAlsSwipe = false; // Ist es schon ein Wisch (true) oder noch ein Tap (false)?

// ── touchStarted: Finger berührt den Bildschirm ──────────────────────────
function touchStarted() {
  let mx = skMx(); // Skalierte X-Position (Spielkoordinaten)
  let my = skMy(); // Skalierte Y-Position
  // Wenn der Touch im Shop-Bereich ist: erstmal nur tracken, NICHT als Klick werten
  if (gs.szene === 'spiel' && mx > 740 && my >= 80 && my <= 425) {
    _shopTouchStartY = my;   // Aktuelle Position merken (für Delta-Berechnung)
    _shopTouchInitialY = my; // Ausgangsposition merken (für die "ist es ein Tap oder ein Wisch?"-Entscheidung)
    _shopTouchAlsSwipe = false; // Erst mal als reiner Tap behandeln (wird zu Swipe wenn der Finger sich genug bewegt)
    return false; // Default-Browser-Scroll unterdrücken
  }
  // Außerhalb des Shop-Bereichs: normales Klick-Verhalten (mousePressed sofort aufrufen)
  mousePressed();
  return false; // Default verhindern (kein iOS-Bouncing)
}

// ── touchMoved: Finger bewegt sich über den Bildschirm ────────────────────
function touchMoved() {
  // Nur reagieren wenn der Touch im Shop begonnen hat
  if (_shopTouchStartY !== null) {
    let my = skMy(); // Aktuelle Y-Position
    let delta = _shopTouchStartY - my; // Wie weit hat sich der Finger seit dem letzten Frame bewegt?
    // Bei mehr als 8 Pixeln Bewegung ab dem Startpunkt: das ist ein Wisch, kein Tap
    if (Math.abs(my - _shopTouchInitialY) > 8) _shopTouchAlsSwipe = true;
    if (gs.ui) gs.ui.shopScroll(delta * 2.5); // Shop entsprechend scrollen (Faktor 2.5 für gefühlt natürliches Tempo)
    _shopTouchStartY = my; // Position für nächstes Frame merken
    return false; // Browser-Default unterbinden
  }
  return false;
}

// ── touchEnded: Finger wird vom Bildschirm genommen ──────────────────────
function touchEnded() {
  // Nur reagieren wenn ein Touch im Shop getrackt wurde
  if (_shopTouchStartY !== null) {
    let warTap = !_shopTouchAlsSwipe; // Reiner Tap (kein Wisch)?
    _shopTouchStartY = null;    // Tracking zurücksetzen
    _shopTouchInitialY = null;
    _shopTouchAlsSwipe = false;
    if (warTap) mousePressed(); // Reiner Tap: JETZT als Klick verarbeiten (nicht beim Touch-Start)
    return false; // Default verhindern
  }
  return false;
}
