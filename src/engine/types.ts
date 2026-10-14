import type {Tone} from '../brand/theme';

// Every scene type takes its content as data, so a new episode is just a new
// file in src/episodes/. Times (`at`) are seconds relative to the scene start;
// leave them out and reveals are spread evenly over the scene.

export type Chapter = {num: string; title: string; kicker?: string};

type Base = {
	id: string;
	/** Scene start in seconds on the episode audio. Scenes end where the next begins. */
	start: number;
	tone?: Tone;
	chapter?: Chapter;
};

export type TitleSceneSpec = Base & {
	type: 'title';
	series: string; // "Prophylaxen-Reihe · Folge 1"
	episodeTitle: string; // "Dekubitusprophylaxe"
	tagline?: string; // script line
	hosts?: string; // "MIT NORA UND BEN"
	photo?: string; // public/ path
	/** When the show lockup hands over to the episode title (s). */
	switchAt?: number;
};

export type ListItem = {label: string; sub?: string; icon?: string; at?: number};

export type ListSceneSpec = Base & {
	type: 'list';
	layout: 'chain' | 'grid';
	columns?: number;
	items: ListItem[];
	/** Optional illustration next to a chain. */
	illustration?: 'patientProfile';
	footnote?: {text: string; at?: number};
};

export type BodyDiagramSceneSpec = Base & {
	type: 'body';
	view: 'back';
	markers: {key: string; label: string; sub?: string; at?: number}[];
	footnote?: {text: string; at?: number};
};

export type ProcedureSceneSpec = Base & {
	type: 'fingertest';
	title: string;
	steps: {label: string; at?: number}[];
	outcomes: {blanches: boolean; title: string; verdict: string; at?: number}[];
};

export type StageCardsSceneSpec = Base & {
	type: 'stages';
	label: string; // "Kategorie" / "Stadium"
	stages: {title: string; sub: string; at?: number}[];
	footnote?: {text: string; at?: number};
};

export type CaseSceneSpec = Base & {
	type: 'case';
	badge: string; // "Praxis-Übung"
	patient: string; // "Herr Schmidt, 82 Jahre"
	facts: {text: string; at?: number}[];
	question: {text: string; at?: number};
	answers: {text: string; at?: number}[];
};

export type OutroSceneSpec = Base & {
	type: 'outro';
	recapTitle: string;
	recap: {text: string; at?: number}[];
	endCardAt: number; // seconds into the scene
	cta: string;
	next?: {kicker: string; title: string};
	tagline?: string;
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
