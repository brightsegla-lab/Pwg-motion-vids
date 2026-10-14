import React from 'react';
import {interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {colors, fonts} from '../brand/theme';
import {progress} from '../lib/anim';

const pulse = (f: number, period = 48) => 0.5 - 0.5 * Math.cos((f / period) * Math.PI * 2);

/* ------------------------------------------------------------------ */
/* Patient lying supine, side view – shows where weight meets mattress */
/* ------------------------------------------------------------------ */

export const PatientProfile: React.FC<{
	width: number;
	/** 0 = no pressure shown, 1 = arrows, 2 = mild redness, 3 = disturbed perfusion, 4 = necrosis */
	level: number;
	points?: ('sacrum' | 'heel' | 'head' | 'scapula')[];
	at?: number;
}> = ({width, level, points = ['sacrum', 'heel'], at = 0}) => {
	const f = useCurrentFrame();
	const show = progress(f, at, 24);
	const arrowsP = progress(f, at + 20, 24) * (level >= 1 ? 1 : 0);
	const sev = interpolate(level, [1, 2, 3, 4], [0, 0.35, 0.7, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const glowColor = interpolateColors(sev, [0, 0.5, 1], [colors.sev2, colors.sev3, colors.sev4]);
	const glowR = 34 + sev * 18 + pulse(f) * 6;
	const pos: Record<string, [number, number]> = {
		sacrum: [420, 252],
		heel: [712, 250],
		head: [104, 236],
		scapula: [244, 250],
	};
	return (
		<svg viewBox="0 0 800 400" width={width} height={width / 2} style={{opacity: show, overflow: 'visible'}}>
			<defs>
				<radialGradient id="pp-glow">
					<stop offset="0%" stopColor={glowColor} stopOpacity={0.95} />
					<stop offset="60%" stopColor={glowColor} stopOpacity={0.45} />
					<stop offset="100%" stopColor={glowColor} stopOpacity={0} />
				</radialGradient>
			</defs>
			{/* bed */}
			<rect x={30} y={252} width={740} height={58} rx={20} fill="#E9F5EE" stroke={colors.greenInk} strokeWidth={4} />
			<path d="M30 340 H770 M60 310 V370 M740 310 V370" stroke={colors.greenInk} strokeWidth={4} strokeLinecap="round" fill="none" />
			<ellipse cx={120} cy={242} rx={78} ry={16} fill="#FFFFFF" stroke={colors.greenInk} strokeWidth={4} />
			{/* body */}
			<path
				d="M162 214 C190 180 220 172 260 172 C320 170 360 176 400 182 C440 188 470 196 520 204 C570 210 610 212 650 216 C690 220 715 218 728 200 C736 192 746 196 744 208 C744 228 738 246 718 251 L640 247 C610 245 590 247 560 249 C510 251 470 253 430 253 C400 253 380 251 340 248 C300 246 260 251 230 251 C200 251 178 245 162 239"
				fill="#FFFFFF"
				stroke={colors.ink}
				strokeWidth={4.5}
				strokeLinejoin="round"
			/>
			<circle cx={128} cy={200} r={38} fill="#FFFFFF" stroke={colors.ink} strokeWidth={4.5} />
			<path d="M214 196 C260 214 320 220 420 214" stroke={colors.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
			{/* pressure glow */}
			{level >= 2
				? points.map((p) => (
						<ellipse key={p} cx={pos[p][0]} cy={pos[p][1]} rx={glowR * 1.3} ry={glowR * 0.8} fill="url(#pp-glow)" />
					))
				: null}
			{level >= 2
				? points.map((p) => <circle key={p + 'd'} cx={pos[p][0]} cy={pos[p][1]} r={9} fill={glowColor} />)
				: null}
			{/* weight arrows */}
			<g opacity={arrowsP} stroke={colors.greenInk} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
				{points.map((p) => {
					const [x] = pos[p];
					const y0 = 60 + (1 - arrowsP) * -20;
					return (
						<g key={p + 'a'}>
							<path d={`M${x} ${y0} V${y0 + 70}`} />
							<path d={`M${x - 14} ${y0 + 56} L${x} ${y0 + 72} L${x + 14} ${y0 + 56}`} />
						</g>
					);
				})}
			</g>
			<text
				x={565}
				y={110}
				fontFamily={fonts.sans}
				fontWeight={700}
				fontSize={30}
				fill={colors.greenInk}
				opacity={arrowsP}
				textAnchor="middle"
			>
				Druck
			</text>
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* Standing body, back view – numbered risk markers                    */
/* ------------------------------------------------------------------ */

export type BodyPoint = {x: number; y: number};

export const BODY_POINTS: Record<string, BodyPoint[]> = {
	hinterkopf: [{x: 200, y: 64}],
	schulterblaetter: [
		{x: 150, y: 236},
		{x: 250, y: 236},
	],
	ellenbogen: [
		{x: 84, y: 352},
		{x: 316, y: 352},
	],
	kreuzbein: [{x: 200, y: 440}],
	huefte: [
		{x: 108, y: 462},
		{x: 292, y: 462},
	],
	sitzbein: [
		{x: 164, y: 506},
		{x: 236, y: 506},
	],
	knie: [
		{x: 156, y: 664},
		{x: 244, y: 664},
	],
	knoechel: [
		{x: 122, y: 812},
		{x: 278, y: 812},
	],
	fersen: [
		{x: 158, y: 862},
		{x: 242, y: 862},
	],
};

export const BodyBack: React.FC<{
	height: number;
	markers: {key: string; at: number; label: string}[];
	fill?: string;
	line?: string;
}> = ({height, markers, fill = '#FFFFFF', line = colors.green}) => {
	const f = useCurrentFrame();
	const w = (height * 400) / 900;
	return (
		<svg viewBox="0 0 400 900" width={w} height={height} style={{overflow: 'visible'}}>
			<defs>
				<filter id="bb-shadow" x="-20%" y="-10%" width="140%" height="120%">
					<feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#062A1A" floodOpacity="0.22" />
				</filter>
				<radialGradient id="bb-glow">
					<stop offset="0%" stopColor={colors.sev3} stopOpacity={0.75} />
					<stop offset="100%" stopColor={colors.sev2} stopOpacity={0} />
				</radialGradient>
			</defs>
			<g filter="url(#bb-shadow)" fill={fill} stroke={fill} strokeLinecap="round" strokeLinejoin="round">
				<ellipse cx={200} cy={78} rx={50} ry={60} stroke="none" />
				<rect x={176} y={120} width={48} height={60} rx={14} stroke="none" />
				<path
					d="M118 176 C150 158 250 158 282 176 C304 188 308 214 302 246 L290 380 C288 418 292 448 298 484 C290 512 110 512 102 484 C108 448 112 418 110 380 L98 246 C92 214 96 188 118 176 Z"
					stroke="none"
				/>
				<path d="M114 196 C92 252 84 320 78 392 L72 470" strokeWidth={44} fill="none" />
				<path d="M286 196 C308 252 316 320 322 392 L328 470" strokeWidth={44} fill="none" />
				<ellipse cx={71} cy={500} rx={20} ry={34} stroke="none" />
				<ellipse cx={329} cy={500} rx={20} ry={34} stroke="none" />
				<path d="M156 470 C154 580 154 680 156 790 L158 846" strokeWidth={70} fill="none" />
				<path d="M244 470 C246 580 246 680 244 790 L242 846" strokeWidth={70} fill="none" />
			</g>
			{/* back-view detail lines */}
			<g stroke={line} strokeOpacity={0.45} strokeWidth={3.5} fill="none" strokeLinecap="round">
				<path d="M200 182 V430" strokeDasharray="3 13" />
				<path d="M132 214 C150 250 170 262 182 252" />
				<path d="M268 214 C250 250 230 262 218 252" />
				<path d="M200 480 V506" />
				<path d="M160 116 C180 128 220 128 240 116" />
			</g>
			{markers.map((m, i) => {
				const p = progress(f, m.at, 18);
				const pts = BODY_POINTS[m.key] ?? [];
				return pts.map((pt, j) => (
					<g key={`${m.key}${j}`} opacity={p}>
						<circle cx={pt.x} cy={pt.y} r={36 + pulse(f + i * 10) * 6} fill="url(#bb-glow)" />
						<circle cx={pt.x} cy={pt.y} r={20} fill={colors.sev3} stroke="#FFFFFF" strokeWidth={4} />
						<text
							x={pt.x}
							y={pt.y + 8}
							textAnchor="middle"
							fontFamily={fonts.sans}
							fontWeight={800}
							fontSize={24}
							fill="#FFFFFF"
						>
							{i + 1}
						</text>
					</g>
				));
			})}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* Skin cross-section – lesion depth per Dekubitus category            */
/* ------------------------------------------------------------------ */

const LAYERS = [
	{name: 'Oberhaut', y: 0, h: 20, c: '#F1D2BC'},
	{name: 'Lederhaut', y: 20, h: 42, c: '#E6B497'},
	{name: 'Unterhaut / Fett', y: 62, h: 52, c: '#F5E2A4'},
	{name: 'Muskel', y: 114, h: 50, c: '#C8645B'},
	{name: 'Knochen', y: 164, h: 36, c: '#EEE7DA'},
];

export const SkinSection: React.FC<{stage: 1 | 2 | 3 | 4; width: number}> = ({stage, width}) => {
	const depth = [0, 0, 34, 104, 182][stage];
	const halfW = [0, 0, 70, 88, 100][stage];
	const cx = 180;
	return (
		<svg viewBox="0 -14 360 214" width={width} height={(width * 214) / 360}>
			<defs>
				<clipPath id={`ss-clip-${stage}`}>
					<rect x={0} y={0} width={360} height={200} rx={18} />
				</clipPath>
			</defs>
			<g clipPath={`url(#ss-clip-${stage})`}>
				{LAYERS.map((l) => (
					<rect key={l.name} x={0} y={l.y} width={360} height={l.h} fill={l.c} />
				))}
				<path d="M0 182 H360" stroke="#D8CDBA" strokeWidth={3} />
				{stage === 1 ? <ellipse cx={cx} cy={6} rx={115} ry={30} fill={colors.sev3} opacity={0.55} /> : null}
				{stage === 2 ? <ellipse cx={cx} cy={6} rx={120} ry={22} fill={colors.sev3} opacity={0.35} /> : null}
				{depth > 0 ? (
					<path
						d={`M${cx - halfW - 20} 0 C${cx - halfW} 0 ${cx - halfW * 0.8} ${depth} ${cx} ${depth} C${cx + halfW * 0.8} ${depth} ${cx + halfW} 0 ${cx + halfW + 20} 0 Z`}
						fill={stage === 4 ? '#5A0F0F' : stage === 3 ? '#9C2A22' : '#C2453A'}
						stroke={stage >= 3 ? '#3E0A0A' : '#9C2A22'}
						strokeWidth={3}
					/>
				) : null}
			</g>
			{stage === 2 ? (
				<path d={`M${cx + 70} 0 C${cx + 74} -16 ${cx + 106} -16 ${cx + 110} 0`} fill="#FBE6DC" stroke="#C2453A" strokeWidth={3} />
			) : null}
			<rect x={0} y={0} width={360} height={200} rx={18} fill="none" stroke="rgba(16,24,20,0.25)" strokeWidth={3} />
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* Fingertest – finger presses on a reddened patch                     */
/* ------------------------------------------------------------------ */

export const FingerTest: React.FC<{
	width: number;
	at: number;
	blanches: boolean;
}> = ({width, at, blanches}) => {
	const f = useCurrentFrame();
	const down = progress(f, at, 24);
	const up = progress(f, at + 60, 24);
	const press = down * (1 - up); // 0..1..0
	const fingerY = interpolate(press, [0, 1], [-70, 0]);
	const fingerOpacity = progress(f, at - 16, 16) * (1 - progress(f, at + 84, 18));
	// Blanching: intact skin turns pale under the finger and reddens again after release;
	// a Dekubitus stays red whatever the pressure.
	const pale = blanches ? press : 0;
	const red = interpolateColors(pale, [0, 1], ['#D9534A', '#F7E4DA']);
	return (
		<svg viewBox="0 0 400 300" width={width} height={(width * 300) / 400} style={{overflow: 'visible'}}>
			<defs>
				<radialGradient id={`ft-red-${blanches ? 'a' : 'b'}`}>
					<stop offset="0%" stopColor="#D9534A" stopOpacity={0.85} />
					<stop offset="100%" stopColor="#D9534A" stopOpacity={0} />
				</radialGradient>
			</defs>
			{/* skin block */}
			<rect x={20} y={170} width={360} height={110} rx={22} fill="#EBC3A8" />
			<rect x={20} y={170} width={360} height={30} rx={14} fill="#F1D2BC" />
			<ellipse cx={200} cy={180} rx={120} ry={26} fill={`url(#ft-red-${blanches ? 'a' : 'b'})`} />
			<ellipse cx={200} cy={178} rx={46} ry={13} fill={red} />
			{/* finger */}
			<g transform={`translate(0 ${fingerY})`} opacity={fingerOpacity}>
				<path
					d="M160 -40 L160 140 C160 166 178 172 200 172 C222 172 240 166 240 140 L240 -40"
					fill="#FFFFFF"
					stroke={colors.ink}
					strokeWidth={5}
					strokeLinejoin="round"
				/>
				<path d="M176 118 C176 100 224 100 224 118 L224 140 C224 152 176 152 176 140 Z" fill="none" stroke={colors.ink} strokeWidth={4} />
				<path d="M168 40 C186 48 214 48 232 40" stroke={colors.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
			</g>
			{/* pressure ticks */}
			<g opacity={press} stroke={colors.greenInk} strokeWidth={4} strokeLinecap="round">
				<path d="M112 150 L136 162 M288 150 L264 162 M116 120 L140 138 M284 120 L260 138" />
			</g>
		</svg>
	);
};



/* ------------------------------------------------------------------ */
/* Standing body, front view – affected regions filled (Parese/Plegie) */
/* ------------------------------------------------------------------ */

export type BodyRegion = 'armL' | 'armR' | 'legL' | 'legR' | 'trunkL' | 'trunkR';

export const BodyFront: React.FC<{
	height: number;
	affected: BodyRegion[];
	base?: string;
	hit?: string;
}> = ({height, affected, base = '#DCEBE2', hit = colors.sev3}) => {
	const c = (r: BodyRegion) => (affected.includes(r) ? hit : base);
	const w = (height * 400) / 900;
	const torso =
		'M118 176 C150 158 250 158 282 176 C304 188 308 214 302 246 L290 380 C288 418 292 448 298 484 C290 512 110 512 102 484 C108 448 112 418 110 380 L98 246 C92 214 96 188 118 176 Z';
	// Viewer's left = patient's right.
	return (
		<svg viewBox="0 0 400 900" width={w} height={height} style={{overflow: 'visible'}}>
			<defs>
				<clipPath id="bf-left">
					<rect x={0} y={0} width={200} height={900} />
				</clipPath>
				<clipPath id="bf-right">
					<rect x={200} y={0} width={200} height={900} />
				</clipPath>
			</defs>
			<g strokeLinecap="round" fill="none">
				<path d="M114 196 C92 252 84 320 78 392 L72 470" strokeWidth={44} stroke={c('armR')} />
				<ellipse cx={71} cy={500} rx={20} ry={34} fill={c('armR')} />
				<path d="M286 196 C308 252 316 320 322 392 L328 470" strokeWidth={44} stroke={c('armL')} />
				<ellipse cx={329} cy={500} rx={20} ry={34} fill={c('armL')} />
				<path d="M156 470 C154 580 154 680 156 790 L158 846" strokeWidth={70} stroke={c('legR')} />
				<path d="M244 470 C246 580 246 680 244 790 L242 846" strokeWidth={70} stroke={c('legL')} />
			</g>
			<path d={torso} fill={c('trunkR')} clipPath="url(#bf-left)" />
			<path d={torso} fill={c('trunkL')} clipPath="url(#bf-right)" />
			<rect x={176} y={120} width={48} height={60} rx={14} fill={base} />
			<ellipse cx={200} cy={78} rx={50} ry={60} fill={base} />
		</svg>
	);
};
