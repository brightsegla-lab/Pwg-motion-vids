import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow, type, Tone} from '../brand/theme';
import {enter, fade} from '../lib/anim';

/** House + stethoscope mark (colour ring preserved). `full` adds the baked wordmark. */
export const LogoMark: React.FC<{
	color?: 'black' | 'white';
	width: number;
	full?: boolean;
	style?: React.CSSProperties;
}> = ({color = 'black', width, full, style}) => (
	<Img
		src={staticFile(`brand/${full ? 'logo' : 'mark'}-${color}.png`)}
		style={{width, height: 'auto', display: 'block', ...style}}
	/>
);

/** "PFLEGE-WG" set live so it stays crisp at any size. */
export const Wordmark: React.FC<{size: number; ink?: string; accent?: string; style?: React.CSSProperties}> = ({
	size,
	ink = colors.ink,
	accent = colors.yellow,
	style,
}) => (
	<div
		style={{
			fontFamily: fonts.sans,
			fontWeight: 800,
			fontSize: size,
			letterSpacing: size * 0.02,
			color: ink,
			lineHeight: 1,
			whiteSpace: 'nowrap',
			display: 'flex',
			alignItems: 'baseline',
			...style,
		}}
	>
		PFLEGE-
		<span
			style={{
				fontFamily: fonts.marker,
				fontWeight: 700,
				color: accent,
				fontSize: size * 1.12,
				transform: 'rotate(-4deg) translateY(2%)',
				display: 'inline-block',
				letterSpacing: 0,
				marginLeft: size * 0.03,
			}}
		>
			WG
		</span>
	</div>
);

export const Script: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({
	children,
	size = 64,
	color = colors.green,
	style,
}) => (
	<div style={{fontFamily: fonts.script, fontWeight: 700, fontSize: size, color, lineHeight: 1.05, ...style}}>
		{children}
	</div>
);

/** Chapter header shared by every content scene: number badge + title + optional kicker. */
export const SceneHeader: React.FC<{
	chapter?: string;
	title: string;
	kicker?: string;
	tone: Tone;
	at?: number;
}> = ({chapter, title, kicker, tone, at = 6}) => {
	const f = useCurrentFrame();
	const onGreen = tone === 'green';
	const ink = onGreen ? colors.ink : colors.greenInk;
	return (
		<div style={{position: 'absolute', left: 120, top: 88, display: 'flex', alignItems: 'center', gap: 32}}>
			{chapter ? (
				<div
					style={{
						...fade(f, at, 16),
						width: 104,
						height: 104,
						borderRadius: 26,
						background: onGreen ? colors.ink : colors.green,
						color: onGreen ? colors.mint : colors.white,
						fontFamily: fonts.sans,
						fontWeight: 800,
						fontSize: 46,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
					}}
				>
					{chapter}
				</div>
			) : null}
			<div style={enter(f, at + 6, {dist: 24})}>
				{kicker ? (
					<div
						style={{
							fontFamily: fonts.sans,
							fontWeight: 700,
							fontSize: type.kicker,
							letterSpacing: 6,
							textTransform: 'uppercase',
							color: onGreen ? colors.greenInk : colors.green,
							opacity: 0.9,
							marginBottom: 6,
						}}
					>
						{kicker}
					</div>
				) : null}
				<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: type.h2, color: ink, lineHeight: 1.05}}>
					{title}
				</div>
			</div>
		</div>
	);
};

/** Discreet logo in the top-right corner of content scenes. */
export const Watermark: React.FC<{tone: Tone}> = ({tone}) => {
	const f = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				right: 110,
				top: 84,
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				...fade(f, 10, 20),
			}}
		>
			<LogoMark color={tone === 'green' ? 'black' : 'black'} width={74} style={{opacity: tone === 'green' ? 0.75 : 0.85}} />
			<Wordmark size={30} ink={tone === 'green' ? colors.ink : colors.ink} accent={tone === 'green' ? colors.yellow : colors.green} style={{opacity: 0.8}} />
		</div>
	);
};

export const Card: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
	<div
		style={{
			background: colors.white,
			borderRadius: radius.card,
			boxShadow: shadow.card,
			...style,
		}}
	>
		{children}
	</div>
);
