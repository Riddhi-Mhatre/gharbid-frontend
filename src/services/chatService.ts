import { api } from './api';
import axios from 'axios';

export const getRooms = () => api.get('/chat/rooms').then(r => r.data.data);

export const getMessages = (roomId: string) =>
  api.get(`/chat/rooms/${roomId}/messages`).then(r => r.data.data);

export const sendMessage = (roomId: string, content: string, type?: string, payload?: object) =>
  api.post(`/chat/rooms/${roomId}/messages`, { content, type, payload }).then(r => r.data.data);

export const markRead = (roomId: string) =>
  api.put(`/chat/rooms/${roomId}/read`).then(r => r.data.data);

// ─── Deal Flow ────────────────────────────────────────────────────────────────

export const sendDealRequest = (roomId: string) =>
  api.post(`/chat/rooms/${roomId}/deal/request`).then(r => r.data.data);

export const respondDeal = (roomId: string, action: 'accept' | 'reject') =>
  api.post(`/chat/rooms/${roomId}/deal/respond`, { action }).then(r => r.data.data);

export const proposeMeet = (roomId: string, payload: {
  primaryDate: string; primaryTime: string;
  alt1Date: string; alt1Time: string;
  alt2Date: string; alt2Time: string;
  notes?: string;
}) => api.post(`/chat/rooms/${roomId}/meet/propose`, payload).then(r => r.data.data);

export const confirmMeet = (roomId: string, chosenDate: string, chosenTime: string) =>
  api.post(`/chat/rooms/${roomId}/meet/confirm`, { chosenDate, chosenTime }).then(r => r.data.data);

export const payDealFee = (roomId: string, role: 'buyer' | 'seller') =>
  api.post(`/chat/rooms/${roomId}/pay`, { role }).then(r => r.data.data);

// ─── File Upload (reuses same S3 presigned-URL pattern as property images) ────

export const uploadChatFile = async (file: File): Promise<string> => {
  const response = await api.post('/properties/upload-url', {
    fileName: file.name,
    contentType: file.type,
  });
  const { uploadUrl, publicUrl } = response.data;
  await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
  return publicUrl as string;
};
