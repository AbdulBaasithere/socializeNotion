import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notesAPI, usersAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  Search,
  FileText,
  UserPlus,
  Settings,
  Eye,
  Edit3,
  Crown,
  Calendar,
  Share
} from 'lucide-react';

const CollaborationPage = () => {
  const [activeTab, setActiveTab] = useState('shared');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePermission, setInvitePermission] = useState('view');

  const { data: sharedNotesData, isLoading: sharedLoading } = useQuery({
    queryKey: ['sharedNotes'],
    queryFn: () => notesAPI.getSharedNotes(),
  });

  const { data: myNotesData, isLoading: myNotesLoading } = useQuery({
    queryKey: ['myNotes'],
    queryFn: () => notesAPI.getNotes(),
  });

  const { data: collaboratorsData } = useQuery({
    queryKey: ['collaborators', selectedNote?.id],
    queryFn: () => notesAPI.getCollaborators(selectedNote.id),
    enabled: !!selectedNote,
  });

  const sharedNotes = sharedNotesData?.data?.notes || [];
  const myNotes = myNotesData?.data?.notes || [];
  const collaborators = collaboratorsData?.data?.collaborators || [];

  const handleInviteCollaborator = async () => {
    if (!selectedNote || !inviteUsername.trim()) return;
    
    try {
      await notesAPI.addCollaborator(selectedNote.id, {
        username: inviteUsername,
        permission_level: invitePermission,
      });
      setInviteUsername('');
      setShowInviteModal(false);
      // Refetch collaborators
    } catch (error) {
      console.error('Error inviting collaborator:', error);
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-green-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'edit':
        return 'bg-green-100 text-green-800';
      case 'view':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collaboration Hub</h1>
          <p className="text-gray-600">Manage shared content and team collaboration</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Grant Access
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <Card>
            <CardHeader>
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeTab === 'shared' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('shared')}
                  className="flex-1"
                >
                  Shared with Me
                </Button>
                <Button
                  variant={activeTab === 'myshared' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('myshared')}
                  className="flex-1"
                >
                  My Shared Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search collaborative content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Content List */}
              <div className="space-y-3">
                {activeTab === 'shared' ? (
                  sharedLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  ) : sharedNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No shared content</h3>
                      <p className="text-gray-500">Content shared with you will appear here.</p>
                    </div>
                  ) : (
                    sharedNotes.map((note) => (
                      <Card 
                        key={note.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedNote?.id === note.id ? 'ring-2 ring-purple-500' : ''
                        }`}
                        onClick={() => setSelectedNote(note)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                                <p className="text-sm text-gray-600">
                                  Shared by {note.author?.username}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Collaborative
                                  </Badge>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(note.updated_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Share className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                ) : (
                  myNotesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  ) : myNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No content to share</h3>
                      <p className="text-gray-500">Create notes to start collaborating with others.</p>
                    </div>
                  ) : (
                    myNotes.map((note) => (
                      <Card 
                        key={note.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedNote?.id === note.id ? 'ring-2 ring-purple-500' : ''
                        }`}
                        onClick={() => setSelectedNote(note)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                                <p className="text-sm text-gray-600">
                                  Created by you
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    Owner
                                  </Badge>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(note.updated_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowInviteModal(true);
                              }}
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Permission Management */}
          {selectedNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Permission Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedNote.title}</h4>
                  <p className="text-sm text-gray-600">
                    Manage who can access and edit this content.
                  </p>
                </div>

                {/* Collaborators List */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Collaborators</h5>
                  {collaborators.length === 0 ? (
                    <p className="text-sm text-gray-500">No collaborators yet</p>
                  ) : (
                    collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {collab.collaborator?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{collab.collaborator?.username}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPermissionIcon(collab.permission_level)}
                          <Badge className={`text-xs ${getPermissionColor(collab.permission_level)}`}>
                            {collab.permission_level}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowInviteModal(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Collaborator
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Invite Modal */}
          {showInviteModal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Collaborator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <Input
                    placeholder="Enter username..."
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Permission Level</label>
                  <div className="space-y-2 mt-2">
                    {['view', 'edit', 'admin'].map((permission) => (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="permission"
                          value={permission}
                          checked={invitePermission === permission}
                          onChange={(e) => setInvitePermission(e.target.value)}
                          className="text-purple-600"
                        />
                        <div className="flex items-center space-x-2">
                          {getPermissionIcon(permission)}
                          <span className="text-sm capitalize">{permission}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleInviteCollaborator} className="flex-1">
                    Send Invite
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Collaboration Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Shared with me</span>
                <Badge variant="secondary">{sharedNotes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">My shared content</span>
                <Badge variant="secondary">{myNotes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active collaborations</span>
                <Badge variant="secondary">{collaborators.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;

