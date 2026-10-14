import './brand/fonts';
import React from 'react';
import {Composition} from 'remotion';
import {EpisodeVideo} from './engine/Episode';
import type {Episode} from './engine/types';
import {dekubitusprophylaxe} from './episodes/dekubitusprophylaxe';

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
	</>
);
