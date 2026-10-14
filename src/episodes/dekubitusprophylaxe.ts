import type {Episode} from '../engine/types';

// Prophylaxen-Reihe · Folge 1 – Dekubitusprophylaxe
//
// Audio: public/audio/dekubitusprophylaxe.mp3, 379.74 s (ffprobe).
// Scene starts were scaled from the planned ~7:30 outline to the real length
// (×0.844) and snapped to the nearest pause in the dialogue. Fine-tune any
// `start` or per-item `at` (seconds from scene start) after listening in the
// Studio (`npm run dev`) – everything else re-flows automatically.
//
// ­ = soft hyphen, lets long German words break cleanly in narrow cards.

export const dekubitusprophylaxe: Episode = {
	id: 'Dekubitusprophylaxe',
	audio: 'audio/dekubitusprophylaxe.mp3',
	duration: 379.74,
	scenes: [
		{
			id: 'intro',
			type: 'title',
			start: 0,
			series: 'Prophylaxen-Reihe · Folge 1',
			episodeTitle: 'Dekubitusprophylaxe',
			tagline: 'Lernen. Verstehen. Wachsen.',
			hosts: 'MIT NORA UND BEN',
			photo: 'brand/studio-mic.jpg',
			switchAt: 12,
		},
		{
			id: 'definition',
			type: 'list',
			start: 26.8,
			chapter: {num: '01', title: 'Was ist ein Dekubitus?', kicker: 'Grundlagen'},
			layout: 'chain',
			illustration: 'patientProfile',
			items: [
				{label: 'Dekubitus = Druckgeschwür', sub: 'Schaden an Haut & Gewebe', icon: 'skin'},
				{label: 'Anhaltender Druck', sub: 'meist über Knochenvorsprüngen', icon: 'mattress'},
				{label: 'Durchblutung gestört', sub: 'Sauerstoff & Nährstoffe fehlen', icon: 'pulse'},
				{label: 'Gewebe stirbt ab', sub: 'Es entsteht eine Wunde', icon: 'alert'},
			],
		},
		{
			id: 'risk',
			type: 'list',
			start: 76.75,
			chapter: {num: '02', title: 'Risikofaktoren', kicker: 'Wer ist gefährdet?'},
			layout: 'grid',
			columns: 3,
			items: [
				{label: 'Bett­lägerigkeit', sub: 'Wenig oder keine Eigenbewegung', icon: 'bed'},
				{label: 'Hohes Alter', sub: 'Dünnere, empfindliche Haut', icon: 'elderly'},
				{label: 'Mangel­ernährung', sub: 'Weniger Polster, schlechte Heilung', icon: 'nutrition'},
				{label: 'Inkontinenz', sub: 'Feuchte Haut wird anfällig', icon: 'drop'},
				{label: 'Reibung & Scherkräfte', sub: 'z. B. beim Hochrutschen im Bett', icon: 'friction'},
			],
			footnote: {text: 'Risiko systematisch einschätzen – z. B. mit der Braden-Skala'},
		},
		{
			id: 'body',
			type: 'body',
			start: 127.1,
			chapter: {num: '03', title: 'Gefährdete Körperstellen', kicker: 'Wo entsteht ein Dekubitus?'},
			view: 'back',
			markers: [
				{key: 'hinterkopf', label: 'Hinterkopf'},
				{key: 'schulterblaetter', label: 'Schulterblätter'},
				{key: 'kreuzbein', label: 'Kreuzbein', sub: 'Häufigste Stelle in Rückenlage'},
				{key: 'fersen', label: 'Fersen'},
			],
			footnote: {text: 'Auch: Ellenbogen, Sitzbein, Hüfte, Knöchel, Ohren'},
		},
		{
			id: 'fingertest',
			type: 'fingertest',
			start: 151.3,
			chapter: {num: '03', title: 'Fingertest nach Phillips', kicker: 'Rötung prüfen'},
			title: 'Fingertest nach Phillips',
			steps: [{label: 'Kurz mit dem Finger auf die Rötung drücken'}, {label: 'Loslassen und Hautfarbe beobachten'}],
			outcomes: [
				{blanches: true, title: 'Wird weiß', verdict: 'Noch kein Dekubitus'},
				{blanches: false, title: 'Bleibt rot', verdict: 'Dekubitus Stadium 1'},
			],
		},
		{
			id: 'stages',
			type: 'stages',
			start: 176.8,
			tone: 'cream',
			chapter: {num: '04', title: 'Die vier Stadien', kicker: 'Einteilung'},
			label: 'Stadium',
			stages: [
				{title: 'Nicht wegdrückbare Rötung', sub: 'Haut noch intakt'},
				{title: 'Teilverlust der Haut', sub: 'Blase oder flache, offene Wunde'},
				{title: 'Verlust aller Haut­schichten', sub: 'Schaden bis ins Fettgewebe'},
				{title: 'Vollständiger Gewebe­verlust', sub: 'Muskel, Sehne oder Knochen sichtbar'},
			],
			footnote: {text: 'Nach EPUAP/NPIAP auch „Kategorie 1–4“ genannt'},
		},
		{
			id: 'measures',
			type: 'list',
			start: 226.9,
			chapter: {num: '05', title: 'Maßnahmen der Prophylaxe', kicker: 'Was du tun kannst'},
			layout: 'grid',
			columns: 3,
			items: [
				{label: 'Umlagern', sub: 'Regelmäßig Position wechseln, z. B. 30°-Lagerung', icon: 'turn'},
				{label: 'Mobilisieren', sub: 'Eigenbewegung fördern, so oft es geht', icon: 'walk'},
				{label: 'Haut­kontrolle', sub: 'Täglich prüfen, Fingertest bei Rötung', icon: 'skin'},
				{label: 'Druck­entlastende Hilfs­mittel', sub: 'Weichlagerung, Fersen frei lagern', icon: 'mattress'},
				{label: 'Eiweiß­reiche Ernährung', sub: 'Und ausreichend trinken', icon: 'protein'},
				{label: 'Dokumen­tation', sub: 'Bewegungsplan & Hautbefund festhalten', icon: 'doc'},
			],
		},
		{
			id: 'case',
			type: 'case',
			start: 298.6,
			tone: 'cream',
			chapter: {num: '06', title: 'Patientenfall', kicker: 'Fallbeispiel'},
			badge: 'Jetzt bist du dran!',
			patient: 'Herr Schmidt, 82 Jahre',
			facts: [
				{text: 'Nach Hüft-OP seit 5 Tagen meist im Bett'},
				{text: 'Isst kaum, trinkt zu wenig'},
				{text: 'Harninkontinent, Haut oft feucht'},
				{text: 'Rötung am Kreuzbein – beim Fingertest bleibt sie rot'},
			],
			question: {text: 'Was erkennst du – und was tust du?'},
			answers: [
				{text: 'Stadium 1: Kreuzbein sofort entlasten'},
				{text: 'Bewegungsplan & Weichlagerung'},
				{text: 'Ernährung, Trinken & Hautschutz'},
				{text: 'Dokumentieren & Pflegefachkraft informieren'},
			],
		},
		{
			id: 'outro',
			type: 'outro',
			start: 354.4,
			chapter: {num: '07', title: 'Zusammenfassung', kicker: 'Das Wichtigste'},
			recapTitle: 'Das Wichtigste in Kürze',
			recap: [
				{text: 'Dekubitus = Gewebeschaden durch Druck'},
				{text: 'Besonders gefährdet: Kreuzbein & Fersen'},
				{text: 'Rötung bleibt beim Fingertest → Stadium 1'},
				{text: 'Bewegen, entlasten, Haut prüfen, dokumentieren'},
			],
			endCardAt: 13.3,
			cta: 'Abonnieren nicht vergessen',
			next: {kicker: 'Nächste Folge', title: 'Sturzprophylaxe'},
			tagline: 'Von Azubis. Für Azubis.',
		},
	],
};
