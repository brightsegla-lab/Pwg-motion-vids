import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {colors, gradients} from '../brand/theme';
import {ease} from '../lib/anim';

// Organic shapes taken from the banner language: big soft lobes bleeding off-frame.
const BLOB_A =
	'M0,0 L1100,0 C980,120 860,170 720,260 C560,360 520,520 380,640 C260,740 120,760 0,820 Z';
const BLOB_B =
	'M1920,1080 L1920,300 C1820,380 1700,420 1620,560 C1540,700 1560,860 1460,960 C1400,1020 1330,1060 1260,1080 Z';
const LINE_A = 'M-40,980 C300,880 520,1000 820,920 C1100,845 1260,700 1560,690';

/** Slow drift so a static background never looks frozen (~2% over a long scene). */
const useDrift = (amp = 18, period = 900) => {
	const f = useCurrentFrame();
	const t = (f % (period * 2)) / period; // 0..2
	const p = t <= 1 ? ease(t) : 1 - ease(t - 1);
	return (p - 0.5) * 2 * amp;
};

export const GreenBackground: React.FC<{deep?: boolean}> = ({deep}) => {
	const d = useDrift();
	return (
		<AbsoluteFill style={{background: deep ? gradients.brandDeep : gradients.brand}}>
			<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="gb-glow" cx="20%" cy="15%" r="60%">
						<stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.22} />
						<stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
					</radialGradient>
					<radialGradient id="gb-vig" cx="50%" cy="45%" r="75%">
						<stop offset="60%" stopColor="#000" stopOpacity={0} />
						<stop offset="100%" stopColor="#062A1A" stopOpacity={0.35} />
					</radialGradient>
				</defs>
				<rect width={1920} height={1080} fill="url(#gb-glow)" />
				<path d={BLOB_B} fill={colors.greenDeep} opacity={0.22} transform={`translate(${-d} ${d * 0.5})`} />
				<path d={BLOB_A} fill="#FFFFFF" opacity={0.07} transform={`translate(${d * 0.6} ${-d * 0.3})`} />
				<path d={LINE_A} stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={2.5} fill="none" />
				<rect width={1920} height={1080} fill="url(#gb-vig)" />
			</svg>
		</AbsoluteFill>
	);
};

export const CreamBackground: React.FC = () => {
	const d = useDrift(14);
	return (
		<AbsoluteFill style={{background: colors.cream}}>
			<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="cb-blob" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#2E9E6B" />
						<stop offset="100%" stopColor={colors.greenDeep} />
					</linearGradient>
					<radialGradient id="cb-light" cx="65%" cy="30%" r="70%">
						<stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
						<stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
					</radialGradient>
				</defs>
				<rect width={1920} height={1080} fill="url(#cb-light)" />
				<g transform={`translate(${-60 + d * 0.5} ${-80})`}>
					<path d="M0,0 L520,0 C470,90 390,150 300,190 C200,235 120,300 60,380 C40,410 20,430 0,440 Z" fill="url(#cb-blob)" />
				</g>
				<g transform={`translate(${40 - d * 0.5} ${70})`}>
					<path d={BLOB_B} fill="url(#cb-blob)" opacity={0.95} transform="translate(120 160) scale(0.92)" />
				</g>
				<path
					d="M1500,1080 C1560,900 1700,760 1920,720"
					stroke="#FFFFFF"
					strokeWidth={3}
					fill="none"
					opacity={0.85}
					transform={`translate(${-d * 0.5} 30)`}
				/>
			</svg>
		</AbsoluteFill>
	);
};

/** Studio photo, never raw: blurred, slowly pushed in, and washed in brand green. */
export const PhotoBackground: React.FC<{src: string; duration: number; overlay?: number}> = ({
	src,
	duration,
	overlay = 0.8,
}) => {
	const f = useCurrentFrame();
	const scale = interpolate(f, [0, duration], [1.08, 1.16], {easing: ease, extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{background: colors.green, overflow: 'hidden'}}>
			<Img
				src={staticFile(src)}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: '50% 35%',
					filter: 'blur(10px) saturate(0.9)',
					transform: `scale(${scale})`,
				}}
			/>
			<AbsoluteFill style={{background: gradients.brand, opacity: overlay}} />
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(6,42,26,0.35) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

export const Background: React.FC<{tone: 'green' | 'cream'; deep?: boolean}> = ({tone, deep}) =>
	tone === 'green' ? <GreenBackground deep={deep} /> : <CreamBackground />;
