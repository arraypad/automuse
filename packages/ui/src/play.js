import React from 'react';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Fab from '@material-ui/core/Fab';
import AppsIcon from '@material-ui/icons/Apps';
import clsx from 'clsx';

import { UiFolder, UiField, drawerWidth } from './ui-field'
import LoadDialog from './load';

const apiRoot = 'http://localhost:1235';

export { drawerWidth };

const useStyles = makeStyles(theme => ({
	wrapper: {
		height: '100%',
	},
	drawerHeader: {
		display: 'flex',
		alignItems: 'center',
		padding: theme.spacing(0, 1),
		...theme.mixins.toolbar,
		justifyContent: 'flex-start',
	},
	play: {
		height: '100%',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		background: 'linear-gradient(45deg, rgba(0, 0, 0, 0.0980392) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.0980392) 75%, rgba(0, 0, 0, 0.0980392) 0), linear-gradient(45deg, rgba(0, 0, 0, 0.0980392) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.0980392) 75%, rgba(0, 0, 0, 0.0980392) 0), white',
		backgroundPosition: '0px 0, 5px 5px',
		backgroundSize: '10px 10px, 10px 10px',
	},
	inner: {
		background: '#fff',
		boxShadow: '10px 10px 23px 0px rgba(0,0,0,0.50)',
	},
	toolbar: theme.mixins.toolbar,
	actions: {
		zIndex: theme.zIndex.drawer + 1,
		position: 'fixed',
		right: theme.spacing(2),
		bottom: theme.spacing(2),
	},
	captureIcon: {
		margin: theme.spacing(1),
	},
	loadButton: {
		marginLeft: theme.spacing(1),
	},
}));

function assignAll(source, dest) {
	for (const [k, v] of Object.entries(dest)) {
		switch (typeof(source[k])) {
		case 'undefined':
			break;
		case 'object':
			assignAll(source[k], v);
			break;
		default:
			dest[k] = source[k];
			break;
		}
	}
}

export default function Play({
	sketch,
	originalConfig,
	drawerOpen,
	setDrawerOpen,
}) {
	const classes = useStyles();

	const [loadOpen, setLoadOpen] = React.useState(false);

	const [, setRerender] = React.useState();
	const forceRerender = () => setRerender({});

	/*
	 * Set up context and config
	 *
	 * originalConfig is the object supplied alongside the sketch, we make changes
	 * directly to this object to avoid requiring an API. The UI in the settings panel
	 * is generated from and updates this object. Changes are persisted in local storage.
	 *
	 * context contains some extra properties which are updated every frame, overridden
	 * by the config, and supplied to the sketch each render call.
	 */

	const [context, setContext] = React.useState({
		document: document,
		startTime: new Date().getTime(),
	});

	const config = React.useRef(originalConfig);
	let resetConfigJson = JSON.stringify(config);

	const applyConfig = newConfig => {
		assignAll(newConfig, config.current);
		resetConfigJson = JSON.stringify(newConfig);
		window.localStorage.setItem('config', JSON.stringify(newConfig));
	};

	const resetConfig = () => {
		applyConfig(JSON.parse(resetConfigJson));
	};

	// todo: namespace by sketch path
	const cachedConfigJson = window.localStorage.getItem('config');
	if (cachedConfigJson !== null) {
		applyConfig(JSON.parse(cachedConfigJson));
	}

	const onConfigChange = () => {
		// todo: also store expansion state of folders?
		window.localStorage.setItem('config', JSON.stringify(config.current));
		forceRerender();
	};

	const containerRef = React.useCallback(container => {
		setContext(prevContext => {
			const context = {
				...prevContext,
			};

			if (container) {
				const { width, height } = container.getBoundingClientRect();
				context.width = context.containerWidth = width;
				context.height = context.containerHeight = height;
			}

			return context;
		});
	}, []);

	const innerRef = React.useCallback(inner => {
		setContext(prevContext => {
			const context = {
				...prevContext,
			};

			if (inner) {
				context.container = inner;
			}

			return context;
		});
	}, []);

	const getContext = () => Object.assign(
		{
			time: (new Date().getTime() - context.startTime) / 1000,
			...context,
		},
		config.current,
	);

	/*
	 * Instantiate the sketch class and store in the project ref
	 */

	const project = React.useRef(null);

	React.useEffect(() => {
		if (context.container) {
			project.current = new sketch(getContext());
		}

		return () => {
			if (project.current) {
				project.current.destroy(context);
			}

			project.current = null;
		};
	}, [context]);

	/*
	 * Save and load versions
	 */

	const [parentId, setParentId] = React.useState(null);
	const [versions, setVersions] = React.useState([]);

	const onSave = async () => {
		const el = project.current.capture();
		if (!(el instanceof HTMLCanvasElement)) {
			alert('Captured element not supported');
			return;
		}			

		const dataUrl = el.toDataURL();
		const res = await fetch(`${apiRoot}/api/save`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				parentId: parentId,
				image: dataUrl,
				config: config.current,
			}),
		});

		const versions = await res.json();
		setVersions(versions);
		setParentId(versions[versions.length - 1].id);
	};

	React.useEffect(() => {
		(async () => {
			const res = await fetch(`${apiRoot}/api/list`);
			const versions = await res.json();
			setVersions(versions);

			const version = versions[versions.length - 1];
			setParentId(version.id);
			applyConfig(version.config);
		})();
	}, []);

	/*
	 * Generate settings UI from config
	 */

	const folders = [];
	const topFieldKeys = [];
	Object.entries(config.current).map(([k, v]) => {
		if (typeof(v) === 'object' && v.constructor.name === 'Object') {
			folders.push(<UiFolder
				key={k}
				title={k}
				v={v}
				onChange={() => {
					onConfigChange();
				}}
			/>);
		} else {
			topFieldKeys.push(k);
		}
	});

	folders.unshift(<UiFolder
		key="Settings"
		title="Settings"
		keys={topFieldKeys}
		v={config.current}
		expanded={true}
		onChange={(newValue, changedKey) => {
			if (project.current && (changedKey === 'width' || changedKey === 'height')) {
				setContext(prevContext => ({
					...prevContext,
					width: config.current.width,
					height: config.current.height,
				}));

				project.current.resize(getContext());
			}

			onConfigChange();
		}}
	/>);

	/*
	 * Animate
	 */

	const requestRef = React.useRef();

	const animate = time => {
		if (project.current) {
			project.current.render(getContext());
		}
		requestRef.current = requestAnimationFrame(animate);
	};

	React.useEffect(() => {
		requestRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(requestRef.current);
	}, [context]);

	/*
	 * Render
	 */

	const getInner = ({ width, height }) => <div
		ref={innerRef}
		className={classes.inner}
		style={{
			width: `${width}px`,
			height: `${height}px`,
		}}
	/>;

	return <div className={classes.wrapper}>
		<div ref={containerRef} className={classes.play}>
			{context.width && getInner(getContext())}
		</div>
		<Drawer
			variant="persistent"
			anchor="right"
			open={drawerOpen}
			classes={{paper: classes.configPaper}}
		>
			<div className={classes.drawerHeader}>
				<IconButton onClick={() => setDrawerOpen(false)}>
					<CloseIcon />
				</IconButton>
			</div>
			<Divider />
			<div className={classes.configFolders}>
				{folders}
			</div>
		</Drawer>
		<div className={classes.actions}>
			<Fab variant="extended" color="primary" aria-label="capture" onClick={onSave}>
				Save
			</Fab>
			<Fab
				color="secondary"
				aria-label="load"
				className={classes.loadButton}
				disabled={versions.length === 0}
				onClick={() => setLoadOpen(true)}
			>
				<AppsIcon />
			</Fab>
		</div>
		{context.width && <LoadDialog
			open={loadOpen}
			handleClose={() => setLoadOpen(false)}
			versions={versions}
			width={context.containerWidth}
			height={context.containerHeight}
			onLoadVersion={version => {
				setParentId(version.id);
				applyConfig(version.config);
				setLoadOpen(false);
			}}
			apiRoot={apiRoot}
		/>}
	</div>
}
