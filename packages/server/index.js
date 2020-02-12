#!/usr/bin/env node

const Bundler = require('parcel-bundler');
const express = require('express');
const cors = require('cors');
const { argv } = require('yargs');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const crypto = require('crypto');

let sketchPath = argv._.length === 1 ? argv._[0] : 'default';
if (!/\.jsx?/i.test(sketchPath)) {
	sketchPath += '.js';
}

// create a unique project ID based on the CWD and sketch path to avoid collisions
const projectPath = `${process.cwd()}/${sketchPath}`;
const projectId = crypto.createHash('md5').update(projectPath).digest('hex');
const storePath = `.automuse-${projectId}`;
if (!existsSync(storePath)) {
	mkdirSync(storePath);
}

if (argv.serveOnly) {
	// we're only serving the API, the frontend is running separately
} else {
	// write entrypoints
	const { entryHtml, entryJs, skeletonJs } = require('./templates');

	writeFileSync(`${storePath}/index.html`, entryHtml);
	writeFileSync(`${storePath}/.automuse.js`, entryJs(projectId, sketchPath));

	if (!existsSync(sketchPath)) {
		writeFileSync(sketchPath, skeletonJs);
	}
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
app.use(express.json());

app.use(`/${storePath}`, express.static(storePath));

app.post('/api/save', (req, res) => {
	const id = new Date().toISOString();

	const image = Buffer.from(req.body.image.substr(22), 'base64');
	const imagePath = `${storePath}/${id}.png`;
	writeFileSync(imagePath, image);

	index.push({
		id,
		parentId: req.body.parentId,
		image: imagePath,
		config: req.body.config,
	});
	writeFileSync(indexPath, JSON.stringify(index));

	res.json(index);
});

app.get('/api/list', (req, res) => {
	res.json(index);
});

const port = argv.port || 1234;

if (argv.serveOnly) {
	console.log(`API listening on http://localhost:${port}/`);
} else {
	const options = {};
	const bundler = new Bundler('.automuse.html', options);
	app.use(bundler.middleware());
}

app.listen(port);
