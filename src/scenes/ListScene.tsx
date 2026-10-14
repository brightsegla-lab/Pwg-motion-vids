import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {Card} from '../components/Brand';
import {Icon} from '../components/Icons';
import {PatientProfile} from '../components/Illustrations';
import {Footnote, SceneFrame} from '../components/SceneFrame';
import {activeIndex, cues, enter, fade, frameAt, rel, sec} from '../lib/anim';
import type {ListItem, ListSceneSpec, SceneProps} from '../engine/types';

const CONTENT_TOP = 270;

type Timing = {at: number[]; subAt: number[]; active: number};

export const ListScene: React.FC<SceneProps<ListSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'green';
	const at = cues(spec.items.length, durationInFrames, {
		lead: sec(3),
		tail: sec(spec.footnote ? 10 : 5),
		explicit: spec.items.map((i) => rel(spec.start, i.at)),
	});
	const subAt = spec.items.map((it, i) => frameAt(spec.start, it.subAt, at[i]));
	const t: Timing = {at, subAt, active: activeIndex(f, at)};
	const footAt = frameAt(spec.start, spec.footnote?.at, durationInFrames - sec(8));

	return (
		<SceneFrame tone={tone} chapter={spec.chapter}>
			{spec.layout === 'chain' ? (
				<Chain items={spec.items} t={t} illustration={spec.illustration} />
			) : spec.layout === 'pills' ? (
				<Pills items={spec.items} t={t} />
			) : (
				<Grid items={spec.items} t={t} columns={spec.columns ?? 3} />
			)}
			{spec.footnote ? <Footnote text={spec.footnote.text} at={footAt} tone={tone} /> : null}
		</SceneFrame>
	);
};

const Sub: React.FC<{text?: string; at: number; style: React.CSSProperties}> = ({text, at, style}) => {
	const f = useCurrentFrame();
	if (!text) return null;
	return <div style={{...style, ...fade(f, at, 16)}}>{text}</div>;
};

const Chain: React.FC<{items: ListItem[]; t: Timing; illustration?: string}> = ({items, t, illustration}) => {
	const f = useCurrentFrame();
	return (
		<div style={{position: 'absolute', top: CONTENT_TOP, left: 120, right: 120, bottom: 150, display: 'flex', gap: 60}}>
			{illustration ? (
				<Card
					style={{
						...fade(f, 14, 24),
						width: 820,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
					}}
				>
					<PatientProfile width={760} level={t.active + 1} at={14} />
				</Card>
			) : null}
			<div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
				{items.map((it, i) => {
					const isDef = i === 0;
					const isActive = i === t.active;
					return (
						<React.Fragment key={it.label}>
							{i > 0 ? (
								<div style={{...fade(f, t.at[i] - 4, 14), height: 40, display: 'flex', justifyContent: 'center', width: 96}}>
									<svg width={30} height={40} viewBox="0 0 30 46">
										<path d="M15 4 V36 M5 28 L15 40 L25 28" stroke={colors.ink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
							) : null}
							<div
								style={{
									...enter(f, t.at[i]),
									display: 'flex',
									alignItems: 'center',
									gap: 26,
									background: isDef ? colors.ink : colors.white,
									color: isDef ? colors.white : colors.ink,
									borderRadius: radius.card,
									padding: isDef ? '26px 34px' : '20px 30px',
									boxShadow: isActive ? `inset 0 0 0 5px ${isDef ? colors.mint : colors.ink}, ${shadow.card}` : shadow.soft,
								}}
							>
								<div
									style={{
										width: 64,
										height: 64,
										borderRadius: 18,
										background: isDef ? colors.mint : '#E6F7EF',
										color: isDef ? colors.ink : colors.green,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontFamily: fonts.sans,
										fontWeight: 800,
										fontSize: 32,
										flexShrink: 0,
									}}
								>
									{it.icon ? <Icon name={it.icon} size={44} stroke={4} /> : i + 1}
								</div>
								<div>
									<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: isDef ? 52 : 44, lineHeight: 1.1}}>{it.label}</div>
									<Sub
										text={it.sub}
										at={t.subAt[i]}
										style={{
											fontFamily: fonts.sans,
											fontWeight: 500,
											fontSize: 32,
											marginTop: 6,
											color: isDef ? 'rgba(255,255,255,0.85)' : colors.inkSoft,
										}}
									/>
								</div>
							</div>
						</React.Fragment>
					);
				})}
			</div>
		</div>
	);
};

const Grid: React.FC<{items: ListItem[]; t: Timing; columns: number}> = ({items, t, columns}) => {
	const f = useCurrentFrame();
	const gap = 30;
	const width = 1680;
	const cardW = (width - gap * (columns - 1)) / columns;
	const rows = Math.ceil(items.length / columns);
	const dense = columns >= 4;
	const cardH = rows > 1 ? (dense ? 372 : 322) : 380;
	return (
		<div
			style={{
				position: 'absolute',
				top: CONTENT_TOP - (dense ? 24 : 8),
				left: 120,
				width,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				gap,
			}}
		>
			{items.map((it, i) => {
				const isActive = i === t.active;
				return (
					<div
						key={it.label}
						style={{
							...enter(f, t.at[i]),
							width: cardW,
							height: cardH,
							background: colors.white,
							borderRadius: radius.card,
							boxShadow: isActive ? `inset 0 0 0 5px ${colors.ink}, ${shadow.card}` : shadow.soft,
							padding: dense ? '26px 30px' : '28px 36px',
							boxSizing: 'border-box',
							display: 'flex',
							flexDirection: 'column',
							gap: 14,
						}}
					>
						<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
							<div
								style={{
									width: dense ? 84 : 92,
									height: dense ? 84 : 92,
									borderRadius: 24,
									background: isActive ? colors.mint : '#E6F7EF',
									color: isActive ? colors.ink : colors.green,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Icon name={it.icon ?? 'check'} size={dense ? 56 : 62} stroke={3.8} />
							</div>
							<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 38, color: colors.creamDeep}}>
								{String(i + 1).padStart(2, '0')}
							</div>
						</div>
						<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: dense ? 38 : 44, lineHeight: 1.08, color: colors.ink}}>
							{it.label}
						</div>
						<Sub
							text={it.sub}
							at={t.subAt[i]}
							style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: dense ? 28 : 30, lineHeight: 1.2, color: colors.inkSoft}}
						/>
					</div>
				);
			})}
		</div>
	);
};

const Pills: React.FC<{items: ListItem[]; t: Timing}> = ({items, t}) => {
	const f = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				top: CONTENT_TOP - 4,
				left: 120,
				width: 1680,
				height: 640,
				display: 'flex',
				flexWrap: 'wrap',
				alignContent: 'center',
				justifyContent: 'center',
				gap: '22px 22px',
			}}
		>
			{items.map((it, i) => {
				const isActive = i === t.active;
				return (
					<div
						key={it.label}
						style={{
							...enter(f, t.at[i], {dist: 24}),
							display: 'flex',
							alignItems: 'center',
							gap: 20,
							background: colors.white,
							borderRadius: 36,
							padding: '16px 34px 16px 16px',
							boxShadow: isActive ? `inset 0 0 0 5px ${colors.ink}, ${shadow.card}` : shadow.soft,
						}}
					>
						<div
							style={{
								width: 80,
								height: 80,
								borderRadius: 24,
								background: isActive ? colors.mint : '#E6F7EF',
								color: isActive ? colors.ink : colors.green,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<Icon name={it.icon ?? 'check'} size={54} stroke={3.8} />
						</div>
						<div>
							<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 42, lineHeight: 1.08, color: colors.ink, whiteSpace: 'nowrap'}}>
								{it.label}
							</div>
							<Sub
								text={it.sub}
								at={t.subAt[i]}
								style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 28, lineHeight: 1.2, color: colors.inkSoft, marginTop: 4, whiteSpace: 'nowrap'}}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
};
