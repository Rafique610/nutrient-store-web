export const GENRE_COLORS = {
  Exercise: ['#23c9b7', '#0d9488'],
  Heat: ['#f97316', '#facc15'],
  Travel: ['#38bdf8', '#2563eb'],
  Wellness: ['#22c55e', '#84cc16'],
  Recovery: ['#a78bfa', '#14b8a6'],
  Sleep: ['#818cf8', '#312e81'],
  Immunity: ['#2dd4bf', '#0f766e'],
  Performance: ['#06b6d4', '#22c55e'],
};

export const GENRES = Object.keys(GENRE_COLORS);

const sachetImage = ({ name, flavor, c1, c2, accent }) => {
  const gridLines = [
    ...Array.from({ length: 17 }, (_, i) => `<path d="M${i * 45} 0v900" stroke="#fff" stroke-width="1"/>`),
    ...Array.from({ length: 21 }, (_, i) => `<path d="M0 ${i * 45}h720" stroke="#fff" stroke-width="1"/>`),
  ].join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${c1}"/>
          <stop offset="1" stop-color="${c2}"/>
        </linearGradient>
        <linearGradient id="foil" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
          <stop offset=".52" stop-color="#e7fffb" stop-opacity=".9"/>
          <stop offset="1" stop-color="#bdfcf4" stop-opacity=".78"/>
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#000" flood-opacity=".42"/>
        </filter>
      </defs>
      <rect width="720" height="900" fill="#030607"/>
      <rect width="720" height="900" fill="url(#bg)" opacity=".24"/>
      <g opacity=".16">${gridLines}</g>
      <g filter="url(#shadow)" transform="translate(170 94)">
        <path d="M42 0h296c22 0 40 18 40 40v650c0 22-18 40-40 40H42c-22 0-40-18-40-40V40C2 18 20 0 42 0Z" fill="url(#foil)"/>
        <path d="M33 34h314v662H33z" fill="#07100f" opacity=".95"/>
        <path d="M33 34h314v270H33z" fill="url(#bg)"/>
        <path d="M70 92h242" stroke="#fff" stroke-opacity=".58" stroke-width="3"/>
        <text x="190" y="170" text-anchor="middle" font-family="Inter,Arial" font-size="42" font-weight="900" fill="#fff">HYDRADOSE</text>
        <text x="190" y="214" text-anchor="middle" font-family="Inter,Arial" font-size="24" font-weight="700" fill="#031313">ELECTROLYTE MIX</text>
        <circle cx="190" cy="344" r="92" fill="${accent}" opacity=".24"/>
        <circle cx="190" cy="344" r="58" fill="${accent}" opacity=".85"/>
        <path d="M168 349c28-64 76-67 45 12-20 50-76 62-104 56 24-9 46-23 59-68Z" fill="#fff" opacity=".9"/>
        <text x="190" y="520" text-anchor="middle" font-family="Inter,Arial" font-size="38" font-weight="900" fill="#fff">${name}</text>
        <text x="190" y="562" text-anchor="middle" font-family="Inter,Arial" font-size="22" font-weight="700" fill="#2dd4bf">${flavor}</text>
        <rect x="64" y="612" width="252" height="52" rx="26" fill="#fff"/>
        <text x="190" y="646" text-anchor="middle" font-family="Inter,Arial" font-size="22" font-weight="900" fill="#06110f">20 SACHETS</text>
      </g>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const productImages = {
  pulse: sachetImage({ name: 'PULSE', flavor: 'Blue Raspberry', c1: '#18d6c1', c2: '#0f172a', accent: '#22d3ee' }),
  lychee: sachetImage({ name: 'FLUX', flavor: 'Lychee Mint', c1: '#2dd4bf', c2: '#14532d', accent: '#a7f3d0' }),
  citrus: sachetImage({ name: 'CITRUS', flavor: 'Lemon Lime', c1: '#facc15', c2: '#0f766e', accent: '#fef08a' }),
  heat: sachetImage({ name: 'HEAT', flavor: 'Orange Salt', c1: '#fb923c', c2: '#0f172a', accent: '#fdba74' }),
  night: sachetImage({ name: 'REST', flavor: 'Berry Calm', c1: '#818cf8', c2: '#111827', accent: '#c4b5fd' }),
  travel: sachetImage({ name: 'MOTION', flavor: 'Grape Ice', c1: '#38bdf8', c2: '#312e81', accent: '#93c5fd' }),
};

const sachetCatalog = [
  {
    id: 1,
    title: 'Pulse Blue Raspberry 20 Sachet',
    genre: 'Exercise',
    image: productImages.pulse,
    developer: 'HydraDose Labs',
    price: 16.99,
    rating: 4.8,
    reviews: 842,
    downloads: 25200,
    tags: ['800mg Sodium', '200mg Potassium', 'Zero Sugar'],
    isNew: true,
    isFeatured: true,
    releaseDate: '2026-01-15',
    description: 'A sugar-free electrolyte sachet for training days, long walks, and fast rehydration after heavy sweat.',
  },
  {
    id: 2,
    title: 'Flux Lychee Mint 20 Sachet',
    genre: 'Wellness',
    image: productImages.lychee,
    developer: 'HydraDose Labs',
    price: 15.49,
    rating: 4.7,
    reviews: 690,
    downloads: 19800,
    tags: ['Clean Hydration', 'Mint Finish', 'Daily Use'],
    isNew: true,
    isFeatured: true,
    releaseDate: '2026-02-08',
    description: 'A crisp lychee mint electrolyte mix made for everyday heat, focus, and steady hydration.',
  },
  {
    id: 3,
    title: 'Citrus Lemon Lime 30 Sachet',
    genre: 'Performance',
    image: productImages.citrus,
    developer: 'HydraDose Labs',
    price: 22.99,
    rating: 4.9,
    reviews: 1120,
    downloads: 36100,
    tags: ['30 Servings', 'Magnesium', 'Zero Sugar'],
    isNew: false,
    isFeatured: true,
    releaseDate: '2025-10-02',
    description: 'A bright citrus hydration pack built for workouts, travel bottles, and all-day performance.',
  },
  {
    id: 4,
    title: 'Heat Shield Orange Salt 15 Sachet',
    genre: 'Heat',
    image: productImages.heat,
    developer: 'HydraDose Labs',
    price: 13.99,
    rating: 4.6,
    reviews: 518,
    downloads: 14400,
    tags: ['Hot Weather', 'High Sodium', 'Fast Mix'],
    isNew: false,
    isFeatured: true,
    releaseDate: '2025-09-18',
    description: 'A compact electrolyte sachet for hot commutes, outdoor work, and summer training sessions.',
  },
  {
    id: 5,
    title: 'Recovery Berry Calm 20 Sachet',
    genre: 'Recovery',
    image: productImages.night,
    developer: 'HydraDose Labs',
    price: 18.25,
    rating: 4.5,
    reviews: 474,
    downloads: 12100,
    tags: ['Magnesium', 'Evening Hydration', 'Cramps'],
    isNew: false,
    isFeatured: false,
    releaseDate: '2025-07-20',
    description: 'A berry electrolyte blend with magnesium for post-training hydration and calmer recovery routines.',
  },
  {
    id: 6,
    title: 'Motion Grape Ice 10 Sachet',
    genre: 'Travel',
    image: productImages.travel,
    developer: 'HydraDose Labs',
    price: 9.99,
    rating: 4.8,
    reviews: 753,
    downloads: 21900,
    tags: ['Pocket Pack', 'Flight Friendly', 'Low Calorie'],
    isNew: true,
    isFeatured: true,
    releaseDate: '2026-03-03',
    description: 'A travel-ready sachet pack for flights, road trips, and days when plain water is not enough.',
  },
  {
    id: 7,
    title: 'Pulse Blue Raspberry 15 Sachet',
    genre: 'Exercise',
    image: productImages.pulse,
    developer: 'HydraDose Active',
    price: 12.99,
    rating: 4.7,
    reviews: 905,
    downloads: 28400,
    tags: ['Trial Pack', 'Zero Sugar', 'Workout'],
    isNew: false,
    isFeatured: true,
    releaseDate: '2025-08-12',
    description: 'The same crisp blue raspberry hydration formula in a smaller pack for first-time routines.',
  },
  {
    id: 8,
    title: 'Rest Berry Calm 10 Sachet',
    genre: 'Sleep',
    image: productImages.night,
    developer: 'HydraDose Labs',
    price: 10.75,
    rating: 4.6,
    reviews: 433,
    downloads: 10800,
    tags: ['Night Routine', 'Magnesium', 'Gentle Taste'],
    isNew: false,
    isFeatured: false,
    releaseDate: '2025-06-14',
    description: 'A lighter evening hydration mix for people who want electrolytes without a sports-drink feel.',
  },
  {
    id: 9,
    title: 'Immunity Lime Zinc 20 Sachet',
    genre: 'Immunity',
    image: productImages.citrus,
    developer: 'HydraDose Labs',
    price: 13.99,
    rating: 4.4,
    reviews: 382,
    downloads: 9700,
    tags: ['Zinc', 'Vitamin C', 'Hydration'],
    isNew: false,
    isFeatured: false,
    releaseDate: '2025-05-11',
    description: 'Electrolytes, vitamin C, and zinc in a lime sachet designed for clean daily hydration support.',
  },
  {
    id: 10,
    title: 'Heat Shield Orange Salt 30 Sachet',
    genre: 'Heat',
    image: productImages.heat,
    developer: 'HydraDose Labs',
    price: 21.99,
    rating: 4.5,
    reviews: 276,
    downloads: 7600,
    tags: ['Value Pack', 'Summer', 'Sweat Loss'],
    isNew: true,
    isFeatured: false,
    releaseDate: '2026-01-30',
    description: 'A bigger orange salt pack for high-heat days, gym bags, and outdoor hydration planning.',
  },
  {
    id: 11,
    title: 'Family Lemon Lime 20 Sachet',
    genre: 'Wellness',
    image: productImages.citrus,
    developer: 'HydraDose Family',
    price: 16.5,
    rating: 4.7,
    reviews: 641,
    downloads: 15300,
    tags: ['Family Pack', 'Mild Flavor', 'Zero Sugar'],
    isNew: false,
    isFeatured: true,
    releaseDate: '2025-11-10',
    description: 'A mellow lemon lime electrolyte sachet for daily bottles, weekend plans, and family use.',
  },
  {
    id: 12,
    title: 'Performance Citrus 15 Sachet',
    genre: 'Performance',
    image: productImages.citrus,
    developer: 'HydraDose Active',
    price: 14.25,
    rating: 4.6,
    reviews: 519,
    downloads: 13100,
    tags: ['Workout', 'Electrolytes', 'Pocket Pack'],
    isNew: false,
    isFeatured: false,
    releaseDate: '2025-04-26',
    description: 'A smaller performance sachet pack for pre-workout bottles and quick rehydration.',
  },
];

export const mockproducts = sachetCatalog.map(product => ({
  ...product,
  isFree: product.price === 0,
  screenshots: [],
}));

export const mockUsers = [
  { id: 1, name: 'Ayesha Khan', email: 'customer@hydrastore.local', role: 'customer', avatar: null, joinDate: '2025-01-15', purchases: [1, 3, 6], cart: [] },
  { id: 2, name: 'HydraDose Team', email: 'seller@hydrastore.local', role: 'seller', avatar: null, joinDate: '2024-11-08', studio: 'HydraDose Labs' },
  { id: 3, name: 'Admin User', email: 'admin@hydrastore.local', role: 'admin', avatar: null, joinDate: '2024-01-01' },
];

export const mockReviews = [
  { id: 1, productId: 1, userId: 1, userName: 'Ayesha Khan', rating: 5, text: 'Mixes fast, tastes clean, and feels much more premium than the usual sports drink.', date: '2026-03-20', helpful: 42 },
  { id: 2, productId: 2, userId: 4, userName: 'Hamza Ali', rating: 4, text: 'Good for daily bottles in Karachi heat. The ingredients are easy to understand.', date: '2026-03-18', helpful: 28 },
  { id: 3, productId: 3, userId: 1, userName: 'Ayesha Khan', rating: 5, text: 'The sachets are convenient and the citrus flavor is sharp without being sugary.', date: '2026-02-10', helpful: 89 },
  { id: 4, productId: 6, userId: 5, userName: 'Sara Malik', rating: 5, text: 'Perfect travel pack. Small enough for a bag and the branding feels premium.', date: '2026-01-22', helpful: 56 },
];

export const mockOrders = [
  { id: 'ORD-001', userId: 1, productId: 1, productName: 'Pulse Blue Raspberry 20 Sachet', price: 16.99, date: '2026-03-15', status: 'completed', paymentMethod: 'Credit Card' },
  { id: 'ORD-002', userId: 1, productId: 3, productName: 'Citrus Lemon Lime 30 Sachet', price: 22.99, date: '2026-02-20', status: 'completed', paymentMethod: 'PayPal' },
];

export const mockAdminStats = {
  totalUsers: 15420,
  totalproducts: sachetCatalog.length,
  totalRevenue: 284650,
  totalOrders: 38920,
  newUsersThisMonth: 1240,
  revenueThisMonth: 24800,
  activeproducts: sachetCatalog.length,
  pendingApprovals: 7,
};
