import React from 'react';

export default class AppContainer extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			currentUser: undefined
		}
		this.divRef = React.createRef()
	}

	componentDidMount() {
		fetch('/api/auth')
		.then(response => response.json())
		.then(data => {
			if (data.currentUser && data.name)
				this.setState({
					currentUser: {
						email: data.currentUser,
						name: data.name,
						id_user: data.id_user
					}
			})
		})
		setTimeout(() => {
			this.divRef.current.style.opacity = '1';
		}, 200)
	}

	render() {
		let children = React.Children.map(this.props.children, child => {
			return React.cloneElement(child, {
				currentUser: this.state.currentUser
			})
		})

		return (
			<div className='app-container' ref={this.divRef} style={{opacity: '0'}}>
				{children}
			</div>
		);
	}
}