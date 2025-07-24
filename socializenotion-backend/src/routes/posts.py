from flask import Blueprint, request, jsonify
from src.models.user import db, Post, Like, Comment, User, Follow
from src.routes.auth import token_required
from sqlalchemy import desc

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('/posts', methods=['GET'])
@token_required
def get_feed(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get posts from followed users and own posts
        following_ids = [f.following_id for f in current_user.following.all()]
        following_ids.append(current_user.id)  # Include own posts
        
        posts = Post.query.filter(Post.user_id.in_(following_ids))\
                         .order_by(desc(Post.created_at))\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        posts_data = []
        for post in posts.items:
            post_dict = post.to_dict()
            # Check if current user liked this post
            liked = Like.query.filter_by(user_id=current_user.id, post_id=post.id).first() is not None
            post_dict['liked_by_user'] = liked
            posts_data.append(post_dict)
        
        return jsonify({
            'posts': posts_data,
            'pagination': {
                'page': posts.page,
                'pages': posts.pages,
                'per_page': posts.per_page,
                'total': posts.total,
                'has_next': posts.has_next,
                'has_prev': posts.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching feed: {str(e)}'}), 500

@posts_bp.route('/posts', methods=['POST'])
@token_required
def create_post(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('content_type'):
            return jsonify({'message': 'Content type is required'}), 400
        
        post = Post(
            user_id=current_user.id,
            content_type=data['content_type'],
            media_url=data.get('media_url'),
            caption=data.get('caption', '')
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'message': 'Post created successfully',
            'post': post.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating post: {str(e)}'}), 500

@posts_bp.route('/posts/<int:post_id>', methods=['GET'])
@token_required
def get_post(current_user, post_id):
    try:
        post = Post.query.get_or_404(post_id)
        post_dict = post.to_dict()
        
        # Check if current user liked this post
        liked = Like.query.filter_by(user_id=current_user.id, post_id=post.id).first() is not None
        post_dict['liked_by_user'] = liked
        
        return jsonify({'post': post_dict}), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching post: {str(e)}'}), 500

@posts_bp.route('/posts/<int:post_id>', methods=['PUT'])
@token_required
def update_post(current_user, post_id):
    try:
        post = Post.query.get_or_404(post_id)
        
        if post.user_id != current_user.id:
            return jsonify({'message': 'Unauthorized to edit this post'}), 403
        
        data = request.get_json()
        
        if data.get('caption') is not None:
            post.caption = data['caption']
        
        if data.get('media_url'):
            post.media_url = data['media_url']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Post updated successfully',
            'post': post.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating post: {str(e)}'}), 500

@posts_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@token_required
def delete_post(current_user, post_id):
    try:
        post = Post.query.get_or_404(post_id)
        
        if post.user_id != current_user.id:
            return jsonify({'message': 'Unauthorized to delete this post'}), 403
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting post: {str(e)}'}), 500

@posts_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@token_required
def like_post(current_user, post_id):
    try:
        post = Post.query.get_or_404(post_id)
        
        # Check if already liked
        existing_like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
        if existing_like:
            return jsonify({'message': 'Post already liked'}), 400
        
        # Create like
        like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(like)
        
        # Update likes count
        post.likes_count += 1
        db.session.commit()
        
        return jsonify({
            'message': 'Post liked successfully',
            'likes_count': post.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error liking post: {str(e)}'}), 500

@posts_bp.route('/posts/<int:post_id>/like', methods=['DELETE'])
@token_required
def unlike_post(current_user, post_id):
    try:
        post = Post.query.get_or_404(post_id)
        
        # Find and remove like
        like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
        if not like:
            return jsonify({'message': 'Post not liked'}), 400
        
        db.session.delete(like)
        
        # Update likes count
        post.likes_count = max(0, post.likes_count - 1)
        db.session.commit()
        
        return jsonify({
            'message': 'Post unliked successfully',
            'likes_count': post.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error unliking post: {str(e)}'}), 500

@posts_bp.route('/posts/<int:post_id>/comments', methods=['GET'])
@token_required
def get_comments(current_user, post_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        comments = Comment.query.filter_by(post_id=post_id)\
                               .order_by(desc(Comment.created_at))\
                               .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'comments': [comment.to_dict() for comment in comments.items],
            'pagination': {
                'page': comments.page,
                'pages': comments.pages,
                'per_page': comments.per_page,
                'total': comments.total,
                'has_next': comments.has_next,
                'has_prev': comments.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching comments: {str(e)}'}), 500

@posts_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@token_required
def create_comment(current_user, post_id):
    try:
        post = Post.query.get_or_404(post_id)
        data = request.get_json()
        
        if not data or not data.get('content'):
            return jsonify({'message': 'Comment content is required'}), 400
        
        comment = Comment(
            user_id=current_user.id,
            post_id=post_id,
            content=data['content']
        )
        
        db.session.add(comment)
        
        # Update comments count
        post.comments_count += 1
        db.session.commit()
        
        return jsonify({
            'message': 'Comment created successfully',
            'comment': comment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating comment: {str(e)}'}), 500

@posts_bp.route('/users/<int:user_id>/posts', methods=['GET'])
@token_required
def get_user_posts(current_user, user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        posts = Post.query.filter_by(user_id=user_id)\
                         .order_by(desc(Post.created_at))\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        posts_data = []
        for post in posts.items:
            post_dict = post.to_dict()
            # Check if current user liked this post
            liked = Like.query.filter_by(user_id=current_user.id, post_id=post.id).first() is not None
            post_dict['liked_by_user'] = liked
            posts_data.append(post_dict)
        
        return jsonify({
            'posts': posts_data,
            'pagination': {
                'page': posts.page,
                'pages': posts.pages,
                'per_page': posts.per_page,
                'total': posts.total,
                'has_next': posts.has_next,
                'has_prev': posts.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching user posts: {str(e)}'}), 500

