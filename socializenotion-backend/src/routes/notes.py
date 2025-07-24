from flask import Blueprint, request, jsonify
from src.models.user import db, Note, Folder, Collaboration, User
from src.routes.auth import token_required
from sqlalchemy import desc, or_

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/notes', methods=['GET'])
@token_required
def get_notes(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        folder_id = request.args.get('folder_id', type=int)
        tag = request.args.get('tag')
        search = request.args.get('search')
        
        # Base query for user's notes and shared notes
        query = Note.query.filter(
            or_(
                Note.user_id == current_user.id,
                Note.id.in_(
                    db.session.query(Collaboration.note_id)
                    .filter_by(user_id=current_user.id)
                )
            )
        )
        
        # Filter by folder
        if folder_id:
            query = query.filter_by(folder_id=folder_id)
        
        # Filter by tag
        if tag:
            query = query.filter(Note.tags.contains(tag))
        
        # Search in title and content
        if search:
            query = query.filter(
                or_(
                    Note.title.contains(search),
                    Note.content.contains(search)
                )
            )
        
        notes = query.order_by(desc(Note.updated_at))\
                    .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'notes': [note.to_dict() for note in notes.items],
            'pagination': {
                'page': notes.page,
                'pages': notes.pages,
                'per_page': notes.per_page,
                'total': notes.total,
                'has_next': notes.has_next,
                'has_prev': notes.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching notes: {str(e)}'}), 500

@notes_bp.route('/notes', methods=['POST'])
@token_required
def create_note(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('title'):
            return jsonify({'message': 'Title is required'}), 400
        
        # Validate folder ownership if folder_id provided
        if data.get('folder_id'):
            folder = Folder.query.get(data['folder_id'])
            if not folder or folder.user_id != current_user.id:
                return jsonify({'message': 'Invalid folder'}), 400
        
        note = Note(
            user_id=current_user.id,
            title=data['title'],
            content=data.get('content', ''),
            folder_id=data.get('folder_id'),
            tags=','.join(data.get('tags', [])) if data.get('tags') else None,
            is_public=data.get('is_public', False)
        )
        
        db.session.add(note)
        db.session.commit()
        
        return jsonify({
            'message': 'Note created successfully',
            'note': note.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating note: {str(e)}'}), 500

@notes_bp.route('/notes/<int:note_id>', methods=['GET'])
@token_required
def get_note(current_user, note_id):
    try:
        note = Note.query.get_or_404(note_id)
        
        # Check if user has access to this note
        has_access = (
            note.user_id == current_user.id or
            note.is_public or
            Collaboration.query.filter_by(note_id=note_id, user_id=current_user.id).first()
        )
        
        if not has_access:
            return jsonify({'message': 'Access denied'}), 403
        
        note_dict = note.to_dict()
        
        # Add collaboration info if user is a collaborator
        collaboration = Collaboration.query.filter_by(note_id=note_id, user_id=current_user.id).first()
        if collaboration:
            note_dict['user_permission'] = collaboration.permission_level
        elif note.user_id == current_user.id:
            note_dict['user_permission'] = 'admin'
        else:
            note_dict['user_permission'] = 'view'
        
        return jsonify({'note': note_dict}), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching note: {str(e)}'}), 500

@notes_bp.route('/notes/<int:note_id>', methods=['PUT'])
@token_required
def update_note(current_user, note_id):
    try:
        note = Note.query.get_or_404(note_id)
        
        # Check if user has edit permission
        collaboration = Collaboration.query.filter_by(note_id=note_id, user_id=current_user.id).first()
        has_edit_permission = (
            note.user_id == current_user.id or
            (collaboration and collaboration.permission_level in ['edit', 'admin'])
        )
        
        if not has_edit_permission:
            return jsonify({'message': 'No edit permission'}), 403
        
        data = request.get_json()
        
        if data.get('title'):
            note.title = data['title']
        
        if data.get('content') is not None:
            note.content = data['content']
        
        if data.get('tags') is not None:
            note.tags = ','.join(data['tags']) if data['tags'] else None
        
        # Only owner can change folder and public status
        if note.user_id == current_user.id:
            if data.get('folder_id') is not None:
                if data['folder_id']:
                    folder = Folder.query.get(data['folder_id'])
                    if not folder or folder.user_id != current_user.id:
                        return jsonify({'message': 'Invalid folder'}), 400
                note.folder_id = data['folder_id']
            
            if data.get('is_public') is not None:
                note.is_public = data['is_public']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Note updated successfully',
            'note': note.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating note: {str(e)}'}), 500

@notes_bp.route('/notes/<int:note_id>', methods=['DELETE'])
@token_required
def delete_note(current_user, note_id):
    try:
        note = Note.query.get_or_404(note_id)
        
        # Only owner can delete
        if note.user_id != current_user.id:
            return jsonify({'message': 'Only owner can delete note'}), 403
        
        db.session.delete(note)
        db.session.commit()
        
        return jsonify({'message': 'Note deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting note: {str(e)}'}), 500

@notes_bp.route('/notes/<int:note_id>/collaborate', methods=['POST'])
@token_required
def add_collaborator(current_user, note_id):
    try:
        note = Note.query.get_or_404(note_id)
        
        # Only owner can add collaborators
        if note.user_id != current_user.id:
            return jsonify({'message': 'Only owner can add collaborators'}), 403
        
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('permission_level'):
            return jsonify({'message': 'Username and permission level are required'}), 400
        
        # Find user to collaborate with
        collaborator = User.query.filter_by(username=data['username']).first()
        if not collaborator:
            return jsonify({'message': 'User not found'}), 404
        
        if collaborator.id == current_user.id:
            return jsonify({'message': 'Cannot collaborate with yourself'}), 400
        
        # Check if already collaborating
        existing = Collaboration.query.filter_by(note_id=note_id, user_id=collaborator.id).first()
        if existing:
            return jsonify({'message': 'User is already a collaborator'}), 400
        
        # Validate permission level
        if data['permission_level'] not in ['view', 'edit', 'admin']:
            return jsonify({'message': 'Invalid permission level'}), 400
        
        collaboration = Collaboration(
            note_id=note_id,
            user_id=collaborator.id,
            permission_level=data['permission_level']
        )
        
        db.session.add(collaboration)
        db.session.commit()
        
        return jsonify({
            'message': 'Collaborator added successfully',
            'collaboration': collaboration.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding collaborator: {str(e)}'}), 500

@notes_bp.route('/notes/<int:note_id>/collaborators', methods=['GET'])
@token_required
def get_collaborators(current_user, note_id):
    try:
        note = Note.query.get_or_404(note_id)
        
        # Check if user has access to this note
        has_access = (
            note.user_id == current_user.id or
            Collaboration.query.filter_by(note_id=note_id, user_id=current_user.id).first()
        )
        
        if not has_access:
            return jsonify({'message': 'Access denied'}), 403
        
        collaborations = Collaboration.query.filter_by(note_id=note_id).all()
        
        return jsonify({
            'collaborators': [collab.to_dict() for collab in collaborations]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching collaborators: {str(e)}'}), 500

@notes_bp.route('/notes/shared', methods=['GET'])
@token_required
def get_shared_notes(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get notes where user is a collaborator
        collaborations = Collaboration.query.filter_by(user_id=current_user.id).all()
        note_ids = [collab.note_id for collab in collaborations]
        
        if not note_ids:
            return jsonify({
                'notes': [],
                'pagination': {
                    'page': 1,
                    'pages': 0,
                    'per_page': per_page,
                    'total': 0,
                    'has_next': False,
                    'has_prev': False
                }
            }), 200
        
        notes = Note.query.filter(Note.id.in_(note_ids))\
                         .order_by(desc(Note.updated_at))\
                         .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'notes': [note.to_dict() for note in notes.items],
            'pagination': {
                'page': notes.page,
                'pages': notes.pages,
                'per_page': notes.per_page,
                'total': notes.total,
                'has_next': notes.has_next,
                'has_prev': notes.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching shared notes: {str(e)}'}), 500

