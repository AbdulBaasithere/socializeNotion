import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  search: (query, page = 1) => api.get(`/users/search?q=${query}&page=${page}`),
  getProfile: (userId) => api.get(`/users/${userId}`),
  follow: (userId) => api.post(`/users/${userId}/follow`),
  unfollow: (userId) => api.delete(`/users/${userId}/unfollow`),
  getFollowers: (userId, page = 1) => api.get(`/users/${userId}/followers?page=${page}`),
  getFollowing: (userId, page = 1) => api.get(`/users/${userId}/following?page=${page}`),
  discover: (page = 1) => api.get(`/users/discover?page=${page}`),
};

// Posts API
export const postsAPI = {
  getFeed: (page = 1) => api.get(`/posts?page=${page}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  createPost: (postData) => api.post('/posts', postData),
  updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
  getComments: (postId, page = 1) => api.get(`/posts/${postId}/comments?page=${page}`),
  createComment: (postId, content) => api.post(`/posts/${postId}/comments`, { content }),
  getUserPosts: (userId, page = 1) => api.get(`/users/${userId}/posts?page=${page}`),
};

// Notes API
export const notesAPI = {
  getNotes: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/notes?${queryParams}`);
  },
  getNote: (noteId) => api.get(`/notes/${noteId}`),
  createNote: (noteData) => api.post('/notes', noteData),
  updateNote: (noteId, noteData) => api.put(`/notes/${noteId}`, noteData),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
  addCollaborator: (noteId, collaboratorData) => api.post(`/notes/${noteId}/collaborate`, collaboratorData),
  getCollaborators: (noteId) => api.get(`/notes/${noteId}/collaborators`),
  getSharedNotes: (page = 1) => api.get(`/notes/shared?page=${page}`),
};

// Folders API
export const foldersAPI = {
  getFolders: (parentId = null) => {
    const params = parentId ? `?parent_id=${parentId}` : '';
    return api.get(`/folders${params}`);
  },
  getFolder: (folderId) => api.get(`/folders/${folderId}`),
  createFolder: (folderData) => api.post('/folders', folderData),
  updateFolder: (folderId, folderData) => api.put(`/folders/${folderId}`, folderData),
  deleteFolder: (folderId) => api.delete(`/folders/${folderId}`),
  getFolderTree: () => api.get('/folders/tree'),
};

export default api;

