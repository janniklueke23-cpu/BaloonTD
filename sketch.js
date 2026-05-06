// sketch.js – Hauptdatei: p5.js Einstiegspunkt, Skalierung, Szenen-Verwaltung und Eingabe

let SKF = 1;
let SKX = 0;
let SKY = 0;

function skMx() { return (mouseX - SKX) / SKF; }
function skMy() { return (mouseY - SKY) / SKF; }

let gs = {
  szene:               'menu',
  level:               1,
  leben:               20,
  muenzen:             150,
  welle:               0,
  maxWellen:           8,
  welleAktiv:          false,
  geschwindigkeit:     1,
  pausiert:            false,
  ausgewaehlteTurmTyp: null,
  angeklickterTurm:    null,
  fightPunkt1:         null,
  tuerme:              [],
  gegner:              [],
  punkte:              0,
  ballonsGeknallt:     0,
  wellenBonus:         0,
  pfad:                [],
  highscoreManager: null,
  einstellungen:    null,
  sound:            null,
  upgrades:         null,
  wirtschaft:       null,
  wellenManager:    null,
  ui:               null,
  spielSzene:       null,
  menuSzene:        null,
  platzierungGueltig: function(mx, my) {
    return this.spielSzene ? this.spielSzene.platzierungGueltig(mx, my) : false;
  }
};

// gs explizit am Window-Objekt verfügbar machen, damit Module wie peTeacher.js,
// motorcycleTeacher.js etc. über window.gs auf den Spielzustand zugreifen können.
// (let-Deklarationen auf Top-Level werden NICHT automatisch zu window-Properties.)
window.gs = gs;

let _aktiverSlider = null;

function setup() {
  let ladetext = document.getElementById('ladetext');
  if (ladetext) ladetext.style.display = 'none';
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(document.body);
  frameRate(60);
  textFont('monospace');
  _berechneSkalierung();
  gs.highscoreManager = new HighscoreManager();
  gs.einstellungen    = new EinstellungsManager();
  gs.sound            = new SoundManager(gs.einstellungen);
  gs.upgrades         = new UpgradeManager();
  gs.wirtschaft       = new EconomyManager(gs);
  gs.wellenManager    = new WellenManager(gs);
  gs.spielSzene       = new SpielSzene(gs);
  gs.menuSzene        = new MenuSzene(gs);
  gs.ui               = new UIManager(gs);
  window._neueGegnerBuffer        = [];
  window._neueStellvertreterBuffer = [];
  window._saeurewolkenBuffer       = [];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  _berechneSkalierung();
}

function _berechneSkalierung() {
  let containSKF = Math.min(windowWidth / 960, windowHeight / 640); // Klassisches "passt komplett rein"
  if (window.MOBILE_MODE) { // Auf dem Handy mehr Bildschirm ausfüllen
    let coverSKF = Math.max(windowWidth / 960, windowHeight / 640); // "deckt komplett ab" (oben/unten ggf. weg)
    SKF = containSKF + (coverSKF - containSKF) * 0.55; // Mittelweg – füllt deutlich besser, schneidet kaum was ab
  } else { // Desktop: alles sichtbar
    SKF = containSKF;
  }
  SKX = (windowWidth  - 960 * SKF) / 2; // Horizontal zentriert
  SKY = (windowHeight - 640 * SKF) / 2; // Vertikal zentriert
  if (window.MOBILE_MODE) { // Auf dem Handy: oben anliegen lassen, Überstand unten ist akzeptabel
    if (SKY < 0) SKY = 0; // Verhindert dass die HUD oben abgeschnitten wird
  }
}

function draw() {
  background(8, 8, 20);
  push();
  translate(SKX, SKY);
  scale(SKF);
  switch (gs.szene) {
    case 'menu':
      gs.menuSzene.drawMenu();
      break;
    case 'levelSelect':
      gs.menuSzene.drawLevelSelect();
      break;
    case 'einstellungen':
      gs.menuSzene.drawEinstellungen();
      break;
    case 'upgrades':
      gs.menuSzene.drawUpgrades();
      break;
    case 'bestenliste':
      gs.menuSzene.drawBestenliste();
      break;
    case 'mobileApp':
      gs.menuSzene.drawMobileApp();
      break;
    case 'spiel':
      background(30, 30, 50);
      gs.spielSzene.update();
      gs.spielSzene.draw();
      gs.ui.draw();
      break;
    case 'gameOver':
      background(30, 30, 50);
      gs.spielSzene.draw();
      gs.ui.draw();
      gs.menuSzene.drawGameOver();
      break;
    case 'sieg':
      background(30, 30, 50);
      gs.spielSzene.draw();
      gs.ui.draw();
      gs.menuSzene.drawSieg();
      break;
  }
  pop();
}

function mousePressed() {
  gs.sound.aktivieren();
  let mx = skMx();
  let my = skMy();

  if (gs.szene === 'menu') {
    gs.sound.menuKlick();
    if (gs.menuSzene.isMenuSpielen(mx, my))       { gs.szene = 'levelSelect';    }
    if (gs.menuSzene.isMenuEinstellungen(mx, my)) { gs.szene = 'einstellungen';  }
    if (gs.menuSzene.isMenuUpgrades(mx, my))      { gs.szene = 'upgrades';       }
    if (gs.menuSzene.isMenuBestenliste(mx, my))   { gs.szene = 'bestenliste';    }
    if (gs.menuSzene.isMenuMobileApp(mx, my))     { gs.szene = 'mobileApp';      }
    return;
  }

  if (gs.szene === 'levelSelect') {
    let level = gs.menuSzene.getLevelKlick(mx, my);
    if (level) {
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(level);
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  if (gs.szene === 'einstellungen') {
    gs.menuSzene.einstellungenKlick(mx, my);
    if (gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  if (gs.szene === 'upgrades') {
    gs.upgrades.upgradeKlick(mx, my);
    if (!gs.upgrades.bestaetigungsDialog && gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  if (gs.szene === 'bestenliste') {
    if (gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  if (gs.szene === 'mobileApp') {
    if (gs.menuSzene.mobileAppKlick(mx, my)) {
      gs.sound.menuKlick();
      return;
    }
    if (gs.menuSzene.isZurueckKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  if (gs.szene === 'gameOver') {
    if (gs.menuSzene.isRetryKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(gs.level);
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isMenuBtnGameOver(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'menu';
    }
    return;
  }

  if (gs.szene === 'sieg') {
    if (gs.menuSzene.isNaechstesLevelKlick(mx, my) && gs.level < 8) {
      gs.sound.menuKlick();
      gs.spielSzene.levelStarten(gs.level + 1);
      gs.szene = 'spiel';
    }
    if (gs.menuSzene.isLevelAuswahlSiegKlick(mx, my)) {
      gs.sound.menuKlick();
      gs.szene = 'levelSelect';
    }
    return;
  }

  if (gs.szene === 'spiel') {
    if (gs.pausiert) return;
    if (gs.ui.isNaechsteWelleKlick(mx, my)) {
      if (!gs.welleAktiv && gs.welle < gs.maxWellen) {
        gs.spielSzene.naechsteWelleStarten();
      }
      return;
    }
    if (gs.ui.isZweiXKlick(mx, my)) {
      gs.geschwindigkeit = gs.geschwindigkeit === 1 ? 2 : 1;
      return;
    }
    let shopTyp = gs.ui.getShopKlick(mx, my);
    if (shopTyp) {
      gs.fightPunkt1 = null; // Beim Wechsel des Lehrer-Typs Fight-Vorgang abbrechen
      if (gs.ausgewaehlteTurmTyp === shopTyp) {
        gs.ausgewaehlteTurmTyp = null;
      } else {
        let kosten = gs.wirtschaft.turmKosten(shopTyp);
        if (gs.wirtschaft.kannKaufen(kosten)) {
          gs.ausgewaehlteTurmTyp = shopTyp;
        }
      }
      return;
    }
    if (gs.angeklickterTurm) {
      let klick = gs.ui.getUpgradePanelKlick(mx, my);
      if (klick) {
        if (klick.typ === 'pfad') {
          gs.spielSzene.turmUpgraden(gs.angeklickterTurm, klick.pfad);
        } else if (klick.typ === 'upgrade') {
          gs.spielSzene.turmUpgraden(gs.angeklickterTurm);
        } else if (klick.typ === 'verkauf') {
          gs.spielSzene.turmVerkaufen(gs.angeklickterTurm);
        }
        return;
      }
    }
    if (mx < 740 && my > 50) {
      if (gs.ausgewaehlteTurmTyp) {
        gs.spielSzene.turmPlatzieren(mx, my);
      } else {
        gs.angeklickterTurm = null;
        gs.tuerme.forEach(t => t.ausgewaehlt = false);
        gs.spielSzene.turmAnklicken(mx, my);
      }
    }
  }
}

function mouseDragged() {
  if (gs.szene !== 'einstellungen') return;
  gs.menuSzene.sliderDraggen(skMx(), skMy());
}

function mouseReleased() {
  _aktiverSlider = null;
  if (gs.menuSzene) gs.menuSzene.sliderLoslassen();
}

function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    if (gs.szene === 'spiel' && !gs.welleAktiv && gs.welle < gs.maxWellen) {
      gs.spielSzene.naechsteWelleStarten();
    }
    return false;
  }
  if (keyCode === ESCAPE) {
    if (gs.szene === 'spiel') {
      if (gs.ausgewaehlteTurmTyp) {
        gs.ausgewaehlteTurmTyp = null;
        gs.fightPunkt1 = null; // Auch laufende Fight-Platzierung abbrechen
      } else if (gs.angeklickterTurm) {
        gs.angeklickterTurm = null;
        gs.tuerme.forEach(t => t.ausgewaehlt = false);
      } else {
        gs.pausiert = !gs.pausiert;
      }
    } else if (['levelSelect', 'einstellungen', 'upgrades', 'bestenliste', 'mobileApp'].includes(gs.szene)) {
      if (gs.upgrades && gs.upgrades.bestaetigungsDialog) {
        gs.upgrades.bestaetigungsDialog = null;
      } else {
        gs.szene = 'menu';
      }
    }
  }
  if ((key === 'r' || key === 'R') && (gs.szene === 'spiel' || gs.szene === 'gameOver')) {
    gs.spielSzene.levelStarten(gs.level);
    gs.szene = 'spiel';
  }
}

function mouseWheel(event) {
  if (gs.szene === 'spiel' && gs.ui && skMx() > 740) {
    gs.ui.shopScroll(event.delta);
    return false;
  }
}

// ── Touch-Handling für Mobile (Shop-Scroll per Wisch) ─────────────────────
let _shopTouchStartY = null;   // Letzte Touch-Y-Position (zum Scroll-Berechnen)
let _shopTouchInitialY = null; // Touch-Y-Position beim Anfang (zum Tap/Swipe-Unterschied)
let _shopTouchAlsSwipe = false; // Wurde so weit gewischt, dass es kein Tap mehr ist?

function touchStarted() {
  let mx = skMx(); // Skalierte Maus-X
  let my = skMy(); // Skalierte Maus-Y
  // Im Shop-Bereich auf dem Handy: erst tracken, NICHT sofort als Klick werten
  if (gs.szene === 'spiel' && mx > 740 && my >= 80 && my <= 425) {
    _shopTouchStartY = my; // Aktuelle Position für Delta-Berechnung
    _shopTouchInitialY = my; // Ausgangsposition für Swipe-Erkennung
    _shopTouchAlsSwipe = false; // Erst mal als Tap behandeln
    return false; // Default-Browser-Scroll unterdrücken
  }
  // Sonst: normales Klick-Verhalten
  mousePressed(); // Maus-Klick auslösen
  return false; // Default verhindern (kein Bouncing)
}

function touchMoved() {
  // Im Shop-Bereich: Bewegung in vertikaler Richtung scrollt den Shop
  if (_shopTouchStartY !== null) {
    let my = skMy(); // Aktuelle Y-Position
    let delta = _shopTouchStartY - my; // Wie weit ist der Finger seit letztem Frame gewandert?
    if (Math.abs(my - _shopTouchInitialY) > 8) _shopTouchAlsSwipe = true; // Mehr als 8 px = Swipe
    if (gs.ui) gs.ui.shopScroll(delta * 2.5); // Shop entsprechend scrollen (Faktor verstärkt)
    _shopTouchStartY = my; // Position für nächstes Frame merken
    return false; // Browser-Default unterbinden
  }
  return false; // Auch sonst kein Scrollen der Seite
}

function touchEnded() {
  // Wenn der Touch im Shop begonnen hat
  if (_shopTouchStartY !== null) {
    let warTap = !_shopTouchAlsSwipe; // Wurde nicht weit gewischt → Tap
    _shopTouchStartY = null; // Tracking zurücksetzen
    _shopTouchInitialY = null; // ...
    _shopTouchAlsSwipe = false; // ...
    if (warTap) mousePressed(); // Reiner Tap: jetzt als Klick verarbeiten
    return false; // Default verhindern
  }
  return false; // Default verhindern
}
