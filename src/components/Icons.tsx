import React from 'react';

// Thin-line icon set drawn to match the logo's single-weight rounded stroke.
// 64×64 grid, stroke = currentColor. Add new icons here for later episodes.
const paths: Record<string, React.ReactNode> = {
	bed: (
		<>
			<path d="M6 14V52M58 30V52M6 42H58M6 36H58" />
			<circle cx="15" cy="29" r="5" />
			<path d="M22 36C26 27 44 25 56 29L58 36" />
		</>
	),
	elderly: (
		<>
			<circle cx="29" cy="11" r="5" />
			<path d="M30 18C24 24 23 31 26 38M26 38L21 55M26 38L33 55M27 25L39 32" />
			<path d="M39 32L41 56M37 32C37 28 43 28 43 32" />
		</>
	),
	nutrition: (
		<>
			<circle cx="33" cy="34" r="15" />
			<circle cx="33" cy="34" r="8" />
			<path d="M9 12V54M5 12V21C5 26 13 26 13 21V12M57 12C50 20 50 30 57 34V54" />
		</>
	),
	drop: (
		<>
			<path d="M32 7C25 20 15 29 15 40A17 17 0 0 0 49 40C49 29 39 20 32 7Z" />
			<path d="M23 41A9 9 0 0 0 30 50" />
		</>
	),
	friction: (
		<>
			<rect x="8" y="20" width="48" height="9" rx="4" />
			<rect x="8" y="35" width="48" height="9" rx="4" />
			<path d="M14 11H46M40 6L46 11L40 16" />
			<path d="M50 53H18M24 48L18 53L24 58" />
		</>
	),
	turn: (
		<>
			<path d="M50 24A20 20 0 0 0 14 26M14 26V16M14 26H24" />
			<path d="M14 40A20 20 0 0 0 50 38M50 38V48M50 38H40" />
			<circle cx="24" cy="32" r="3.5" />
			<path d="M30 32H44" />
		</>
	),
	walk: (
		<>
			<circle cx="35" cy="9" r="5" />
			<path d="M33 17L28 34M31 22L21 28M31 22L41 29M28 34L20 45L18 56M28 34L37 44L41 56" />
		</>
	),
	skin: (
		<>
			<circle cx="26" cy="26" r="15" />
			<path d="M37 37L55 55" strokeWidth={6} />
			<path d="M17 30C21 25 31 25 35 30" />
			<circle cx="26" cy="22" r="3" />
		</>
	),
	mattress: (
		<>
			<rect x="6" y="32" width="52" height="16" rx="7" />
			<path d="M19 32V48M32 32V48M45 32V48" />
			<path d="M20 8V22M15 17L20 22L25 17M44 8V22M39 17L44 22L49 17" />
			<path d="M10 56H54" />
		</>
	),
	protein: (
		<>
			<path d="M32 7C21 7 13 27 13 39C13 51 21 58 32 58C43 58 51 51 51 39C51 27 43 7 32 7Z" />
			<circle cx="32" cy="40" r="8" />
		</>
	),
	doc: (
		<>
			<rect x="13" y="11" width="38" height="47" rx="5" />
			<rect x="23" y="6" width="18" height="9" rx="3" />
			<path d="M21 27H43M21 35H43M21 43H33" />
			<path d="M37 47L41 51L49 42" />
		</>
	),
	wheelchair: (
		<>
			<circle cx="24" cy="9" r="4.5" />
			<path d="M24 16V32H40L46 48M18 20V34M24 24H36" />
			<circle cx="27" cy="44" r="13" />
		</>
	),
	glass: (
		<>
			<path d="M17 9H47L42 57H22Z" />
			<path d="M20 28C26 25 30 31 36 28C40 26 42 27 44 28" />
		</>
	),
	glucose: (
		<>
			<rect x="10" y="9" width="30" height="46" rx="6" />
			<rect x="15" y="15" width="20" height="13" rx="2" />
			<circle cx="25" cy="42" r="4" />
			<path d="M51 26C47 33 45 37 45 41A6 6 0 0 0 57 41C57 37 55 33 51 26Z" />
		</>
	),
	hand: (
		<path d="M21 34V16A3 3 0 0 1 27 16V30M27 30V11A3 3 0 0 1 33 11V30M33 30V14A3 3 0 0 1 39 14V32M39 32V21A3 3 0 0 1 45 21V40C45 50 39 57 30 57C24 57 20 53 16 47L10 38A3 3 0 0 1 15 34L21 40" />
	),
	tilt: (
		<>
			<path d="M6 52H58" />
			<path d="M28 52L56 34V52Z" />
			<circle cx="13" cy="40" r="5" />
			<path d="M20 38L52 25" strokeWidth={6} />
		</>
	),
	chat: (
		<>
			<path d="M9 12H55V42H30L17 53V42H9Z" />
			<path d="M21 27H21.5M32 27H32.5M43 27H43.5" strokeWidth={5} />
		</>
	),
	check: <path d="M14 33L26 45L50 19" />,
	alert: (
		<>
			<path d="M32 8L58 54H6Z" />
			<path d="M32 24V38" />
			<circle cx="32" cy="46" r="1.5" />
		</>
	),
	bell: (
		<>
			<path d="M18 44V30C18 21 24 15 32 15C40 15 46 21 46 30V44L51 49H13Z" />
			<path d="M27 53C27 58 37 58 37 53M32 10V15" />
		</>
	),
	clock: (
		<>
			<circle cx="32" cy="33" r="22" />
			<path d="M32 19V33L42 40" />
		</>
	),
	pulse: <path d="M6 34H19L25 20L34 48L40 28L44 34H58" />,
	question: (
		<>
			<circle cx="32" cy="32" r="24" />
			<path d="M24 25C24 19 28 16 32 16C37 16 40 19 40 24C40 31 32 31 32 38" />
			<circle cx="32" cy="46" r="1.5" />
		</>
	),
	arrowRight: <path d="M10 32H52M40 20L52 32L40 44" />,
	play: <path d="M22 14L50 32L22 50Z" />,
	scale: (
		<>
			<path d="M10 52H54M32 12V52M14 20H50" />
			<path d="M14 20L7 36A8 8 0 0 0 21 36ZM50 20L43 36A8 8 0 0 0 57 36Z" />
		</>
	),
};

export type IconName = keyof typeof paths;

export const Icon: React.FC<{
	name: string;
	size?: number;
	color?: string;
	stroke?: number;
	style?: React.CSSProperties;
}> = ({name, size = 64, color = 'currentColor', stroke = 3.4, style}) => (
	<svg
		viewBox="0 0 64 64"
		width={size}
		height={size}
		fill="none"
		stroke={color}
		strokeWidth={stroke}
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{display: 'block', overflow: 'visible', ...style}}
	>
		{paths[name] ?? paths.question}
	</svg>
);
