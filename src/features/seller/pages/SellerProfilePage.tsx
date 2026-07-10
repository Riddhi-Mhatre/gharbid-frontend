import { useState, useRef } from 'react';
import { Settings, User, Bell, Upload, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { NotificationPanel } from '../../../components/common/NotificationPanel';
import { updateProfile, uploadAvatarToS3 } from '../../../services/userService';
import { toast } from 'sonner';

export default function SellerProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'personal' | 'notifications'>('personal');

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+91 ');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+91')) {
      if (val.startsWith('91')) val = '+' + val;
      else if (val.length > 0 && !val.startsWith('+')) val = '+91 ' + val;
      else if (val === '+') val = '+91 ';
    }
    setPhone(val);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error('File size must be under 800KB');
      return;
    }
    setIsUploading(true);
    const toastId = toast.loading('Uploading image...');
    try {
      const publicUrl = await uploadAvatarToS3(file);
      setProfileImage(publicUrl);
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^\+91[ -]?\d{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      toast.error('Phone number must be in Indian format (+91 followed by 10 digits)');
      return;
    }
    setIsSaving(true);
    try {
      const updatedData = { name, phone, location, bio, profileImage };
      await updateProfile(updatedData);
      useAuthStore.setState({ user: { ...user, ...updatedData } as any });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4 border-b border-dark-border pb-6">
        <div className="p-3 bg-white/10 rounded-lg">
          <Settings size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-black uppercase tracking-widest text-white">Profile Settings</h1>
          <p className="text-muted text-sm mt-1">Manage your personal information and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Tabs */}
        <div className="space-y-2">
           <button 
             onClick={() => setActiveTab('personal')}
             className={`w-full flex items-center gap-3 p-4 rounded-lg border font-medium transition-colors ${
               activeTab === 'personal' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-transparent text-muted hover:bg-white/5 hover:text-white border-transparent'
             }`}
           >
             <User size={18} /> Personal Information
           </button>
           <button 
             onClick={() => setActiveTab('notifications')}
             className={`w-full flex items-center gap-3 p-4 rounded-lg border font-medium transition-colors ${
               activeTab === 'notifications' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-transparent text-muted hover:bg-white/5 hover:text-white border-transparent'
             }`}
           >
             <Bell size={18} /> Notifications
           </button>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6 lg:p-8 min-h-[500px]">
           {activeTab === 'personal' && (
             <>
               <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-dark-border pb-4">Personal Information</h2>
           
           <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent p-1 relative overflow-hidden group">
                 <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-primary">{name.charAt(0) || 'S'}</span>
                    )}
                 </div>
                 {isUploading && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                     <Loader2 className="animate-spin text-white" size={24} />
                   </div>
                 )}
              </div>
              <div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleImageUpload} 
                   accept="image/jpeg, image/png, image/gif" 
                   className="hidden" 
                 />
                 <div className="flex flex-col items-start gap-2 mb-2">
                   <button 
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     disabled={isUploading}
                     className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-bold uppercase tracking-widest text-xs transition-colors border border-dark-border flex items-center gap-2 disabled:opacity-50"
                   >
                      <Upload size={14} /> Change Avatar
                   </button>
                   {profileImage && (
                     <button 
                       type="button"
                       onClick={() => {
                         setProfileImage('');
                         if (fileInputRef.current) fileInputRef.current.value = '';
                       }}
                       className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded font-bold uppercase tracking-widest text-xs transition-colors border border-red-500/20 w-full text-center"
                     >
                        Remove Avatar
                     </button>
                   )}
                 </div>
                 <p className="text-xs text-muted">JPG, GIF or PNG. Max size of 800KB</p>
              </div>
           </div>

           <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-black border border-dark-border rounded p-3 text-white focus:border-primary outline-none transition-colors" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest">Email Address</label>
                    <input type="email" value={user?.email || ''} disabled className="w-full bg-black/50 border border-dark-border rounded p-3 text-muted outline-none cursor-not-allowed" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest">Phone Number</label>
                    <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="+91 9876543210" className="w-full bg-black border border-dark-border rounded p-3 text-white focus:border-primary outline-none transition-colors" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest">Location</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Mumbai, MH" className="w-full bg-black border border-dark-border rounded p-3 text-white focus:border-primary outline-none transition-colors" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-muted uppercase tracking-widest">Bio</label>
                 <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us a bit about yourself and your properties..." className="w-full bg-black border border-dark-border rounded p-3 text-white focus:border-primary outline-none transition-colors custom-scrollbar"></textarea>
              </div>

               <div className="pt-6 border-t border-dark-border flex justify-end gap-4">
                 <button type="button" onClick={() => { setName(user?.name||''); setPhone(user?.phone||'+91 '); setLocation(user?.location||''); setBio(user?.bio||''); setProfileImage(user?.profileImage||''); }} className="px-6 py-3 bg-transparent hover:bg-white/5 text-white rounded font-bold uppercase tracking-widest text-xs transition-colors">
                    Cancel
                 </button>
                 <button type="submit" disabled={isSaving} className="px-6 py-3 bg-primary hover:bg-white text-black rounded font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isSaving && <Loader2 size={14} className="animate-spin" />} Save Changes
                 </button>
              </div>
           </form>
             </>
           )}
           
           {activeTab === 'notifications' && (
             <div className="h-full bg-black/50 border border-dark-border rounded-xl shadow-lg overflow-hidden">
                <NotificationPanel onClose={() => setActiveTab('personal')} />
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
