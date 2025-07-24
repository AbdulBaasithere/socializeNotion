from flask import Blueprint, request, jsonify
from src.models.user import db, User, Follow
from src.routes.auth import token_required
from sqlalchemy import or_

user_bp = Blueprint('user', __name__)

@user_bp.route('/users/search', methods=['GET'])
@token_required
def search_users(current_user):
    try:
        query = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        if not query:
            return jsonify({'users': [], 'pagination': {}}), 200
        
        users = User.query.filter(
            or_(
                User.username.contains(query),
                User.email.contains(query),
                User.bio.contains(query)
            )
        ).filter(User.id != current_user.id)\
         .paginate(page=page, per_page=per_page, error_out=False)
        
        users_data = []
        for user in users.items:
            user_dict = user.to_dict()
            # Check if current user is following this user
            is_following = Follow.query.filter_by(
                follower_id=current_user.id,
                following_id=user.id
            ).first() is not None
            user_dict['is_following'] = is_following
            users_data.append(user_dict)
        
        return jsonify({
            'users': users_data,
            'pagination': {
                'page': users.page,
                'pages': users.pages,
                'per_page': users.per_page,
                'total': users.total,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error searching users: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
def get_user_profile(current_user, user_id):
    try:
        user = User.query.get_or_404(user_id)
        user_dict = user.to_dict()
        
        # Add relationship info if not viewing own profile
        if user_id != current_user.id:
            is_following = Follow.query.filter_by(
                follower_id=current_user.id,
                following_id=user_id
            ).first() is not None
            user_dict['is_following'] = is_following
            
            follows_back = Follow.query.filter_by(
                follower_id=user_id,
                following_id=current_user.id
            ).first() is not None
            user_dict['follows_back'] = follows_back
        
        return jsonify({'user': user_dict}), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching user profile: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>/follow', methods=['POST'])
@token_required
def follow_user(current_user, user_id):
    try:
        if user_id == current_user.id:
            return jsonify({'message': 'Cannot follow yourself'}), 400
        
        user_to_follow = User.query.get_or_404(user_id)
        
        # Check if already following
        existing_follow = Follow.query.filter_by(
            follower_id=current_user.id,
            following_id=user_id
        ).first()
        
        if existing_follow:
            return jsonify({'message': 'Already following this user'}), 400
        
        # Create follow relationship
        current_user.follow(user_to_follow)
        db.session.commit()
        
        return jsonify({
            'message': f'Now following {user_to_follow.username}',
            'follower_count': user_to_follow.get_follower_count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error following user: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>/unfollow', methods=['DELETE'])
@token_required
def unfollow_user(current_user, user_id):
    try:
        if user_id == current_user.id:
            return jsonify({'message': 'Cannot unfollow yourself'}), 400
        
        user_to_unfollow = User.query.get_or_404(user_id)
        
        # Check if following
        existing_follow = Follow.query.filter_by(
            follower_id=current_user.id,
            following_id=user_id
        ).first()
        
        if not existing_follow:
            return jsonify({'message': 'Not following this user'}), 400
        
        # Remove follow relationship
        current_user.unfollow(user_to_unfollow)
        db.session.commit()
        
        return jsonify({
            'message': f'Unfollowed {user_to_unfollow.username}',
            'follower_count': user_to_unfollow.get_follower_count()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error unfollowing user: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>/followers', methods=['GET'])
@token_required
def get_followers(current_user, user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        user = User.query.get_or_404(user_id)
        
        followers = Follow.query.filter_by(following_id=user_id)\
                               .paginate(page=page, per_page=per_page, error_out=False)
        
        followers_data = []
        for follow in followers.items:
            follower_dict = follow.follower.to_dict()
            # Check if current user is following this follower
            is_following = Follow.query.filter_by(
                follower_id=current_user.id,
                following_id=follow.follower_id
            ).first() is not None
            follower_dict['is_following'] = is_following
            followers_data.append(follower_dict)
        
        return jsonify({
            'followers': followers_data,
            'pagination': {
                'page': followers.page,
                'pages': followers.pages,
                'per_page': followers.per_page,
                'total': followers.total,
                'has_next': followers.has_next,
                'has_prev': followers.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching followers: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>/following', methods=['GET'])
@token_required
def get_following(current_user, user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        user = User.query.get_or_404(user_id)
        
        following = Follow.query.filter_by(follower_id=user_id)\
                               .paginate(page=page, per_page=per_page, error_out=False)
        
        following_data = []
        for follow in following.items:
            followed_dict = follow.followed.to_dict()
            # Check if current user is following this person
            is_following = Follow.query.filter_by(
                follower_id=current_user.id,
                following_id=follow.following_id
            ).first() is not None
            followed_dict['is_following'] = is_following
            following_data.append(followed_dict)
        
        return jsonify({
            'following': following_data,
            'pagination': {
                'page': following.page,
                'pages': following.pages,
                'per_page': following.per_page,
                'total': following.total,
                'has_next': following.has_next,
                'has_prev': following.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching following: {str(e)}'}), 500

@user_bp.route('/users/discover', methods=['GET'])
@token_required
def discover_users(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get users that current user is not following
        following_ids = [f.following_id for f in current_user.following.all()]
        following_ids.append(current_user.id)  # Exclude self
        
        users = User.query.filter(~User.id.in_(following_ids))\
                         .order_by(User.created_at.desc())\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        users_data = []
        for user in users.items:
            user_dict = user.to_dict()
            user_dict['is_following'] = False  # By definition, not following these users
            users_data.append(user_dict)
        
        return jsonify({
            'users': users_data,
            'pagination': {
                'page': users.page,
                'pages': users.pages,
                'per_page': users.per_page,
                'total': users.total,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error discovering users: {str(e)}'}), 500