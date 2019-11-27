import React from 'react';
import ReactDOM from 'react-dom'

class AppContainer extends React.Component {
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
						name: data.name
					}
			})
		})
	}

	render() {
		return (
			<div>
				<MenuBar currentUser={this.state.currentUser}/>
				<Feed currentUser={this.state.currentUser}></Feed>
			</div>
		);
	}
}

function MenuBar(props) {
	if (props.currentUser) {
		return (
			<div className='menu-bar'>
				<a href='/' className='menu-bar-element-left'>Camagru</a>
				<a href='/logout' className='menu-bar-element-right'>Log out {props.currentUser.name}</a>
			</div>
		)
	}
	return (
		<div className='menu-bar'>
			<a href='/' className='menu-bar-element-left'>Camagru</a>
			<a href='/login' className='menu-bar-element-right'>Log in</a>
		</div>
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
				return <Post key={image.id_img} img={image} currentUser={this.props.currentUser}/>
			})
		}
		return <h2>No Images...</h2>
	}

	render() {
		return (
			<div className='center feed-container'>
				{this.getImages()}
			</div>
		)
	}
  }

class Post extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			comments: undefined,
			isLiked: false,
			numLikes: 0,
			showNewCommentField: false
		}
		this.toggleLike = this.toggleLike.bind(this)
		this.appendComment = this.appendComment.bind(this)
		this.toggleComment = this.toggleComment.bind(this)
	}

	componentDidMount() {
		fetch(`/api/comments/${this.props.img.id_img}`)
		.then(response => response.json())
		.then(data => {
			this.setState({comments: data})
		}, err => {
			console.log(err);
		})

		fetch(`/api/likes/isLiked/${this.props.img.id_img}`)
		.then(response => response.json())
		.then(data => {
			this.setState({isLiked: data.userLikes})
		})

		fetch(`/api/likes/${this.props.img.id_img}`)
		.then(response => response.json())
		.then(data => {
			this.setState({numLikes: data.numLikes})
		})
	}

	appendComment(commentContent) {
		console.log((this.state.comments))
		if (this.state.comments.length) {
			let joined = this.state.comments
			let id_cm = joined.map(val => val.id_cm).reduce((max, current) => Math.max(max, current))
			joined.push({
				cm_text: commentContent,
				name: this.props.currentUser.name,
				id_cm: id_cm + 1
			})
			console.log(joined)
			this.setState({
				comments: joined
			})
		} else {
			this.setState({
				comments: [{
					cm_text: commentContent,
					name: this.props.currentUser.name,
					id_cm: 1
				}]
			})
		}
	}

	toggleLike() {
		let isLiked = this.state.isLiked
		if (isLiked) {
			this.setState((state) => {
				return {
					isLiked: false,
					numLikes: state.numLikes - 1
				}
			})
		} else {
			this.setState((state) => {
				return {
					isLiked: true,
					numLikes: state.numLikes + 1
				}
			})
		}
		fetch('/api/likes', {
			method: 'post',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
				},
			body: JSON.stringify({
				likeStatus: !isLiked,
				id_img: this.props.img.id_img
			})
		})
	}

	toggleComment() {
		this.setState((state) => {
			return {showNewCommentField: !state.showNewCommentField}
		})
	}

	render() {
		let img = this.props.img;
		return (
			<div className='post-container'>
				<h4 className='post-author'>{img.name}</h4>
				<ImageContainer src={img.path} toggleLike={this.toggleLike}/>
				<LikeBar isLiked={this.state.isLiked}
					numLikes={this.state.numLikes}
					currentUser={this.props.currentUser}
					toggleLike={this.toggleLike}
					toggleComment={this.toggleComment}/>
				<CommentContainer
					showNewCommentField={this.state.showNewCommentField}
					comments={this.state.comments}
					appendHandle={this.appendComment}
					currentUser={this.props.currentUser}
					appendComment={this.appendComment}/>
			</div>
		)
	}
}

class ImageContainer extends React.Component {
	render() {
		let src = `/api/img/${this.props.src}`;
		return (
			<div className='image-container'>
				<img className='post-image' src={src} onDoubleClick={this.props.toggleLike}></img>
			</div>
		)
	}
}

class LikeBar extends React.Component {
	render() {
		let likeIcon = this.props.currentUser
			? <img className='like-image'
					onClick={this.props.toggleLike}
					src={this.props.isLiked
				? '/public/thumb-up.svg'
				: '/public/thumb-up-outline.svg'}/>
			: ''
		let commentIcon = this.props.currentUser
			? <img className='comment-image'
					src='/public/add_comment-24px.svg'
					onClick={this.props.toggleComment}/>
			: ''
		return (
			<div className='like-container'>
				<p className='like-count'>{this.props.numLikes} likes</p>
				{likeIcon}
				{commentIcon}
			</div>
		)
	}
}

class CommentContainer extends React.Component {
	constructor(props) {
		super(props)
	}
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
		let newComment = this.props.currentUser ? <NewComment currentUser={this.props.currentUser} appendComment={this.props.appendComment}/> : ''
		return (
			<div>
				{comments}
				{this.props.showNewCommentField && newComment}
			</div>
		)
	}
}

class NewComment extends React.Component {
	constructor(props) {
		super(props)
		this.state = {commentValue: ''}
		this.handleChange = this.handleChange.bind(this)
		this.handleEnter = this.handleEnter.bind(this)
	}

	handleChange(event) {
		this.setState({commentValue: event.target.value})
	}

	handleEnter(event) {
		if (event.key == 'Enter') {
			this.props.appendComment(this.state.commentValue)
		}
	}

	render() {
		return(
			<div className='new-comment-container'>
				<input className='new-comment-content' type='text'
					value={this.state.commentValue}
					onChange={this.handleChange}
					placeholder='Comment...'
					onKeyPress={this.handleEnter}/>
			</div>
		)
	}
}

class Comment extends React.Component {
	render() {
		return (
			<div className='comment-container'>
				<span className='comment-author'>{this.props.author}</span>
				<span className='comment-content'>{this.props.comment}</span>
			</div>
		)
	}
}

ReactDOM.render(
<AppContainer/>,
document.getElementById('app')
);