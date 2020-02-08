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

export function UiField({ k, v, onChange }) {
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