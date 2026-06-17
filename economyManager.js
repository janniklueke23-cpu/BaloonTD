// economyManager.js – Verwaltet Münzen, Belohnungen und Turmkosten

class EconomyManager { // Klasse für die gesamte Spielwirtschaft
  constructor(spielZustand) { // Konstruktor erhält den zentralen Spielzustand
    this.gs = spielZustand; // Referenz auf den Spielzustand speichern
    this.wellenBonus = 30; // Basisbonus in Münzen am Ende jeder Welle
    this.muenzenDieseWelle = 0; // Zählt die in der aktuellen Welle verdienten Münzen
  }

  belohnungFuerBallon(typ) { // Gibt die Münzbelohnung für einen Ballontyp zurück (mit Upgrade-Bonus)
    const belohnungen = { // Tabelle: Ballontyp → Münzwert
      'rot':    1,  // Erstklässler: 1 Münze
      'blau':   2,  // Sophomore: 2 Münzen
      'gruen':  3,  // Junior: 3 Münzen
      'gelb':   5,  // Senior: 5 Münzen
      'schwarz':20, // Klassensprecher (Boss): 20 Münzen
      'rosa':   45, // Streber (Tank): 45 Münzen
      'weiss':  100 // Schulsprecher (Mega-Tank): 100 Münzen
    };
    let basis = belohnungen[typ] || 1; // Basis-Belohnung holen
    let faktor = (this.gs.upgrades) ? this.gs.upgrades.getMuenzFaktor() : 1; // Münz-Multiplikator aus Upgrades
    return Math.floor(basis * faktor); // Mit Upgrade-Faktor multipliziert zurückgeben
  }

  turmKosten(typ) { // Gibt die Grundkosten eines Lehrers zurück (mit Rabatt-Upgrade)
    // WICHTIG: muss exakt mit TURMSHOP_EINTRAEGE in uiManager.js übereinstimmen,
    // sonst zeigt der Shop einen anderen Preis als tatsächlich abgezogen wird!
    const kosten = { // Tabelle: Lehrer-Typ → Preis in Münzen
      'blech':    100, // Hr. Blech (Standard-Kreidewerfer)
      'pfingsten':150, // Hr. Pfingsten (Verlangsamer)
      'koch':     200, // Hr. Koch (starker Einzelschaden)
      'raum':     250, // Hr. Zimmer (Geld-Generator + Buff)
      'brust':    300, // Hr. Rücken (Kettenblitz)
      'pfister':  350, // Hr. Fister (Säure mit Splash)
      'motsious': 400, // Hr. Muzius (Teilchenbeschleuniger)
      'fight':    450  // Hr. Fight (mobiler Anlauf-Schaden)
    };
    let basis = kosten[typ] || 100; // Basispreis holen
    let rabatt = (this.gs.upgrades) ? this.gs.upgrades.getRabatt() : 0; // Rabatt aus Upgrades holen
    return Math.floor(basis * (1 - rabatt)); // Rabattierter Preis zurückgeben
  }

  upgradeKosten(turmTyp, stufe) { // Gibt die Kosten für ein Upgrade zurück
    const upgrades = { // Tabelle: Lehrer-Typ → [Stufe1, Stufe2, Stufe3]
      'blech':    [60,  120, 220], // Blech
      'pfingsten':[80,  160, 270], // Pfingsten
      'pfister':  [80,  150, 260], // Pfister
      'koch':     [110, 220, 380], // Koch
      'raum':     [110, 220, 380], // Baum
      'motsious': [120, 240, 420], // Motsious
      'brust':    [140, 260, 480], // Schulter
      'fight':    [180, 360, 650]  // Fight (deutlich teurer wegen hoher Kraft)
    };
    let stufenListe = upgrades[turmTyp] || [50, 100, 200]; // Upgrade-Liste holen
    return stufenListe[stufe - 1] || 0; // Kosten für gewünschte Stufe (Index = stufe-1)
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
    // Bonus wächst sublinear, damit das Endgame nicht in Geld ertrinkt
    let bonus = this.wellenBonus + Math.floor(welleNummer * 5 + Math.sqrt(welleNummer) * 8); // Sublineare Skalierung
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
