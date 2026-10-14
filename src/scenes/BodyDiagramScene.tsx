import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {BodyBack} from '../components/Illustrations';
import {Footnote, SceneFrame} from '../components/SceneFrame';
import {activeIndex, cues, enter, fade, sec} from '../lib/anim';
import type {BodyDiagramSceneSpec, SceneProps} from '../engine/types';

export const BodyDiagramScene: React.FC<SceneProps<BodyDiagramSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'green';
	const at = cues(spec.markers.length, durationInFrames, {
		lead: sec(3),
		tail: sec(spec.footnote ? 8 : 4),
		explicit: spec.markers.map((m) => m.at),
	});
	const active = activeIndex(f, at);
	const footAt = spec.footnote?.at !== undefined ? sec(spec.footnote.at) : durationInFrames - sec(6.5);

	return (
		<SceneFrame tone={tone} chapter={spec.chapter}>
			<div style={{position: 'absolute', left: 330, top: 236, ...fade(f, 10, 24)}}>
				<BodyBack height={700} markers={spec.markers.map((m, i) => ({key: m.key, label: m.label, at: at[i]}))} />
				<div
					style={{
						position: 'absolute',
						left: -230,
						top: 520,
						width: 200,
						textAlign: 'right',
						fontFamily: fonts.sans,
						fontWeight: 700,
						fontSize: 28,
						letterSpacing: 5,
						textTransform: 'uppercase',
						color: tone === 'green' ? colors.greenInk : colors.green,
					}}
				>
					Rückenansicht
				</div>
			</div>
			<div style={{position: 'absolute', left: 900, right: 120, top: 270, display: 'flex', flexDirection: 'column', gap: 26}}>
				{spec.markers.map((m, i) => (
					<div
						key={m.key}
						style={{
							...enter(f, at[i] + 6),
							display: 'flex',
							alignItems: 'center',
							gap: 30,
							background: colors.white,
							borderRadius: radius.card,
							padding: '22px 32px',
							boxShadow: i === active ? `inset 0 0 0 5px ${colors.sev3}, ${shadow.card}` : shadow.soft,
						}}
					>
						<div
							style={{
								width: 70,
								height: 70,
								borderRadius: 35,
								background: colors.sev3,
								color: colors.white,
								fontFamily: fonts.sans,
								fontWeight: 800,
								fontSize: 36,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							{i + 1}
						</div>
						<div>
							<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 50, color: colors.ink, lineHeight: 1.05}}>{m.label}</div>
							{m.sub ? (
								<div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 31, color: colors.inkSoft, marginTop: 6}}>{m.sub}</div>
							) : null}
						</div>
					</div>
				))}
			</div>
			{spec.footnote ? <Footnote text={spec.footnote.text} at={footAt} tone={tone} left={900} /> : null}
		</SceneFrame>
	);
};
