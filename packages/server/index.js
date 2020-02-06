#!/usr/bin/env node

const Bundler = require('parcel-bundler');
const express = require('express');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');

const { entryHtml, entryJs, babelConfig, skeletonJs } = require('./templates');

let sketchName = process.argv.length > 2
	? process.argv[2].replace(/\.js$/, '')
	: 'sketch';
let sketchPath = `${sketchName}.js`;

writeFileSync(`.automuse.html`, entryHtml);
writeFileSync(`.automuse.js`, entryJs(sketchName));
//writeFileSync(`.babelrc`, babelConfig);

if (!existsSync(sketchPath)) {
	writeFileSync(sketchPath, skeletonJs);
}

let index = [];
if (existsSync('.automuse-store')) {
	if (existsSync('.automuse-store/index.json')) {
		index = JSON.parse(readFileSync('.automuse-store/index.json').toString('utf-8'));
	}
} else {
	mkdirSync('.automuse-store');
}

const app = express();
app.use(express.json());
app.use('/.automuse-store', express.static('.automuse-store'));

app.post('/api/save', (req, res) => {
	const id = new Date().toISOString();

	const image = Buffer.from(req.body.image.substr(22), 'base64');
	const imagePath = `.automuse-store/${id}.png`;
	writeFileSync(imagePath, image);

	index.push({
		id,
		image: imagePath,
		config: req.body.config,
	});
	writeFileSync('.automuse-store/index.json', JSON.stringify(index));

	res.json(index);
});

app.get('/api/list', (req, res) => {
	res.json(index);
});

const options = {};
const bundler = new Bundler('.automuse.html', options);
app.use(bundler.middleware());

app.listen(1234);

