import {Easing, interpolate} from 'remotion';

// One soft curve for the whole series: ease-in-out, never bounce or elastic.
export const ease = Easing.bezier(0.45, 0, 0.25, 1);

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

/** 0 → 1 between `at` and `at + dur` frames, eased and clamped. */
export const progress = (frame: number, at: number, dur = 18) =>
	interpolate(frame, [at, at + dur], [0, 1], {
		easing: ease,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

/** Fade + short rise: the single "enter" motion used across the series. */
export const enter = (frame: number, at: number, opts: {dur?: number; dist?: number} = {}) => {
	const p = progress(frame, at, opts.dur ?? 20);
	const dist = opts.dist ?? 36;
	return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
};

/** Fade only (for elements whose motion would compete with a neighbour). */
export const fade = (frame: number, at: number, dur = 18) => ({opacity: progress(frame, at, dur)});

/** Fade out starting at `at`. */
export const exit = (frame: number, at: number, dur = 16) => 1 - progress(frame, at, dur);

/**
 * Spread `n` cue points across a scene so reveals follow the conversation.
 * Explicit per-item `at` (seconds, scene-relative) wins when provided.
 */
export const cues = (
	n: number,
	sceneFrames: number,
	{lead = sec(2.5), tail = sec(3), explicit = [] as (number | undefined)[]} = {},
) => {
	const span = Math.max(1, sceneFrames - lead - tail);
	return Array.from({length: n}, (_, i) =>
		explicit[i] !== undefined ? sec(explicit[i] as number) : Math.round(lead + (span * i) / Math.max(1, n)),
	);
};

/** Index of the last cue already reached (-1 before the first). */
export const activeIndex = (frame: number, at: number[]) => {
	let idx = -1;
	at.forEach((a, i) => {
		if (frame >= a) idx = i;
	});
	return idx;
};

/** Absolute audio seconds → seconds relative to a scene start (undefined stays undefined). */
export const rel = (start: number, at?: number) => (at === undefined ? undefined : at - start);

/** Absolute audio seconds → frame inside a scene, with a fallback frame. */
export const frameAt = (start: number, at: number | undefined, fallback: number) =>
	at === undefined ? fallback : sec(at - start);
