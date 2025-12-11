import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Get CSRF token from cookie.
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Axios instance configured for the backend API.
 * Includes credentials for session cookies.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

// Request interceptor to add CSRF token
apiClient.interceptors.request.use(
  (config) => {
    const csrfToken = getCsrfToken();
    if (csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Exclude /auth/me from automatic redirect to let AuthContext handle it
      // Use URL path matching instead of string ending to handle query parameters
      const requestUrl = error.config?.url || '';
      const urlPath = new URL(requestUrl, window.location.origin).pathname;
      if (urlPath !== '/auth/me') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  error: string;
}

export interface User {
  id: number;
  username: string;
  role: 'buyer' | 'seller';
  baselineWeight?: number | null;
  basePrice?: number | null;
  kUp?: number | null;
  kDown?: number | null;
  createdAt?: string;
}

export interface PriceRecord {
  id: number;
  sellerId: number;
  date: string;
  session: 'AM' | 'PM';
  price: number;
  createdAt?: string;
}

export interface ChartDataPoint {
  date: string;
  session: 'AM' | 'PM';
  price: number;
  ma5: number;
  ma10: number;
  ma20: number;
  ma50: number;
}

export interface TradeRecord {
  id: number;
  buyerId: number;
  sellerId: number;
  sellerName?: string;
  buyerName?: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: string;
}

export interface PnLData {
  position: number;
  costBasis: number;
  totalCost: number;
  currentPrice: number | null;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface TotalPnLData {
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  totalInvested: number;
  returnPercent: number;
}

export interface SellerEarningsData {
  totalReceived: number;
  totalPaidOut: number;
  netEarnings: number;
  buyTransactions: number;
  sellTransactions: number;
}

export interface BalanceHistoryPoint {
  timestamp: string;
  balance: number;
}

export interface BalanceHistoryData {
  userId: number;
  period: string;
  data: BalanceHistoryPoint[];
}

export interface DailyPnLData {
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  totalInvested: number;
  returnPercent: number;
  periodStart: string;
  periodEnd: string;
}

export interface DailyEarningsData {
  totalReceived: number;
  totalPaidOut: number;
  netEarnings: number;
  buyTransactions: number;
  sellTransactions: number;
  periodStart: string;
  periodEnd: string;
}

export interface SellerWithPrice {
  id: number;
  username: string;
  latestPrice: PriceRecord | null;
}

export interface PriceStats {
  lastSalePrice: number | null;
  '1wHigh': number | null;
  '1wLow': number | null;
  '1mHigh': number | null;
  '1mLow': number | null;
  '3mHigh': number | null;
  '3mLow': number | null;
  '6mHigh': number | null;
  '6mLow': number | null;
}

export interface AccountValuePoint {
  timestamp: string;
  accountValue: number;
  cashBalance: number;
  equityValue: number;
}

export interface AccountValueHistoryData {
  userId: number;
  data: AccountValuePoint[];
}

export interface HoldingData {
  sellerId: number;
  sellerName: string;
  shares: number;
  currentPrice: number;
  costBasis: number;
  totalCost: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface HoldingsResponse {
  holdings: HoldingData[];
}

// Auth API
export const authApi = {
  register: (data: {
    username: string;
    password: string;
    role: 'buyer' | 'seller';
    baselineWeight?: number;
    basePrice?: number;
    kUp?: number;
    kDown?: number;
  }) => apiClient.post<{ message: string; user: User }>('/auth/register', data),

  login: (username: string, password: string) =>
    apiClient.post<{ message: string; user: User }>('/auth/login', { username, password }),

  logout: () => apiClient.post<{ message: string }>('/auth/logout'),

  getCurrentUser: () => apiClient.get<{ user: User }>('/auth/me'),
};

// Seller API
export const sellerApi = {
  uploadPrice: (data: { date: string; session: 'AM' | 'PM'; price: number }) =>
    apiClient.post<{ message: string; price: PriceRecord }>('/seller/upload-price', data),

  getSettings: () =>
    apiClient.get<{
      baselineWeight: number | null;
      basePrice: number | null;
      kUp: number | null;
      kDown: number | null;
    }>('/seller/settings'),

  updateSettings: (data: {
    baselineWeight?: number;
    basePrice?: number;
    kUp?: number;
    kDown?: number;
  }) => apiClient.put<{ message: string; settings: object }>('/seller/settings', data),

  getMyPrices: () => apiClient.get<{ prices: PriceRecord[] }>('/seller/prices'),

  getBalance: () => apiClient.get<{ balance: number }>('/seller/balance'),

  getEarnings: () => apiClient.get<SellerEarningsData>('/seller/earnings'),

  getTradeHistory: (limit?: number) =>
    apiClient.get<{ trades: TradeRecord[] }>('/seller/trade-history', {
      params: { limit },
    }),

  getFilledSessions: (date: string) =>
    apiClient.get<{ filledSessions: ('AM' | 'PM')[] }>('/seller/filled-sessions', {
      params: { date },
    }),

  getBalanceHistory: (period?: string) =>
    apiClient.get<BalanceHistoryData>('/seller/balance-history', {
      params: period ? { period } : undefined,
    }),

  getDailyEarnings: () => apiClient.get<DailyEarningsData>('/seller/daily-earnings'),
};

// Prices API
export const pricesApi = {
  getSellerPrices: (sellerId: number, period: string = '1M') =>
    apiClient.get<{
      sellerId: number;
      sellerName: string;
      period: string;
      data: ChartDataPoint[];
    }>(`/prices/${sellerId}`, { params: { period } }),

  getSellerStats: (sellerId: number) =>
    apiClient.get<{
      sellerId: number;
      sellerName: string;
      stats: PriceStats;
    }>(`/prices/${sellerId}/stats`),

  getAllSellers: (search?: string) =>
    apiClient.get<{ sellers: SellerWithPrice[] }>('/prices/sellers', {
      params: search ? { search } : undefined,
    }),
};

// Buyer API
export const buyerApi = {
  recharge: (amount: number) =>
    apiClient.post<{ message: string; balance: { balance: number } }>('/buyer/recharge', {
      amount,
    }),

  trade: (data: { sellerId: number; price: number; quantity: number; side: 'buy' | 'sell' }) =>
    apiClient.post<{ message: string; trade: TradeRecord; balance: number }>('/buyer/trade', data),

  getTrades: (sellerId?: number, limit?: number) =>
    apiClient.get<{ trades: TradeRecord[] }>('/buyer/trades', {
      params: { sellerId, limit },
    }),

  getBalance: () => apiClient.get<{ balance: number }>('/buyer/balance'),

  getPnL: (sellerId: number) => apiClient.get<PnLData>(`/buyer/pnl/${sellerId}`),

  getTotalPnL: () => apiClient.get<TotalPnLData>('/buyer/total-pnl'),

  getBalanceHistory: (period?: string) =>
    apiClient.get<BalanceHistoryData>('/buyer/balance-history', {
      params: period ? { period } : undefined,
    }),

  getDailyPnL: () => apiClient.get<DailyPnLData>('/buyer/daily-pnl'),

  getAccountValueHistory: () =>
    apiClient.get<AccountValueHistoryData>('/buyer/account-value-history'),

  getHoldings: () => apiClient.get<HoldingsResponse>('/buyer/holdings'),
};

export default apiClient;
