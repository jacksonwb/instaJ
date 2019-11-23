import React from 'react';
import ReactDOM from 'react-dom'


class AppContainer extends React.Component {
	render() {
	  return (
		<div>
		  <Feed></Feed>
		</div>
	  );
	}
  }

class Feed extends React.Component {
	render() {
		return (
			<div>
				<h1>Feed</h1>
				<ImageContainer src='coolimage.jpg'/>
			</div>
		)
	}
  }

class Post extends React.Component {
	render() {
		return (
			<p>Post!</p>
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
	render() {
		return (
			<div></div>
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