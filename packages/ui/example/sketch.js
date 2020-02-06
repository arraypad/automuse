
export const config = {
	width: 300,
	height: 300,
	color: '#f00',
	rotation: {
		enabled: true,
		speed: 0.5,
	},
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

		this.ctx.save();

		if (config.rotation.enabled) {
			// rotate around center
			this.ctx.translate(width / 2, height / 2);
			this.ctx.rotate(time * config.rotation.speed);
			this.ctx.translate(-width / 2, -height / 2);
		}

		// draw rect
		this.ctx.fillStyle = config.color;
		this.ctx.fillRect(width / 4, width / 4, width / 2, height / 2);

		// clear rotation
		this.ctx.restore();
	}

	capture() {
		return this.canvas;
	}
}
