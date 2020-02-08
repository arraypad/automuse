import React from 'react';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import clsx from 'clsx';

import { UiFolder, UiField, drawerWidth } from './ui-field'
import LoadDialog from './load';

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
	handleDrawerClose,
	loadOpen,
	handleLoadClose,
}) {
	const classes = useStyles();

	const [, setRerender] = React.useState();
	const forceRerender = () => setRerender({});

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
				context.width = width;
				context.height = height;
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

	const getInner = ({ width, height }) => 
		<div
			ref={innerRef}
			className={classes.inner}
			style={{
				width: `${width}px`,
				height: `${height}px`,
			}}
		/>;

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
				<IconButton onClick={handleDrawerClose}>
					<CloseIcon />
				</IconButton>
			</div>
			<Divider />
			<div className={classes.configFolders}>
				{folders}
			</div>
		</Drawer>
		<LoadDialog open={loadOpen} handleClose={handleLoadClose} />
	</div>
}
