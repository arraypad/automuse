import React from 'react';
import Drawer from '@material-ui/core/Drawer';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import InputColor from 'react-input-color';
import Switch from '@material-ui/core/Switch';

const useStyles = makeStyles(theme => ({
	appBar: {
		zIndex: theme.zIndex.drawer + 1,
	},
	wrapper: {
		flex: 1,
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
	configPanel: {
		width: '300px',
	},
	configPaper: {
		background: 'none',
		border: 'none',
	},
	configFolders: {
		padding: '10px',
	},
	configDetails: {
		display: 'flex',
		flexDirection: 'column',
	},
	configControl: {
		marginBottom: '20px',
		'&:last-of-type': {
			marginBottom: '0',
		},
	},
	inputColor: {
		marginTop: '5px',
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

export default function Play({ sketch, originalConfig }) {
	const classes = useStyles();

	const [, setRerender] = React.useState();
	const forceRerender = () => setRerender({});

	const [context, setContext] = React.useState({
		document: document,
		startTime: new Date().getTime(),
	});

	const config = React.useRef(originalConfig);

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
					forceRerender();
				}}
			/>);
		} else {
			topFieldKeys.push(k);
		}
	});

	folders.unshift(<UiFolder
		title="Settings"
		key="Settings"
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

			forceRerender();
		}}
	/>);

	return <div className={classes.wrapper}>
		<div ref={containerRef} className={classes.play}>
			{context.width && getInner(getContext())}
		</div>
		<Drawer variant="permanent" anchor="right" classes={{paper: classes.configPaper}}>
			<div className={classes.toolbar} />
				<div className={classes.configFolders}>
					{folders}
				</div>
		</Drawer>
	</div>
}

function UiFolder({ title, v, keys, onChange, expanded }) {
	const classes = useStyles();
	return <ExpansionPanel key={title} className={classes.configPanel} defaultExpanded={expanded}>
		<ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
			<Typography className={classes.heading}>{title}</Typography>
		</ExpansionPanelSummary>
		<ExpansionPanelDetails className={classes.configDetails}>
			{(keys || Object.keys(v)).map(k => 
				<UiField
					k={k}
					v={v[k]}
					key={k}
					onChange={newValue => {
						v[k] = newValue;
						onChange(v, k);
					}}
				/>
			)}
		</ExpansionPanelDetails>
	</ExpansionPanel>;
}

function UiField({ k, v, onChange }) {
	if (typeof(v) !== 'object') {
		return <UiFieldInner k={k} v={{value: v}} onChange={onChange} />;
	}

	if (v.constructor.name === 'Vector3') {
		return <UiFolder key={k} title={k} v={v} keys={['x', 'y', 'z']} onChange={onChange} />;
	} else if (v.constructor.name === 'Vector2') {
		return <UiFolder key={k} title={k} v={v} keys={['x', 'y']} onChange={onChange} />;
	}
	
	return <UiFieldInner k={k} v={v} onChange={onChange} />;
}

function UiFieldInner({ k, v, onChange }) {
	const classes = useStyles();

	if (!v.component) {
		if (/colou?r/.test(k)) {
			v.component = 'color';
		} else {
			switch (typeof(v.value)) {
			case 'number':
				v.component = 'number';
				break;
			case 'boolean':
				v.component = 'switch';
				break;
			default:
				v.component = 'string';
				break;
			}
		}
	}

	let input;
	switch (v.component) {
	case 'color':
		input = <InputColor
			className={classes.inputColor}
			initialHexColor={'#ff0000'}
			onChange={newValue => onChange(newValue.hex)}
		/>
		break;
	case 'string':
		input = <TextField
			defaultValue={v.value}
			onChange={e => onChange(e.target.value)}
		/>;
		break;
	case 'number':
		input = <TextField
			defaultValue={v.value}
			onChange={e => onChange(parseFloat(e.target.value))}
		/>;
		break;
	case 'switch':
		input = <Switch
			checked={v.value}
			onChange={e => {
				v.value = e.target.checked;
				onChange(v.value);
			}}
		/>;
		break;
	default:
		console.error('Unknown component type: ', v.component);
		return false;
	}
	
	return <FormControl className={classes.configControl}>
		<FormLabel>{k}</FormLabel>
		{input}
	</FormControl>;
}
