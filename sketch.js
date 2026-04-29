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
  SKF = min(windowWidth / 960, windowHeight / 640);
  SKX = (windowWidth  - 960 * SKF) / 2;
  SKY = (windowHeight - 640 * SKF) / 2;
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
    if (gs.menuSzene.isNaechstesLevelKlick(mx, my) && gs.level < 3) {
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
      } else if (gs.angeklickterTurm) {
        gs.angeklickterTurm = null;
        gs.tuerme.forEach(t => t.ausgewaehlt = false);
      } else {
        gs.pausiert = !gs.pausiert;
      }
    } else if (['levelSelect', 'einstellungen', 'upgrades', 'bestenliste'].includes(gs.szene)) {
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

function touchStarted() {
  mousePressed();
  return false;
}
