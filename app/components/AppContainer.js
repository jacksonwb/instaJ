import React from 'react';

export default class AppContainer extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			currentUser: undefined
		}
	}

	componentDidMount() {
		fetch('/api/auth')
		.then(response => response.json())
		.then(data => {
			console.log(data)
			if (data.currentUser && data.name)
				this.setState({
					currentUser: {
						email: data.currentUser,
						name: data.name,
						id_user: data.id_user
					}
			})
		})
	}

	render() {
		let children = React.Children.map(this.props.children, child => {
			return React.cloneElement(child, {
				currentUser: this.state.currentUser
			})
		})

		return (
			<div>
				{children}
			</div>
		);
	}
}