import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Plus,
  Image as ImageIcon,
  Video,
  FileText
} from 'lucide-react';

const HomePage = () => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('text');

  const { data: feedData, isLoading, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsAPI.getFeed(),
  });

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      await postsAPI.createPost({
        content_type: postType,
        caption: newPost,
        media_url: postType === 'text' ? null : 'https://via.placeholder.com/400x300'
      });
      setNewPost('');
      refetch();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await postsAPI.unlikePost(postId);
      } else {
        await postsAPI.likePost(postId);
      }
      refetch();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const posts = feedData?.data?.posts || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to Your Creative Hub</h1>
        <p className="text-purple-100">
          Share your moments, organize your thoughts, and collaborate with others in one seamless platform.
        </p>
        <Button 
          className="mt-4 bg-white text-purple-600 hover:bg-gray-100"
          onClick={() => document.getElementById('create-post').focus()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Post
        </Button>
      </div>

      {/* Create Post */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-sm text-gray-500">Share something with your followers</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            id="create-post"
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={postType === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPostType('text')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Text
              </Button>
              <Button
                variant={postType === 'photo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPostType('photo')}
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Photo
              </Button>
              <Button
                variant={postType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPostType('video')}
              >
                <Video className="w-4 h-4 mr-1" />
                Video
              </Button>
            </div>
            
            <Button 
              onClick={handleCreatePost}
              disabled={!newPost.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500 mb-4">
                Start following people or create your first post to see content here.
              </p>
              <Button variant="outline">
                Explore Users
              </Button>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white">
                      {post.author?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.author?.username}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {post.caption && (
                  <p className="text-gray-900">{post.caption}</p>
                )}
                
                {post.media_url && post.content_type !== 'text' && (
                  <div className="rounded-lg overflow-hidden">
                    {post.content_type === 'photo' ? (
                      <img 
                        src={post.media_url} 
                        alt="Post content"
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id, post.liked_by_user)}
                      className={post.liked_by_user ? 'text-red-500' : 'text-gray-500'}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${post.liked_by_user ? 'fill-current' : ''}`} />
                      {post.likes_count}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.comments_count}
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;

