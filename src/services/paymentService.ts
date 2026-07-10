import { api } from './api';

/**
 * Creates a Razorpay order on the backend.
 * Returns { orderId, amount, currency, keyId }
 */
export const createPaymentOrder = (roomId: string, role: 'buyer' | 'seller') =>
  api.post('/payments/create-order', { roomId, role }).then((r) => r.data.data);

/**
 * Verifies a completed Razorpay payment on the backend.
 * On success the backend records the payment and closes the deal if both sides paid.
 * Returns the chat system message to append.
 */
export const verifyPayment = (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  roomId: string;
  role: 'buyer' | 'seller';
}) => api.post('/payments/verify', payload).then((r) => r.data.data);
