import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { foldersAPI, notesAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FolderPlus, 
  FileText, 
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Tag,
  Calendar
} from 'lucide-react';

const OrganizationPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: foldersData, isLoading: foldersLoading, refetch: refetchFolders } = useQuery({
    queryKey: ['folders', selectedFolder?.id],
    queryFn: () => foldersAPI.getFolders(selectedFolder?.id),
  });

  const { data: notesData, isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', selectedFolder?.id, searchQuery, filterTag],
    queryFn: () => notesAPI.getNotes({ 
      folder_id: selectedFolder?.id,
      search: searchQuery,
      tag: filterTag 
    }),
  });

  const { data: folderTreeData } = useQuery({
    queryKey: ['folderTree'],
    queryFn: () => foldersAPI.getFolderTree(),
  });

  const folders = foldersData?.data?.folders || [];
  const notes = notesData?.data?.notes || [];
  const folderTree = folderTreeData?.data?.folder_tree || [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await foldersAPI.createFolder({
        name: newFolderName,
        parent_folder_id: selectedFolder?.id,
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
      refetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const breadcrumbs = [];
  let currentFolder = selectedFolder;
  while (currentFolder) {
    breadcrumbs.unshift(currentFolder);
    currentFolder = currentFolder.parent;
  }

  const allTags = [...new Set(notes.flatMap(note => note.tags || []))];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar - Folder Tree */}
      <div className="w-1/4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Organize Your Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setSelectedFolder(null)}
            >
              <Folder className="w-4 h-4 mr-2" />
              All Content
            </Button>
            
            <div className="space-y-1">
              {folderTree.map((folder) => (
                <FolderTreeItem 
                  key={folder.id} 
                  folder={folder} 
                  selectedFolder={selectedFolder}
                  onSelectFolder={setSelectedFolder}
                />
              ))}
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-purple-600"
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          </CardContent>
        </Card>

        {/* Filter by Tags */}
        {allTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filter by Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={filterTag === '' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setFilterTag('')}
              >
                All Tags
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={filterTag === tag ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setFilterTag(tag)}
                >
                  <Tag className="w-3 h-3 mr-2" />
                  {tag}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {selectedFolder ? selectedFolder.name : 'All Content'}
            </h1>
            {breadcrumbs.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                <span>Home</span>
                {breadcrumbs.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <span>/</span>
                    <button
                      onClick={() => setSelectedFolder(folder)}
                      className="hover:text-purple-600"
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Create Folder Modal */}
        {isCreatingFolder && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <Button onClick={handleCreateFolder}>Create</Button>
                <Button variant="outline" onClick={() => setIsCreatingFolder(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Grid/List */}
        <div className="flex-1 overflow-y-auto">
          {foldersLoading || notesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {/* Folders */}
              {folders.map((folder) => (
                <Card 
                  key={`folder-${folder.id}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedFolder(folder)}
                >
                  <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-3'}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Folder className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{folder.name}</h3>
                        <p className="text-sm text-gray-500">
                          {folder.notes_count || 0} notes
                        </p>
                      </div>
                      {viewMode === 'list' && (
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Notes */}
              {notes.map((note) => (
                <Card 
                  key={`note-${note.id}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-3'}>
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                        {viewMode === 'grid' && note.content && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {note.content.substring(0, 100)}...
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
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
                      </div>
                      {viewMode === 'list' && (
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {folders.length === 0 && notes.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedFolder ? 'This folder is empty' : 'No content yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start organizing your content by creating folders and notes.
                  </p>
                  <div className="space-x-2">
                    <Button onClick={() => setIsCreatingFolder(true)}>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Create Folder
                    </Button>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Note
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Folder Tree Item Component
const FolderTreeItem = ({ folder, selectedFolder, onSelectFolder, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div>
      <Button
        variant={selectedFolder?.id === folder.id ? 'default' : 'ghost'}
        size="sm"
        className="w-full justify-start"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectFolder(folder)}
      >
        <Folder className="w-4 h-4 mr-2" />
        {folder.name}
        <Badge variant="secondary" className="ml-auto text-xs">
          {folder.notes_count || 0}
        </Badge>
      </Button>
      
      {folder.children && folder.children.length > 0 && isExpanded && (
        <div className="ml-2">
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;

