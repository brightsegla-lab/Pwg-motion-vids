import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {colors, fonts, radius, Tone} from '../brand/theme';
import type {Chapter} from '../engine/types';
import {Background} from './Backgrounds';
import {SceneHeader, Watermark} from './Brand';
import {enter} from '../lib/anim';

/** Background + chapter header + watermark shared by all content scenes. */
export const SceneFrame: React.FC<{
	tone: Tone;
	chapter?: Chapter;
	title?: string;
	deep?: boolean;
	children: React.ReactNode;
}> = ({tone, chapter, title, deep, children}) => (
	<AbsoluteFill>
		<Background tone={tone} deep={deep} />
		{chapter ? (
			<SceneHeader chapter={chapter.num} title={title ?? chapter.title} kicker={chapter.kicker} tone={tone} />
		) : null}
		<Watermark tone={tone} />
		{children}
	</AbsoluteFill>
);

/** Small rounded note at the bottom of a scene (sources, "weitere Stellen" …). */
export const Footnote: React.FC<{text: string; at: number; tone: Tone; left?: number}> = ({text, at, tone, left}) => {
	const f = useCurrentFrame();
	return (
		<div
			style={{position: 'absolute', left: left ?? 0, right: 0, bottom: 62, display: 'flex', justifyContent: left === undefined ? 'center' : 'flex-start'}}
		>
			<div
				style={{
					...enter(f, at, {dist: 20}),
					background: tone === 'green' ? colors.ink : colors.green,
					color: colors.white,
					borderRadius: radius.pill,
					padding: '16px 36px',
					fontFamily: fonts.sans,
					fontWeight: 600,
					fontSize: 34,
				}}
			>
				{text}
			</div>
		</div>
	);
};
