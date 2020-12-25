module.exports = {
	"plugins": [
		"html"
	],
	"env": {
		"node": false,
		"browser": true,
		"es6": true,
		"jquery": true
	},
	"extends": "eslint:recommended",
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly"
	},
	"parserOptions": {
		"ecmaVersion": 2020,
		"sourceType": "script",
	},
	"rules": {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"windows"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		],
		"no-prototype-builtins": [
			"off"
		]
	}
};