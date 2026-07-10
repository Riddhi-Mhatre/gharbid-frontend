import { useAuthStore } from '../store/authStore';
import { User, BadgeCheck } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/50 mx-auto flex items-center justify-center mb-4">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={48} className="text-primary" />
              )}
            </div>
            <h2 className="font-bold text-lg">{user.name}</h2>
            <p className="text-sm text-muted capitalize mb-3">{user.role}</p>
            {user.isVerified ? (
              <span className="badge-verified mx-auto"><BadgeCheck size={14} /> Verified User</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs bg-dark-hover text-muted px-2 py-1 rounded-md border border-dark-border">
                Unverified
              </span>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg border-b border-dark-border pb-4 mb-4">Personal Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted mb-1">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Phone</p>
                <p className="text-sm">{user.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Joined</p>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
