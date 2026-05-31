const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = API_BASE_URL === '/api' ? '' : API_BASE_URL.replace(/\/api\/?$/, '');

let authToken = localStorage.getItem('ns_token') || '';

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
  if (authToken) localStorage.setItem('ns_token', authToken);
  else localStorage.removeItem('ns_token');
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
    throw new ApiError('Unable to reach Nutrient Store API. Is the backend running?', 0, null);
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

export function normalizeProduct(product) {
  if (!product) return null;

  const id = String(product.id || product._id);
  const genre = product.genre || product.category || 'Vitamins';
  const image = assetUrl(product.image || product.coverImage);
  const screenshots = Array.isArray(product.screenshots)
    ? product.screenshots.map(assetUrl)
    : [];
  const rating = Number(product.rating ?? product.averageRating ?? 0);
  const reviews = Number(product.reviews ?? product.totalReviews ?? 0);
  const downloads = Number(product.downloads ?? product.totalSales ?? 0);
  const price = Number(product.price || 0);

  return {
    ...product,
    id,
    _id: id,
    genre,
    category: genre,
    image,
    coverImage: image,
    screenshots,
    developer: product.brandName || product.developer || product.developerName || 'HydraDose Labs',
    developerName: product.brandName || product.developer || product.developerName || 'HydraDose Labs',
    developerId: product.seller || product.developerId,
    price,
    rating,
    averageRating: rating,
    reviews,
    totalReviews: reviews,
    downloads,
    totalSales: downloads,
    tags: Array.isArray(product.tags) ? product.tags : [],
    isFree: price === 0,
    isFeatured: Boolean(product.isFeatured),
    isNew: Boolean(product.isNew),
    releaseDate: product.releaseDate || (product.createdAt ? product.createdAt.slice(0, 10) : ''),
  };
}

export function normalizeUser(user) {
  if (!user) return null;

  const id = String(user.id || user._id);
  const name = user.name || user.profile?.fullName || user.username || 'HydraDose User';

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
    studio: user.studio,
  };
}

export function normalizeReview(review) {
  if (!review) return null;

  return {
    ...review,
    id: String(review.id || review._id),
    productId: String(review.product || review.productId || review.product),
    userId: String(review.userId || review.user),
    userName: review.userName || 'HydraDose User',
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

export const productsApi = {
  list: (params = {}) => request(`/products${buildQuery(params)}`).then((data) => ({
    ...data,
    products: (data?.products || []).map(normalizeProduct),
  })),
  get: (id) => request(`/products/${id}`).then((data) => ({ product: normalizeProduct(data?.product) })),
  create: (payload) => request('/products', { method: 'POST', body: payload }).then((data) => ({ product: normalizeProduct(data?.product) })),
  update: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: payload }).then((data) => ({ product: normalizeProduct(data?.product) })),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  reviews: (id) => request(`/products/${id}/reviews`).then((data) => ({
    reviews: (data?.reviews || []).map(normalizeReview),
  })),
  download: async (id, filename = 'hydration-order') => {
    const response = await fetch(`${API_BASE_URL}/products/${id}/download`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      if (response.status === 404) {
        const productName = filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ');
        const dummyContent = [
          `HydraDose - ${productName}`,
          '='.repeat(40),
          '',
          'Thank you for shopping with HydraDose!',
          '',
          `Product: ${productName}`,
          `Generated: ${new Date().toLocaleString()}`,
          '',
          'This is a demo receipt. A real store would generate',
          'order details and fulfillment information here.',
          '',
          'Thank you for choosing clean daily hydration.',
          '- The HydraDose Team',
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
  downloadUrl: (id) => `${API_BASE_URL}/products/${id}/download`,
};

export const orderApi = {
  getCart: () => request('/orders/cart').then((data) => ({
    ...data,
    items: (data?.items || data?.cart || []).map(normalizeProduct),
  })),
  addToCart: (productId) => request('/orders/cart', { method: 'POST', body: { productId, productId: productId } }).then((data) => ({
    ...data,
    items: (data?.items || data?.cart || []).map(normalizeProduct),
  })),
  removeFromCart: (productId) => request(`/orders/cart/${productId}`, { method: 'DELETE' }).then((data) => ({
    ...data,
    items: (data?.items || data?.cart || []).map(normalizeProduct),
  })),
  clearCart: () => request('/orders/cart', { method: 'DELETE' }),
  checkout: (payload = {}) => request('/orders/checkout', { method: 'POST', body: payload }).then((data) => ({
    ...data,
    library: (data?.library || []).map(normalizeProduct),
  })),
  list: () => request('/orders').then((data) => ({ orders: data?.orders || [] })),
  library: () => request('/orders/library').then((data) => ({
    ...data,
    products: (data?.products || data?.library || []).map(normalizeProduct),
  })),
};

export const reviewApi = {
  create: (payload) => request('/reviews', { method: 'POST', body: { ...payload, productId: payload.productId || payload.productId } }).then((data) => ({
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
  products: () => request('/admin/products').then((data) => ({
    products: (data?.products || []).map(normalizeProduct),
  })),
  createproduct: (payload) => request('/admin/products', { method: 'POST', body: payload }).then((data) => ({
    product: normalizeProduct(data?.product),
  })),
  updateproduct: (id, payload) => request(`/admin/products/${id}`, { method: 'PUT', body: payload }).then((data) => ({
    product: normalizeProduct(data?.product),
  })),
  deleteproduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
};
