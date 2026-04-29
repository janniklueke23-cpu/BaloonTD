// highscoreManager.js – Verwaltet die Bestenlisten im localStorage

class HighscoreManager {
  constructor() {
    this.schluessel = 'lvs_highscores_v1';
    this.maxProLevel = 3;
    this.daten = this._laden();
  }

  _laden() {
    try {
      let json = localStorage.getItem(this.schluessel);
      if (!json) return { 1: [], 2: [], 3: [] };
      return JSON.parse(json);
    } catch (e) {
      return { 1: [], 2: [], 3: [] };
    }
  }

  _speichern() {
    try { localStorage.setItem(this.schluessel, JSON.stringify(this.daten)); } catch (e) {}
  }

  scoreEintragen(level, punkte, welleErreicht) {
    if (!this.daten[level]) this.daten[level] = [];
    let eintrag = {
      punkte: Math.floor(punkte),
      welle: welleErreicht,
      datum: new Date().toLocaleDateString('de-DE')
    };
    this.daten[level].push(eintrag);
    this.daten[level].sort((a, b) => b.punkte - a.punkte);
    this.daten[level] = this.daten[level].slice(0, this.maxProLevel);
    this._speichern();
  }

  getScores(level) {
    return this.daten[level] || [];
  }

  levelFreigeschaltet(level) {
    if (level === 1) return true;
    if (level === 2) return (this.daten[1] && this.daten[1].length > 0);
    if (level === 3) return (this.daten[2] && this.daten[2].length > 0);
    return false;
  }
}
