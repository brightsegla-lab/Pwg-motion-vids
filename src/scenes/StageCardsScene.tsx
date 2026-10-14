import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {SkinSection} from '../components/Illustrations';
import {Footnote, SceneFrame} from '../components/SceneFrame';
import {activeIndex, cues, enter, fade, frameAt, progress, rel, sec} from '../lib/anim';
import type {SceneProps, StageCardsSceneSpec} from '../engine/types';

const SEV = [colors.sev1, colors.sev2, colors.sev3, colors.sev4];

export const StageCardsScene: React.FC<SceneProps<StageCardsSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'cream';
	const at = cues(spec.stages.length, durationInFrames, {
		lead: sec(3),
		tail: sec(spec.footnote ? 9 : 4),
		explicit: spec.stages.map((s) => rel(spec.start, s.at)),
	});
	const active = activeIndex(f, at);
	const footAt = frameAt(spec.start, spec.footnote?.at, durationInFrames - sec(7));
	const gap = 32;
	const cardW = (1680 - gap * 3) / 4;
	const barP = progress(f, at[0], at[at.length - 1] - at[0] + 30);

	return (
		<SceneFrame tone={tone} chapter={spec.chapter}>
			<div style={{position: 'absolute', left: 120, top: 262, width: 1680, display: 'flex', gap}}>
				{spec.stages.map((s, i) => {
					const c = SEV[i];
					const isActive = i === active;
					return (
						<div
							key={s.title}
							style={{
								...enter(f, at[i], {dist: 48, dur: 22}),
								width: cardW,
								height: 612,
								background: colors.white,
								borderRadius: radius.card,
								overflow: 'hidden',
								boxShadow: isActive ? `inset 0 0 0 5px ${c}, ${shadow.card}` : shadow.soft,
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<div
								style={{
									background: c,
									color: i === 0 ? colors.ink : colors.white,
									padding: '20px 28px',
									display: 'flex',
									alignItems: 'baseline',
									justifyContent: 'space-between',
									fontFamily: fonts.sans,
									fontWeight: 800,
								}}
							>
								<span style={{fontSize: 34, letterSpacing: 1}}>{spec.label}</span>
								<span style={{fontSize: 72, lineHeight: 0.9}}>{i + 1}</span>
							</div>
							<div style={{padding: '24px 28px 0'}}>
								<SkinSection stage={(i + 1) as 1 | 2 | 3 | 4} width={cardW - 56} />
							</div>
							<div style={{padding: '22px 28px 26px', display: 'flex', flexDirection: 'column', gap: 10}}>
								<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 40, lineHeight: 1.1, color: colors.ink}}>{s.title}</div>
								<div style={{...fade(f, frameAt(spec.start, s.subAt, at[i]), 16), fontFamily: fonts.sans, fontWeight: 500, fontSize: 30, lineHeight: 1.25, color: colors.inkSoft}}>{s.sub}</div>
							</div>
						</div>
					);
				})}
			</div>
			{/* severity scale */}
			<div style={{position: 'absolute', left: 120, top: 898, width: 1680, ...fade(f, at[0], 20)}}>
				<div style={{height: 14, borderRadius: 7, background: 'rgba(16,24,20,0.08)', overflow: 'hidden'}}>
					<div
						style={{
							width: `${barP * 100}%`,
							height: '100%',
							borderRadius: 7,
							background: `linear-gradient(90deg, ${SEV.join(', ')})`,
							backgroundSize: '1680px 100%',
						}}
					/>
				</div>
			</div>
			{spec.footnote ? <Footnote text={spec.footnote.text} at={footAt} tone={tone} /> : null}
		</SceneFrame>
	);
};
