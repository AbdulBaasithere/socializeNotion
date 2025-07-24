import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notesAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter,
  FileText,
  Edit3,
  Trash2,
  Share,
  Tag,
  Calendar,
  Folder
} from 'lucide-react';

const NotesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const { data: notesData, isLoading, refetch } = useQuery({
    queryKey: ['notes', searchQuery],
    queryFn: () => notesAPI.getNotes({ search: searchQuery }),
  });

  const notes = notesData?.data?.notes || [];

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;
    
    try {
      await notesAPI.createNote({
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      setNewNote({ title: '', content: '', tags: '' });
      setIsCreating(false);
      refetch();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !selectedNote.title.trim()) return;
    
    try {
      await notesAPI.updateNote(selectedNote.id, {
        title: selectedNote.title,
        content: selectedNote.content,
        tags: selectedNote.tags,
      });
      refetch();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notesAPI.deleteNote(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      refetch();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Notes List */}
      <div className="w-1/3 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Notes</h1>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Note
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter by Tag
            </Button>
            <Button variant="outline" size="sm">
              <Folder className="w-4 h-4 mr-1" />
              Create Folder
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : notes.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No notes found</p>
                <Button 
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                >
                  Create Your First Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            notes.map((note) => (
              <Card 
                key={note.id} 
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedNote?.id === note.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate flex-1">
                      {note.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {note.content && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {note.content.substring(0, 100)}...
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {note.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{note.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1">
        {isCreating ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Note</CardTitle>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNote}>
                    Save Note
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 h-full">
              <Input
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="text-lg font-medium"
              />
              
              <Input
                placeholder="Tags (comma separated)..."
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
              />
              
              <Textarea
                placeholder="Start writing your note..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="flex-1 min-h-[400px] resize-none"
              />
            </CardContent>
          </Card>
        ) : selectedNote ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Input
                    value={selectedNote.title}
                    onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                    className="text-lg font-medium border-none p-0 focus:ring-0"
                  />
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button size="sm" onClick={handleUpdateNote}>
                    <Edit3 className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
              
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <div className="flex space-x-1">
                    {selectedNote.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="h-full">
              <Textarea
                value={selectedNote.content || ''}
                onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                placeholder="Start writing..."
                className="w-full h-full min-h-[500px] resize-none border-none p-0 focus:ring-0"
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a note to edit
              </h3>
              <p className="text-gray-500 mb-4">
                Choose a note from the list or create a new one to get started.
              </p>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Note
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotesPage;

