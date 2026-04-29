// upgradeManager.js – Verwaltet permanente Spieler-Upgrades die über alle Spielrunden erhalten bleiben

const UPGRADE_DEFS = {
  startgeld: {
    name:   'Startkapital',
    symbol: '💰',
    farbe:  [220, 180, 40],
    stufen: [
      { kosten: 50,  beschreibung: '+50 Startmünzen',  kurztext: '+50 🪙' },
      { kosten: 150, beschreibung: '+150 Startmünzen', kurztext: '+150 🪙' },
      { kosten: 300, beschreibung: '+300 Startmünzen', kurztext: '+300 🪙' }
    ]
  },
  leben: {
    name:   'Zähigkeit',
    symbol: '❤️',
    farbe:  [200, 60, 60],
    stufen: [
      { kosten: 75,  beschreibung: '+2 Startleben',  kurztext: '+2 ❤️' },
      { kosten: 200, beschreibung: '+5 Startleben',  kurztext: '+5 ❤️' },
      { kosten: 400, beschreibung: '+10 Startleben', kurztext: '+10 ❤️' }
    ]
  },
  rabatt: {
    name:   'Sparlehrer',
    symbol: '🏷️',
    farbe:  [60, 140, 200],
    stufen: [
      { kosten: 100, beschreibung: '10% Rabatt auf alle Türme', kurztext: '-10% Kosten' },
      { kosten: 250, beschreibung: '20% Rabatt auf alle Türme', kurztext: '-20% Kosten' },
      { kosten: 500, beschreibung: '30% Rabatt auf alle Türme', kurztext: '-30% Kosten' }
    ]
  },
  muenzbonus: {
    name:   'Schatzsucher',
    symbol: '🪙',
    farbe:  [80, 180, 80],
    stufen: [
      { kosten: 80,  beschreibung: '+10% Münzen pro Ballon', kurztext: 'x1.10 🪙' },
      { kosten: 200, beschreibung: '+25% Münzen pro Ballon', kurztext: 'x1.25 🪙' },
      { kosten: 450, beschreibung: '+50% Münzen pro Ballon', kurztext: 'x1.50 🪙' }
    ]
  }
};

class UpgradeManager {
  constructor() {
    this.schluessel = 'lvs_upgrades_v2';
    this.daten = this._laden();
    this.bestaetigungsDialog = null;
    this.kaufErfolgTimer = 0;
    this.kaufErfolgKat = '';
  }

  _standard() {
    return {
      gesamtMuenzen: 0,
      gekauft: {
        startgeld:  0,
        leben:      0,
        rabatt:     0,
        muenzbonus: 0
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

  gesamtMuenzenErhoehen(betrag) {
    this.daten.gesamtMuenzen += Math.floor(betrag);
    this._speichern();
  }

  _ausgegeben() {
    let summe = 0;
    for (let kat in this.daten.gekauft) {
      let stufe = this.daten.gekauft[kat];
      let def = UPGRADE_DEFS[kat];
      if (!def) continue;
      for (let i = 0; i < stufe; i++) {
        summe += def.stufen[i].kosten;
      }
    }
    return summe;
  }

  verfuegbareMuenzen() {
    return Math.max(0, this.daten.gesamtMuenzen - this._ausgegeben());
  }

  naechsteKosten(kategorie) {
    let stufe = this.daten.gekauft[kategorie];
    let def = UPGRADE_DEFS[kategorie];
    if (!def || stufe >= def.stufen.length) return null;
    return def.stufen[stufe].kosten;
  }

  kaufen(kategorie) {
    let stufe = this.daten.gekauft[kategorie];
    let def = UPGRADE_DEFS[kategorie];
    if (!def || stufe >= def.stufen.length) return false;
    let kosten = def.stufen[stufe].kosten;
    if (this.verfuegbareMuenzen() < kosten) return false;
    this.daten.gekauft[kategorie]++;
    this._speichern();
    this.kaufErfolgTimer = 80;
    this.kaufErfolgKat = kategorie;
    return true;
  }

  getStartMuenzen() {
    const boni = [50, 150, 300];
    let stufe = this.daten.gekauft['startgeld'];
    return stufe > 0 ? boni[stufe - 1] : 0;
  }

  getStartLeben() {
    const boni = [2, 5, 10];
    let stufe = this.daten.gekauft['leben'];
    return stufe > 0 ? boni[stufe - 1] : 0;
  }

  getRabatt() {
    const rabatte = [0.10, 0.20, 0.30];
    let stufe = this.daten.gekauft['rabatt'];
    return stufe > 0 ? rabatte[stufe - 1] : 0;
  }

  getMuenzFaktor() {
    const faktoren = [1.10, 1.25, 1.50];
    let stufe = this.daten.gekauft['muenzbonus'];
    return stufe > 0 ? faktoren[stufe - 1] : 1.0;
  }

  upgradeKlick(mx, my) {
    let kategorien = Object.keys(UPGRADE_DEFS);
    let karten = this._kartenPositionen();
    for (let i = 0; i < kategorien.length; i++) {
      let kat = kategorien[i];
      let k = karten[i];
      let stufe = this.daten.gekauft[kat];
      let def = UPGRADE_DEFS[kat];
      if (stufe >= def.stufen.length) continue;
      let kosten = def.stufen[stufe].kosten;
      if (mx >= k.x + 10 && mx <= k.x + k.b - 10 && my >= k.y + k.h - 45 && my <= k.y + k.h - 10) {
        if (this.verfuegbareMuenzen() >= kosten) {
          this.bestaetigungsDialog = { kategorie: kat, kosten: kosten, name: def.name };
        }
        return;
      }
    }
    if (this.bestaetigungsDialog) {
      if (mx >= 340 && mx <= 480 && my >= 340 && my <= 378) {
        if (this.kaufen(this.bestaetigungsDialog.kategorie)) {
          if (window.gs && window.gs.sound) gs.sound.upgradeGekauft();
        }
        this.bestaetigungsDialog = null;
      } else if (mx >= 490 && mx <= 620 && my >= 340 && my <= 378) {
        this.bestaetigungsDialog = null;
      }
    }
  }

  _kartenPositionen() {
    return [
      { x: 100, y: 170, b: 350, h: 200 },
      { x: 510, y: 170, b: 350, h: 200 },
      { x: 100, y: 390, b: 350, h: 200 },
      { x: 510, y: 390, b: 350, h: 200 }
    ];
  }

  drawUpgradeScreen() {
    let kategorien = Object.keys(UPGRADE_DEFS);
    let karten = this._kartenPositionen();
    for (let i = 0; i < kategorien.length; i++) {
      this._karteZeichnen(kategorien[i], karten[i]);
    }
    if (this.kaufErfolgTimer > 0) this.kaufErfolgTimer--;
    if (this.bestaetigungsDialog) this._dialogZeichnen();
  }

  _karteZeichnen(kategorie, k) {
    let def = UPGRADE_DEFS[kategorie];
    let stufe = this.daten.gekauft[kategorie];
    let maxStufe = def.stufen.length;
    let farbe = def.farbe;
    let hatMehr = stufe < maxStufe;
    let naechsteKosten = hatMehr ? def.stufen[stufe].kosten : 0;
    let kannKaufen = hatMehr && this.verfuegbareMuenzen() >= naechsteKosten;
    let istErfolgKarte = this.kaufErfolgKat === kategorie && this.kaufErfolgTimer > 0;
    let helligkeit = istErfolgKarte ? 80 : 25;
    fill(helligkeit, helligkeit + 8, helligkeit + 15);
    stroke(farbe[0] * 0.6, farbe[1] * 0.6, farbe[2] * 0.6);
    strokeWeight(istErfolgKarte ? 3 : 1.5);
    rect(k.x, k.y, k.b, k.h, 10);
    noStroke();
    fill(farbe[0], farbe[1], farbe[2]);
    textAlign(LEFT, TOP);
    textSize(22);
    text(def.symbol, k.x + 14, k.y + 12);
    textSize(16);
    textStyle(BOLD);
    text(def.name, k.x + 44, k.y + 14);
    textStyle(NORMAL);
    for (let i = 0; i < maxStufe; i++) {
      let kreisX = k.x + k.b - 20 - (maxStufe - 1 - i) * 22;
      let kreisY = k.y + 22;
      if (i < stufe) {
        fill(farbe[0], farbe[1], farbe[2]);
      } else {
        fill(50, 50, 65);
      }
      noStroke();
      ellipse(kreisX, kreisY, 14, 14);
    }
    fill(160, 165, 185);
    textSize(12);
    textAlign(LEFT, TOP);
    if (stufe > 0) {
      text('Aktiv: ' + def.stufen[stufe - 1].beschreibung, k.x + 14, k.y + 50);
    } else {
      text('Noch nicht aktiviert', k.x + 14, k.y + 50);
    }
    if (hatMehr) {
      fill(140, 185, 140);
      text('Nächste Stufe: ' + def.stufen[stufe].beschreibung, k.x + 14, k.y + 70);
    }
    if (hatMehr) {
      let btnFarbe = kannKaufen ? farbe : [50, 50, 60];
      fill(btnFarbe[0] * 0.7, btnFarbe[1] * 0.7, btnFarbe[2] * 0.7);
      stroke(btnFarbe[0], btnFarbe[1], btnFarbe[2]);
      strokeWeight(1.5);
      rect(k.x + 10, k.y + k.h - 45, k.b - 20, 32, 6);
      noStroke();
      fill(kannKaufen ? 255 : 120);
      textAlign(CENTER, CENTER);
      textSize(13);
      textStyle(BOLD);
      text(T('kaufen') + '  🪙' + naechsteKosten, k.x + k.b / 2, k.y + k.h - 29);
      textStyle(NORMAL);
    } else {
      noStroke();
      fill(farbe[0], farbe[1], farbe[2]);
      textAlign(CENTER, CENTER);
      textSize(13);
      textStyle(BOLD);
      text(T('maxStufe'), k.x + k.b / 2, k.y + k.h - 29);
      textStyle(NORMAL);
    }
    if (istErfolgKarte) {
      let alpha = map(this.kaufErfolgTimer, 0, 80, 0, 100);
      noStroke();
      fill(farbe[0], farbe[1], farbe[2], alpha);
      rect(k.x, k.y, k.b, k.h, 10);
    }
  }

  _dialogZeichnen() {
    let d = this.bestaetigungsDialog;
    noStroke();
    fill(0, 0, 0, 160);
    rect(0, 0, 960, 640);
    fill(25, 25, 45);
    stroke(100, 100, 180);
    strokeWeight(2);
    rect(300, 260, 360, 160, 12);
    noStroke();
    fill(200, 200, 255);
    textAlign(CENTER, TOP);
    textSize(18);
    textStyle(BOLD);
    text(T('bestaetigen'), 480, 276);
    textStyle(NORMAL);
    fill(180, 180, 220);
    textSize(14);
    text(d.name + ' – 🪙' + d.kosten, 480, 304);
    let mausx = skMx();
    let mausy = skMy();
    let jaHover = mausx >= 340 && mausx <= 480 && mausy >= 340 && mausy <= 378;
    fill(jaHover ? color(80, 180, 80) : color(50, 140, 50));
    stroke(100, 200, 100);
    strokeWeight(1.5);
    rect(340, 340, 140, 38, 8);
    noStroke();
    fill(255);
    textSize(13);
    textStyle(BOLD);
    text(T('ja'), 410, 359);
    textStyle(NORMAL);
    let neinHover = mausx >= 490 && mausx <= 620 && mausy >= 340 && mausy <= 378;
    fill(neinHover ? color(160, 60, 60) : color(120, 40, 40));
    stroke(180, 80, 80);
    strokeWeight(1.5);
    rect(490, 340, 130, 38, 8);
    noStroke();
    fill(255);
    textSize(13);
    textStyle(BOLD);
    text(T('nein'), 555, 359);
    textStyle(NORMAL);
  }
}
