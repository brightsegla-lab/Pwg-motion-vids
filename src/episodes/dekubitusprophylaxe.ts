import type {Episode} from '../engine/types';

// Prophylaxen-Reihe – Dekubitusprophylaxe
//
// Audio: public/audio/dekubitusprophylaxe.mp3 (379.74 s)
// Timing reference: assets/transcript/dekubitusprophylaxe.json / .srt (word timestamps).
//
// Every time below is ABSOLUTE on the audio. `say(t)` takes the second where the
// matching phrase/word starts in the transcript and shows the element 0.2 s earlier.
// Find a word's time with:  python3 scripts/cue.py assets/transcript/dekubitusprophylaxe.json "Wort" [ab_Sekunde]
//
// Only content that is actually said in the audio is shown.
// ­ = soft hyphen, lets long German words break cleanly in narrow cards.

const say = (spoken: number) => Math.round((spoken - 0.2) * 100) / 100;

export const dekubitusprophylaxe: Episode = {
	id: 'Dekubitusprophylaxe',
	audio: 'audio/dekubitusprophylaxe.mp3',
	duration: 379.74,
	scenes: [
		{
			id: 'intro',
			type: 'title',
			start: 0,
			photo: 'brand/studio-mic.jpg',
			subtitle: {text: 'Der Podcast von Azubis für Azubis', at: say(15.58)},
			switchAt: say(20.58), // "Genau, wir haben uns überlegt, eine kleine Reihe …"
			series: {text: 'Prophylaxen-Reihe', at: say(22.24)},
			seriesNote: {text: 'Eine Prophylaxe pro Folge', at: say(35.74)},
			episodeTitle: {text: 'Dekubitusprophylaxe', at: say(39.6)},
		},
		{
			id: 'definition',
			type: 'list',
			start: say(41.24), // "Klassiker. Das ist doch die mit dem Wundliegen, oder?"
			chapter: {num: '01', title: 'Was ist ein Dekubitus?', kicker: '„Die mit dem Wundliegen“'},
			layout: 'chain',
			illustration: 'patientProfile',
			items: [
				{label: 'Dekubitus = Druckgeschwür', icon: 'skin', at: say(45.02)},
				{
					label: 'Anhaltender Druck auf Haut & Gewebe',
					sub: 'zu lange in der gleichen Position',
					icon: 'mattress',
					at: say(47.22),
					subAt: say(50.14),
				},
				{label: 'Durchblutung gestört', sub: 'zu wenig Sauerstoff im Gewebe', icon: 'pulse', at: say(53.88), subAt: say(56.4)},
				{label: 'Gewebe kann absterben', sub: 'im schlimmsten Fall', icon: 'alert', at: say(58.74)},
			],
			footnote: {text: 'Deshalb ist Prophylaxe so wichtig', at: say(65.58)},
		},
		{
			id: 'risk',
			type: 'list',
			start: say(67.9), // "Lass uns kurz über die Risikofaktoren reden …"
			chapter: {num: '02', title: 'Risikofaktoren', kicker: 'Wer ist besonders gefährdet?'},
			layout: 'pills',
			items: [
				{label: 'Bettlägerigkeit', sub: 'oder eingeschränkte Beweglichkeit', icon: 'bed', at: say(73.72), subAt: say(74.84)},
				{label: 'Hohes Alter', icon: 'elderly', at: say(76.9)},
				{label: 'Lähmungen', icon: 'wheelchair', at: say(78.08)},
				{label: 'Mangelernährung', sub: 'oder Untergewicht', icon: 'nutrition', at: say(79.04), subAt: say(79.9)},
				{label: 'Zu wenig trinken', icon: 'glass', at: say(81.08)},
				{label: 'Diabetes', icon: 'glucose', at: say(82.34)},
				{label: 'Durchblutungsstörungen', icon: 'pulse', at: say(83.26)},
				{label: 'Inkontinenz', sub: 'feuchte Haut ist anfälliger', icon: 'drop', at: say(87.64), subAt: say(88.88)},
				{label: 'Eingeschränktes Empfinden', sub: 'für Schmerz oder Berührung', icon: 'hand', at: say(90.8)},
				{label: 'Reibung & Scherkräfte', sub: 'z. B. beim Hochziehen im Bett', icon: 'friction', at: say(94.1), subAt: say(95.74)},
			],
		},
		{
			id: 'shear',
			type: 'list',
			start: say(97.58), // "Okay, Moment. Scherkräfte? Was genau ist das noch mal?"
			chapter: {num: '02', title: 'Scherkräfte', kicker: 'Was genau ist das?'},
			layout: 'chain',
			illustration: 'patientProfile',
			items: [
				{label: 'Patient rutscht im Bett nach unten', icon: 'bed', at: say(101.38)},
				{label: 'Du ziehst ihn wieder hoch', sub: 'ohne ihn richtig anzuheben', icon: 'friction', at: say(104.22), subAt: say(105.8)},
				{label: 'Haut reibt über die Matratze', icon: 'skin', at: say(107.5)},
				{label: 'Gewebe wird zusätzlich belastet', icon: 'alert', at: say(109.52)},
			],
			footnote: {text: 'Lieber anheben statt ziehen!', at: say(113.88)},
		},
		{
			id: 'body',
			type: 'body',
			start: say(116.8), // "Und wo entsteht so was am häufigsten?"
			chapter: {num: '03', title: 'Wo entsteht ein Dekubitus?', kicker: 'Am häufigsten'},
			view: 'back',
			lead: {text: 'Vor allem, wo Knochen dicht unter der Haut liegen', at: say(121.5)},
			markers: [
				{key: 'hinterkopf', label: 'Hinterkopf', at: say(125.3)},
				{key: 'schulterblaetter', label: 'Schulter­blätter', at: say(126.18)},
				{key: 'ellenbogen', label: 'Ellenbogen', at: say(127.38)},
				{key: 'kreuzbein', label: 'Kreuzbein & Steißbein', at: say(128.28)},
				{key: 'huefte', label: 'Hüfte', at: say(130.0)},
				{key: 'sitzbein', label: 'Sitzbein­höcker', at: say(130.76)},
				{key: 'knie', label: 'Knie', at: say(131.84)},
				{key: 'knoechel', label: 'Knöchel', at: say(132.48)},
				{key: 'fersen', label: 'Fersen', at: say(133.24)},
			],
			footnote: {text: 'Wo Knochen auf Haut trifft, drückt es am meisten', at: say(137.42)},
		},
		{
			id: 'fingertest',
			type: 'fingertest',
			start: say(149.58) - 0.4, // header lands on "Fingertest nach Phillips"
			chapter: {num: '03', title: 'Fingertest nach Phillips', kicker: 'Früh erkennen'},
			title: 'Fingertest nach Phillips',
			steps: [{label: 'Kurz mit dem Finger auf die gerötete Stelle drücken', at: say(151.32)}],
			outcomes: [
				{blanches: true, title: 'Haut noch intakt', verdict: 'Kurz heller, Rötung kommt zurück', at: say(154.78), verdictAt: say(157.28)},
				{blanches: false, title: 'Schon ein Dekubitus', verdict: 'Bleibt rot, egal wie fest du drückst', at: say(160.38), verdictAt: say(162.48)},
			],
		},
		{
			id: 'stages',
			type: 'stages',
			start: say(169.14), // "Und die Stadien …"
			tone: 'cream',
			chapter: {num: '04', title: 'Die vier Stadien'},
			label: 'Stadium',
			stages: [
				{title: 'Nicht wegdrückbare Rötung', sub: 'Haut noch intakt', at: say(175.74)},
				{title: 'Teilverlust der Haut', sub: 'Kann sich als Blase zeigen', at: say(184.86), subAt: say(188.14)},
				{title: 'Vollständiger Hautverlust', sub: 'Fett sichtbar, noch keine Knochen oder Sehnen', at: say(190.24), subAt: say(193.08)},
				{title: 'Vollständiger Gewebe­verlust', sub: 'Knochen, Sehnen oder Muskeln liegen frei', at: say(196.92), subAt: say(200.08)},
			],
			footnote: {text: 'Stadium 1 = genau das, was der Fingertest zeigt', at: say(181.4)},
		},
		{
			id: 'measures',
			type: 'list',
			start: say(207.88), // "Genau deshalb reden wir über die Prophylaxe."
			chapter: {num: '05', title: 'Was macht man dagegen?', kicker: 'Prophylaxe'},
			layout: 'grid',
			columns: 4,
			items: [
				{label: 'Regelmäßig umlagern', sub: 'klassisch alle 2 Stunden, nach individuellem Plan', icon: 'turn', at: say(212.5), subAt: say(219.02)},
				{label: '30°- und 135°-Lagerung', sub: 'nehmen Druck von gefährdeten Stellen', icon: 'tilt', at: say(223.78), subAt: say(231.02)},
				{label: 'Mobilisation fördern', sub: 'Aufstehen, gehen, Bewegungs­übungen', icon: 'walk', at: say(234.08), subAt: say(236.72)},
				{label: 'Haut­kontrolle', sub: 'täglich, plus Hautpflege mit geeigneten Produkten', icon: 'skin', at: say(239.68), subAt: say(244.36)},
				{
					label: 'Druck­entlastende Hilfsmittel',
					sub: 'Antidekubitus­matratze, Sitzkissen, Fersen­schoner',
					icon: 'mattress',
					at: say(248.66),
					subAt: say(250.34),
				},
				{label: 'Ernährung', sub: 'ausreichend trinken, eiweißreich essen', icon: 'protein', at: say(253.84), subAt: say(256.78)},
				{label: 'Alles dokumen­tieren', sub: 'Maßnahmen und Hautzustand', icon: 'doc', at: say(262.5), subAt: say(265.34)},
			],
		},
		{
			id: 'case',
			type: 'case',
			start: say(267.1), // "Okay, lass uns das mal an einem Fall durchgehen."
			tone: 'cream',
			chapter: {num: '06', title: 'Fallbeispiel'},
			patient: {text: 'Bettlägeriger Patient', at: say(272.48)},
			facts: [
				{text: 'Hohes Alter', at: say(274.98)},
				{text: 'Isst wenig, trinkt wenig', at: say(276.04)},
				{text: 'Rötung am Steißbein', at: say(278.18)},
				{text: 'Wird beim Fingertest nicht heller', at: say(280.42)},
			],
			conclusion: {text: 'Rötung bleibt: schon Stadium 1', at: say(282.58)},
			question: {text: 'Was machst du jetzt als Erstes?', at: say(287.84)},
			answerGroups: [
				{
					title: 'Als Erstes',
					at: say(289.72),
					items: [
						{text: 'Sofort umlagern', at: say(289.72)},
						{text: 'Druck von der Stelle nehmen', at: say(291.28)},
						{text: 'Dokumentieren', at: say(292.74)},
					],
				},
				{
					title: 'Danach',
					at: say(294.5),
					items: [
						{text: 'Engmaschiger kontrollieren', at: say(295.26)},
						{text: 'Öfter umlagern als sonst', at: say(297.16)},
						{text: 'Genug trinken und essen', at: say(298.8)},
					],
				},
			],
		},
		{
			id: 'outro',
			type: 'outro',
			start: say(311.46), // "Fassen wir noch mal ganz kurz zusammen."
			chapter: {num: '07', title: 'Kurz zusammengefasst'},
			recapTitle: 'Kurz zusammengefasst',
			recap: [
				{label: 'Druckgeschwür durch anhaltenden Druck', sub: 'meist an knochennahen Stellen', at: say(313.48)},
				{
					label: 'Risikofaktoren',
					sub: 'Bettlägerigkeit, hohes Alter, Mangelernährung, Feuchtigkeit durch Inkontinenz',
					at: say(318.76),
				},
				{label: 'Früherkennung', sub: 'Fingertest nach Phillips · Einteilung in vier Stadien', at: say(326.1)},
				{
					label: 'Maßnahmen',
					sub: 'Umlagern, mobilisieren, Haut kontrollieren & pflegen, druckentlastende Hilfsmittel, Ernährung & Flüssigkeit',
					at: say(331.12),
				},
			],
			endCardAt: say(342.64), // "So, das war's für heute von uns."
			ctas: [
				{text: 'Abonniert uns gern', icon: 'bell', at: say(353.0)},
				{text: "Schreibt's in die Kommentare", icon: 'chat', at: say(365.28)},
			],
			farewell: {text: 'Bis zum nächsten Mal bei Pflege-WG', at: say(374.56)},
		},
	],
};
