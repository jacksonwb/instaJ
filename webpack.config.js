var path = require('path');

module.exports = env => {
	console.log('Webpack mode: ', env.production ? 'prod' : 'dev')
	return {
		entry: {
			main: './app/main.js',
			photo: './app/photo.js'
		},
		mode: env.production ? 'production' : 'development',
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
		}
	}
}