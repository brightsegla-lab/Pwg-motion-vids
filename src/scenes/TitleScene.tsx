import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, fonts, radius} from '../brand/theme';
import {LogoMark, Script, Wordmark} from '../components/Brand';
import {GreenBackground, PhotoBackground} from '../components/Backgrounds';
import {enter, exit, fade, frameAt, sec} from '../lib/anim';
import type {SceneProps, TitleSceneSpec} from '../engine/types';

export const TitleScene: React.FC<SceneProps<TitleSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const T = (at: number | undefined, fb: number) => frameAt(spec.start, at, fb);
	const sw = T(spec.switchAt, sec(12));
	const outA = exit(f, sw - 10, 18);
	const seriesAt = T(spec.series.at, sw + 10);
	const titleAt = T(spec.episodeTitle.at, sw + 40);

	return (
		<AbsoluteFill>
			{spec.photo ? <PhotoBackground src={spec.photo} duration={durationInFrames} overlay={0.86} /> : <GreenBackground />}

			{/* Phase A – show lockup */}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: outA}}>
				<div style={enter(f, 20, {dur: 30, dist: 30})}>
					<LogoMark color="black" width={360} />
				</div>
				<div style={{...enter(f, 54, {dur: 28, dist: 30}), marginTop: 34}}>
					<Wordmark size={132} />
				</div>
				{spec.subtitle ? (
					<div
						style={{
							...fade(f, T(spec.subtitle.at, 90), 20),
							marginTop: 40,
							fontFamily: fonts.sans,
							fontWeight: 600,
							fontSize: 42,
							letterSpacing: 1,
							color: colors.greenInk,
						}}
					>
						{spec.subtitle.text}
					</div>
				) : null}
				{spec.tagline ? (
					<div style={{...fade(f, T(spec.tagline.at, 120), 20), marginTop: 18}}>
						<Script size={72} color={colors.white}>
							{spec.tagline.text}
						</Script>
					</div>
				) : null}
			</AbsoluteFill>

			{/* Phase B – series + episode title */}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{...fade(f, sw, 20), position: 'absolute', top: 110, display: 'flex', alignItems: 'center', gap: 22}}>
					<LogoMark color="black" width={92} />
					<Wordmark size={46} />
				</div>
				<div
					style={{
						...enter(f, seriesAt, {dist: 24}),
						background: colors.ink,
						color: colors.mint,
						borderRadius: radius.pill,
						padding: '16px 40px',
						fontFamily: fonts.sans,
						fontWeight: 700,
						fontSize: 40,
						letterSpacing: 5,
						textTransform: 'uppercase',
					}}
				>
					{spec.series.text}
				</div>
				{spec.seriesNote ? (
					<div
						style={{
							...fade(f, T(spec.seriesNote.at, seriesAt + 60), 20),
							marginTop: 26,
							fontFamily: fonts.sans,
							fontWeight: 600,
							fontSize: 40,
							color: colors.greenInk,
						}}
					>
						{spec.seriesNote.text}
					</div>
				) : null}
				<div
					style={{
						...enter(f, titleAt, {dur: 22, dist: 40}),
						marginTop: 40,
						fontFamily: fonts.sans,
						fontWeight: 800,
						fontSize: 132,
						lineHeight: 1,
						color: colors.ink,
						letterSpacing: -1,
					}}
				>
					{spec.episodeTitle.text}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
