import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors, fonts, radius, shadow} from '../brand/theme';
import {Card} from '../components/Brand';
import {Icon} from '../components/Icons';
import {PatientProfile} from '../components/Illustrations';
import {Footnote, SceneFrame} from '../components/SceneFrame';
import {activeIndex, cues, enter, fade, sec} from '../lib/anim';
import type {ListItem, ListSceneSpec, SceneProps} from '../engine/types';

const CONTENT_TOP = 270;

export const ListScene: React.FC<SceneProps<ListSceneSpec>> = ({spec, durationInFrames}) => {
	const f = useCurrentFrame();
	const tone = spec.tone ?? 'green';
	const hasFoot = Boolean(spec.footnote);
	const at = cues(spec.items.length, durationInFrames, {
		lead: sec(3),
		tail: sec(hasFoot ? 10 : 5),
		explicit: spec.items.map((i) => i.at),
	});
	const active = activeIndex(f, at);
	const footAt = spec.footnote?.at !== undefined ? sec(spec.footnote.at) : durationInFrames - sec(8);

	return (
		<SceneFrame tone={tone} chapter={spec.chapter}>
			{spec.layout === 'chain' ? (
				<Chain items={spec.items} at={at} active={active} illustration={spec.illustration} />
			) : (
				<Grid items={spec.items} at={at} active={active} columns={spec.columns ?? 3} />
			)}
			{spec.footnote ? <Footnote text={spec.footnote.text} at={footAt} tone={tone} /> : null}
		</SceneFrame>
	);
};

const Chain: React.FC<{items: ListItem[]; at: number[]; active: number; illustration?: string}> = ({
	items,
	at,
	active,
	illustration,
}) => {
	const f = useCurrentFrame();
	return (
		<div style={{position: 'absolute', top: CONTENT_TOP, left: 120, right: 120, bottom: 120, display: 'flex', gap: 60}}>
			{illustration ? (
				<Card
					style={{
						...fade(f, 14, 24),
						width: 860,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
					}}
				>
					<PatientProfile width={780} level={active + 1} at={14} />
				</Card>
			) : null}
			<div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0}}>
				{items.map((it, i) => {
					const isDef = i === 0;
					const isActive = i === active;
					return (
						<React.Fragment key={it.label}>
							{i > 0 ? (
								<div style={{...fade(f, at[i] - 4, 14), height: 46, display: 'flex', justifyContent: 'center', width: 96}}>
									<svg width={30} height={46} viewBox="0 0 30 46">
										<path d="M15 4 V36 M5 28 L15 40 L25 28" stroke={colors.ink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
							) : null}
							<div
								style={{
									...enter(f, at[i]),
									display: 'flex',
									alignItems: 'center',
									gap: 26,
									background: isDef ? colors.ink : colors.white,
									color: isDef ? colors.white : colors.ink,
									borderRadius: radius.card,
									padding: isDef ? '26px 34px' : '20px 30px',
									boxShadow: isActive
										? `inset 0 0 0 5px ${isDef ? colors.mint : colors.ink}, ${shadow.card}`
										: shadow.soft,
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
									<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: isDef ? 54 : 46, lineHeight: 1.1}}>
										{it.label}
									</div>
									{it.sub ? (
										<div
											style={{
												fontFamily: fonts.sans,
												fontWeight: 500,
												fontSize: 32,
												marginTop: 6,
												color: isDef ? 'rgba(255,255,255,0.85)' : colors.inkSoft,
											}}
										>
											{it.sub}
										</div>
									) : null}
								</div>
							</div>
						</React.Fragment>
					);
				})}
			</div>
		</div>
	);
};

const Grid: React.FC<{items: ListItem[]; at: number[]; active: number; columns: number}> = ({
	items,
	at,
	active,
	columns,
}) => {
	const f = useCurrentFrame();
	const gap = 30;
	const width = 1680;
	const cardW = (width - gap * (columns - 1)) / columns;
	const rows = Math.ceil(items.length / columns);
	const cardH = rows > 1 ? 322 : 380;
	return (
		<div
			style={{
				position: 'absolute',
				top: CONTENT_TOP - 8,
				left: 120,
				width,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				gap,
			}}
		>
			{items.map((it, i) => {
				const isActive = i === active;
				return (
					<div
						key={it.label}
						style={{
							...enter(f, at[i]),
							width: cardW,
							height: cardH,
							background: colors.white,
							borderRadius: radius.card,
							boxShadow: isActive ? `inset 0 0 0 5px ${colors.ink}, ${shadow.card}` : shadow.soft,
							padding: '28px 36px',
							boxSizing: 'border-box',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
						}}
					>
						<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
							<div
								style={{
									width: 92,
									height: 92,
									borderRadius: 26,
									background: isActive ? colors.mint : '#E6F7EF',
									color: isActive ? colors.ink : colors.green,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Icon name={it.icon ?? 'check'} size={62} stroke={3.8} />
							</div>
							<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 40, color: colors.creamDeep}}>
								{String(i + 1).padStart(2, '0')}
							</div>
						</div>
						<div>
							<div style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 44, lineHeight: 1.08, color: colors.ink}}>
								{it.label}
							</div>
							{it.sub ? (
								<div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: 30, lineHeight: 1.2, marginTop: 8, color: colors.inkSoft}}>
									{it.sub}
								</div>
							) : null}
						</div>
					</div>
				);
			})}
		</div>
	);
};
