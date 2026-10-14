import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {Script} from '../components/Brand';
import {Icon} from '../components/Icons';
import {SceneFrame} from '../components/SceneFrame';
import {cues, enter, fade, sec} from '../lib/anim';
import type {CaseSceneSpec, SceneProps} from '../engine/types';

export const CaseScene: React.FC<SceneProps<CaseSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'cream';
	const n = spec.facts.length + 1 + spec.answers.length;
	const at = cues(n, durationInFrames, {
		lead: sec(3.5),
		tail: sec(4),
		explicit: [...spec.facts.map((x) => x.at), spec.question.at, ...spec.answers.map((x) => x.at)],
	});
	const factAt = at.slice(0, spec.facts.length);
	const qAt = at[spec.facts.length];
	const ansAt = at.slice(spec.facts.length + 1);

	return (
		<SceneFrame tone={tone} chapter={spec.chapter}>
			<div style={{position: 'absolute', left: 820, top: 118, transform: 'rotate(-3deg)', ...fade(f, 24, 24)}}>
				<Script size={72} color={colors.green}>
					{spec.badge}
				</Script>
			</div>

			{/* Clipboard */}
			<div
				style={{
					...enter(f, 18),
					position: 'absolute',
					left: 120,
					top: 270,
					width: 860,
					height: 720,
					background: colors.white,
					borderRadius: radius.card,
					boxShadow: shadow.card,
					borderTop: `16px solid ${colors.green}`,
					padding: '50px 54px',
					boxSizing: 'border-box',
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: -42,
						left: 330,
						width: 200,
						height: 56,
						borderRadius: 16,
						background: colors.greenDeep,
					}}
				/>
				<div style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 30}}>
					<div
						style={{
							width: 84,
							height: 84,
							borderRadius: 42,
							background: '#E6F7EF',
							color: colors.green,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Icon name="elderly" size={56} stroke={3.8} />
					</div>
					<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 50, color: colors.ink}}>{spec.patient}</div>
				</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
					{spec.facts.map((x, i) => (
						<div key={x.text} style={{...enter(f, factAt[i], {dist: 24}), display: 'flex', gap: 20, alignItems: 'flex-start'}}>
							<div style={{width: 14, height: 14, borderRadius: 7, background: colors.green, marginTop: 18, flexShrink: 0}} />
							<div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 40, lineHeight: 1.25, color: colors.ink}}>
								{x.text}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Question + answers */}
			<div style={{position: 'absolute', left: 1030, right: 120, top: 270, display: 'flex', flexDirection: 'column', gap: 22}}>
				<div
					style={{
						...enter(f, qAt),
						background: colors.ink,
						color: colors.white,
						borderRadius: radius.card,
						padding: '30px 36px',
						display: 'flex',
						alignItems: 'center',
						gap: 24,
					}}
				>
					<Icon name="question" size={64} color={colors.mint} stroke={4} />
					<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 44, lineHeight: 1.15}}>{spec.question.text}</div>
				</div>
				{spec.answers.map((a, i) => (
					<div
						key={a.text}
						style={{
							...enter(f, ansAt[i], {dist: 24}),
							background: colors.white,
							borderRadius: 22,
							boxShadow: shadow.soft,
							padding: '20px 28px',
							display: 'flex',
							alignItems: 'center',
							gap: 20,
						}}
					>
						<div
							style={{
								width: 52,
								height: 52,
								borderRadius: 26,
								background: colors.green,
								color: colors.white,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<Icon name="check" size={34} stroke={6} />
						</div>
						<div style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: colors.ink}}>{a.text}</div>
					</div>
				))}
			</div>
		</SceneFrame>
	);
};
