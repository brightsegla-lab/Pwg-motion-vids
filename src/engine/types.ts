import type {Tone} from '../brand/theme';

// Every scene type takes its content as data, so a new episode is just a new
// file in src/episodes/.
//
// ALL TIMES ARE ABSOLUTE SECONDS ON THE EPISODE AUDIO (same clock as the SRT).
// `at` = the moment an element starts to appear. Leave it out and reveals are
// spread evenly over the scene.

export type Chapter = {num: string; title: string; kicker?: string};
export type Timed = {text: string; at?: number};

type Base = {
	id: string;
	/** Scene start (s). Scenes end where the next begins. */
	start: number;
	tone?: Tone;
	chapter?: Chapter;
};

export type TitleSceneSpec = Base & {
	type: 'title';
	/** Line above the logo (phase A). */
	subtitle?: Timed;
	/** Script line under the wordmark (phase A). */
	tagline?: Timed;
	/** When the show lockup hands over to the episode block (s). */
	switchAt: number;
	series: Timed; // pill
	seriesNote?: Timed; // small line under the pill
	episodeTitle: Timed;
	photo?: string; // public/ path
};

export type ListItem = {label: string; sub?: string; icon?: string; at?: number; subAt?: number};

export type ListSceneSpec = Base & {
	type: 'list';
	layout: 'chain' | 'grid' | 'pills';
	columns?: number;
	items: ListItem[];
	/** Optional illustration next to a chain. */
	illustration?: 'patientProfile';
	footnote?: Timed;
};

export type BodyDiagramSceneSpec = Base & {
	type: 'body';
	view: 'back';
	lead?: Timed;
	markers: {key: string; label: string; at?: number}[];
	footnote?: Timed;
};

export type ProcedureSceneSpec = Base & {
	type: 'fingertest';
	title: string;
	steps: {label: string; at?: number}[];
	outcomes: {blanches: boolean; title: string; verdict: string; at: number; verdictAt?: number}[];
};

export type StageCardsSceneSpec = Base & {
	type: 'stages';
	label: string; // "Stadium"
	stages: {title: string; sub: string; at?: number; subAt?: number}[];
	footnote?: Timed;
};

export type CaseSceneSpec = Base & {
	type: 'case';
	badge?: Timed;
	patient: Timed;
	facts: Timed[];
	conclusion?: Timed;
	question: Timed;
	answerGroups: {title: string; at?: number; items: Timed[]}[];
};

export type OutroSceneSpec = Base & {
	type: 'outro';
	recapTitle: string;
	recap: {label: string; sub?: string; at?: number}[];
	endCardAt: number;
	ctas: (Timed & {icon?: string})[];
	farewell?: Timed;
};

export type SceneSpec =
	| TitleSceneSpec
	| ListSceneSpec
	| BodyDiagramSceneSpec
	| ProcedureSceneSpec
	| StageCardsSceneSpec
	| CaseSceneSpec
	| OutroSceneSpec;

export type Episode = {
	id: string; // composition id
	audio: string; // public/ path
	/** Exact audio length in seconds (ffprobe). */
	duration: number;
	scenes: SceneSpec[];
};

/** Props every scene component receives besides its spec. */
export type SceneProps<T> = {spec: T; durationInFrames: number};
