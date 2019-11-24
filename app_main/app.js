import React from 'react';
import ReactDOM from 'react-dom'

class AppContainer extends React.Component {
	constructor(props) {
		super(props)
		this.state = {currentUser: undefined}
	}

	componentDidMount() {
		fetch('/api/auth')
		.then(response => response.json())
		.then(data => {
			this.setState({currentUser: data.currentUser})
		})
	}

	render() {
		return (
			<div>
				<h1>Camagru</h1>
				<MenuBar currentUser={this.state.currentUser}/>
				<Feed></Feed>
			</div>
		);
	}
}

function MenuBar(props) {
	console.log(props.currentUser)
	if (props.currentUser) {
		return (
			<h2>Hello {props.currentUser}</h2>
		)
	}
	return (
		<h2>Menu Bar</h2>
	)
}

class Feed extends React.Component {
	constructor(props) {
		super(props)
		this.state = {images:undefined}
	}

	componentDidMount() {
		fetch(`/api/images?nbr=5&lastId=0`)
		.then(response => response.json())
		.then(data => {
			this.setState({images:data})
		})
	}

	getImages() {
		if (this.state.images) {
			return this.state.images.map(image => {
				return <Post key={image.id_img} img={image}/>
			})
		}
		return <h2>No Images...</h2>
	}

	render() {
		return (
			<div>
				<h1>Feed</h1>
				{this.getImages()}
			</div>
		)
	}
  }

class Post extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			comments: undefined
		}
	}

	componentDidMount() {

		fetch(`/api/comments/${this.props.img.id_img}`)
		.then(response => response.json())
		.then(data => {
			this.setState({comments: data})
		}, err => {
			console.log(err);
		})
	}

	render() {
		let img = this.props.img;
		return (
			<div>
				<h3>Post</h3>
				<h4>{img.name}</h4>
				<ImageContainer src={img.path}/>
				<LikeBar/>
				<CommentContainer comments={this.state.comments}/>
			</div>
		)
	}
}

class ImageContainer extends React.Component {
	render() {
		let src = `/api/img/${this.props.src}`;
		return (
			<img src={src}></img>
		)
	}
}

class LikeBar extends React.Component {
	render() {
		return (
			<p>likebars</p>
		)
	}
}

class CommentContainer extends React.Component {
	getComments() {
		if (this.props.comments) {
			let comments = this.props.comments.map((comment) => {
				return <Comment key={comment.id_cm} author={comment.name} comment={comment.cm_text}/>
			})
			return (comments)
		} else {
			return (
				<p>No Comments...</p>
			)
		}
	}
	render() {
		let comments = this.getComments()
		if (this.props.comments) {
		}
		return (
			<div>
				{comments}
			</div>
		)
	}
}

class Comment extends React.Component {
	render() {
		return (
			<p>{this.props.author} - {this.props.comment}</p>
		)
	}
}

ReactDOM.render(
<AppContainer/>,
document.getElementById('app')
);