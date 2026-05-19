// ═══════════════════════════════════════════════════════════════════════════
// tower.js – BAUPLAN ALLER LEHRER UND GESCHOSSE
// ═══════════════════════════════════════════════════════════════════════════
// Diese Datei enthält zwei wichtige "Baupläne" (= Klassen):
//   1) Turm    – die Vorlage für ALLE Lehrer-Türme im Spiel.
//   2) Geschoss – die Vorlage für alle Projektile (Kreide, Verweise etc.).
//
// Die spezifischen Lehrer (Hr. Blech, Hr. Koch usw.) sind ERWEITERUNGEN
// von "Turm". Sie übernehmen alle Eigenschaften und Methoden, die hier
// stehen, und können einzelne überschreiben oder ergänzen.
// Beispiel: jeder Turm hat eine Reichweite – aber Hr. Koch hat eine GRÖSSERE
// Reichweite als Hr. Blech. Statt alles doppelt zu schreiben, erbt der Koch
// die Grundlagen und überschreibt nur den einen Wert.
// ═══════════════════════════════════════════════════════════════════════════

class Turm { // Die "abstrakte" Basisklasse – wird nie direkt benutzt, nur als Vorlage

  // ─── Konstruktor: wird aufgerufen wenn ein neuer Lehrer entsteht ──────
  // Vergleich: ein Plätzchen ausstechen. Der Bauplan ist die Ausstechform,
  // hier in constructor() wird festgelegt was jedes neue Plätzchen bekommt.
  constructor(x, y, typ, basisKosten) {
    this.x = x;                       // Wo steht der Lehrer auf dem Spielfeld? (links-rechts)
    this.y = y;                       // Wo steht der Lehrer auf dem Spielfeld? (oben-unten)
    this.typ = typ;                   // Was für ein Typ ist das? (Text wie 'blech', 'koch', 'fight')
    this.basisKosten = basisKosten;   // Was hat der Lehrer beim Kauf gekostet (für die Verkaufs-Berechnung)
    this.upgradeStufe = 0;            // Wie oft wurde der Lehrer schon verbessert (0 = noch nie)
    this.upgradePfad = null;          // Welcher der beiden Upgrade-Pfade wurde gewählt (null = noch keiner, 0 = Pfad A, 1 = Pfad B)
    this.maxUpgrades = 3;             // Maximal drei Stufen pro Pfad (mehr geht nicht)
    this.reichweite = 100;            // Wie weit kann der Lehrer "sehen" und schießen (in Pixeln, wird von Unterklassen überschrieben)
    this.feuerRate = 60;              // Wie viele Frames zwischen den Schüssen (60 Frames = 1 Sekunde)
    this.schaden = 1;                 // Wie viel HP ein Treffer einem Schüler abzieht
    this.feuerTimer = 0;              // Countdown bis zum nächsten Schuss (wird in update heruntergezählt)
    this.ziel = null;                 // Welchen Schüler hat der Lehrer gerade im Visier (null = keinen)
    this.ausgewaehlt = false;         // Ist der Lehrer gerade vom Spieler angeklickt (für die Upgrade-Anzeige)
    this.radius = 22;                 // Größe des Lehrer-Symbols (wichtig für die Klick-Erkennung)
    this.geschosse = [];              // Liste seiner aktuell fliegenden Geschosse
    this.schussTyp = 'normal';        // Wie sieht das Geschoss aus? (wird von Unterklassen genutzt)
    this.durchdringen = false;        // Kann ein Schuss mehrere Schüler hintereinander treffen?
    this.durchdrigenAnzahl = 1;       // Falls ja: wie viele maximal?
    this.kopfFarbe = [200, 200, 200]; // Hautfarbe für das Strichmännchen (Standard: grau – Unterklassen ändern das)
    this.koerperFarbe = [100, 100, 200]; // Hemd-Farbe (Standard: blau – Unterklassen ändern das)
    this.id = ++Turm.zaehler;         // Eindeutige Nummer für diesen Lehrer (für Identifikation/Vergleiche)
  }

  // ─── update: wird 60 Mal pro Sekunde aufgerufen ────────────────────────
  // Hier passiert die "Spiel-Logik" pro Frame: Buff suchen, Ziel suchen, ggf.
  // schießen, eigene Geschosse aktualisieren.
  update(gegner, spielGeschwindigkeit) {
    this._raumBuffsAktualisieren();             // Schauen ob ein Hr. Zimmer (Raum) in der Nähe ist und uns einen Bonus gibt

    this.feuerTimer -= spielGeschwindigkeit;    // Schuss-Cooldown herunterzählen (bei 2× Speed: doppelt so schnell)
    this.ziel = this._besteZielFinden(gegner);  // Bestes Ziel in Reichweite raussuchen (am weitesten vorne auf dem Pfad)

    if (this.ziel && this.feuerTimer <= 0) {    // Wenn wir ein Ziel haben UND Cooldown abgelaufen ist:
      let originalSchaden = this.schaden;       // Original-Schadenswert merken (gleich Wiederhergestellt)
      // Falls ein Buff aktiv ist: Schaden temporär erhöhen
      if (this._raumSchadenBuff > 0) this.schaden = this.schaden * (1 + this._raumSchadenBuff);
      this._schiessen();                        // Schuss abfeuern (Methode wird in Unterklassen oft überschrieben)
      this.schaden = originalSchaden;           // Original-Schadenswert zurücksetzen (Buff ist nur "geliehen")
      // Sound-Effekt abspielen – außer bei Support-Türmen die nicht "richtig schießen"
      if (this.typ !== 'pfingsten' && this.typ !== 'raum' && window.gs && window.gs.sound) {
        window.gs.sound.turmSchiessen(this.typ);
      }
      // Cooldown neu setzen, mit Tempo-Buff falls vorhanden (kleinerer Multiplikator = schneller)
      this.feuerTimer = this.feuerRate * (this._raumFeuerRateBuff || 1);
    }

    // Alle eigenen Geschosse aktualisieren – RÜCKWÄRTS durch die Liste,
    // damit wir gefahrlos beim Iterieren Elemente entfernen können.
    for (let i = this.geschosse.length - 1; i >= 0; i--) {
      this.geschosse[i].update(gegner, spielGeschwindigkeit); // Geschoss bewegen und Treffer prüfen
      if (!this.geschosse[i].aktiv) {          // Ist das Geschoss inaktiv (hat getroffen oder den Bildschirm verlassen)?
        this.geschosse.splice(i, 1);            // Aus der Liste löschen
      }
    }
  }

  // ─── _raumBuffsAktualisieren: prüft ob Hr. Zimmer einen Buff spendiert ──
  // Hr. Zimmer ist ein Support-Lehrer der umliegende Lehrer verstärkt.
  // Diese Methode prüft pro Frame ob einer in der Nähe steht und merkt sich
  // den stärksten Buff.
  _raumBuffsAktualisieren() {
    this._raumSchadenBuff = 0;                  // Schaden-Bonus zurücksetzen (jeden Frame neu prüfen)
    this._raumFeuerRateBuff = 1;                // Tempo-Multiplikator zurücksetzen (1 = keine Veränderung)
    if (this.typ === 'raum') return;            // Hr. Zimmer verstärkt sich nicht selbst
    if (!window.gs || !window.gs.tuerme) return; // Sicherheitscheck: falls das Spiel noch nicht ganz geladen ist

    // Durch ALLE Türme schauen ob ein Raum-Turm in Reichweite ist
    for (let t of window.gs.tuerme) {
      if (t.typ !== 'raum' || t === this) continue;          // Nur Raum-Türme zählen, und nicht uns selbst
      if (dist(this.x, this.y, t.x, t.y) > t.reichweite) continue; // Außerhalb der Buff-Reichweite? Überspringen.

      // Stärksten Schaden-Buff merken (mehrere Hr. Zimmer überlagern sich nicht – der Beste gewinnt)
      if (t.schadenBuff && t.schadenBuff > this._raumSchadenBuff) {
        this._raumSchadenBuff = t.schadenBuff;
      }
      // Stärksten Tempo-Buff merken (analog)
      if (t.feuerRateBuff && t.feuerRateBuff > 0) {
        let mult = 1 - t.feuerRateBuff;                       // z.B. 0.2 Buff → mult = 0.8 (= 20% schneller)
        if (mult < this._raumFeuerRateBuff) this._raumFeuerRateBuff = mult; // Niedrigster Multiplikator = größter Tempo-Vorteil
      }
    }
  }

  // ─── _besteZielFinden: welcher Schüler soll als nächstes beschossen werden? ──
  // Strategie "first": der Schüler, der am weitesten vorne auf dem Pfad ist
  // (= am dichtesten am Ziel). So wird verhindert, dass jemand kurz vorm Ziel
  // doch noch durchrutscht.
  _besteZielFinden(gegner) {
    let besteDistanz = -1;                       // "Beste" = größte zurückgelegte Strecke. Mit -1 wird auch Distanz 0 noch akzeptiert.
    let besteZiel = null;                        // Bisher noch kein Ziel gefunden
    for (let g of gegner) {                      // Durch alle Schüler im Level
      if (!g.aktiv) continue;                    // Tote/inaktive Schüler überspringen
      let abstand = dist(this.x, this.y, g.x, g.y); // Wie weit ist der Lehrer vom Schüler entfernt?
      if (abstand <= this.reichweite) {          // In Reichweite?
        if (g.gesamtDistanz > besteDistanz) {    // Ist er weiter vorne auf dem Pfad als das bisherige beste Ziel?
          besteDistanz = g.gesamtDistanz;        // Neue Bestmarke merken
          besteZiel = g;                          // Diesen Schüler als Ziel auswählen
        }
      }
    }
    return besteZiel;                             // Kann auch null sein wenn kein Schüler in Reichweite ist
  }

  // ─── _schiessen: erzeugt ein neues Geschoss in Richtung Ziel ───────────
  // Diese Methode wird in vielen Unterklassen überschrieben (jeder Lehrer
  // hat ein eigenes Geschoss). Diese hier ist die Default-Variante.
  _schiessen() {
    if (!this.ziel || !this.ziel.aktiv) return;  // Sicherheits-Check: kein gültiges Ziel? → nichts tun
    let g = new Geschoss(                        // Neues Geschoss-Objekt erschaffen mit allen Eigenschaften:
      this.x,                  // Startposition X (Lehrer-Position)
      this.y,                  // Startposition Y
      this.ziel,               // Welcher Schüler ist Ziel
      this.schaden,            // Wieviel HP soll abgezogen werden
      this.schussTyp,          // Wie sieht das Geschoss aus
      this.durchdringen,       // Soll es durch mehrere Schüler fliegen?
      this.durchdrigenAnzahl   // Falls ja: wie viele
    );
    this.geschosse.push(g);                       // Geschoss in unsere Liste eintragen (wird in update aktualisiert)
  }

  // ─── upgrade: ein Upgrade kaufen ────────────────────────────────────────
  // pfadIndex muss beim ALLERERSTEN Upgrade angegeben werden (0 oder 1).
  // Danach merkt sich der Lehrer den Pfad und der Parameter wird ignoriert.
  upgrade(pfadIndex) {
    if (this.upgradeStufe >= this.maxUpgrades) return false; // Maximal-Stufe erreicht? → keine weiteren Upgrades

    if (this.upgradePfad === null) {              // Noch kein Pfad gewählt (= erster Kauf)?
      if (pfadIndex !== 0 && pfadIndex !== 1) return false; // Ungültige Eingabe → abbrechen
      this.upgradePfad = pfadIndex;               // Pfad DAUERHAFT festlegen (kein Wechsel mehr möglich)
    }
    this.upgradeStufe++;                          // Stufe hochzählen
    this._upgradeAnwenden();                       // Spezifische Effekte anwenden (jeder Lehrer hat eigene Logik)
    return true;                                   // Erfolg signalisieren
  }

  // ─── _upgradeAnwenden: leer in der Basisklasse ─────────────────────────
  // Jede Unterklasse muss diese Methode selbst implementieren, weil jeder
  // Lehrer andere Upgrades hat (mehr Schaden, mehr Reichweite etc.).
  _upgradeAnwenden() {
    // Wird von jeder Unterklasse (Blech, Koch etc.) spezifisch überschrieben
  }

  // ─── getPfadeInfo: gibt beide Upgrade-Pfade als Liste zurück ────────────
  // Ebenfalls in den Unterklassen implementiert. Wird vom UI gebraucht, um
  // die Upgrade-Buttons zu beschriften.
  getPfadeInfo() {
    return null;                                  // Basis-Lehrer hat keine Pfade
  }

  // ─── draw: zeichnet den Lehrer als Strichmännchen ──────────────────────
  // Hier wird der Lehrer optisch dargestellt: Sockel, Körper, Arme, Kopf,
  // ggf. Upgrade-Abzeichen und ein typ-spezifisches Symbol.
  draw() {
    push();                                       // Aktuellen Zeichen-Zustand "abspeichern" (wie ein Lesezeichen)
    translate(this.x, this.y);                    // Koordinatensystem zur Lehrer-Position verschieben (jetzt ist 0,0 der Lehrer-Mittelpunkt)

    // Reichweiten-Kreis (nur wenn der Lehrer angeklickt ist)
    if (this.ausgewaehlt) {
      noFill();                                   // Nur Umriss, keine Füllung
      stroke(255, 255, 255, 60);                  // Weißer Rand, halbtransparent (60 = 23% Deckkraft)
      strokeWeight(1.5);                          // Dünne Linie
      ellipse(0, 0, this.reichweite * 2, this.reichweite * 2); // Kreis mit Reichweite als Radius (Durchmesser = 2*Radius)
    }

    // Sockel des Lehrers (graues Rechteck unten)
    fill(120, 120, 120);                          // Mittelgrau füllen
    stroke(60, 60, 60);                           // Dunkelgrauer Rand
    strokeWeight(1);                              // Dünn
    rect(-18, -5, 36, 16, 4);                     // Rechteck (x, y, breite, höhe, eckenradius) – 18 Pixel links vom Mittelpunkt zentriert

    // Körper des Lehrers (Hemd in Lehrer-spezifischer Farbe)
    let kf = this.koerperFarbe;                   // Farbe aus der Unterklasse abgreifen
    fill(kf[0], kf[1], kf[2]);                    // Mit RGB-Werten füllen
    stroke(max(0, kf[0]-60), max(0, kf[1]-60), max(0, kf[2]-60)); // Dunklere Kontur (60 Werte abgezogen, mindestens 0)
    strokeWeight(1.5);                            // Etwas dicker
    rect(-11, -28, 22, 24, 3);                    // Körper-Rechteck über dem Sockel

    // Arme (zwei diagonale Linien)
    stroke(max(0, kf[0]-40), max(0, kf[1]-40), max(0, kf[2]-40)); // Etwas hellere Konturfarbe für Arme
    strokeWeight(3);                              // Dicke Striche
    line(-11, -22, -20, -12);                     // Linker Arm: vom Körper-Rand schräg nach unten-links
    line(11, -22, 20, -12);                       // Rechter Arm: analog rechts

    // Kopf (kreisförmige Ellipse)
    let kpf = this.kopfFarbe;                     // Hautfarbe aus der Unterklasse
    fill(kpf[0], kpf[1], kpf[2]);
    stroke(max(0, kpf[0]-50), max(0, kpf[1]-50), max(0, kpf[2]-50));
    strokeWeight(1.5);
    ellipse(0, -38, 20, 20);                      // Kreis (20×20) über dem Körper

    // Upgrade-Abzeichen (nur wenn schon mindestens ein Upgrade gekauft)
    if (this.upgradeStufe > 0) {
      // Farbe zeigt den gewählten Pfad: blau für Pfad A, grün für Pfad B
      let af = this.upgradePfad === 0 ? [80, 150, 255] : [80, 220, 100];
      fill(af[0], af[1], af[2]);                  // Abzeichen mit Pfad-Farbe füllen
      noStroke();                                  // Keine Kontur
      ellipse(12, -48, 14, 14);                   // Kleiner Kreis oben rechts neben dem Kopf
      fill(255);                                   // Weißer Text
      textAlign(CENTER, CENTER);                  // Text zentrieren
      textSize(9);                                // Kleine Schrift
      text(this.upgradeStufe, 12, -48);           // Zahl 1, 2 oder 3 anzeigen
    }

    // Typ-spezifisches Symbol (z.B. Kreide bei Hr. Blech, Verweis bei Hr. Koch)
    this._symbolZeichnen();                       // Methode wird in den Unterklassen implementiert

    pop();                                         // Zeichen-Zustand wiederherstellen (Verschiebung rückgängig)

    // Geschosse zeichnen (NACH pop, weil Geschosse ihre eigene Position haben)
    for (let g of this.geschosse) {
      g.draw();                                   // Jedes Geschoss zeichnet sich selbst
    }
  }

  // ─── _symbolZeichnen: leer in der Basisklasse ──────────────────────────
  // Jede Unterklasse zeichnet ihr eigenes Symbol (Kreide, Bierflasche, Blitz etc.)
  _symbolZeichnen() {
    // Standardmäßig kein Symbol – Unterklassen überschreiben das
  }

  // ─── getUpgradeInfo: liefert Info zum NÄCHSTEN möglichen Upgrade ───────
  // Wird vom UI gebraucht für die Upgrade-Buttons. Gibt Name, Beschreibung
  // und Kosten zurück.
  getUpgradeInfo() {
    if (this.upgradePfad === null) return null;   // Noch kein Pfad gewählt? Dann gibts auch noch keinen "Nächsten"
    let pfade = this.getPfadeInfo();              // Die ganze Pfad-Definition holen
    if (!pfade) return null;                       // Keine Pfade definiert? (sollte nicht passieren)
    return pfade[this.upgradePfad].upgrades[this.upgradeStufe] || null; // Das nächste Upgrade im gewählten Pfad
  }
}

Turm.zaehler = 0; // Klassen-weiter Zähler: wird bei jeder neuen Lehrer-Erschaffung hochgezählt (für eindeutige IDs)


// ═══════════════════════════════════════════════════════════════════════════
// Geschoss – BAUPLAN ALLER PROJEKTILE
// ═══════════════════════════════════════════════════════════════════════════
// Jedes Geschoss (Kreide, Verweis, Bierflasche, Teilchen, Blitz) ist eine
// "Instanz" dieser Klasse oder einer Unterklasse davon. Die Klasse weiß:
//   - wo es gerade ist (x, y)
//   - welches Ziel es verfolgt
//   - wie viel Schaden es macht
//   - wie es sich bewegt
//   - was passiert wenn es trifft
// ═══════════════════════════════════════════════════════════════════════════

class Geschoss {

  // ─── Konstruktor: erzeugt ein neues fliegendes Projektil ──────────────
  constructor(x, y, ziel, schaden, typ, durchdringen, maxTreffer) {
    this.x = x;                                   // Startposition X (typisch: Lehrer-Position)
    this.y = y;                                   // Startposition Y
    this.ziel = ziel;                             // Schüler-Objekt das verfolgt wird
    this.zielId = ziel ? ziel.id : -1;            // Eindeutige ID des Ziels gemerkt (falls Ziel verloren geht)
    this.schaden = schaden;                       // Wie viel HP-Abzug bei Treffer
    this.typ = typ || 'normal';                   // Visueller Typ ('blech', 'koch' etc.) – wird vom Zeichner gelesen
    this.durchdringen = durchdringen || false;    // Fliegt das Geschoss durch mehrere Schüler hindurch?
    this.maxTreffer = maxTreffer || 1;            // Wie viele Schüler maximal getroffen werden (1 = nur den ersten)
    this.trefferZaehler = 0;                      // Wie viele Schüler haben wir schon getroffen?
    this.getroffene = new Set();                  // "Set" = Liste ohne Duplikate, merkt sich IDs der bereits getroffenen Schüler
    this.geschwindigkeit = 7;                     // 7 Pixel pro Frame (= 420 px/sek bei 60fps)
    this.aktiv = true;                            // Solange true: Geschoss existiert und wird gezeichnet
    this.winkel = 0;                              // Flugrichtung in Radiant (für die Drehung beim Zeichnen)
    this.splashRadius = 0;                        // Radius eines Explosions-Schadens (0 = kein Splash, nur Einzel-Ziel)
    this.kritisch = false;                        // Kritischer Treffer = doppelter Schaden (aktuell ungenutzt)
    this.schadensTyp = 'normal';                  // 'normal' oder 'panzerbrechend' (umgeht gelbe Schüler-Rüstung)
    this.partikelFarbe = [255, 200, 50];          // Farbe der Treffer-Funken (orange-gelb default)
  }

  // ─── update: pro Frame bewegen und auf Treffer prüfen ──────────────────
  update(gegner, spielGeschwindigkeit) {
    if (!this.aktiv) return;                      // Tote Geschosse nicht mehr anfassen
    let schritte = spielGeschwindigkeit;          // Bei 1× Speed: 1 Schritt, bei 2× Speed: 2 Schritte
    for (let s = 0; s < schritte; s++) {          // Schleife für die Schritte (Mehrfach-Update bei 2× Geschwindigkeit)
      this._bewegungsSchritt(gegner);             // Einen Schritt ausführen
    }
  }

  // ─── _bewegungsSchritt: ein einzelner Bewegungsschritt ────────────────
  _bewegungsSchritt(gegner) {
    let zielX, zielY;                             // Wohin fliegen wir gerade?

    if (this.ziel && this.ziel.aktiv) {           // Lebt das Ziel noch?
      zielX = this.ziel.x;                        // Ja: aktuelle Position des Ziels (es bewegt sich ja!)
      zielY = this.ziel.y;
    } else {
      this.aktiv = false;                         // Nein: Geschoss deaktivieren (verfehlt)
      return;
    }

    // Vektor vom Geschoss zum Ziel berechnen
    let dx = zielX - this.x;                      // Differenz X (positiv = Ziel rechts)
    let dy = zielY - this.y;                      // Differenz Y (positiv = Ziel unten)
    let abstand = sqrt(dx * dx + dy * dy);        // Länge des Vektors = Distanz (Satz des Pythagoras)
    this.winkel = atan2(dy, dx);                  // Winkel in dem das Geschoss fliegt (für die Drehung beim Zeichnen)

    if (abstand < this.geschwindigkeit + 2) {     // Sind wir nah genug ans Ziel?
      this._treffer(gegner);                      // Ja: Treffer-Logik auslösen
      return;
    }

    // Sonst: einen Schritt in Richtung Ziel gehen
    let nx = dx / abstand;                        // X-Komponente der EINHEITS-Richtung (Länge 1)
    let ny = dy / abstand;                        // Y-Komponente der Einheits-Richtung
    this.x += nx * this.geschwindigkeit;          // Position um "geschwindigkeit" Pixel in X-Richtung verschieben
    this.y += ny * this.geschwindigkeit;          // Analog in Y-Richtung

    // Falls das Geschoss aus dem Spielfeld geflogen ist: deaktivieren
    if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 700) {
      this.aktiv = false;
    }
  }

  // ─── _treffer: was passiert bei einem Treffer? ─────────────────────────
  // Drei Varianten: Splash (Flächenschaden), Durchdringen (mehrere hintereinander),
  // oder normaler Einzeltreffer.
  _treffer(gegner) {
    if (this.splashRadius > 0) {
      // ─── Variante 1: Splash-Schaden (Flächen-Explosion) ──────────────
      for (let g of gegner) {                      // Alle Schüler im Spiel durchgehen
        if (!g.aktiv) continue;                    // Tote überspringen
        if (dist(this.x, this.y, g.x, g.y) <= this.splashRadius) { // Innerhalb des Splash-Radius?
          if (!this.getroffene.has(g.id)) {       // Diesen Schüler noch nicht in dieser Explosion getroffen?
            let neueGegner = g.schadennehmen(this.schaden, this.schadensTyp); // Schaden anwenden, ggf. werden Schichten freigegeben
            this.getroffene.add(g.id);             // Als getroffen markieren (kein Doppelschaden)
            // Neue Schichten in den globalen Puffer legen (werden später ins Spiel eingefügt)
            if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner);
          }
        }
      }
    } else if (this.durchdringen && this.trefferZaehler < this.maxTreffer) {
      // ─── Variante 2: Durchdringung (durch mehrere Schüler) ────────────
      if (this.ziel && this.ziel.aktiv && !this.getroffene.has(this.ziel.id)) {
        let neueGegner = this.ziel.schadennehmen(this.schaden, this.schadensTyp); // Schaden am aktuellen Ziel
        this.getroffene.add(this.ziel.id);         // Diesen Schüler als getroffen markieren
        this.trefferZaehler++;                    // Treffer-Zähler hochzählen
        if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner);

        // Nächstes Ziel suchen, das wir noch nicht erwischt haben
        let naechstesZiel = this._naechstesNichtGetroffenes(gegner);
        if (naechstesZiel && this.trefferZaehler < this.maxTreffer) {
          this.ziel = naechstesZiel;               // Neues Ziel anvisieren
          return;                                   // Geschoss bleibt aktiv und fliegt weiter
        }
      }
    } else {
      // ─── Variante 3: Normaler Einzeltreffer ──────────────────────────
      if (this.ziel && this.ziel.aktiv) {
        let effSchaden = this.kritisch ? this.schaden * 2 : this.schaden; // Bei Kritischem: doppelter Schaden
        let neueGegner = this.ziel.schadennehmen(effSchaden, this.schadensTyp);
        if (neueGegner) window._neueGegnerBuffer = (window._neueGegnerBuffer || []).concat(neueGegner);
      }
    }
    this.aktiv = false;                            // Nach dem Treffer ist das Geschoss "verbraucht"
  }

  // ─── _naechstesNichtGetroffenes: für Durchdringung das nächste Ziel ────
  // Sucht den dichtesten Schüler in der Nähe, der noch nicht von uns getroffen wurde.
  _naechstesNichtGetroffenes(gegner) {
    let nahestes = null;                           // Noch keiner gefunden
    let minAbstand = Infinity;                    // "Unendlich" als Startwert – jeder reale Abstand ist kleiner
    for (let g of gegner) {
      if (!g.aktiv) continue;                      // Tote überspringen
      if (this.getroffene.has(g.id)) continue;    // Schon getroffene überspringen
      let d = dist(this.x, this.y, g.x, g.y);     // Abstand berechnen
      if (d < minAbstand) {                       // Näher als der bisher beste?
        minAbstand = d;
        nahestes = g;
      }
    }
    return nahestes;                               // Kann null sein wenn keiner mehr in der Nähe ist
  }

  // ─── draw: Geschoss auf dem Bildschirm zeichnen ────────────────────────
  draw() {
    if (!this.aktiv) return;                      // Tote Geschosse nicht zeichnen
    push();                                        // Zeichen-Zustand speichern
    translate(this.x, this.y);                    // Koordinatensystem zur Geschoss-Position
    rotate(this.winkel);                          // In Flugrichtung drehen (damit Geschosse "vorwärts" zeigen)
    this._projektilZeichnen();                    // Spezifische Form zeichnen (oft überschrieben)
    pop();                                         // Zeichen-Zustand wiederherstellen
  }

  // ─── _projektilZeichnen: Standard-Geschoss = kleines oranges Oval ──────
  // Wird von Unterklassen (Kreide, Verweis etc.) meist überschrieben.
  _projektilZeichnen() {
    noStroke();                                    // Keine Kontur
    fill(255, 180, 30);                            // Orange-Gelb (RGB)
    ellipse(0, 0, 10, 6);                          // Kleines Oval: 10 breit, 6 hoch
  }
}
