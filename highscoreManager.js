// highscoreManager.js – Verwaltet die Bestenlisten im localStorage

class HighscoreManager {
  constructor() {
    this.schluessel = 'lvs_highscores_v1';
    this.maxProLevel = 3;
    this.daten = this._laden();
  }

  _laden() {
    let leer = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] }; // 8 Level
    try {
      let json = localStorage.getItem(this.schluessel);
      if (!json) return leer; // Keine Daten: leer zurück
      let geladen = JSON.parse(json); // JSON laden
      return Object.assign(leer, geladen); // Neue Level-Slots dazu mergen falls Speicherstand älter ist
    } catch (e) {
      return leer; // Bei Fehler: leer zurück
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
    if (level === 1) return true; // Level 1 ist immer freigeschaltet
    if (level < 1 || level > 8) return false; // Nur 8 Level definiert
    let prev = this.daten[level - 1]; // Vorheriges Level
    return !!(prev && prev.length > 0); // Erst freischalten wenn das vorherige bestanden wurde
  }
}
