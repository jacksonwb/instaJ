import React from 'react';
import Post from './Post'

function throttle(fn, wait) {
	let time = Date.now()
	return function() {
		if (Date.now() > wait + time) {
			fn()
			time = Date.now()
		}
	}
}

export default class Feed extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			images:undefined,
			loading: false}
		this.deletePost = this.deletePost.bind(this)
		this.fetchNextImages = this.fetchNextImages.bind(this)
		this.setScrollEvent = this.setScrollEvent.bind(this)

		window.onscroll = throttle(() => {this.setScrollEvent(0.9, () => {this.fetchNextImages(1)})}, 100)
	}

	componentDidMount() {
		fetch(`/api/images?nbr=5&lastId=0`)
		.then(response => response.json())
		.then(data => {
			this.setState({images:data})
		})
	}

	fetchNextImages(nbr) {
		const lastId = this.state.images.map(img => img.id_img).reduce((max, current) => Math.max(max, current))
		this.setState({loading: true})
		fetch(`/api/images?nbr=${nbr}&lastId=${lastId}`)
		.then(response => response.json())
		.then(data => {
			this.setState((state) => {
				return {
					loading: false,
					images:state.images.concat(data)
				}
			})
		})
	}

	setScrollEvent(ratio, handler) {
		if (
			(window.innerHeight + document.documentElement.scrollTop)
			/ document.documentElement.offsetHeight > ratio
		) {
			handler()
		}
	}

	deletePost(id_img) {
		return () => {
			if (this.state.images) {
				let images = this.state.images.filter((ob) => {
					return ob.id_img != id_img
				})
				this.setState({images})
				fetch(`/api/img/${id_img}`, {
					method: 'delete',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
						},
					body: JSON.stringify({
						confirm: true
					})
				})
			}
		}
	}

	renderPosts() {
		if (this.state.images) {
			return this.state.images.map(image => {
				return <Post
					key={image.id_img}
					img={image}
					currentUser={this.props.currentUser}
					showModal={this.state.showDeleteModal}
					toggleDeleteModal={this.toggleDeleteModal}
					deletePost={this.deletePost(image.id_img)}/>
			})
		}
		return <h2>No Images...</h2>
	}

	render() {
		return (
			<div>
				<div className='center feed-container'>
					{this.renderPosts()}
				</div>
				{this.state.loading && <h2 style={{'textAlign':'center'}}>Loading...</h2>}
			</div>
		)
	}
}