// app/services/api.ts

const API_BASE = '/api';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'خطا در ارتباط با سرور');
  }
  return data;
};

// -------------------------------------------------
// API Auth
// -------------------------------------------------
export const authAPI = {
  sendOTP: (phone: string) =>
    fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }).then(handleResponse),

  verifyOTP: (phone: string, code: string) =>
    fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    }).then(handleResponse),

  completeProfile: (first_name: string, last_name: string) =>
    fetch(`${API_BASE}/auth/complete-profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ first_name, last_name }),
    }).then(handleResponse),
};

// -------------------------------------------------
// API پروفایل
// -------------------------------------------------
export const profileAPI = {
  getProfile: () =>
    fetch(`${API_BASE}/profile`, {
      headers: getHeaders(),
    }).then(handleResponse),

  updateProfile: (data: any) =>
    fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getMyPosts: (status?: string) =>
    fetch(`${API_BASE}/profile/posts${status ? `?status=${status}` : ''}`, {
      headers: getHeaders(),
    }).then(handleResponse),
};

// -------------------------------------------------
// API آگهی‌ها
// -------------------------------------------------
// app/services/api.ts — بخش postsAPI (بقیه فایل دست نخورده)
export const postsAPI = {
  getPosts: (params?: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.search) query.append("search", params.search);
    if (params?.sort) query.append("sort", params.sort);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    return fetch(`${API_BASE}/posts?${query.toString()}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getPost: (id: number) =>
    fetch(`${API_BASE}/posts/${id}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  createPost: (data: any) =>
    fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updatePost: (id: number, data: any) =>
    fetch(`${API_BASE}/posts/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deletePost: (id: number) =>
    fetch(`${API_BASE}/posts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

  lock: (postId: number, action: "lock" | "unlock") =>
    fetch(`${API_BASE}/posts/${postId}/lock`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    }).then(handleResponse),
};

// -------------------------------------------------
// API علاقه‌مندی‌ها
// -------------------------------------------------
export const savedAPI = {
  getSaved: () =>
    fetch(`${API_BASE}/saved`, {
      headers: getHeaders(),
    }).then(handleResponse),

  addSaved: (post_id: number) =>
    fetch(`${API_BASE}/saved`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ post_id }),
    }).then(handleResponse),

  removeSaved: (post_id: number) =>
    fetch(`${API_BASE}/saved?post_id=${post_id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),
};

// -------------------------------------------------
// API پیام‌ها
// -------------------------------------------------
export const messagesAPI = {
  getConversations: () =>
    fetch(`${API_BASE}/messages`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // 🔑 postId اختیاری — اگه null/undefined باشه، پیام‌های بدون post_id برمی‌گرده
  getMessages: (userId: number, postId?: number | null) => {
    let url = `${API_BASE}/messages/${userId}`;
    if (postId !== undefined && postId !== null) {
      url += `?postId=${postId}`;
    }
    return fetch(url, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  sendMessage: (receiver_id: number, message: string, post_id?: number) =>
    fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ receiver_id, message, post_id }),
    }).then(handleResponse),
};

// -------------------------------------------------
// API اعلانات
// -------------------------------------------------
export const notificationsAPI = {
  getNotifications: (limit?: number) =>
    fetch(`${API_BASE}/notifications${limit ? `?limit=${limit}` : ''}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  markAsRead: (notification_id?: number, markAll?: boolean) =>
    fetch(`${API_BASE}/notifications`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ notification_id, mark_all: markAll }),
    }).then(handleResponse),
};

export const usersAPI = {
  getPublicProfile: (userId: number) =>
    fetch(`${API_BASE}/users/${userId}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getTop: (params?: {
    limit?: number;
    minRating?: number;
    minProjects?: number;
    sort?: "rating" | "projects";
  }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.minRating !== undefined)
      query.append("minRating", String(params.minRating));
    if (params?.minProjects !== undefined)
      query.append("minProjects", String(params.minProjects));
    if (params?.sort) query.append("sort", params.sort);
    return fetch(`${API_BASE}/users/top?${query.toString()}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },
};

// -------------------------------------------------
// API قراردادها
// -------------------------------------------------
export const contractsAPI = {
  get: (postId: number, otherUserId: number) =>
    fetch(`${API_BASE}/contracts?postId=${postId}&otherUserId=${otherUserId}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  start: (postId: number, freelancerId: number) =>
    fetch(`${API_BASE}/contracts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ postId, freelancerId }),
    }).then(handleResponse),

  update: (contractId: number, action: 'deliver' | 'confirm' | 'cancel') =>
    fetch(`${API_BASE}/contracts/${contractId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    }).then(handleResponse),
};

// -------------------------------------------------
// API امتیازها
// -------------------------------------------------
export const reviewsAPI = {
  submit: (contractId: number, rating: number, comment?: string) =>
    fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contractId, rating, comment }),
    }).then(handleResponse),
};

// -------------------------------------------------
// API نظرات پروفایل
// -------------------------------------------------
export const profileReviewsAPI = {
  get: () =>
    fetch(`${API_BASE}/profile/reviews`, {
      headers: getHeaders(),
    }).then(handleResponse),
};


