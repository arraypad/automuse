import 'regenerator-runtime/runtime';
import CssBaseline from '@material-ui/core/CssBaseline';
import React from 'react';
import ReactDOM from 'react-dom';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { App, assignAll } from './app';

const theme = createMuiTheme({
	palette: {
		primary: {
			light: '#a4a4a4',
			main: '#757575',
			dark: '#494949',
			contrastText: '#fff',
		},
		secondary: {
			light: '#484848',
			main: '#212121',
			dark: '#000000',
			contrastText: '#fff',
		},
	},
});

export function runApp(Sketch, config, projectId) {
	ReactDOM.render(
		<>
			<CssBaseline />
			<ThemeProvider theme={theme}>
				<App
					sketch={Sketch}
					originalConfig={config}
					projectId={projectId}
				/>
			</ThemeProvider>
		</>,
		document.getElementById("container"),
	);
}

export function worker(Sketch, config) {
	let project, canvas, raw;

	const handlers = {
		init: ctx => {
			canvas = new OffscreenCanvas(ctx.width, ctx.height);
			raw = ctx.raw,
			ctx.canvas = canvas;
			project = new Sketch(ctx);
		},
		setConfig: newConfig => {
			assignAll(newConfig, config);
		},
		render: async (ctx) => {
			const render = await project.render(ctx);
			if (raw) {
				self.postMessage({ frame: ctx.frame, render });
				return;
			}

			canvas.convertToBlob().then(blob => {
				const reader = new FileReader();
				reader.readAsDataURL(blob);
				reader.onloadend = () => {
					self.postMessage({frame: ctx.frame, render: reader.result });
				};
			})
		},
	};

	self.onmessage = e => {
		const { handler, ctx } = e.data;
		handlers[handler](ctx);
	};
}
