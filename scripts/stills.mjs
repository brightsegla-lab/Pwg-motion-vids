// Render preview stills: node scripts/stills.mjs 3 9 22 ...  (seconds)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const shell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browserExecutable = fs.existsSync(shell) ? shell : null;
const id = process.env.COMP ?? 'Dekubitusprophylaxe';
const outDir = process.env.OUT ?? 'out/stills';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const s of process.argv.slice(2).map(Number)) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(s * 30));
	const output = `${outDir}/t${String(s).padStart(6, '0')}.jpg`;
	await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 80, browserExecutable});
	console.log(output);
}
