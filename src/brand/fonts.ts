import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/kalam/700.css';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';
import {continueRender, delayRender} from 'remotion';

// @font-face rules load lazily; block rendering until every face we use is ready
// so no frame is captured with a fallback font.
const faces = [
	'500 40px Montserrat',
	'600 40px Montserrat',
	'700 40px Montserrat',
	'800 40px Montserrat',
	'900 40px Montserrat',
	'700 40px Kalam',
	'600 40px Caveat',
	'700 40px Caveat',
];

const handle = delayRender('Loading brand fonts');
Promise.all(faces.map((f) => document.fonts.load(f, 'PFLEGE-WG äöüß')))
	.then(() => continueRender(handle))
	.catch((err) => {
		console.error(err);
		continueRender(handle);
	});
