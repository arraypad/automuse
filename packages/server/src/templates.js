
const entryHtml = `<html>
<head>
	<style type="text/css">
	html, body { margin: 0; padding: 0; }
	</style>
</head>
<body>
	<div id="container"></div>
	<script src=".automuse.js"></script>
</body>
</html>`;

const entryJs = (projectId, sketchName) => `
import { runApp } from './.automuse-ui';
import { Sketch, config } from '../${sketchName}';
runApp(Sketch, config, '${projectId}');
`;

const workerJs = (sketchName) => `
import { worker } from './.automuse-ui';
import { Sketch, config } from '../${sketchName}';
worker(Sketch, config);
`;

module.exports = { entryHtml, entryJs, workerJs };
