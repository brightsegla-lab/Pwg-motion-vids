import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {Icon} from '../components/Icons';
import {FingerTest} from '../components/Illustrations';
import {SceneFrame} from '../components/SceneFrame';
import {cues, enter, fade, sec} from '../lib/anim';
import type {ProcedureSceneSpec, SceneProps} from '../engine/types';

export const FingerTestScene: React.FC<SceneProps<ProcedureSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'green';
	const n = spec.steps.length + spec.outcomes.length;
	const at = cues(n, durationInFrames, {
		lead: sec(2.5),
		tail: sec(5),
		explicit: [...spec.steps.map((s) => s.at), ...spec.outcomes.map((o) => o.at)],
	});
	const stepAt = at.slice(0, spec.steps.length);
	const outAt = at.slice(spec.steps.length);

	return (
		<SceneFrame tone={tone} chapter={spec.chapter} title={spec.title}>
			<div style={{position: 'absolute', left: 120, right: 120, top: 262, display: 'flex', gap: 28}}>
				{spec.steps.map((s, i) => (
					<div
						key={s.label}
						style={{
							...enter(f, stepAt[i]),
							flex: 1,
							display: 'flex',
							alignItems: 'center',
							gap: 22,
							background: colors.ink,
							color: colors.white,
							borderRadius: radius.card,
							padding: '22px 30px',
						}}
					>
						<div
							style={{
								width: 58,
								height: 58,
								borderRadius: 29,
								background: colors.mint,
								color: colors.ink,
								fontFamily: fonts.sans,
								fontWeight: 800,
								fontSize: 32,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							{i + 1}
						</div>
						<div style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 38, lineHeight: 1.15}}>{s.label}</div>
					</div>
				))}
			</div>
			<div style={{position: 'absolute', left: 120, right: 120, top: 440, bottom: 90, display: 'flex', gap: 40}}>
				{spec.outcomes.map((o, i) => {
					const good = o.blanches;
					const accent = good ? colors.green : colors.sev3;
					return (
						<div
							key={o.title}
							style={{
								...fade(f, outAt[i] - 20, 20),
								flex: 1,
								background: colors.white,
								borderRadius: radius.card,
								boxShadow: shadow.card,
								padding: '30px 40px',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
							}}
						>
							<FingerTest width={400} at={outAt[i]} blanches={o.blanches} />
							<div style={{...enter(f, outAt[i] + 80), textAlign: 'center', marginTop: 18}}>
								<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 46, color: colors.ink}}>{o.title}</div>
								<div
									style={{
										marginTop: 18,
										display: 'inline-flex',
										alignItems: 'center',
										gap: 14,
										background: accent,
										color: colors.white,
										borderRadius: radius.pill,
										padding: '12px 30px',
										fontFamily: fonts.sans,
										fontWeight: 700,
										fontSize: 36,
									}}
								>
									<Icon name={good ? 'check' : 'alert'} size={38} stroke={5} />
									{o.verdict}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</SceneFrame>
	);
};
