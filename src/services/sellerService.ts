import { api } from './api';
import axios from 'axios';

export interface SellerDashboardData {
  totalProperties: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  totalViews: number;
}

export const getSellerDashboard = (): Promise<SellerDashboardData> =>
  api.get('/seller/dashboard').then(r => r.data.data);

export const getSellerProperties = () =>
  api.get('/seller/properties').then(r => r.data.data);

export const getSellerPayments = () =>
  api.get('/seller/payments').then(r => r.data.data);

// ─── Image Upload (Media/Uploads Bucket) ────────────────────────────────────
export const uploadFileToS3 = async (file: File): Promise<string> => {
  try {
    console.log('Uploading image:', file.name);

    const response = await api.post('/properties/upload-url', {
      fileName: file.name,
      contentType: file.type,
    });

    // Backend returns { uploadUrl, publicUrl, key } directly (not in data.data)
    const { uploadUrl, publicUrl } = response.data;

    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
    });

    console.log('Image upload successful:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('S3 Image Upload Error:', error);
    throw error;
  }
};

// ─── Document Upload (Documents Bucket) ─────────────────────────────────────

/**
 * Gets a pre-signed S3 URL to upload a legal document.
 * @param fileName  — original file name
 * @param contentType — MIME type (falls back to application/octet-stream if empty)
 * @param docType   — named key: saleDeed | propertyCard | taxReceipt | ownerAadhar | ownerPan | noc
 */
export const getDocumentUploadUrl = async (
  fileName: string,
  contentType: string,
  docType: string
): Promise<{ uploadUrl: string; s3Key: string }> => {
  // Fallback for files where browser doesn't detect MIME type (e.g. some .docx on Windows)
  const resolvedType = contentType || inferMimeType(fileName);
  const response = await api.get('/seller/document-upload-url', {
    params: { fileName, fileType: resolvedType, docType },
  });
  // Backend returns { success: true, data: { uploadUrl, s3Key } }
  return response.data.data;
};

export const getDocumentReadUrl = async (s3Key: string): Promise<string> => {
  const response = await api.get('/seller/document-read-url', {
    params: { s3Key },
  });
  return response.data.data.readUrl;
};

/** Infer MIME type from file extension when browser provides an empty type */
function inferMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return map[ext ?? ''] ?? 'application/octet-stream';
}

/**
 * Uploads a single legal document to S3 and returns the s3Key.
 * @param file    — the File to upload
 * @param docType — named key (e.g. "saleDeed")
 */
export const uploadDocumentToS3 = async (
  file: File,
  docType: string
): Promise<string> => {
  const { uploadUrl, s3Key } = await getDocumentUploadUrl(
    file.name,
    file.type,
    docType
  );

  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
  });

  return s3Key;
};

// ─── Save documents to property ─────────────────────────────────────────────
/**
 * Saves a named-key document object to the property in DynamoDB.
 * @param propertyId — the property to update
 * @param documents  — e.g. { saleDeed: "s3Key", propertyCard: "s3Key", ... }
 */
export const saveDocumentsToProperty = async (
  propertyId: string,
  documents: Record<string, string>
): Promise<any> => {
  const response = await api.patch(
    `/seller/properties/${propertyId}/documents`,
    { documents }
  );
  return response.data;
};

// ─── Platform fee payment ────────────────────────────────────────────────────
export const payPlatformFee = (propertyId: string): Promise<any> =>
  api.post(`/seller/properties/${propertyId}/pay-fee`).then(r => r.data.data);

// ─── Delete a property ───────────────────────────────────────────────────────
export const deleteSellerProperty = (propertyId: string): Promise<any> =>
  api.delete(`/properties/${propertyId}`).then(r => r.data.data);

// ─── Seller Auction Management ───────────────────────────────────────────────

export const getSellerAuctions = async (): Promise<any> => {
  const response = await api.get('/seller/auctions');
  return response.data.data;
};

export const scheduleSellerAuction = (propertyId: string, data: any): Promise<any> =>
  api.post(`/seller/properties/${propertyId}/auction`, data).then(r => r.data.data);

export const getSellerAuction = (propertyId: string): Promise<any> =>
  api.get(`/seller/properties/${propertyId}/auction`).then(r => r.data.data);

export const getSellerAuctionBids = (propertyId: string): Promise<any> =>
  api.get(`/seller/properties/${propertyId}/auction/bids`).then(r => r.data.data);

export const earlyCloseAuction = (propertyId: string): Promise<any> =>
  api.post(`/seller/properties/${propertyId}/auction/early-close`).then(r => r.data.data);

export const getInterestedBuyers = (propertyId: string): Promise<any> =>
  api.get(`/seller/properties/${propertyId}/interested-buyers`).then(r => r.data.data);

export const markPropertySold = (propertyId: string): Promise<any> =>
  api.post(`/seller/properties/${propertyId}/sold`).then(r => r.data.data);

