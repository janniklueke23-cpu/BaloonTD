// highscoreManager.js – Verwaltet die Bestenlisten im localStorage

class HighscoreManager { // Klasse für die Verwaltung aller Highscores
  constructor() { // Konstruktor: wird einmal beim Erstellen der Instanz aufgerufen
    this.schluessel = 'lvs_highscores_v1'; // Schlüssel unter dem die Daten im localStorage gespeichert werden
    this.maxProLevel = 3; // Maximal 3 Einträge pro Level werden gespeichert
    this.daten = this._laden(); // Gespeicherte Scores beim Programmstart einlesen
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

  scoreEintragen(level, punkte, welleErreicht) { // Öffentliche Methode: trägt einen neuen Score ein
    if (!this.daten[level]) this.daten[level] = []; // Sicherstellen dass ein Array für dieses Level existiert
    let eintrag = { // Neuen Eintrag als Objekt anlegen
      punkte: Math.floor(punkte), // Punktzahl als ganze Zahl speichern
      welle: welleErreicht, // Nummer der letzten erreichten Welle
      datum: new Date().toLocaleDateString('de-DE') // Aktuelles Datum im deutschen Format speichern
    };
    this.daten[level].push(eintrag); // Neuen Eintrag zur Liste dieses Levels hinzufügen
    this.daten[level].sort((a, b) => b.punkte - a.punkte); // Liste absteigend nach Punkten sortieren
    this.daten[level] = this.daten[level].slice(0, this.maxProLevel); // Nur die besten 3 Einträge behalten
    this._speichern(); // Geänderte Liste dauerhaft speichern
  }

  getScores(level) { // Gibt die gespeicherten Scores für ein Level zurück
    return this.daten[level] || []; // Score-Array zurückgeben oder leeres Array falls nichts vorhanden
  }

  levelFreigeschaltet(level) { // Prüft ob ein Level spielbar ist
    if (level === 1) return true; // Level 1 ist immer freigeschaltet
    if (level === 2) return (this.daten[1] && this.daten[1].length > 0); // Level 2: Level 1 muss abgeschlossen sein
    if (level === 3) return (this.daten[2] && this.daten[2].length > 0); // Level 3: Level 2 muss abgeschlossen sein
    return false; // Alle anderen Level bleiben gesperrt
  }
}
