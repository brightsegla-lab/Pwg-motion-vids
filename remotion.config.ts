import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setAudioBitrate('192k');

// Cloud containers cannot download Chrome; fall back to the pre-installed
// headless shell when present. Locally Remotion uses its own browser.
const localShell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('fs').existsSync(localShell)) {
	Config.setBrowserExecutable(localShell);
}
