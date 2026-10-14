// Prints every timed on-screen element of an episode, sorted by time (Markdown table).
// Usage: node scripts/cue-sheet.mjs [episode-file-basename]
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const name = process.argv[2] ?? 'dekubitusprophylaxe';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cues-'));
execSync(`npx tsc src/episodes/${name}.ts --outDir ${tmp} --module es2020 --target es2020 --skipLibCheck`, {stdio: 'inherit'});
const file = fs.readdirSync(tmp, {recursive: true}).find((f) => f.endsWith(`${name}.js`));
const mod = await import(path.join(tmp, file));
const ep = Object.values(mod)[0];
const rows = [];
const add = (t, scene, what) => t !== undefined && rows.push([t, scene, what]);
const clean = (s) => s.replace(/­/g, '');
for (const s of ep.scenes) {
	const sc = s.chapter ? `${s.chapter.num} ${s.chapter.title}` : s.id;
	add(s.start, sc, `▶ Szene beginnt${s.chapter ? ` – Titel „${s.chapter.title}“` : ''}`);
	if (s.type === 'title') {
		add(s.subtitle?.at, sc, s.subtitle?.text);
		add(s.series.at, sc, s.series.text);
		add(s.seriesNote?.at, sc, s.seriesNote?.text);
		add(s.episodeTitle.at, sc, s.episodeTitle.text);
	}
	for (const it of s.items ?? []) {
		add(it.at, sc, clean(it.label));
		if (it.sub) add(it.subAt ?? it.at, sc, `   ↳ ${clean(it.sub)}`);
	}
	add(s.lead?.at, sc, s.lead?.text);
	for (const m of s.markers ?? []) add(m.at, sc, `Marker: ${clean(m.label)}`);
	for (const st of s.steps ?? []) add(st.at, sc, st.label);
	for (const o of s.outcomes ?? []) {
		add(o.at, sc, o.title);
		add(o.verdictAt ?? o.at, sc, `   ↳ ${o.verdict}`);
	}
	(s.stages ?? []).forEach((st, i) => {
		add(st.at, sc, `${s.label} ${i + 1}: ${clean(st.title)}`);
		add(st.subAt ?? st.at, sc, `   ↳ ${st.sub}`);
	});
	add(s.patient?.at, sc, s.patient?.text);
	for (const x of s.facts ?? []) add(x.at, sc, x.text);
	add(s.conclusion?.at, sc, s.conclusion?.text);
	add(s.question?.at, sc, s.question?.text);
	for (const g of s.answerGroups ?? []) for (const a of g.items) add(a.at, sc, `${g.title}: ${a.text}`);
	for (const r of s.recap ?? []) add(r.at, sc, `${r.label}${r.sub ? ' – ' + r.sub : ''}`);
	if (s.type === 'outro') {
		add(s.endCardAt, sc, '▶ Endkarte (Logo)');
		for (const c of s.ctas) add(c.at, sc, c.text);
		add(s.farewell?.at, sc, s.farewell?.text);
	}
	add(s.footnote?.at, sc, `Hinweis: ${s.footnote?.text}`);
}
rows.sort((a, b) => a[0] - b[0]);
const ts = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
console.log('| Zeit | Szene | Text auf dem Bildschirm |\n|---|---|---|');
for (const [t, sc, w] of rows) console.log(`| ${ts(t)} | ${sc} | ${w} |`);
