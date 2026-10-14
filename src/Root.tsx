import './brand/fonts';
import React from 'react';
import {Composition, Still} from 'remotion';
import {EpisodeVideo} from './engine/Episode';
import type {Episode} from './engine/types';
import {dekubitusprophylaxe} from './episodes/dekubitusprophylaxe';
import {Thumbnail, ThumbnailProps} from './thumbnail/Thumbnail';

const dekubitusThumb: Omit<ThumbnailProps, 'variant'> = {
	series: 'Prophylaxen-Reihe',
	headline: 'DEKUBITUS',
	accent: 'vorbeugen',
	tag: 'Einfach erklärt für Pflege-Azubis',
	markers: ['hinterkopf', 'schulterblaetter', 'ellenbogen', 'kreuzbein', 'fersen'],
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
	</>
);
