module.exports = {
	"plugins": [
		"html"
	],
	"env": {
		"browser": true,
		"commonjs": true,
		"es6": true,
		"jquery": true
	},
	"extends": "eslint:recommended",
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly"
	},
	"parserOptions": {
		"ecmaVersion": 2019
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