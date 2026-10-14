import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, fonts, radius} from '../brand/theme';
import {LogoMark, Script, Wordmark} from '../components/Brand';
import {GreenBackground, PhotoBackground} from '../components/Backgrounds';
import {enter, exit, fade, sec} from '../lib/anim';
import type {SceneProps, TitleSceneSpec} from '../engine/types';

export const TitleScene: React.FC<SceneProps<TitleSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const sw = sec(spec.switchAt ?? 12);
	const outA = exit(f, sw, 20);

	return (
		<AbsoluteFill>
			{spec.photo ? <PhotoBackground src={spec.photo} duration={durationInFrames} overlay={0.86} /> : <GreenBackground />}

			{/* Phase A – show lockup */}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: outA}}>
				<div
					style={{
						...fade(f, 8, 30),
						fontFamily: fonts.sans,
						fontWeight: 600,
						fontSize: 40,
						letterSpacing: 2,
						color: colors.greenInk,
						marginBottom: 44,
					}}
				>
					Der Podcast für Pflege-Azubis
				</div>
				<div style={enter(f, 24, {dur: 30, dist: 30})}>
					<LogoMark color="black" width={360} />
				</div>
				<div style={{...enter(f, 54, {dur: 28, dist: 30}), marginTop: 34}}>
					<Wordmark size={132} />
				</div>
				{spec.hosts ? (
					<div
						style={{
							...fade(f, 90, 28),
							marginTop: 40,
							fontFamily: fonts.sans,
							fontWeight: 600,
							fontSize: 36,
							letterSpacing: 8,
							color: colors.white,
							display: 'flex',
							alignItems: 'center',
							gap: 22,
						}}
					>
						<span style={{width: 56, height: 3, background: colors.white}} />
						{spec.hosts}
						<span style={{width: 56, height: 3, background: colors.white}} />
					</div>
				) : null}
			</AbsoluteFill>

			{/* Phase B – episode title */}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{...fade(f, sw + 10, 24), position: 'absolute', top: 110, display: 'flex', alignItems: 'center', gap: 22}}>
					<LogoMark color="black" width={92} />
					<Wordmark size={46} />
				</div>
				<div
					style={{
						...enter(f, sw + 22, {dist: 24}),
						background: colors.ink,
						color: colors.mint,
						borderRadius: radius.pill,
						padding: '16px 40px',
						fontFamily: fonts.sans,
						fontWeight: 700,
						fontSize: 38,
						letterSpacing: 5,
						textTransform: 'uppercase',
					}}
				>
					{spec.series}
				</div>
				<div
					style={{
						...enter(f, sw + 40, {dur: 26, dist: 40}),
						marginTop: 40,
						fontFamily: fonts.sans,
						fontWeight: 800,
						fontSize: 132,
						lineHeight: 1,
						color: colors.ink,
						letterSpacing: -1,
					}}
				>
					{spec.episodeTitle}
				</div>
				{spec.tagline ? (
					<div style={{...fade(f, sw + 80, 30), marginTop: 46}}>
						<Script size={80} color={colors.greenInk}>
							{spec.tagline}
						</Script>
					</div>
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
