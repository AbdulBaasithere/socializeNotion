import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authAPI, postsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Calendar,
  MapPin,
  Link as LinkIcon,
  Heart,
  MessageCircle,
  FileText,
  Image as ImageIcon,
  Video
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile(),
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: () => postsAPI.getUserPosts(user?.id),
    enabled: !!user?.id,
  });

  const profile = profileData?.data?.user || user;
  const posts = postsData?.data?.posts || [];

  const stats = [
    { label: 'Posts Created', value: posts.length, color: 'bg-blue-500' },
    { label: 'Notes Created', value: 0, color: 'bg-green-500' },
    { label: 'Followers', value: profile?.follower_count || 0, color: 'bg-purple-500' },
    { label: 'Following', value: profile?.following_count || 0, color: 'bg-pink-500' },
  ];

  const recentActivity = [
    { type: 'like', content: 'John liked your photo', time: '2 minutes ago' },
    { type: 'comment', content: 'Sarah commented on your post', time: '1 hour ago' },
    { type: 'follow', content: 'Alex started following you', time: '3 hours ago' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-purple-500 to-blue-500"></div>
        <CardContent className="relative pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16">
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white text-2xl">
                {profile?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.username}</h1>
                  <p className="text-gray-600">{profile?.email}</p>
                </div>
                <Button className="mt-2 sm:mt-0">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              {profile?.bio && (
                <p className="text-gray-700 max-w-2xl">{profile.bio}</p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Joined {new Date(profile?.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <div className={`w-8 h-8 ${stat.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Tabs */}
          <Card>
            <CardHeader>
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeTab === 'posts' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('posts')}
                  className="flex-1"
                >
                  Posts
                </Button>
                <Button
                  variant={activeTab === 'notes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('notes')}
                  className="flex-1"
                >
                  Notes
                </Button>
                <Button
                  variant={activeTab === 'media' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('media')}
                  className="flex-1"
                >
                  Media
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {postsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No posts yet</p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {post.content_type === 'photo' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                            {post.content_type === 'video' && <Video className="w-4 h-4 text-green-500" />}
                            {post.content_type === 'text' && <FileText className="w-4 h-4 text-gray-500" />}
                            <span className="text-sm text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge variant="outline">{post.content_type}</Badge>
                        </div>
                        
                        {post.caption && (
                          <p className="text-gray-900">{post.caption}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {post.likes_count}
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.comments_count}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === 'notes' && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notes yet</p>
                  <Button className="mt-4" variant="outline">
                    Create Your First Note
                  </Button>
                </div>
              )}
              
              {activeTab === 'media' && (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No media yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.content}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

