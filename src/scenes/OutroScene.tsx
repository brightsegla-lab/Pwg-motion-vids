import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {LogoMark, Script, Wordmark} from '../components/Brand';
import {PhotoBackground} from '../components/Backgrounds';
import {Icon} from '../components/Icons';
import {SceneFrame} from '../components/SceneFrame';
import {cues, enter, fade, frameAt, rel, sec} from '../lib/anim';
import type {OutroSceneSpec, SceneProps} from '../engine/types';

export const OutroScene: React.FC<SceneProps<OutroSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const endAt = sec(spec.endCardAt - spec.start);
	const at = cues(spec.recap.length, endAt, {lead: sec(3), tail: sec(3), explicit: spec.recap.map((r) => rel(spec.start, r.at))});
	const endIn = fade(f, endAt, 24).opacity;

	return (
		<AbsoluteFill>
			{/* Recap */}
			<SceneFrame tone="green" chapter={spec.chapter} title={spec.recapTitle}>
				<div
					style={{position: 'absolute', left: 120, right: 120, top: 250, bottom: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22}}
				>
					{spec.recap.map((r, i) => (
						<div
							key={r.label}
							style={{
								...enter(f, at[i]),
								display: 'flex',
								alignItems: 'center',
								gap: 30,
								background: colors.white,
								borderRadius: radius.card,
								boxShadow: shadow.soft,
								padding: '24px 40px',
							}}
						>
							<div
								style={{
									width: 68,
									height: 68,
									borderRadius: 34,
									background: colors.ink,
									color: colors.mint,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
								}}
							>
								<Icon name="check" size={44} stroke={6} />
							</div>
							<div>
								<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 46, lineHeight: 1.12, color: colors.ink}}>{r.label}</div>
								{r.sub ? (
									<div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 34, lineHeight: 1.25, color: colors.inkSoft, marginTop: 4}}>
										{r.sub}
									</div>
								) : null}
							</div>
						</div>
					))}
				</div>
			</SceneFrame>

			{/* End card */}
			{f >= endAt ? (
				<AbsoluteFill style={{opacity: endIn}}>
					<PhotoBackground src="brand/studio-mic.jpg" duration={durationInFrames - endAt} overlay={0.88} />
					<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 40}}>
						<div style={enter(f, endAt + 6, {dur: 26})}>
							<LogoMark color="black" width={250} />
						</div>
						<div style={{...enter(f, endAt + 22, {dur: 26}), marginTop: 26}}>
							<Wordmark size={104} />
						</div>
						<div style={{display: 'flex', gap: 30, marginTop: 56, alignItems: 'stretch'}}>
							{spec.ctas.map((c, i) => (
								<div
									key={c.text}
									style={{
										...enter(f, frameAt(spec.start, c.at, endAt + 60 + i * 60)),
										display: 'flex',
										alignItems: 'center',
										gap: 20,
										background: i === 0 ? colors.ink : colors.white,
										color: i === 0 ? colors.white : colors.ink,
										borderRadius: radius.pill,
										padding: '22px 44px',
										fontFamily: fonts.sans,
										fontWeight: 800,
										fontSize: 42,
										boxShadow: shadow.card,
									}}
								>
									<Icon name={c.icon ?? 'bell'} size={48} color={i === 0 ? colors.yellow : colors.green} stroke={4.5} />
									{c.text}
								</div>
							))}
						</div>
						{spec.farewell ? (
							<div style={{...fade(f, frameAt(spec.start, spec.farewell.at, durationInFrames - sec(5)), 20), marginTop: 44}}>
								<Script size={76} color={colors.greenInk}>
									{spec.farewell.text}
								</Script>
							</div>
						) : null}
					</AbsoluteFill>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};
