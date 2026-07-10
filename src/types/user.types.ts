export type Role = 'buyer' | 'seller';
export interface User {
  userId: string;
  email: string;
  phone?: string;
  name: string;
  role: Role;
  isVerified: boolean;
  profileImage?: string;
  createdAt: string;
}
