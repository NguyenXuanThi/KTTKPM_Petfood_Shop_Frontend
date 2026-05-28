export interface User {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  role: "user" | "admin" | "support";
  isActive?: boolean;
  inactiveReason?: string | null;
  inactiveAt?: string | null;
  lastLoginAt?: string | null;
  reactivationRequestedAt?: string | null;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  email?: string;
  status?: "active" | "inactive";
}

export interface UserListResponse {
  items: User[];
  meta: ProductListMeta;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface InactiveLoginResponse {
  message: "Your account is inactive" | string;
  reason: string;
  canRequestReactivation: boolean;
  userId: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface Category {
  _id: string;
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string | null;
  level: number;
  path: string;
  menuGroup: string;
  menuOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  menuGroups?: Array<{ group: string; items: CategoryNode[] }>;
}

export interface CategoryListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CategoryListResponse {
  items: Category[];
  meta: CategoryListMeta;
}

export interface CategoryFormPayload {
  name: string;
  description?: string;
  parentId?: string | null;
  menuGroup?: string;
  menuOrder?: number;
  isActive?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string | null;
  imageUrl: string;
  imageKey: string;
  isActive: boolean;
  averageRating?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  orderId: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  rating: number;
  comment: string;
  images?: Array<{ url: string; publicId?: string }>;
  status: "visible" | "hidden";
  isVerifiedPurchase?: boolean;
  verifiedPurchase?: boolean;
  hiddenReason?: string;
  hiddenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewPayload {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  images?: Array<{ url: string; publicId?: string }>;
}

export interface ProductReviewsParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  rating?: number;
}

export interface ReviewListResponse {
  success?: boolean;
  reviews: Review[];
  summary: ReviewSummary;
  meta?: ProductListMeta;
}

export interface AdminReviewListParams {
  page?: number;
  limit?: number;
  status?: "visible" | "hidden" | "all";
  search?: string;
  productId?: string;
  userId?: string;
}

export interface AdminReviewListResponse {
  success?: boolean;
  reviews: Review[];
  meta: ProductListMeta;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  categoryId?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "price";
  sortOrder?: "asc" | "desc";
}

export interface ProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: Product[];
  meta: ProductListMeta;
}

export type RecommendationSource = "viewed" | "searched" | "best_seller";

export interface ProductRecommendationResponse {
  success?: boolean;
  source: RecommendationSource;
  context?: {
    productId?: string | null;
    keyword?: string | null;
  } | null;
  updatedAt?: string | null;
  products: Product[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

export interface CartItemFlags {
  priceChanged: boolean;
  outOfStock: boolean;
  inactiveProduct: boolean;
}

export interface CartApiItem {
  productId: string;
  quantity: number;
  priceAtAdd: number;
  productName: string;
  imageUrl: string;
  lastValidatedAt: string | null;
  flags: CartItemFlags;
}

export interface CartTotals {
  subtotal: number;
  totalItems: number;
}

export interface CartApiResponse {
  id: string;
  ownerType: "user" | "guest";
  userId?: string | null;
  guestToken?: string | null;
  items: CartApiItem[];
  totals: CartTotals;
  createdAt: string;
  updatedAt: string;
}

export interface CartValidateIssue {
  productId: string;
  issues: string[];
}

export interface CartValidateResponse {
  canCheckout: boolean;
  issues: CartValidateIssue[];
  cart: CartApiResponse;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressPayload {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  label: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
}

export type PaymentMethod = "cash" | "banking" | "vnpay";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled";
export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "waiting_verify"
  | "paid"
  | "failed"
  | "expired";

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal?: number;
  shippingFee?: number;
  shippingDiscount?: number;
  couponCode?: string;
  couponDiscount?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  estimatedDeliveryAt?: string | null;
  confirmedAt?: string | null;
  shippingStartedAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt?: string | null;
  cancelledReason?: string;
  cartRestoredAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  orderId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  proofImageUrl?: string;
  proofImagePublicId?: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string>;
}

export interface UserSearchResult {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";
