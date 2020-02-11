import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import InputColor from 'react-input-color';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

export const drawerWidth = 300;

const useStyles = makeStyles(theme => ({
	configPanel: {
		width: drawerWidth,
	},
	configPaper: {
		// background: '#eee',
		// border: 'none',
	},
	configFolders: {
		padding: '10px',
	},
	configDetails: {
		display: 'flex',
		flexDirection: 'column',
	},
	configInline: {
		display: 'flex',
		flexDirection: 'column',
		marginBottom: theme.spacing(2),
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

export function UiFolder({ title, v, keys, onChange, expanded }) {
	const classes = useStyles();

	const fields = (keys || Object.keys(v)).map(k =>
		<UiField
			k={k}
			v={v[k]}
			key={k}
			onChange={newValue => {
				v[k] = newValue;
				onChange(v, k);
			}}
		/>
	);

	if (!title) {
		return <div className={classes.configInline}>{fields}</div>;
	}

	return <ExpansionPanel
		key={title}
		className={classes.configPanel}
		defaultExpanded={expanded}
		elevation={0}
	>
		<ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
			<Typography className={classes.heading}>{title.toUpperCase()}</Typography>
		</ExpansionPanelSummary>
		<ExpansionPanelDetails className={classes.configDetails}>
			{fields}
		</ExpansionPanelDetails>
	</ExpansionPanel>;
}

export function UiField({ k, v, onChange, inputOnly }) {
	if (typeof(v) !== 'object') {
		return <UiFieldInner k={k} v={{value: v}} onChange={onChange} inputOnly={inputOnly} />;
	}

	if (v.constructor.name === 'Vector3' || v.constructor.name === 'Euler') {
		return <UiFieldCompound key={k} title={k} v={v} keys={['x', 'y', 'z']} onChange={onChange} />;
	} else if (v.constructor.name === 'Vector2') {
		return <UiFieldCompound key={k} title={k} v={v} keys={['x', 'y']} onChange={onChange} />;
	}
	
	return <UiFieldInner k={k} v={v} onChange={onChange} inputOnly={inputOnly} />;
}

function UiFieldCompound({ title, v, keys, onChange }) {
	const classes = useStyles();

	return <FormControl className={classes.configControl}>
		<FormLabel>{title}</FormLabel>
		<div style={{
			display: 'flex',
		}}>
			{(keys || Object.keys(v)).map(k =>
				<UiField
					k={k}
					v={v[k]}
					key={k}
					onChange={newValue => {
						v[k] = newValue;
						onChange(v, k);
					}}
					inputOnly={true}
				/>
			)}
		</div>
	</FormControl>;
}

function itoh2(i) {
	const s = (i & 255).toString(16);
	return s.length === 2 ? s : '0' + s;
}

function UiFieldInner({ k, v, onChange, inputOnly }) {
	const classes = useStyles();

	if (!v.component) {
		if (/colou?r/i.test(k)) {
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
		let numeric = false, i = v.value;
		if (typeof(i) === 'number') {
			numeric = true;
			i = `#${itoh2(i >> 16)}${itoh2(i >> 8)}${itoh2(i)}`;
		}

		input = <InputColor
			className={classes.inputColor}
			initialHexColor={i}
			onChange={newValue => {
				onChange(numeric
					? ((newValue.r << 16) | (newValue.g << 8) | newValue.b)
					: newValue.hex)
			}}
		/>
		break;
	case 'string':
		input = <TextField
			label={inputOnly && k}
			value={v.value}
			onChange={e => onChange(e.target.value)}
		/>;
		break;
	case 'number':
		input = <TextField
			label={inputOnly && k}
			value={v.value}
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

	if (inputOnly) {
		return input;
	}
	
	return <FormControl className={classes.configControl}>
		<FormLabel>{k}</FormLabel>
		{input}
	</FormControl>;
}
