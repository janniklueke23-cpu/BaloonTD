// economyManager.js – Verwaltet Münzen, Belohnungen und Turmkosten

class EconomyManager { // Klasse für die gesamte Spielwirtschaft
  constructor(spielZustand) { // Konstruktor erhält den zentralen Spielzustand
    this.gs = spielZustand; // Referenz auf den Spielzustand speichern
    this.wellenBonus = 25; // Basisbonus in Münzen am Ende jeder Welle
    this.muenzenDieseWelle = 0; // Zählt die in der aktuellen Welle verdienten Münzen
  }

  belohnungFuerBallon(typ) { // Gibt die Münzbelohnung für einen Ballontyp zurück (mit Upgrade-Bonus)
    const belohnungen = { // Tabelle: Ballontyp → Münzwert
      'rot':    1, // Erstklässler: 1 Münze
      'blau':   2, // Sophomore: 2 Münzen
      'gruen':  3, // Junior: 3 Münzen
      'gelb':   5, // Senior: 5 Münzen
      'schwarz':20  // Klassenprecher (Boss): 20 Münzen
    };
    let basis = belohnungen[typ] || 1; // Basis-Belohnung holen
    let faktor = (this.gs.upgrades) ? this.gs.upgrades.getMuenzFaktor() : 1; // Münz-Multiplikator aus Upgrades
    return Math.floor(basis * faktor); // Mit Upgrade-Faktor multipliziert zurückgeben
  }

  turmKosten(typ) { // Gibt die Grundkosten eines Turms zurück (mit Rabatt-Upgrade)
    const kosten = { // Tabelle: Turmtyp → Preis in Münzen
      'blech':    100, // Blech: 100 Münzen
      'pfingsten':130, // Pfingsten: 130 Münzen
      'koch':     175, // Koch: 175 Münzen
      'pfister':  140  // Pfister: 140 Münzen
    };
    let basis = kosten[typ] || 100; // Basispreis holen
    let rabatt = (this.gs.upgrades) ? this.gs.upgrades.getRabatt() : 0; // Rabatt aus Upgrades holen
    return Math.floor(basis * (1 - rabatt)); // Rabattierter Preis zurückgeben
  }

  upgradeKosten(turmTyp, stufe) { // Gibt die Kosten für ein Upgrade zurück
    const upgrades = { // Verschachtelte Tabelle: Turmtyp → [Stufe1, Stufe2, Stufe3]
      'blech':    [50,  100, 200], // Upgrade-Kosten für Blech
      'pfingsten':[65,  130, 220], // Upgrade-Kosten für Pfingsten
      'koch':     [80,  160, 280], // Upgrade-Kosten für Koch
      'pfister':  [60,  120, 210]  // Upgrade-Kosten für Pfister
    };
    let stufenListe = upgrades[turmTyp] || [50, 100, 200]; // Upgrade-Liste für Turmtyp holen
    return stufenListe[stufe - 1] || 0; // Kosten für die gewünschte Stufe zurückgeben (Index = stufe-1)
  }

  muenzenHinzufuegen(betrag) { // Fügt dem Spieler Münzen hinzu und zählt für Gesamt-Statistik
    this.gs.muenzen += betrag; // Münzen zum Gesamtkontostand addieren
    this.muenzenDieseWelle += betrag; // Auch die Wellen-Statistik aktualisieren
    if (this.gs.upgrades) this.gs.upgrades.gesamtMuenzenErhoehen(betrag); // Gesamt-Münzen für Upgrade-System erhöhen
  }

  muenzenAbziehen(betrag) { // Zieht Münzen vom Spieler ab – gibt true zurück wenn genug vorhanden
    if (this.gs.muenzen < betrag) return false; // Prüfen ob genug Münzen vorhanden sind
    this.gs.muenzen -= betrag; // Münzen abziehen
    return true; // Erfolg zurückmelden
  }

  kannKaufen(betrag) { // Prüft ob der Spieler sich etwas leisten kann (ohne zu kaufen)
    return this.gs.muenzen >= betrag; // True wenn genügend Münzen vorhanden
  }

  welleAbgeschlossen(welleNummer) { // Berechnet und vergibt den Wellenbonus
    let bonus = this.wellenBonus + welleNummer * 10; // Bonus steigt mit jeder Welle
    this.muenzenHinzufuegen(bonus); // Bonus zum Kontostand hinzufügen
    this.gs.wellenBonus = bonus; // Bonus im Spielzustand speichern (für die Anzeige)
    this.muenzenDieseWelle = 0; // Zähler für nächste Welle zurücksetzen
    return bonus; // Bonus-Betrag zurückgeben (für Anzeigetext)
  }

  turmVerkaufen(turm) { // Berechnet den Verkaufspreis eines Turms und fügt Münzen hinzu
    let gesamtAusgaben = turm.basisKosten; // Grundkosten des Turms
    for (let i = 0; i < turm.upgradeStufe; i++) { // Alle bezahlten Upgrades durchgehen
      gesamtAusgaben += this.upgradeKosten(turm.typ, i + 1); // Upgrade-Kosten addieren
    }
    let verkaufsPreis = Math.floor(gesamtAusgaben * 0.6); // 60% der Gesamtausgaben zurückbekommen
    this.muenzenHinzufuegen(verkaufsPreis); // Verkaufspreis gutschreiben
    return verkaufsPreis; // Preis zurückgeben (für Bestätigung)
  }
}
