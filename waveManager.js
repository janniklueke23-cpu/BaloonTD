// waveManager.js – Verwaltet die Wellen-Spawning-Logik für alle 3 Level

// Wellen-Definition: Jede Welle ist ein Array von Gruppen { typ, anzahl, verzoegerung }
// 'verzoegerung' = Frames zwischen dem Spawnen einzelner Ballons in der Gruppe

const LEVEL_WELLEN = { // Wellen-Definitionen für alle Level
  1: [ // Level 1: Der Flur (8 Wellen)
    // Welle 1
    [{ typ: 'rot', anzahl: 8, verzoegerung: 30 }], // 8 rote Ballons mit 0,5 Sek. Abstand
    // Welle 2
    [{ typ: 'rot', anzahl: 14, verzoegerung: 25 }], // 14 rote Ballons, etwas schneller
    // Welle 3
    [{ typ: 'rot', anzahl: 10, verzoegerung: 25 }, { typ: 'blau', anzahl: 4, verzoegerung: 35 }], // Rot + erste Blaue
    // Welle 4
    [{ typ: 'rot', anzahl: 6, verzoegerung: 20 }, { typ: 'blau', anzahl: 8, verzoegerung: 30 }], // Mehr Blaue
    // Welle 5
    [{ typ: 'blau', anzahl: 12, verzoegerung: 28 }], // Nur Blaue
    // Welle 6
    [{ typ: 'blau', anzahl: 10, verzoegerung: 25 }, { typ: 'gruen', anzahl: 3, verzoegerung: 40 }], // + erste Grüne
    // Welle 7
    [{ typ: 'rot', anzahl: 8, verzoegerung: 15 }, { typ: 'blau', anzahl: 8, verzoegerung: 25 }, { typ: 'gruen', anzahl: 5, verzoegerung: 35 }], // Mix
    // Welle 8 (Boss-Welle Level 1)
    [{ typ: 'gruen', anzahl: 8, verzoegerung: 25 }, { typ: 'gelb', anzahl: 2, verzoegerung: 60 }] // Grüne + erste Gelbe
  ],

  2: [ // Level 2: Die Mensa (12 Wellen)
    // Welle 1
    [{ typ: 'blau', anzahl: 10, verzoegerung: 28 }], // Direkt mit Blauen starten
    // Welle 2
    [{ typ: 'blau', anzahl: 8, verzoegerung: 25 }, { typ: 'gruen', anzahl: 4, verzoegerung: 35 }], // + Grüne
    // Welle 3
    [{ typ: 'gruen', anzahl: 10, verzoegerung: 30 }], // Nur Grüne
    // Welle 4
    [{ typ: 'blau', anzahl: 6, verzoegerung: 20 }, { typ: 'gruen', anzahl: 8, verzoegerung: 28 }], // Mix
    // Welle 5
    [{ typ: 'gruen', anzahl: 8, verzoegerung: 25 }, { typ: 'gelb', anzahl: 2, verzoegerung: 55 }], // Erste Gelbe!
    // Welle 6
    [{ typ: 'gruen', anzahl: 10, verzoegerung: 22 }, { typ: 'gelb', anzahl: 4, verzoegerung: 50 }], // Mehr Gelbe
    // Welle 7
    [{ typ: 'gelb', anzahl: 6, verzoegerung: 45 }], // Nur Gelbe
    // Welle 8
    [{ typ: 'blau', anzahl: 12, verzoegerung: 18 }, { typ: 'gruen', anzahl: 8, verzoegerung: 25 }, { typ: 'gelb', anzahl: 3, verzoegerung: 50 }], // Vollmix
    // Welle 9
    [{ typ: 'gruen', anzahl: 12, verzoegerung: 20 }, { typ: 'gelb', anzahl: 5, verzoegerung: 45 }], // Hart
    // Welle 10
    [{ typ: 'gelb', anzahl: 8, verzoegerung: 40 }], // Viele Gelbe
    // Welle 11
    [{ typ: 'gruen', anzahl: 15, verzoegerung: 18 }, { typ: 'gelb', anzahl: 6, verzoegerung: 42 }], // Sehr hart
    // Welle 12 (Boss-Welle Level 2)
    [{ typ: 'gelb', anzahl: 6, verzoegerung: 38 }, { typ: 'schwarz', anzahl: 1, verzoegerung: 120 }] // Erster Boss!
  ],

  3: [ // Level 3: Der Schulhof (15 Wellen)
    // Welle 1
    [{ typ: 'gruen', anzahl: 12, verzoegerung: 22 }], // Mit Grünen starten
    // Welle 2
    [{ typ: 'gruen', anzahl: 10, verzoegerung: 20 }, { typ: 'gelb', anzahl: 4, verzoegerung: 45 }], // + Gelbe
    // Welle 3
    [{ typ: 'gelb', anzahl: 8, verzoegerung: 40 }], // Nur Gelbe
    // Welle 4
    [{ typ: 'gruen', anzahl: 14, verzoegerung: 18 }, { typ: 'gelb', anzahl: 6, verzoegerung: 38 }], // Mix
    // Welle 5
    [{ typ: 'gelb', anzahl: 10, verzoegerung: 35 }, { typ: 'schwarz', anzahl: 1, verzoegerung: 100 }], // Erster Boss
    // Welle 6
    [{ typ: 'gruen', anzahl: 16, verzoegerung: 16 }, { typ: 'gelb', anzahl: 8, verzoegerung: 35 }], // Viel Druck
    // Welle 7
    [{ typ: 'gelb', anzahl: 10, verzoegerung: 32 }, { typ: 'schwarz', anzahl: 1, verzoegerung: 90 }], // Boss!
    // Welle 8
    [{ typ: 'gruen', anzahl: 20, verzoegerung: 15 }, { typ: 'gelb', anzahl: 10, verzoegerung: 30 }], // Flut
    // Welle 9
    [{ typ: 'gelb', anzahl: 12, verzoegerung: 30 }, { typ: 'schwarz', anzahl: 2, verzoegerung: 80 }], // 2 Bosse!
    // Welle 10
    [{ typ: 'gruen', anzahl: 18, verzoegerung: 14 }, { typ: 'gelb', anzahl: 12, verzoegerung: 28 }, { typ: 'schwarz', anzahl: 1, verzoegerung: 75 }], // Alles
    // Welle 11
    [{ typ: 'gelb', anzahl: 15, verzoegerung: 26 }, { typ: 'schwarz', anzahl: 2, verzoegerung: 70 }], // Doppel-Boss
    // Welle 12
    [{ typ: 'gruen', anzahl: 20, verzoegerung: 12 }, { typ: 'gelb', anzahl: 15, verzoegerung: 25 }], // Extremflut
    // Welle 13
    [{ typ: 'gelb', anzahl: 18, verzoegerung: 22 }, { typ: 'schwarz', anzahl: 3, verzoegerung: 65 }], // 3 Bosse!
    // Welle 14
    [{ typ: 'gruen', anzahl: 25, verzoegerung: 10 }, { typ: 'gelb', anzahl: 20, verzoegerung: 20 }, { typ: 'schwarz', anzahl: 2, verzoegerung: 60 }], // Fast alles
    // Welle 15 (Finale!)
    [{ typ: 'gelb', anzahl: 20, verzoegerung: 18 }, { typ: 'schwarz', anzahl: 4, verzoegerung: 55 }] // Episches Finale
  ]
};

class WellenManager { // Klasse die das Spawnen der Gegner-Wellen steuert
  constructor(spielZustand) { // Konstruktor: erhält Referenz auf den Spielzustand
    this.gs = spielZustand; // Spielzustand-Referenz speichern
    this.aktuelleGruppe = 0; // Welche Gruppe in der Welle gerade gespawnt wird
    this.gruppenTimer = 0; // Timer: wann wird der nächste Ballon in der Gruppe gespawnt
    this.gruppeSpawnZaehler = 0; // Wie viele Ballons in der Gruppe schon gespawnt wurden
    this.welleAbgeschlossen = false; // Ob die aktuelle Welle fertig gespawnt ist
    this.aktuelleWellenDef = null; // Definition der aktuellen Welle
    this.gruppenIndex = 0; // Index der aktuellen Gruppe in der Welle
    this.wartePause = 0; // Pause zwischen Gruppen (Frames)
  }

  welleStarten(welleNummer, level) { // Startet eine neue Welle
    let wellenListe = LEVEL_WELLEN[level]; // Wellen-Liste für das Level holen
    if (!wellenListe || welleNummer > wellenListe.length) { // Ungültige Welle?
      return false; // Fehler zurückgeben
    }
    this.aktuelleWellenDef = wellenListe[welleNummer - 1]; // Wellen-Definition laden (0-indiziert)
    this.gruppenIndex = 0; // Erste Gruppe starten
    this.gruppeSpawnZaehler = 0; // Spawn-Zähler zurücksetzen
    this.gruppenTimer = 0; // Timer zurücksetzen
    this.welleAbgeschlossen = false; // Welle ist nicht fertig
    this.wartePause = 60; // 1 Sekunde Pause vor der ersten Gruppe
    return true; // Erfolgreich gestartet
  }

  update(pfad, spielGeschwindigkeit) { // Jeden Frame: nächste Ballons spawnen wenn nötig
    if (!this.aktuelleWellenDef) return []; // Keine aktive Welle: leer zurückgeben
    if (this.welleAbgeschlossen) return []; // Welle schon fertig: leer zurückgeben
    let neueGegner = []; // Liste der neu gespawnten Ballons
    for (let s = 0; s < spielGeschwindigkeit; s++) { // Bei 2x-Geschwindigkeit doppelt spawnen
      let spawned = this._spawnSchritt(pfad); // Einen Spawn-Schritt ausführen
      neueGegner = neueGegner.concat(spawned); // Gespawnte Ballons sammeln
    }
    return neueGegner; // Neue Ballons zurückgeben (werden ins Spiel eingefügt)
  }

  _spawnSchritt(pfad) { // Einen Schritt des Spawn-Prozesses ausführen
    let neueGegner = []; // Liste der neu gespawnten Ballons
    if (this.wartePause > 0) { // Warte-Phase am Anfang?
      this.wartePause--; // Timer herunterzählen
      return neueGegner; // Noch nicht spawnen
    }
    if (this.gruppenIndex >= this.aktuelleWellenDef.length) { // Alle Gruppen gespawnt?
      this.welleAbgeschlossen = true; // Welle als abgeschlossen markieren
      return neueGegner; // Leer zurückgeben
    }
    let aktGruppe = this.aktuelleWellenDef[this.gruppenIndex]; // Aktuelle Gruppe holen
    this.gruppenTimer--; // Spawn-Timer herunterzählen
    if (this.gruppenTimer <= 0) { // Zeit für nächsten Spawn?
      if (this.gruppeSpawnZaehler < aktGruppe.anzahl) { // Noch Ballons in der Gruppe?
        let neuerBallon = new Ballon(aktGruppe.typ, pfad, 0); // Neuen Ballon erstellen
        neueGegner.push(neuerBallon); // Zur Spawn-Liste hinzufügen
        this.gruppeSpawnZaehler++; // Spawn-Zähler erhöhen
        this.gruppenTimer = aktGruppe.verzoegerung; // Timer für nächsten Ballon zurücksetzen
      } else { // Alle Ballons dieser Gruppe gespawnt
        this.gruppenIndex++; // Nächste Gruppe
        this.gruppeSpawnZaehler = 0; // Zähler zurücksetzen
        this.gruppenTimer = 60; // 1 Sekunde Pause zwischen Gruppen
      }
    }
    return neueGegner; // Neu gespawnte Ballons zurückgeben
  }

  alleGespawnt() { // Prüft ob alle Ballons der Welle gespawnt wurden
    return this.welleAbgeschlossen; // True wenn Welle fertig gespawnt
  }

  getMaxWellen(level) { // Gibt die Anzahl der Wellen für ein Level zurück
    return LEVEL_WELLEN[level] ? LEVEL_WELLEN[level].length : 0; // Anzahl der Wellen zurückgeben
  }
}
