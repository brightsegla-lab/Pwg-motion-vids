import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {BodyBack} from '../components/Illustrations';
import {Footnote, SceneFrame} from '../components/SceneFrame';
import {activeIndex, cues, enter, frameAt, rel, sec} from '../lib/anim';
import type {BodyDiagramSceneSpec, SceneProps} from '../engine/types';

export const BodyDiagramScene: React.FC<SceneProps<BodyDiagramSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'green';
	const at = cues(spec.markers.length, durationInFrames, {
		lead: sec(3),
		tail: sec(spec.footnote ? 8 : 4),
		explicit: spec.markers.map((m) => rel(spec.start, m.at)),
	});
	const active = activeIndex(f, at);
	const footAt = frameAt(spec.start, spec.footnote?.at, durationInFrames - sec(6.5));
	const half = Math.ceil(spec.markers.length / 2);
	const columns = [spec.markers.slice(0, half), spec.markers.slice(half)];

	return (
		<SceneFrame tone={tone} chapter={spec.chapter}>
			<div style={{position: 'absolute', left: 330, top: 236, ...enter(f, 10, {dist: 0, dur: 24})}}>
				<BodyBack height={700} markers={spec.markers.map((m, i) => ({key: m.key, label: m.label, at: at[i]}))} />
				<div
					style={{
						position: 'absolute',
						left: -250,
						top: 520,
						width: 220,
						textAlign: 'right',
						fontFamily: fonts.sans,
						fontWeight: 700,
						fontSize: 26,
						letterSpacing: 4,
						textTransform: 'uppercase',
						color: tone === 'green' ? colors.greenInk : colors.green,
					}}
				>
					Rückenansicht
				</div>
			</div>
			<div style={{position: 'absolute', left: 860, right: 120, top: 262}}>
				{spec.lead ? (
					<div
						style={{
							...enter(f, frameAt(spec.start, spec.lead.at, sec(2)), {dist: 20}),
							fontFamily: fonts.sans,
							fontWeight: 700,
							fontSize: 40,
							lineHeight: 1.2,
							color: tone === 'green' ? colors.ink : colors.greenInk,
							marginBottom: 26,
						}}
					>
						{spec.lead.text}
					</div>
				) : null}
				<div style={{display: 'flex', gap: 22}}>
					{columns.map((col, c) => (
						<div key={c} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 16}}>
							{col.map((m, j) => {
								const i = c * half + j;
								return (
									<div
										key={m.key}
										style={{
											...enter(f, at[i], {dist: 20}),
											display: 'flex',
											alignItems: 'center',
											gap: 20,
											background: colors.white,
											borderRadius: radius.card,
											padding: '14px 24px 14px 16px',
											boxShadow: i === active ? `inset 0 0 0 5px ${colors.sev3}, ${shadow.card}` : shadow.soft,
										}}
									>
										<div
											style={{
												width: 56,
												height: 56,
												borderRadius: 28,
												background: colors.sev3,
												color: colors.white,
												fontFamily: fonts.sans,
												fontWeight: 800,
												fontSize: 30,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											{i + 1}
										</div>
										<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 34, color: colors.ink, lineHeight: 1.08}}>
											{m.label}
										</div>
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>
			{spec.footnote ? <Footnote text={spec.footnote.text} at={footAt} tone={tone} /> : null}
		</SceneFrame>
	);
};
