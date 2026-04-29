// settingsManager.js – Verwaltet Spieleinstellungen und speichert sie persistent im localStorage

// Übersetzungstabelle: alle UI-Texte in Deutsch und Englisch
const TEXTE = {
  de: {
    spielen:          'SPIELEN',
    levelWaehlen:     'Level wählen',
    einstellungen:    'Einstellungen',
    upgrades:         'Upgrades',
    bestenliste:      'Bestenliste',
    zurueck:          '◄ Zurück',
    zurueckZumMenue:  '◄ Zurück zum Menü',
    lautstaerke:      'Lautstärke',
    soundEffekte:     'Soundeffekte',
    musik:            'Musik',
    sprache:          'Sprache',
    an:               'An',
    aus:              'Aus',
    deutsch:          'Deutsch',
    englisch:         'Englisch',
    naechsteWelle:    '▶ Nächste Welle [Space]',
    welleLaeuft:      'Welle läuft...',
    alleWellen:       'Alle Wellen!',
    welle:            'Welle',
    von:              'von',
    pausiert:         '⏸ PAUSIERT',
    level:            'Level',
    niederlage:       '💀 Niederlage!',
    schuelerHaben:    'Die Schüler haben gewonnen...',
    punkte:           'Erreichte Punkte:',
    nochmal:          '🔄 Nochmal versuchen',
    menue:            '◄ Menü',
    gewonnen:         '🎉 Gewonnen!',
    alleBesiegt:      'Du hast alle Schüler besiegt!',
    gesamtPunkte:     'Gesamtpunkte:',
    ballonsGeknallt:  'Ballons geplatzt:',
    levelAbgeschl:    'abgeschlossen!',
    naechstesLevel:   '▶ Level ',
    levelAuswahl:     '◄ Level-Auswahl',
    verfuegbar:       'Verfügbar:',
    gekauft:          '✓ Gekauft',
    maxStufe:         '✓ Max. Stufe',
    kaufen:           'Kaufen',
    kosten:           'Kosten:',
    bestaetigen:      'Upgrade kaufen?',
    ja:               'Ja, kaufen',
    nein:             'Abbrechen',
    nochNichtGespielt:'Noch nicht gespielt',
    pkt:              'Pkt.',
    speichernOk:      '✓ Gespeichert',
  },
  en: {
    spielen:          'PLAY',
    levelWaehlen:     'Select Level',
    einstellungen:    'Settings',
    upgrades:         'Upgrades',
    bestenliste:      'Leaderboard',
    zurueck:          '◄ Back',
    zurueckZumMenue:  '◄ Back to Menu',
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
    menue:            '◄ Menu',
    gewonnen:         '🎉 Victory!',
    alleBesiegt:      'You defeated all students!',
    gesamtPunkte:     'Total score:',
    ballonsGeknallt:  'Balloons popped:',
    levelAbgeschl:    'completed!',
    naechstesLevel:   '▶ Level ',
    levelAuswahl:     '◄ Level Select',
    verfuegbar:       'Available:',
    gekauft:          '✓ Purchased',
    maxStufe:         '✓ Max level',
    kaufen:           'Buy',
    kosten:           'Cost:',
    bestaetigen:      'Buy upgrade?',
    ja:               'Yes, buy',
    nein:             'Cancel',
    nochNichtGespielt:'Not played yet',
    pkt:              'pts.',
    speichernOk:      '✓ Saved',
  }
};

class EinstellungsManager {
  constructor() {
    this.schluessel = 'lvs_einstellungen_v1';
    this.daten = this._laden();
  }

  _standard() {
    return {
      lautstaerke: 80,
      soundEin:    true,
      musikEin:    true,
      sprache:     'de'
    };
  }

  _laden() {
    try {
      let json = localStorage.getItem(this.schluessel);
      if (!json) return this._standard();
      return Object.assign(this._standard(), JSON.parse(json));
    } catch (e) {
      return this._standard();
    }
  }

  _speichern() {
    try { localStorage.setItem(this.schluessel, JSON.stringify(this.daten)); } catch (e) {}
  }

  get(schluessel) {
    return this.daten[schluessel];
  }

  set(schluessel, wert) {
    this.daten[schluessel] = wert;
    this._speichern();
  }
}

function T(schluessel) {
  let sprache = (window.gs && window.gs.einstellungen) ? window.gs.einstellungen.get('sprache') : 'de';
  let texte = TEXTE[sprache] || TEXTE['de'];
  return texte[schluessel] || TEXTE['de'][schluessel] || schluessel;
}
