// Pflege-WG brand tokens. Every colour/font in the video comes from here.

export const colors = {
	mint: '#2ECC91',
	green: '#1B8F5A',
	greenDeep: '#0F5C3A',
	greenInk: '#0B3F28',
	cream: '#F6F2E9',
	creamDeep: '#ECE5D6',
	white: '#FFFFFF',
	ink: '#101814',
	inkSoft: '#3C4A43',
	yellow: '#F4C430',
	// Severity scale (Dekubitus-Kategorien, Risiko-Marker)
	sev1: '#F4C430',
	sev2: '#F08A24',
	sev3: '#D9362B',
	sev4: '#7A1414',
	alert: '#D9362B',
} as const;

export const gradients = {
	brand: `linear-gradient(135deg, ${colors.mint} 0%, #25B67D 45%, ${colors.green} 100%)`,
	brandDeep: `linear-gradient(135deg, #27B57F 0%, ${colors.green} 55%, ${colors.greenDeep} 100%)`,
};

export const fonts = {
	sans: '"Montserrat", "Inter", sans-serif',
	marker: '"Kalam", "Montserrat", cursive',
	script: '"Caveat", cursive',
};

// Type scale tuned for 1080p that stays readable on a phone held upright.
export const type = {
	hero: 150,
	h1: 96,
	h2: 68,
	h3: 52,
	body: 44,
	small: 34,
	kicker: 30,
};

export const radius = {card: 28, pill: 999};

export const shadow = {
	card: '0 18px 50px rgba(11, 63, 40, 0.18), 0 2px 6px rgba(11, 63, 40, 0.08)',
	soft: '0 10px 30px rgba(11, 63, 40, 0.12)',
};

export type Tone = 'green' | 'cream';
