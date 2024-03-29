import React from 'react';

export default class Post extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			comments: undefined,
			isLiked: false,
			numLikes: 0,
			showNewCommentField: false,
			showDeleteModal: false
		}
		this.toggleLike = this.toggleLike.bind(this)
		this.appendComment = this.appendComment.bind(this)
		this.toggleComment = this.toggleComment.bind(this)
		this.toggleDeleteModal = this.toggleDeleteModal.bind(this)
	}

	componentDidMount() {
		fetch(`/api/comments/${this.props.img.id_img}`)
		.then(response => response.json())
		.then(data => {
			this.setState({comments: data})
		}, err => {
			onsole.log(err);
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

	toggleDeleteModal() {
		this.setState((state) => ({
			showDeleteModal: !state.showDeleteModal
		}))
	}

	appendComment(commentContent) {
		let newComment = {}
		if (this.state.comments.length) {
			let joined = this.state.comments
			let id_cm = joined.map(val => val.id_cm).reduce((max, current) => Math.max(max, current))
			newComment = {
				cm_text: commentContent,
				name: this.props.currentUser.name,
				id_cm: id_cm + 1
			}
			joined.push(newComment)
			this.setState({
				comments: joined,
				showNewCommentField: false
			})
		} else {
			newComment = {
				cm_text: commentContent,
				name: this.props.currentUser.name,
				id_cm: 1
			}
			this.setState({
				comments: [newComment],
				showNewCommentField: false
			})
		}
		console.log(this.props.img.id_img)
		fetch(`/api/comments/${this.props.img.id_img}`, {
			method: 'post',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				comment: commentContent
			})
		})
	}

	toggleLike() {
		if (!this.props.currentUser)
			return
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
		let displayDeleteIcon = this.props.currentUser && this.props.currentUser.id_user === img.id_user ?
			true : false

		let modal =  (
			<Modal toggleDeleteModal={this.toggleDeleteModal}>
				<h3>Delete post?</h3>
				<div className='modal-button-container'>
					<div className='modal-button-yes modal-button' onClick={this.props.deletePost}>Yes</div>
					<div className='modal-button-no modal-button' onClick={this.toggleDeleteModal}>No</div>
				</div>
			</Modal>
		)

		return (
			<div className='post-container'>
				{this.state.showDeleteModal && modal}
				<TitleBar img={img}
				displayDeleteIcon={displayDeleteIcon}
				toggleDeleteModal={this.toggleDeleteModal}/>
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

class TitleBar extends React.Component {
	render () {
		let icon = this.props.displayDeleteIcon ?
			<img src='/public/delete.svg'
				className='title-bar-delete-icon'
				onClick={this.props.toggleDeleteModal}/> : ''
		return (
			<div className='title-bar-container'>
				<h4 className='post-author'>{this.props.img.name}</h4>
				{icon}
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

function Modal(props) {
	return(
		<div>
			<div className='modal-background' onClick={props.toggleDeleteModal}></div>
			<div className='modal-message'>{props.children}</div>
		</div>
	)
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
		this.NewCommentRef = React.createRef()
	}

	componentDidMount() {
		this.NewCommentRef.current.focus()
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
				<textarea className='new-comment-content' type='text'
					ref={this.NewCommentRef}
					value={this.state.commentValue}
					onChange={this.handleChange}
					placeholder='Comment...'
					maxLength='500'
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