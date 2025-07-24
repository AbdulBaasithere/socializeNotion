import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  UserPlus,
  UserCheck,
  TrendingUp,
  Star,
  MapPin,
  Calendar
} from 'lucide-react';

const ExplorePage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');

  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ['discoverUsers'],
    queryFn: () => usersAPI.discover(),
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => usersAPI.search(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const discoverUsers = discoverData?.data?.users || [];
  const searchUsers = searchData?.data?.users || [];

  const handleFollow = async (userId) => {
    try {
      await usersAPI.follow(userId);
      // Refetch data to update follow status
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await usersAPI.unfollow(userId);
      // Refetch data to update follow status
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const featuredUsers = [
    {
      id: 'featured-1',
      username: 'SolarWiz',
      bio: 'Passionate about renewable energy and sustainability.',
      follower_count: 1250,
      following_count: 340,
      is_following: false,
    },
    {
      id: 'featured-2',
      username: 'LunarThinker',
      bio: 'Lunar enthusiast navigating the realms of hardcover books.',
      follower_count: 890,
      following_count: 156,
      is_following: false,
    },
    {
      id: 'featured-3',
      username: 'TechScribe',
      bio: 'Writing about the latest in technology and innovation.',
      follower_count: 2100,
      following_count: 445,
      is_following: false,
    },
    {
      id: 'featured-4',
      username: 'ArtisanGeo',
      bio: 'Exploring the intersection of art and geography.',
      follower_count: 567,
      following_count: 234,
      is_following: false,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover amazing creators, connect with like-minded people, and expand your creative network.
        </p>
        
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by username or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'discover' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('discover')}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Discover Users
            </Button>
            <Button
              variant={activeTab === 'search' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('search')}
              className="flex-1"
              disabled={!searchQuery}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Results
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Featured Section */}
      {activeTab === 'discover' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Featured Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredUsers.map((featuredUser) => (
                <Card key={featuredUser.id} className="text-center">
                  <CardContent className="p-4">
                    <Avatar className="w-16 h-16 mx-auto mb-3">
                      <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white text-lg">
                        {featuredUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-gray-900 mb-1">{featuredUser.username}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{featuredUser.bio}</p>
                    <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-3">
                      <span>{featuredUser.follower_count} followers</span>
                      <span>{featuredUser.following_count} following</span>
                    </div>
                    <Button
                      size="sm"
                      variant={featuredUser.is_following ? 'outline' : 'default'}
                      onClick={() => featuredUser.is_following ? handleUnfollow(featuredUser.id) : handleFollow(featuredUser.id)}
                      className="w-full"
                    >
                      {featuredUser.is_following ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {activeTab === 'discover' ? 'Discover New People' : `Search Results for "${searchQuery}"`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTab === 'discover' ? (
                  discoverLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  ) : discoverUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No new users to discover</h3>
                      <p className="text-gray-500">You're following everyone! Check back later for new users.</p>
                    </div>
                  ) : (
                    discoverUsers.map((discoveredUser) => (
                      <UserCard
                        key={discoveredUser.id}
                        user={discoveredUser}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                      />
                    ))
                  )
                ) : (
                  searchLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                  ) : searchUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-500">Try searching with different keywords.</p>
                    </div>
                  ) : (
                    searchUsers.map((searchedUser) => (
                      <UserCard
                        key={searchedUser.id}
                        user={searchedUser}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                      />
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Network */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Network</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Following</span>
                <Badge variant="secondary">{user?.following_count || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Followers</span>
                <Badge variant="secondary">{user?.follower_count || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Posts Created</span>
                <Badge variant="secondary">0</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['#creativity', '#productivity', '#collaboration', '#design', '#technology'].map((topic) => (
                <Button key={topic} variant="ghost" size="sm" className="w-full justify-start">
                  {topic}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Who to Follow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredUsers.slice(0, 3).map((suggestedUser) => (
                <div key={suggestedUser.id} className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white text-sm">
                      {suggestedUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestedUser.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {suggestedUser.follower_count} followers
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// User Card Component
const UserCard = ({ user, onFollow, onUnfollow }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{user.username}</h3>
              <Button
                size="sm"
                variant={user.is_following ? 'outline' : 'default'}
                onClick={() => user.is_following ? onUnfollow(user.id) : onFollow(user.id)}
              >
                {user.is_following ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">{user.email}</p>
            
            {user.bio && (
              <p className="text-sm text-gray-700 mt-2">{user.bio}</p>
            )}
            
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <span>{user.follower_count} followers</span>
              <span>{user.following_count} following</span>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExplorePage;

