import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {LogoMark, Script, Wordmark} from '../components/Brand';
import {PhotoBackground} from '../components/Backgrounds';
import {Icon} from '../components/Icons';
import {SceneFrame} from '../components/SceneFrame';
import {cues, enter, fade, sec} from '../lib/anim';
import type {OutroSceneSpec, SceneProps} from '../engine/types';

export const OutroScene: React.FC<SceneProps<OutroSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const endAt = sec(spec.endCardAt);
	const at = cues(spec.recap.length, endAt, {lead: sec(3), tail: sec(3), explicit: spec.recap.map((r) => r.at)});
	const endIn = fade(f, endAt, 24).opacity;

	return (
		<AbsoluteFill>
			{/* Recap */}
			<SceneFrame tone="green" chapter={spec.chapter} title={spec.recapTitle}>
				<div
					style={{position: 'absolute', left: 120, right: 120, top: 240, bottom: 90, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30}}
				>
					{spec.recap.map((r, i) => (
						<div
							key={r.text}
							style={{
								...enter(f, at[i]),
								display: 'flex',
								alignItems: 'center',
								gap: 30,
								background: colors.white,
								borderRadius: radius.card,
								boxShadow: shadow.soft,
								padding: '34px 44px',
							}}
						>
							<div
								style={{
									width: 72,
									height: 72,
									borderRadius: 36,
									background: colors.ink,
									color: colors.mint,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
								}}
							>
								<Icon name="check" size={46} stroke={6} />
							</div>
							<div style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 54, lineHeight: 1.15, color: colors.ink}}>{r.text}</div>
						</div>
					))}
				</div>
			</SceneFrame>

			{/* End card */}
			{f >= endAt ? (
				<AbsoluteFill style={{opacity: endIn}}>
					<PhotoBackground src="brand/studio-mic.jpg" duration={durationInFrames - endAt} overlay={0.88} />
					<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 60}}>
						<div style={enter(f, endAt + 6, {dur: 26})}>
							<LogoMark color="black" width={250} />
						</div>
						<div style={{...enter(f, endAt + 22, {dur: 26}), marginTop: 26}}>
							<Wordmark size={104} />
						</div>
						{spec.tagline ? (
							<div style={{...fade(f, endAt + 40, 24), marginTop: 22}}>
								<Script size={64} color={colors.greenInk}>
									{spec.tagline}
								</Script>
							</div>
						) : null}
						<div style={{display: 'flex', gap: 36, marginTop: 56, alignItems: 'stretch'}}>
							<div
								style={{
									...enter(f, endAt + 60),
									display: 'flex',
									alignItems: 'center',
									gap: 22,
									background: colors.ink,
									color: colors.white,
									borderRadius: radius.pill,
									padding: '24px 48px',
									fontFamily: fonts.sans,
									fontWeight: 800,
									fontSize: 44,
									boxShadow: shadow.card,
								}}
							>
								<Icon name="bell" size={50} color={colors.yellow} stroke={4.5} />
								{spec.cta}
							</div>
							{spec.next ? (
								<div
									style={{
										...enter(f, endAt + 84),
										display: 'flex',
										alignItems: 'center',
										gap: 22,
										background: colors.white,
										borderRadius: radius.pill,
										padding: '16px 44px 16px 20px',
										boxShadow: shadow.card,
									}}
								>
									<div
										style={{
											width: 74,
											height: 74,
											borderRadius: 37,
											background: colors.mint,
											color: colors.ink,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Icon name="arrowRight" size={44} stroke={5} />
									</div>
									<div>
										<div
											style={{
												fontFamily: fonts.sans,
												fontWeight: 700,
												fontSize: 26,
												letterSpacing: 4,
												textTransform: 'uppercase',
												color: colors.green,
											}}
										>
											{spec.next.kicker}
										</div>
										<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 44, color: colors.ink, lineHeight: 1.1}}>
											{spec.next.title}
										</div>
									</div>
								</div>
							) : null}
						</div>
					</AbsoluteFill>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};
