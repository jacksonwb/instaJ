import React from 'react';
import ReactDOM from 'react-dom'
import { TSImportEqualsDeclaration } from 'babel-types';
import AppContainer from './components/AppContainer'
import MenuBar from './components/MenuBar'
import Feed from './components/Feed'
import FloatButton from './components/FloatButton'

ReactDOM.render(
	<AppContainer>
		<MenuBar/>
		<Feed/>
		<FloatButton img='/public/camera.svg' href='/photo'/>
	</AppContainer>,
	document.getElementById('app')
);