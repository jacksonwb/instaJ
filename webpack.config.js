var path = require('path');

module.exports = {
	entry: {
		main: './app/main.js',
		photo: './app/photo.js'
	},
	mode: 'development',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].bundle.js'
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			}
		]
	},
}