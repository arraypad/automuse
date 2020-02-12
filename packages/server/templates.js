
const entryHtml = `<html>
<head>
	<style type="text/css">
	html, body { margin: 0; padding: 0; }
	</style>
</head>
<body>
	<div id="container"></div>
	<script>window
	<script src=".automuse.js"></script>
</body>
</html>`;

const entryJs = (projectId, sketchName) => `
import { runApp } from '@automuse/ui';
import { Sketch, config } from '../${sketchName}';
runApp(Sketch, config, projectId);
`;

const skeletonJs = `
export const config = {
	speed: 0.5,
};

export class Sketch {
	constructor({ width, height, document, container }) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;

		this.ctx = this.canvas.getContext('2d');

		container.appendChild(this.canvas);
	}

	destroy({ container }) {
		container.removeChild(this.canvas);
	}

	resize({ width, height }) {
		this.canvas.width = width;
		this.canvas.height = height;
	}

	render({ width, height, time }) {
		this.ctx.clearRect(0, 0, width, height);

		// rotate around center
		this.ctx.save();
		this.ctx.translate(width / 2, height / 2);
		this.ctx.rotate(time * config.speed);
		this.ctx.translate(-width / 2, -height / 2);

		// draw rect
		this.ctx.fillStyle = 'green';
		this.ctx.fillRect(width / 4, width / 4, width / 2, height / 2);

		// clear rotation
		this.ctx.restore();
	}
}
`;

module.exports = { entryHtml, entryJs, skeletonJs };
