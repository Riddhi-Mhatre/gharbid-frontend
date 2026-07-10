import { api } from './api';
import type { PropertyFilters } from '../types/property.types';

export const getProperties = (filters?: PropertyFilters) =>
  api.get('/properties', { params: filters }).then(r => r.data.data);

export const getProperty = (id: string) =>
  api.get(`/properties/${id}`).then(r => r.data.data);

export const createProperty = (data: FormData | object) =>
  api.post('/properties', data).then(r => r.data.data);

export const updateProperty = (id: string, data: object) =>
  api.put(`/properties/${id}`, data).then(r => r.data.data);

export const expressInterest = (id: string, source?: string) =>
  api.post(`/properties/${id}/interest${source ? `?source=${source}` : ''}`).then(r => r.data.data);

export const saveFavorite = (id: string) =>
  api.post(`/properties/${id}/favorite`).then(r => r.data.data);

export const getUploadUrl = (id: string, fileName: string, fileType: string) =>
  api.get(`/properties/${id}/upload-url`, { params: { fileName, fileType } }).then(r => r.data.data);
