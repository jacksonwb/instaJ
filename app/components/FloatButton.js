import React from 'react'

export default function FloatButton(props) {
	return (
		<a href={props.href}>
			<div className='float-button' onClick={props.click}>
				<img className='float-button-img' src={props.img}/>
			</div>
		</a>
	)
}