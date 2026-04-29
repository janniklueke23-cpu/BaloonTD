// settingsManager.js – Verwaltet Spieleinstellungen und speichert sie persistent im localStorage

// Übersetzungstabelle: alle UI-Texte in Deutsch und Englisch
const TEXTE = { // Objekt mit allen übersetzten Texten
  de: { // Deutsche Texte
    spielen:          'SPIELEN',               // Hauptmenü: Spielen-Button
    levelWaehlen:     'Level wählen',          // Hauptmenü: Level-Auswahl
    einstellungen:    'Einstellungen',         // Hauptmenü: Einstellungen-Button
    upgrades:         'Upgrades',              // Hauptmenü: Upgrades-Button
    bestenliste:      'Bestenliste',           // Hauptmenü: Bestenliste-Button
    zurueck:          '◀ Zurück',              // Allgemein: Zurück-Button
    zurueckZumMenue:  '◀ Zurück zum Menü',     // Submenüs: Zurück-Button
    lautstaerke:      'Lautstärke',            // Einstellungen: Lautstärke-Label
    soundEffekte:     'Soundeffekte',          // Einstellungen: Sound-Label
    musik:            'Musik',                 // Einstellungen: Musik-Label
    sprache:          'Sprache',               // Einstellungen: Sprache-Label
    an:               'An',                    // Toggle: An
    aus:              'Aus',                   // Toggle: Aus
    deutsch:          'Deutsch',              // Sprache: Deutsch
    englisch:         'Englisch',             // Sprache: Englisch
    naechsteWelle:    '▶ Nächste Welle [Space]', // HUD: Wellen-Button
    welleLaeuft:      'Welle läuft...',        // HUD: Welle aktiv
    alleWellen:       'Alle Wellen!',          // HUD: Alle Wellen fertig
    welle:            'Welle',                 // HUD: Wellen-Label
    von:              'von',                   // HUD: "von" in "Welle X von Y"
    pausiert:         '⏸ PAUSIERT',            // HUD: Pause-Anzeige
    level:            'Level',                 // HUD: Level-Label
    niederlage:       '💀 Niederlage!',        // Game-Over: Titel
    schuelerHaben:    'Die Schüler haben gewonnen...', // Game-Over: Untertitel
    punkte:           'Erreichte Punkte:',     // Game-Over/Sieg: Punkte-Label
    nochmal:          '🔄 Nochmal versuchen',  // Game-Over: Retry-Button
    menue:            '◀ Menü',               // Game-Over: Menü-Button
    gewonnen:         '🎉 Gewonnen!',          // Sieg: Titel
    alleBesiegt:      'Du hast alle Schüler besiegt!', // Sieg: Untertitel
    gesamtPunkte:     'Gesamtpunkte:',         // Sieg: Punkte-Label
    ballonsGeknallt:  'Ballons geplatzt:',     // Sieg: Ballons-Label
    levelAbgeschl:    'abgeschlossen!',        // Sieg: Level-Abschluss
    naechstesLevel:   '▶ Level ',              // Sieg: Nächstes Level
    levelAuswahl:     '◀ Level-Auswahl',       // Sieg: Level-Auswahl
    verfuegbar:       'Verfügbar:',            // Upgrades: Münzen verfügbar
    gekauft:          '✓ Gekauft',             // Upgrades: Bereits gekauft
    maxStufe:         '✓ Max. Stufe',          // Upgrades: Maximale Stufe
    kaufen:           'Kaufen',                // Upgrades: Kaufen-Button
    kosten:           'Kosten:',               // Upgrades: Kosten-Label
    bestaetigen:      'Upgrade kaufen?',       // Bestätigung: Titel
    ja:               'Ja, kaufen',            // Bestätigung: Ja-Button
    nein:             'Abbrechen',             // Bestätigung: Nein-Button
    bestenliste:      'Bestenliste',           // Bestenliste: Titel
    nochNichtGespielt:'Noch nicht gespielt',   // Bestenliste: Kein Score
    pkt:              'Pkt.',                  // Score: Punkte-Einheit
    speichernOk:      '✓ Gespeichert',         // Einstellungen: Gespeichert-Hinweis
  },
  en: { // Englische Texte
    spielen:          'PLAY',
    levelWaehlen:     'Select Level',
    einstellungen:    'Settings',
    upgrades:         'Upgrades',
    bestenliste:      'Leaderboard',
    zurueck:          '◀ Back',
    zurueckZumMenue:  '◀ Back to Menu',
    lautstaerke:      'Master Volume',
    soundEffekte:     'Sound Effects',
    musik:            'Music',
    sprache:          'Language',
    an:               'On',
    aus:              'Off',
    deutsch:          'German',
    englisch:         'English',
    naechsteWelle:    '▶ Next Wave [Space]',
    welleLaeuft:      'Wave running...',
    alleWellen:       'All Waves done!',
    welle:            'Wave',
    von:              'of',
    pausiert:         '⏸ PAUSED',
    level:            'Level',
    niederlage:       '💀 Defeat!',
    schuelerHaben:    'The students have won...',
    punkte:           'Score reached:',
    nochmal:          '🔄 Try again',
    menue:            '◀ Menu',
    gewonnen:         '🎉 Victory!',
    alleBesiegt:      'You defeated all students!',
    gesamtPunkte:     'Total score:',
    ballonsGeknallt:  'Balloons popped:',
    levelAbgeschl:    'completed!',
    naechstesLevel:   '▶ Level ',
    levelAuswahl:     '◀ Level Select',
    verfuegbar:       'Available:',
    gekauft:          '✓ Purchased',
    maxStufe:         '✓ Max level',
    kaufen:           'Buy',
    kosten:           'Cost:',
    bestaetigen:      'Buy upgrade?',
    ja:               'Yes, buy',
    nein:             'Cancel',
    bestenliste:      'Leaderboard',
    nochNichtGespielt:'Not played yet',
    pkt:              'pts.',
    speichernOk:      '✓ Saved',
  }
};

class EinstellungsManager { // Klasse für alle Spieleinstellungen
  constructor() { // Konstruktor: lädt gespeicherte Einstellungen
    this.schluessel = 'lvs_einstellungen_v1'; // localStorage-Schlüssel für Einstellungen
    this.daten = this._laden(); // Gespeicherte Einstellungen laden
  }

  _standard() { // Gibt die Standard-Einstellungen zurück
    return { // Standard-Einstellungsobjekt
      lautstaerke: 80,   // Standard-Lautstärke: 80%
      soundEin:    true, // Soundeffekte standardmäßig an
      musikEin:    true, // Musik standardmäßig an
      sprache:     'de'  // Standard-Sprache: Deutsch
    };
  }

  _laden() { // Einstellungen aus localStorage laden
    let json = localStorage.getItem(this.schluessel); // Gespeicherten JSON-String holen
    if (!json) return this._standard(); // Kein Eintrag: Standards zurückgeben
    try { // Versuche JSON zu parsen
      return Object.assign(this._standard(), JSON.parse(json)); // Standards mit gespeicherten überschreiben
    } catch (e) { // Fehler beim Parsen
      return this._standard(); // Standards als Fallback zurückgeben
    }
  }

  _speichern() { // Einstellungen in localStorage speichern
    localStorage.setItem(this.schluessel, JSON.stringify(this.daten)); // Aktuellen Stand speichern
  }

  get(schluessel) { // Einen Einstellungswert abrufen
    return this.daten[schluessel]; // Wert aus den Daten zurückgeben
  }

  set(schluessel, wert) { // Einen Einstellungswert setzen und speichern
    this.daten[schluessel] = wert; // Wert in den Daten setzen
    this._speichern(); // Änderung sofort in localStorage speichern
  }
}

// Globale Hilfsfunktion: gibt den Text in der aktuellen Sprache zurück
function T(schluessel) { // T = Text-Lookup-Funktion
  let sprache = (window.gs && window.gs.einstellungen) ? window.gs.einstellungen.get('sprache') : 'de'; // Aktuelle Sprache aus gs holen
  let texte = TEXTE[sprache] || TEXTE['de']; // Übersetzungstabelle für die Sprache laden
  return texte[schluessel] || TEXTE['de'][schluessel] || schluessel; // Text zurückgeben, Fallback auf Deutsch
}
