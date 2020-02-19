#!/usr/bin/env node

const Bundler = require('parcel-bundler');
const express = require('express');
const cors = require('cors');
const { argv } = require('yargs');
const { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const temp = require('temp');

const templates = {};
const uiDist = ``;

temp.track();

if (argv._.length !== 1) {
	console.error('Usage: npx automuse path_to_sketch.js');
	process.exit(1);
}

let sketchPath = argv._[0];
if (!/\.jsx?/i.test(sketchPath)) {
	sketchPath += '.js';
}

const port = argv.port || 1234;

function rootUrl() {
	return `http://localhost:${port}/`;
}

// create a unique project ID based on the CWD and sketch path to avoid collisions
const projectPath = `${process.cwd()}/${sketchPath}`;
const projectId = crypto.createHash('md5').update(projectPath).digest('hex');
const storePath = `.automuse-${projectId}`;
if (!existsSync(storePath)) {
	mkdirSync(storePath);
}

const { entryHtml, entryJs, workerJs } = require('./templates');

writeFileSync(`${storePath}/index.html`, entryHtml);
writeFileSync(`${storePath}/.automuse.js`, entryJs(projectId, sketchPath));
writeFileSync(`${storePath}/.automuse-ui.js`, uiDist);
writeFileSync(`${storePath}/.worker.js`, workerJs(sketchPath));

if (!existsSync(sketchPath)) {
	let template = 'canvas';
	if (argv.template) {
		if (argv.template in templates) {
			template = argv.template;
		} else {
			console.error(`Unknown template: ${argv.template}`);
			process.exit(1);
		}
	}

	writeFileSync(sketchPath, templates[template].toString());
}

// load index
const indexPath = `${storePath}/index.json`;
let index = [];
if (existsSync(indexPath)) {
	try {
		index = JSON.parse(readFileSync(indexPath).toString('utf-8'));
	} catch (err) {
		console.error(`Error reading index (${indexPath}): ${err}`);
		process.exit(1);
	}
}

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: false, limit: '1gb'}));
app.use(express.json({limit: '1gb'}));

app.use(`/`, express.static(storePath));

function getRevision() {
	try {
		const { stdout } = spawnSync('git', ['rev-parse', '--short', 'HEAD']);
		return stdout.toString('utf-8');
	} catch {
		return null;
	}
}

app.post('/api/save', (req, res) => {
	const id = new Date().toISOString();

	const image = Buffer.from(req.body.image.substr(22), 'base64');
	const imageName = `${id}.png`;
	const imagePath = `${storePath}/${imageName}`;
	writeFileSync(imagePath, image);

	index.push({
		id,
		parentId: req.body.parentId,
		image: imageName,
		config: req.body.config,
		revision: getRevision(),
	});
	writeFileSync(indexPath, JSON.stringify(index));

	res.json(index);
});

app.post('/api/delete', (req, res) => {
	let versionIndex = null;
	for (let i = 0; i < index.length; i++) {
		const version = index[i];
		if (version.id === req.body.id) {
			versionIndex = i;
			continue;
		}

		if (version.parentId === req.body.id) {
			version.parentId = req.body.parentId;
		}
	}

	if (versionIndex !== null) {
		index.splice(versionIndex, 1);
	}

	res.json(index);
});

app.post('/api/render', (req, res) => {
	if (/\W/.test(req.body.format)) {
		return res.status(400).send('Bad Request');
	}

	const dir = temp.mkdirSync('automuse');
	const framePaths = [];
	let i = 0;
	for (const frame of req.body.frames) {
		const decoded = req.body.raw ? frame : Buffer.from(frame.substr(22), 'base64');
		const ext = req.body.raw ? req.body.format : 'png';
		const framePath = `${dir}/${new String(i).padStart(5, '0')}.${ext}`;
		writeFileSync(framePath, decoded);
		i++;
		framePaths.push(framePath);
	}

	let outName = `${req.body.id}-${new Date().toISOString()}.${req.body.format}`;
	if (/[\\\/"']/.test(outName)) {
		return res.status(400).send('Bad Request');
	}

	const fps = parseInt(req.body.fps) || 30;
	switch (req.body.format) {
	case 'gif':
		spawnSync(
			'ffmpeg',
			[
				'-framerate', fps,
				'-i', `${dir}/%05d.png`,
				'-filter_complex', 'palettegen[v1];[0:v][v1]paletteuse',
				'-y', `${storePath}/${outName}`,
			]
		);
		break;
	case 'mp4':
		spawnSync(
			'ffmpeg',
			[
				'-framerate', fps,
				'-i', `${dir}/%05d.png`,
				'-c:v', 'libx264',
				'-pix_fmt', 'yuv420p',
				'-crf', '18',
				`${storePath}/${outName}`,
			],
		);
		break;
	default:
		if (req.body.frames.length === 1) {
			copyFileSync(`${dir}/00000.${req.body.format}`, `${storePath}/${outName}`);
		} else {
			outName = outName.replace(`.${req.body.format}`, '.zip');
			spawnSync(
				'zip',
				[
					'-j',
					`${storePath}/${outName}`,
					...framePaths,
				],
			);
		}
		break;
	}

	res.json({
		url: `${rootUrl()}${outName}`,
	})
});

app.get('/api/list', (req, res) => {
	res.json(index);
});

console.log(`Listening on ${rootUrl()}`);

const options = {};
const bundler = new Bundler([
	`${storePath}/index.html`,
	`${storePath}/.automuse.js`,
	`${storePath}/.worker.js`,
], options);

app.use(bundler.middleware());

app.listen(port);
