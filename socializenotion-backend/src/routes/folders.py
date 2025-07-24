from flask import Blueprint, request, jsonify
from src.models.user import db, Folder
from src.routes.auth import token_required
from sqlalchemy import desc

folders_bp = Blueprint('folders', __name__)

@folders_bp.route('/folders', methods=['GET'])
@token_required
def get_folders(current_user):
    try:
        parent_id = request.args.get('parent_id', type=int)
        
        # Get folders for current user
        query = Folder.query.filter_by(user_id=current_user.id)
        
        if parent_id:
            query = query.filter_by(parent_folder_id=parent_id)
        else:
            query = query.filter_by(parent_folder_id=None)  # Root folders
        
        folders = query.order_by(Folder.name).all()
        
        return jsonify({
            'folders': [folder.to_dict() for folder in folders]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching folders: {str(e)}'}), 500

@folders_bp.route('/folders', methods=['POST'])
@token_required
def create_folder(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'message': 'Folder name is required'}), 400
        
        # Validate parent folder if provided
        if data.get('parent_folder_id'):
            parent_folder = Folder.query.get(data['parent_folder_id'])
            if not parent_folder or parent_folder.user_id != current_user.id:
                return jsonify({'message': 'Invalid parent folder'}), 400
        
        # Check for duplicate folder names in the same parent
        existing = Folder.query.filter_by(
            user_id=current_user.id,
            name=data['name'],
            parent_folder_id=data.get('parent_folder_id')
        ).first()
        
        if existing:
            return jsonify({'message': 'Folder with this name already exists in this location'}), 400
        
        folder = Folder(
            user_id=current_user.id,
            name=data['name'],
            parent_folder_id=data.get('parent_folder_id')
        )
        
        db.session.add(folder)
        db.session.commit()
        
        return jsonify({
            'message': 'Folder created successfully',
            'folder': folder.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating folder: {str(e)}'}), 500

@folders_bp.route('/folders/<int:folder_id>', methods=['GET'])
@token_required
def get_folder(current_user, folder_id):
    try:
        folder = Folder.query.get_or_404(folder_id)
        
        if folder.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        folder_dict = folder.to_dict()
        
        # Add subfolders and notes count
        folder_dict['subfolders_count'] = len(folder.subfolders)
        folder_dict['notes_count'] = len(folder.notes)
        
        return jsonify({'folder': folder_dict}), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching folder: {str(e)}'}), 500

@folders_bp.route('/folders/<int:folder_id>', methods=['PUT'])
@token_required
def update_folder(current_user, folder_id):
    try:
        folder = Folder.query.get_or_404(folder_id)
        
        if folder.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        data = request.get_json()
        
        if data.get('name'):
            # Check for duplicate folder names in the same parent
            existing = Folder.query.filter_by(
                user_id=current_user.id,
                name=data['name'],
                parent_folder_id=folder.parent_folder_id
            ).filter(Folder.id != folder_id).first()
            
            if existing:
                return jsonify({'message': 'Folder with this name already exists in this location'}), 400
            
            folder.name = data['name']
        
        if data.get('parent_folder_id') is not None:
            # Validate new parent folder
            if data['parent_folder_id']:
                parent_folder = Folder.query.get(data['parent_folder_id'])
                if not parent_folder or parent_folder.user_id != current_user.id:
                    return jsonify({'message': 'Invalid parent folder'}), 400
                
                # Prevent circular references
                if data['parent_folder_id'] == folder_id:
                    return jsonify({'message': 'Folder cannot be its own parent'}), 400
                
                # Check if the new parent is a descendant of this folder
                def is_descendant(parent_id, ancestor_id):
                    if parent_id == ancestor_id:
                        return True
                    parent = Folder.query.get(parent_id)
                    if parent and parent.parent_folder_id:
                        return is_descendant(parent.parent_folder_id, ancestor_id)
                    return False
                
                if is_descendant(data['parent_folder_id'], folder_id):
                    return jsonify({'message': 'Cannot move folder to its own descendant'}), 400
            
            folder.parent_folder_id = data['parent_folder_id']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Folder updated successfully',
            'folder': folder.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating folder: {str(e)}'}), 500

@folders_bp.route('/folders/<int:folder_id>', methods=['DELETE'])
@token_required
def delete_folder(current_user, folder_id):
    try:
        folder = Folder.query.get_or_404(folder_id)
        
        if folder.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        # Check if folder has subfolders or notes
        if folder.subfolders or folder.notes:
            return jsonify({'message': 'Cannot delete folder that contains subfolders or notes'}), 400
        
        db.session.delete(folder)
        db.session.commit()
        
        return jsonify({'message': 'Folder deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting folder: {str(e)}'}), 500

@folders_bp.route('/folders/tree', methods=['GET'])
@token_required
def get_folder_tree(current_user):
    try:
        # Get all folders for the user
        folders = Folder.query.filter_by(user_id=current_user.id).order_by(Folder.name).all()
        
        # Build tree structure
        def build_tree(parent_id=None):
            tree = []
            for folder in folders:
                if folder.parent_folder_id == parent_id:
                    folder_dict = folder.to_dict()
                    folder_dict['children'] = build_tree(folder.id)
                    folder_dict['notes_count'] = len(folder.notes)
                    tree.append(folder_dict)
            return tree
        
        tree = build_tree()
        
        return jsonify({'folder_tree': tree}), 200
        
    except Exception as e:
        return jsonify({'message': f'Error building folder tree: {str(e)}'}), 500

