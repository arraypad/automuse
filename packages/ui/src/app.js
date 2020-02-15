import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import CloseIcon from '@material-ui/icons/Close';
import CodeIcon from '@material-ui/icons/Code';
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser';
import MenuIcon from '@material-ui/icons/Menu';
import SaveIcon from '@material-ui/icons/Save';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import SettingsIcon from '@material-ui/icons/Settings';

import { makeStyles } from '@material-ui/core/styles';

import { UiFolder, UiField, drawerWidth } from './ui-field'
import LoadDialog from './load';

const apiRoot = process.env.AUTOMUSE_API_ROOT || 'http://localhost:1234';

const useStyles = makeStyles(theme => ({
	icon: {
		marginRight: theme.spacing(1),
	},
	appBar: {
		transition: theme.transitions.create(['margin', 'width'], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen,
		}),
	},
	wrapper: {
		flex: 1,
	},
	title: {
		flexGrow: 1,
	},
	appWrapper: {
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
	save: {
		margin: theme.spacing(1),
	},
	captureIcon: {
		margin: theme.spacing(1),
	},
	loadButton: {
		marginLeft: theme.spacing(1),
	},
}));

export function assignAll(source, dest) {
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

export function App({
	sketch,
	originalConfig,
	projectId,
}) {
	function storeGetItem(name) {
		return window.localStorage.getItem(`${projectId}/${name}`);
	}

	function storeSetItem(name, value) {
		return window.localStorage.setItem(`${projectId}/${name}`, value);
	}

	const classes = useStyles();

	const [drawerOpen, setDrawerOpen] = React.useState(false);

	const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
	const menuClose = () => {
		setMenuAnchorEl(null);
	};
	const [loadOpen, setLoadOpen] = React.useState(false);

	const [, setRerender] = React.useState();
	const forceRerender = () => setRerender({});

	const project = React.useRef(null);

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
		startTime: new Date().getTime(),
		exportWorkers: 4,
	});

	const getContext = frame => {
		const fps = config.current.fps || 30;

		let time;
		if (frame === undefined) {
			time = (new Date().getTime() - context.startTime) / 1000;
			frame = fps * time;
		} else {
			time = frame / fps;
		}

		const ctx = {
			time,
			frame,
			...context,
		};

		return Object.assign(ctx, config.current);
	};

	const config = React.useRef(originalConfig);
	let resetConfigJson = JSON.stringify(config);

	const updateDimensions = () => {
		setContext(prevContext => ({
			...prevContext,
			width: config.current.width,
			height: config.current.height,
		}));

		if (project.current) {
			project.current.resize(getContext());
		}
	};

	const applyConfig = newConfig => {
		const dimsChanged = newConfig.width !== config.current.width || newConfig.height !== config.current.height;
		assignAll(newConfig, config.current);
		if (dimsChanged) {
			updateDimensions();
		}
		resetConfigJson = JSON.stringify(newConfig);
		storeSetItem('config', JSON.stringify(newConfig));
	};

	const resetConfig = () => {
		applyConfig(JSON.parse(resetConfigJson));
	};

	const cachedConfigJson = storeGetItem('config');
	if (cachedConfigJson !== null) {
		applyConfig(JSON.parse(cachedConfigJson));
	}

	const onConfigChange = () => {
		// todo: also store expansion state of folders?
		storeSetItem('config', JSON.stringify(config.current));
		forceRerender();
		if (project.current && !project.current.animate) {
			project.current.render(getContext());
		}
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

		if (container) {
			updateDimensions();
		}
	}, []);

	const innerRef = React.useCallback(inner => {
		setContext(prevContext => ({
			...prevContext,
			canvas: inner,
		}));
	}, []);

	/*
	 * Instantiate the sketch class and store in the project ref
	 */

	React.useEffect(() => {
		if (context.canvas) {
			project.current = new sketch(getContext());

			if (!project.current.animate) {
				project.current.render(getContext());
			}
		}

		return () => {
			project.current = null;
		};
	}, [context]);

	/*
	 * Save and load versions
	 */

	const [parentId, setParentId] = React.useState(storeGetItem('parentId'));
	const [versions, setVersions] = React.useState([]);

	const onSave = async () => {
		const dataUrl = context.canvas.toDataURL();
		const res = await fetch(`${apiRoot}/api/save`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				parentId: parentId,
				image: dataUrl,
				config: config.current,
				width: config.current.width || context.width,
				height: config.current.height || context.height,
			}),
		});

		const versions = await res.json();
		setVersions(versions);
		setParentId(versions[versions.length - 1].id);
	};

	const isExporting = React.useRef(false);
	const [exportOpen, setExportOpen] = React.useState(false);
	const [exportProgress, setExportProgress] = React.useState(50);
	const onExport = async () => {
		setExportProgress(0);
		isExporting.current = true;
		setExportOpen(true);

		const numFrames =  project.current.animate ? config.current.frames || 300 : 1;
		const frames = new Array(numFrames);

		const ctx = getContext();
		const startTime = new Date();

		if (window.Worker && context.exportWorkers > 0) {
			const workers = [];

			await (() => new Promise((resolve, reject) => {
				let renderedFrames = 0;

				for (let i = 0; i < context.exportWorkers; i++) {
					const canvas = document.createElement('canvas');
					canvas.width = ctx.width;
					canvas.height = ctx.height;

					const offscreen = canvas.transferControlToOffscreen()

					const worker = new Worker(`${apiRoot}/.worker.js`);

					worker.onmessage = async (e) => {
						const { frame, dataUrl } = e.data;
						frames[frame] = dataUrl;
						setExportProgress(80 * ++renderedFrames / numFrames);
						if (renderedFrames === numFrames) {
							resolve();
						}
					};

					worker.postMessage({
						handler: 'init',
						ctx: {
							...ctx,
							canvas: offscreen,
						},
					}, [offscreen]);

					worker.postMessage({
						handler: 'setConfig',
						ctx: config.current,
					});

					workers.push({worker, canvas});
				}

				for (let i = 0; i < numFrames; i++) {
					const { worker } = workers[i % context.exportWorkers];

					const ctx = getContext(i);
					delete ctx.canvas;

					worker.postMessage({handler: 'render', ctx});
				}
			}))();

			workers.map(({ worker }) => worker.terminate());
			workers.splice(0, workers.length);
		} else {
			for (let i = 0; i < numFrames; i++) {
				const ctx = getContext(i);

				if (project.current.animate) {
					project.current.animate(ctx);
				}

				project.current.render(ctx);
				frames[i] = context.canvas.toDataURL();
				setExportProgress(80 * i / numFrames);
			}
		}

		console.log('Rendered in ', (new Date() - startTime) / 1000, 'seconds');

		const res = await fetch(`${apiRoot}/api/render`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id: parentId,
				frames,
			}),
		});

		setExportProgress(100);

		const { url } = await res.json();
		window.open(url);
		isExporting.current = false;
		setExportOpen(false);
	};

	const onExportDone = () => {
		isExporting.current = false;
		setExportOpen(false);
	};

	const onDelete = async (version) => {
		const res = await fetch(`${apiRoot}/api/delete`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id: version.id,
				parentId: version.parentId,
			}),
		});

		const versions = await res.json();
		setVersions(versions);
	};

	React.useEffect(() => {
		(async () => {
			const res = await fetch(`${apiRoot}/api/list`);
			const versions = await res.json();
			setVersions(versions);
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
				updateDimensions();
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
			if (project.current.animate) {
				if (!isExporting.current) {
					project.current.animate(getContext());
					project.current.render(getContext());
				}
			} else {
				requestRef.current = null;
				return;
			}
		}

		requestRef.current = requestAnimationFrame(animate);
	};

	React.useEffect(() => {
		requestRef.current = requestAnimationFrame(animate);
		return () => {
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
			}
		};
	}, [context]);

	/*
	 * Render
	 */

	const getInner = ({ width, height }) => <canvas
		ref={innerRef}
		className={classes.inner}
		width={width}
		height={height}
	/>;

	return <>
		<div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
			<AppBar position="sticky" className={classes.appBar}>
				<Toolbar>
					<IconButton
						classes={{root: classes.icon}}
						color="inherit"
						onClick={e => setMenuAnchorEl(e.currentTarget)}
					>
						<MenuIcon />
					</IconButton>
					<Typography variant="h6" noWrap className={classes.title}>
						Automuse
					</Typography>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="end"
						onClick={() => setDrawerOpen(true)}
					>
						<SettingsIcon />
					</IconButton>
				</Toolbar>
			</AppBar>
			<Menu
				variant="menu"
				getContentAnchorEl={null}
				anchorEl={menuAnchorEl}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'left',
				}}
				keepMounted
				open={Boolean(menuAnchorEl)}
				onClose={menuClose}
			>
				<MenuItem onClick={() => { menuClose(); onSave(); }}>
					<ListItemIcon fontSize="small"><SaveIcon /></ListItemIcon>
					<ListItemText>Save</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => { menuClose(); setLoadOpen(true); }}
					disabled={versions.length === 0}
				>
					<ListItemIcon fontSize="small"><OpenInBrowserIcon /></ListItemIcon>
					<ListItemText>Load</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => { menuClose(); onExport(); }}>
					<ListItemIcon fontSize="small"><SaveAltIcon /></ListItemIcon>
					<ListItemText>Export render</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => { menuClose(); alert('exporting!'); }} disabled>
					<ListItemIcon fontSize="small"><CodeIcon /></ListItemIcon>
					<ListItemText>Export production build</ListItemText>
				</MenuItem>
			</Menu>
			<div className={classes.appWrapper}>
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
					<div className={classes.drawerHeader} />
				</Drawer>
				<div className={classes.actions}>
					<Fab variant="extended" color="primary" onClick={onSave}>
						<SaveIcon className={classes.save} />
						Save
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
						storeSetItem('parentId', version.id);
						applyConfig(version.config);
						setLoadOpen(false);
					}}
					onDeleteVersion={version => {
						if (version.id === parentId) {
							setParentId(version.parentId);
							storeSetItem('parentId', version.parentId);
						}
						onDelete(version);
					}}
					apiRoot={apiRoot}
					parentId={parentId}
				/>}
				<Dialog
					open={exportOpen}
					onClose={onExportDone}
					onClick={e => e.stopPropagation()}
					onMouseDown={e => e.stopPropagation()}
					onTouchStart={e => e.stopPropagation()}
				>
					<DialogTitle>{"Exporting"}</DialogTitle>
					<DialogContent>
						<DialogContentText>
							Please wait, or make a cup of tea...
						</DialogContentText>
						<div>
							<LinearProgress
								variant="determinate"
								value={exportProgress}
							/>
							<span>{exportProgress}%</span>
						</div>
					</DialogContent>
					<DialogActions>
						<Button onClick={onExportDone} autoFocus>
							Cancel
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		</div>
	</>;
}
