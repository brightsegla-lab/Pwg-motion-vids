import React from 'react';
import {AbsoluteFill} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {LogoMark, Wordmark} from '../components/Brand';
import {CreamBackground, GreenBackground} from '../components/Backgrounds';
import {BodyBack, BodyFront, BodyRegion, SkinSection} from '../components/Illustrations';

// YouTube thumbnail (1920×1080, exported as JPG < 2 MB).
// Rules: ≤ 4 big words, one focal visual, nothing important in the bottom-right
// corner (YouTube puts the video length there), readable at 160 px wide.

export type ThumbnailProps = {
	variant: 'body' | 'stages' | 'paresis';
	tone?: 'green' | 'cream';
	series: string; // "Prophylaxen-Reihe"
	headline: string[]; // one entry per line, e.g. ["DEKUBITUS"]
	headlineSize?: number;
	accent: string; // "vorbeugen"
	accentSize?: number;
	tag: string; // "für Pflege-Azubis"
	markers?: string[]; // BODY_POINTS keys shown on the body variant
	figures?: {label: string; affected: BodyRegion[]}[]; // paresis variant
};

const SEV = [colors.sev1, colors.sev2, colors.sev3, colors.sev4];

export const Thumbnail: React.FC<ThumbnailProps> = ({
	variant,
	tone,
	series,
	headline,
	headlineSize = 178,
	accent,
	accentSize = 150,
	tag,
	markers = [],
	figures = [],
}) => {
	const onGreen = (tone ?? (variant === 'stages' ? 'cream' : 'green')) === 'green';
	return (
		<AbsoluteFill>
			{onGreen ? <GreenBackground deep /> : <CreamBackground />}

			{/* Brand row */}
			<div style={{position: 'absolute', left: 100, top: 84, display: 'flex', alignItems: 'center', gap: 22}}>
				<LogoMark color="black" width={104} />
				<Wordmark size={54} accent={onGreen ? colors.yellow : colors.green} />
			</div>

			{/* Headline block */}
			<div style={{position: 'absolute', left: 100, top: headline.length > 1 ? 250 : 300, width: 1080}}>
				<div
					style={{
						display: 'inline-block',
						background: colors.ink,
						color: colors.mint,
						borderRadius: radius.pill,
						padding: '14px 36px',
						fontFamily: fonts.sans,
						fontWeight: 800,
						fontSize: 40,
						letterSpacing: 5,
						textTransform: 'uppercase',
					}}
				>
					{series}
				</div>
				<div
					style={{
						marginTop: 26,
						fontFamily: fonts.sans,
						fontWeight: 900,
						fontSize: headlineSize,
						lineHeight: 0.95,
						letterSpacing: -4,
						color: colors.ink,
					}}
				>
					{headline.map((l) => (
						<div key={l}>{l}</div>
					))}
				</div>
				<div style={{position: 'relative', display: 'inline-block', marginTop: 18, marginLeft: 6}}>
					<div
						style={{
							position: 'absolute',
							left: -18,
							right: -24,
							top: 34,
							bottom: 6,
							background: onGreen ? colors.yellow : colors.mint,
							borderRadius: 18,
							transform: 'rotate(-2deg)',
						}}
					/>
					<div
						style={{
							position: 'relative',
							fontFamily: fonts.marker,
							fontWeight: 700,
							fontSize: accentSize,
							lineHeight: 1,
							color: colors.ink,
							transform: 'rotate(-3deg)',
						}}
					>
						{accent}
					</div>
				</div>
				<div
					style={{
						marginTop: 40,
						fontFamily: fonts.sans,
						fontWeight: 700,
						fontSize: 50,
						color: onGreen ? colors.white : colors.greenInk,
					}}
				>
					{tag}
				</div>
			</div>

			{/* Focal visual */}
			{variant === 'body' ? (
				<div style={{position: 'absolute', right: 210, top: 60}}>
					<div
						style={{
							position: 'absolute',
							inset: '-40px -120px',
							borderRadius: '50%',
							background: 'radial-gradient(closest-side, rgba(255,255,255,0.28), rgba(255,255,255,0))',
						}}
					/>
					<BodyBack height={960} markers={markers.map((key) => ({key, label: key, at: -1000}))} />
				</div>
			) : variant === 'paresis' ? (
				<div
					style={{
						position: 'absolute',
						right: 100,
						top: 110,
						width: 700,
						display: 'flex',
						flexWrap: 'wrap',
						gap: 28,
					}}
				>
					{figures.map((fg) => (
						<div
							key={fg.label}
							style={{
								width: 336,
								height: 420,
								background: colors.white,
								borderRadius: radius.card,
								boxShadow: shadow.card,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '20px 0 22px',
								boxSizing: 'border-box',
							}}
						>
							<div
								style={{
									background: colors.ink,
									color: colors.white,
									borderRadius: radius.pill,
									padding: '6px 34px',
									fontFamily: fonts.sans,
									fontWeight: 800,
									fontSize: 46,
								}}
							>
								{fg.label}
							</div>
							<BodyFront height={300} affected={fg.affected} />
						</div>
					))}
				</div>
			) : (
				<div style={{position: 'absolute', right: 120, top: 120, width: 560, height: 800}}>
					{[0, 1, 2, 3].map((i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: i * 24,
								top: i * 165,
								width: 480,
								background: colors.white,
								borderRadius: radius.card,
								boxShadow: shadow.card,
								overflow: 'hidden',
								transform: `rotate(${-4 + i * 2.5}deg)`,
							}}
						>
							<div
								style={{
									background: SEV[i],
									color: i === 0 ? colors.ink : colors.white,
									padding: '10px 26px',
									fontFamily: fonts.sans,
									fontWeight: 900,
									fontSize: 44,
									display: 'flex',
									justifyContent: 'space-between',
								}}
							>
								<span>Stadium</span>
								<span>{i + 1}</span>
							</div>
							<div style={{padding: '18px 22px 20px'}}>
								<SkinSection stage={(i + 1) as 1 | 2 | 3 | 4} width={436} />
							</div>
						</div>
					))}
				</div>
			)}
		</AbsoluteFill>
	);
};
