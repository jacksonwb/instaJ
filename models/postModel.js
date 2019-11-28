const imageModel = require('imageModel')
const commentModel = require('CommentModel')
const likeModel = require('likeModel')

function deletePost(db, id_img) {
	imageModel.removeImage(db, id_img)
	likeModel.removeAllLikes(db, id_img)
	commentModel.removeAllComments(db, id_img)
}

module.exports = {deletePost}