import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {Script} from '../components/Brand';
import {Icon} from '../components/Icons';
import {SceneFrame} from '../components/SceneFrame';
import {cues, enter, fade, frameAt, rel, sec} from '../lib/anim';
import type {CaseSceneSpec, SceneProps} from '../engine/types';

export const CaseScene: React.FC<SceneProps<CaseSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'cream';
	const T = (at: number | undefined, fb: number) => frameAt(spec.start, at, fb);
	const factAt = cues(spec.facts.length, durationInFrames / 2, {
		lead: sec(4),
		tail: 0,
		explicit: spec.facts.map((x) => rel(spec.start, x.at)),
	});
	const qAt = T(spec.question.at, Math.round(durationInFrames / 2));

	return (
		<SceneFrame tone={tone} chapter={spec.chapter}>
			{spec.badge ? (
				<div style={{position: 'absolute', left: 820, top: 118, transform: 'rotate(-3deg)', ...fade(f, T(spec.badge.at, 24), 20)}}>
					<Script size={72} color={colors.green}>
						{spec.badge.text}
					</Script>
				</div>
			) : null}

			{/* Clipboard */}
			<div
				style={{
					...enter(f, T(spec.patient.at, 18)),
					position: 'absolute',
					left: 120,
					top: 270,
					width: 820,
					height: 720,
					background: colors.white,
					borderRadius: radius.card,
					boxShadow: shadow.card,
					borderTop: `16px solid ${colors.green}`,
					padding: '50px 54px',
					boxSizing: 'border-box',
				}}
			>
				<div style={{position: 'absolute', top: -42, left: 310, width: 200, height: 56, borderRadius: 16, background: colors.greenDeep}} />
				<div style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 32}}>
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
							flexShrink: 0,
						}}
					>
						<Icon name="bed" size={56} stroke={3.8} />
					</div>
					<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 46, color: colors.ink, lineHeight: 1.1}}>{spec.patient.text}</div>
				</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
					{spec.facts.map((x, i) => (
						<div key={x.text} style={{...enter(f, factAt[i], {dist: 24}), display: 'flex', gap: 20, alignItems: 'flex-start'}}>
							<div style={{width: 14, height: 14, borderRadius: 7, background: colors.green, marginTop: 20, flexShrink: 0}} />
							<div style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 42, lineHeight: 1.25, color: colors.ink}}>{x.text}</div>
						</div>
					))}
				</div>
				{spec.conclusion ? (
					<div
						style={{
							...enter(f, T(spec.conclusion.at, qAt - sec(3)), {dist: 20}),
							position: 'absolute',
							left: 54,
							right: 54,
							bottom: 46,
							display: 'flex',
							alignItems: 'center',
							gap: 18,
							background: colors.sev3,
							color: colors.white,
							borderRadius: 22,
							padding: '20px 28px',
							fontFamily: fonts.sans,
							fontWeight: 800,
							fontSize: 31,
						}}
					>
						<Icon name="alert" size={44} stroke={4.5} />
						{spec.conclusion.text}
					</div>
				) : null}
			</div>

			{/* Question + answer groups */}
			<div style={{position: 'absolute', left: 990, right: 120, top: 270, display: 'flex', flexDirection: 'column', gap: 24}}>
				<div
					style={{
						...enter(f, qAt),
						background: colors.ink,
						color: colors.white,
						borderRadius: radius.card,
						padding: '28px 34px',
						display: 'flex',
						alignItems: 'center',
						gap: 24,
					}}
				>
					<Icon name="question" size={60} color={colors.mint} stroke={4} />
					<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 44, lineHeight: 1.15}}>{spec.question.text}</div>
				</div>
				{spec.answerGroups.map((g) => {
					const gAt = T(g.at, qAt + sec(2));
					return (
						<div
							key={g.title}
							style={{
								...enter(f, gAt, {dist: 24}),
								background: colors.white,
								borderRadius: radius.card,
								boxShadow: shadow.soft,
								padding: '24px 32px',
							}}
						>
							<div
								style={{
									fontFamily: fonts.sans,
									fontWeight: 800,
									fontSize: 28,
									letterSpacing: 4,
									textTransform: 'uppercase',
									color: colors.green,
									marginBottom: 12,
								}}
							>
								{g.title}
							</div>
							<div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
								{g.items.map((a, i) => (
									<div key={a.text} style={{...enter(f, T(a.at, gAt + i * sec(1.5)), {dist: 16}), display: 'flex', alignItems: 'center', gap: 18}}>
										<div
											style={{
												width: 46,
												height: 46,
												borderRadius: 23,
												background: colors.green,
												color: colors.white,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											<Icon name="check" size={30} stroke={6} />
										</div>
										<div style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: colors.ink}}>{a.text}</div>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</SceneFrame>
	);
};
