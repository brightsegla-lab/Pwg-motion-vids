import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {colors} from '../brand/theme';
import {ease, sec} from '../lib/anim';
import {BodyDiagramScene} from '../scenes/BodyDiagramScene';
import {CaseScene} from '../scenes/CaseScene';
import {FingerTestScene} from '../scenes/FingerTestScene';
import {ListScene} from '../scenes/ListScene';
import {OutroScene} from '../scenes/OutroScene';
import {StageCardsScene} from '../scenes/StageCardsScene';
import {TitleScene} from '../scenes/TitleScene';
import type {Episode, SceneSpec} from './types';

/** Overlap between scenes; the incoming scene fades in on top (soft crossfade). */
export const XFADE = 18;

const renderScene = (spec: SceneSpec, durationInFrames: number) => {
	switch (spec.type) {
		case 'title':
			return <TitleScene spec={spec} durationInFrames={durationInFrames} />;
		case 'list':
			return <ListScene spec={spec} durationInFrames={durationInFrames} />;
		case 'body':
			return <BodyDiagramScene spec={spec} durationInFrames={durationInFrames} />;
		case 'fingertest':
			return <FingerTestScene spec={spec} durationInFrames={durationInFrames} />;
		case 'stages':
			return <StageCardsScene spec={spec} durationInFrames={durationInFrames} />;
		case 'case':
			return <CaseScene spec={spec} durationInFrames={durationInFrames} />;
		case 'outro':
			return <OutroScene spec={spec} durationInFrames={durationInFrames} />;
	}
};

const FadeIn: React.FC<{enabled: boolean; children: React.ReactNode}> = ({enabled, children}) => {
	const f = useCurrentFrame();
	const o = enabled ? interpolate(f, [0, XFADE], [0, 1], {easing: ease, extrapolateRight: 'clamp'}) : 1;
	return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

/** Thin chapter progress rail along the bottom edge. */
const ChapterRail: React.FC<{episode: Episode; total: number}> = ({episode, total}) => {
	const f = useCurrentFrame();
	const chapters = episode.scenes.filter((s) => s.chapter);
	const starts = chapters.map((s) => sec(s.start));
	const first = starts[0] ?? 0;
	const endCard = episode.scenes.find((s) => s.type === 'outro');
	const hideAt = endCard && endCard.type === 'outro' ? sec(endCard.start + endCard.endCardAt) : total;
	const vis =
		interpolate(f, [first, first + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
		interpolate(f, [hideAt, hideAt + 16], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	// merge consecutive scenes that share a chapter number
	const segs: {from: number; to: number}[] = [];
	chapters.forEach((s, i) => {
		const from = starts[i];
		const to = i + 1 < chapters.length ? starts[i + 1] : hideAt;
		const prev = chapters[i - 1];
		if (prev && prev.chapter?.num === s.chapter?.num) segs[segs.length - 1].to = to;
		else segs.push({from, to});
	});
	return (
		<div style={{position: 'absolute', left: 120, right: 120, bottom: 34, display: 'flex', gap: 10, opacity: vis * 0.9}}>
			{segs.map((s, i) => {
				const p = Math.min(1, Math.max(0, (f - s.from) / (s.to - s.from)));
				return (
					<div key={i} style={{flex: s.to - s.from, height: 8, borderRadius: 4, background: 'rgba(16,24,20,0.14)', overflow: 'hidden'}}>
						<div style={{width: `${p * 100}%`, height: '100%', background: colors.ink, borderRadius: 4}} />
					</div>
				);
			})}
		</div>
	);
};

export const EpisodeVideo: React.FC<{episode: Episode}> = ({episode}) => {
	const total = Math.round(episode.duration * 30);
	return (
		<AbsoluteFill style={{background: colors.green}}>
			{episode.scenes.map((s, i) => {
				const from = sec(s.start);
				const next = episode.scenes[i + 1];
				const to = next ? sec(next.start) : total;
				const dur = to - from + (next ? XFADE : 0);
				return (
					<Sequence key={s.id} from={from} durationInFrames={dur} name={`${s.chapter?.num ?? '00'} · ${s.id}`}>
						<FadeIn enabled={i > 0}>{renderScene(s, dur)}</FadeIn>
					</Sequence>
				);
			})}
			<ChapterRail episode={episode} total={total} />
			<Audio src={staticFile(episode.audio)} />
		</AbsoluteFill>
	);
};
