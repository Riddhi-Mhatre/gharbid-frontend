import { api } from './api';

export const getAuctions = (status?: string) =>
  api.get('/auctions', { params: { status } }).then(r => r.data.data);

export const getAuction = (id: string) =>
  api.get(`/auctions/${id}`).then(r => r.data.data);

export const placeBid = (auctionId: string, amount: number) =>
  api.post(`/auctions/${auctionId}/bid`, { amount }).then(r => r.data.data);

export const getBidHistory = (auctionId: string) =>
  api.get(`/auctions/${auctionId}/bids`).then(r => r.data.data);

export const setAutoBid = (auctionId: string, maxAmount: number) =>
  api.post(`/auctions/${auctionId}/auto-bid`, { maxAmount }).then(r => r.data.data);
