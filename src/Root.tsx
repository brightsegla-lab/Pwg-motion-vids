import './brand/fonts';
import React from 'react';
import {Composition, Still} from 'remotion';
import {EpisodeVideo} from './engine/Episode';
import type {Episode} from './engine/types';
import {dekubitusprophylaxe} from './episodes/dekubitusprophylaxe';
import {Thumbnail, ThumbnailProps} from './thumbnail/Thumbnail';

const dekubitusThumb: Omit<ThumbnailProps, 'variant'> = {
	series: 'Prophylaxen-Reihe',
	headline: ['DEKUBITUS'],
	accent: 'vorbeugen',
	tag: 'Einfach erklärt für Pflege-Azubis',
	markers: ['hinterkopf', 'schulterblaetter', 'ellenbogen', 'kreuzbein', 'fersen'],
};

// Thumbnail for the earlier episode (#3, Parese & Plegie) – no video in this repo yet.
const pareseThumb: ThumbnailProps = {
	variant: 'paresis',
	series: 'Pflege-WG #3',
	headline: ['PARESE', '& PLEGIE'],
	headlineSize: 168,
	accent: 'einfach erklärt',
	accentSize: 128,
	tag: 'Für Pflege-Azubis',
	figures: [
		{label: 'Mono', affected: ['armL']},
		{label: 'Hemi', affected: ['armL', 'legL', 'trunkL']},
		{label: 'Para', affected: ['legL', 'legR']},
		{label: 'Tetra', affected: ['armL', 'armR', 'legL', 'legR', 'trunkL', 'trunkR']},
	],
};

// Register each episode of the series here.
const episodes: Episode[] = [dekubitusprophylaxe];

const FPS = 30;

export const RemotionRoot: React.FC = () => (
	<>
		{episodes.map((ep) => (
			<Composition
				key={ep.id}
				id={ep.id}
				component={EpisodeVideo}
				durationInFrames={Math.round(ep.duration * FPS)}
				fps={FPS}
				width={1920}
				height={1080}
				defaultProps={{episode: ep}}
			/>
		))}
		<Still id="Thumbnail-Dekubitus-A" component={Thumbnail} width={1920} height={1080} defaultProps={{...dekubitusThumb, variant: 'body'}} />
		<Still id="Thumbnail-Dekubitus-B" component={Thumbnail} width={1920} height={1080} defaultProps={{...dekubitusThumb, variant: 'stages'}} />
		<Still id="Thumbnail-Parese-A" component={Thumbnail} width={1920} height={1080} defaultProps={pareseThumb} />
		<Still id="Thumbnail-Parese-B" component={Thumbnail} width={1920} height={1080} defaultProps={{...pareseThumb, tone: 'cream'}} />
	</>
);
