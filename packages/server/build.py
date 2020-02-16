#!/usr/bin/env python

import os
import glob
import json
from shutil import copyfile

def read(path):
	with open(path, 'r') as f:
		return f.read()

templates = {
	os.path.splitext(os.path.basename(f))[0]: read(f) \
		for f in glob.glob('../ui/example/*.js')
}

index = read('src/index.js').replace(
	'templates = {}',
	'templates = {}'.format(json.dumps(templates))
).replace(
	'uiDist = ``',
	'uiDist = {}'.format(json.dumps(read('../ui/dist/index.js'))),
)

with open('dist/index.js', 'w') as f:
	f.write(index)

copyfile('src/templates.js', 'dist/templates.js')
