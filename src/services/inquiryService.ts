import { api } from './api';

export interface Inquiry {
  inquiryId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  propertyId: string;
  propertyTitle: string;
  status: 'pending' | 'accepted' | 'rejected';
  roomId?: string;
  createdAt: string;
}

/** Buyer: send an interest/inquiry for a property */
export const expressInterest = (propertyId: string): Promise<Inquiry> =>
  api.post(`/properties/${propertyId}/interest`).then(r => r.data.data);

/** Seller: get all inquiries directed to them */
export const getSellerInquiries = (): Promise<Inquiry[]> =>
  api.get('/inquiries/seller').then(r => r.data.data);

/** Buyer: get all inquiries they have sent */
export const getBuyerInquiries = (): Promise<Inquiry[]> =>
  api.get('/inquiries/buyer').then(r => r.data.data);

/** Seller: accept an inquiry — creates chat room */
export const acceptInquiry = (inquiryId: string): Promise<{ inquiry: Inquiry; room: any }> =>
  api.post(`/inquiries/${inquiryId}/accept`).then(r => r.data.data);

/** Seller: reject an inquiry */
export const rejectInquiry = (inquiryId: string): Promise<any> =>
  api.post(`/inquiries/${inquiryId}/reject`).then(r => r.data.data);
