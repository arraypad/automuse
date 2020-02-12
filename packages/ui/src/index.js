import 'regenerator-runtime/runtime';
import CssBaseline from '@material-ui/core/CssBaseline';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';

export function runApp(Sketch, config, projectId) {
	ReactDOM.render(
		<>
			<CssBaseline />
			<App
				sketch={Sketch}
				originalConfig={config}
				projectId={projectId}
			/>
		</>,
		document.getElementById("container"),
	);
}
