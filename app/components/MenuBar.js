import React from 'react';

export default function MenuBar(props) {
	let authElem = props.currentUser ?
		<a href='/logout' className='menu-bar-element-right'>Log out {props.currentUser.name}</a> :
		<a href='/login' className='menu-bar-element-right'>Log in</a>

	let userElem = 	<a href='/settings' className='menu-bar-element-right'>User Settings</a>

	return (
		<div className='menu-bar'>
			<a href='/' className='menu-bar-element-left'>
				<img className='menu-thumb' src='/public/thumb.png'/>
				<p className='menu-bar-sub'>instaJ</p>
			</a>
			{authElem}
			{props.currentUser && userElem}
		</div>
	)
}