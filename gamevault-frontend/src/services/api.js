const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

let authToken = localStorage.getItem('gv_token') || '';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function setAuthToken(token) {
  authToken = token || '';
  if (authToken) localStorage.setItem('gv_token', authToken);
  else localStorage.removeItem('gv_token');
}

export function getAuthToken() {
  return authToken;
}

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (!isFormData && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: isFormData || options.body === undefined ? options.body : JSON.stringify(options.body),
    });
  } catch (_error) {
    throw new ApiError('Unable to reach NutriFactor API. Is the backend running?', 0, null);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || 'Request failed', response.status, payload);
  }

  return payload?.data;
}

export function assetUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads')) return `${API_ORIGIN}${value}`;
  return value;
}

export function normalizeGame(game) {
  if (!game) return null;

  const id = String(game.id || game._id);
  const genre = game.genre || game.category || 'Vitamins';
  const image = assetUrl(game.image || game.coverImage);
  const screenshots = Array.isArray(game.screenshots)
    ? game.screenshots.map(assetUrl)
    : [];
  const rating = Number(game.rating ?? game.averageRating ?? 0);
  const reviews = Number(game.reviews ?? game.totalReviews ?? 0);
  const downloads = Number(game.downloads ?? game.totalSales ?? 0);
  const price = Number(game.price || 0);

  return {
    ...game,
    id,
    _id: id,
    genre,
    category: genre,
    image,
    coverImage: image,
    screenshots,
    developer: game.developer || game.developerName || 'NutriFactor Wellness Lab',
    developerId: game.developerId,
    price,
    rating,
    averageRating: rating,
    reviews,
    totalReviews: reviews,
    downloads,
    totalSales: downloads,
    tags: Array.isArray(game.tags) ? game.tags : [],
    isFree: price === 0,
    isFeatured: Boolean(game.isFeatured),
    isNew: Boolean(game.isNew),
    releaseDate: game.releaseDate || (game.createdAt ? game.createdAt.slice(0, 10) : ''),
  };
}

export function normalizeUser(user) {
  if (!user) return null;

  const id = String(user.id || user._id);
  const name = user.name || user.profile?.fullName || user.username || 'NutriFactor User';

  return {
    ...user,
    id,
    _id: id,
    name,
    username: user.username || name,
    email: user.email,
    role: user.role || 'customer',
    avatar: user.avatar || user.profile?.avatar || null,
    bio: user.bio || user.profile?.bio || '',
    joinDate: user.joinDate || user.createdAt,
    studio: user.studio || (user.role === 'developer' ? name : undefined),
  };
}

export function normalizeReview(review) {
  if (!review) return null;

  return {
    ...review,
    id: String(review.id || review._id),
    gameId: String(review.gameId || review.game),
    userId: String(review.userId || review.user),
    userName: review.userName || 'NutriFactor User',
    rating: Number(review.rating || 0),
    text: review.text || review.comment || '',
    comment: review.comment || review.text || '',
    date: review.date || (review.createdAt ? review.createdAt.slice(0, 10) : ''),
  };
}

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),
};

export const gamesApi = {
  list: (params = {}) => request(`/games${buildQuery(params)}`).then((data) => ({
    ...data,
    games: (data?.games || []).map(normalizeGame),
  })),
  get: (id) => request(`/games/${id}`).then((data) => ({ game: normalizeGame(data?.game) })),
  create: (payload) => request('/games', { method: 'POST', body: payload }).then((data) => ({ game: normalizeGame(data?.game) })),
  update: (id, payload) => request(`/games/${id}`, { method: 'PUT', body: payload }).then((data) => ({ game: normalizeGame(data?.game) })),
  remove: (id) => request(`/games/${id}`, { method: 'DELETE' }),
  reviews: (id) => request(`/games/${id}/reviews`).then((data) => ({
    reviews: (data?.reviews || []).map(normalizeReview),
  })),
  download: async (id, filename = 'nutrifactor-order') => {
    const response = await fetch(`${API_BASE_URL}/games/${id}/download`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      // If no file is available on the server, generate a dummy file client-side
      if (response.status === 404) {
        const gameName = filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ');
        const dummyContent = [
          `NutriFactor - ${gameName}`,
          '='.repeat(40),
          '',
          'Thank you for shopping with NutriFactor!',
          '',
          `Product: ${gameName}`,
          `Generated: ${new Date().toLocaleString()}`,
          '',
          'This is a demo receipt. A real store would generate',
          'order details and fulfillment information here.',
          '',
          'Thank you for choosing daily wellness.',
          '- The NutriFactor Team',
        ].join('\n');
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.replace(/\.[^.]+$/, '') + '.txt';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return;
      }
      throw new ApiError(payload?.message || 'Unable to load order receipt', response.status, payload);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  downloadUrl: (id) => `${API_BASE_URL}/games/${id}/download`,
};

export const orderApi = {
  getCart: () => request('/orders/cart').then((data) => ({
    ...data,
    items: (data?.items || data?.cart || []).map(normalizeGame),
  })),
  addToCart: (gameId) => request('/orders/cart', { method: 'POST', body: { gameId } }).then((data) => ({
    ...data,
    items: (data?.items || data?.cart || []).map(normalizeGame),
  })),
  removeFromCart: (gameId) => request(`/orders/cart/${gameId}`, { method: 'DELETE' }).then((data) => ({
    ...data,
    items: (data?.items || data?.cart || []).map(normalizeGame),
  })),
  clearCart: () => request('/orders/cart', { method: 'DELETE' }),
  checkout: (payload = {}) => request('/orders/checkout', { method: 'POST', body: payload }).then((data) => ({
    ...data,
    library: (data?.library || []).map(normalizeGame),
  })),
  list: () => request('/orders').then((data) => ({ orders: data?.orders || [] })),
  library: () => request('/orders/library').then((data) => ({
    ...data,
    games: (data?.games || data?.library || []).map(normalizeGame),
  })),
};

export const reviewApi = {
  create: (payload) => request('/reviews', { method: 'POST', body: payload }).then((data) => ({
    review: normalizeReview(data?.review),
  })),
  update: (id, payload) => request(`/reviews/${id}`, { method: 'PUT', body: payload }).then((data) => ({
    review: normalizeReview(data?.review),
  })),
  remove: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
};

export const adminApi = {
  stats: () => request('/admin/stats'),
  users: (params = {}) => request(`/admin/users${buildQuery(params)}`).then((data) => ({
    users: (data?.users || []).map(normalizeUser),
  })),
  createUser: (payload) => request('/admin/users', { method: 'POST', body: payload }).then((data) => ({
    user: normalizeUser(data?.user),
  })),
  updateUser: (id, payload) => request(`/admin/users/${id}`, { method: 'PUT', body: payload }).then((data) => ({
    user: normalizeUser(data?.user),
  })),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  games: () => request('/admin/games').then((data) => ({
    games: (data?.games || []).map(normalizeGame),
  })),
  createGame: (payload) => request('/admin/games', { method: 'POST', body: payload }).then((data) => ({
    game: normalizeGame(data?.game),
  })),
  updateGame: (id, payload) => request(`/admin/games/${id}`, { method: 'PUT', body: payload }).then((data) => ({
    game: normalizeGame(data?.game),
  })),
  deleteGame: (id) => request(`/admin/games/${id}`, { method: 'DELETE' }),
};
