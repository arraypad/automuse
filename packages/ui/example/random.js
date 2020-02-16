
export const config = {
	width: 300,
	height: 300,
	seed: 'hello',
	frames: 1,
};

export class Sketch {
	constructor({ canvas }) {
		this.ctx = canvas.getContext('2d');
	}

	render({ width, height, random }) {
		const r = random() * 255,
			g = random() * 255,
			b = random() * 255;

		this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1.0)`;
		this.ctx.fillRect(0, 0, width, height);
	}
}
