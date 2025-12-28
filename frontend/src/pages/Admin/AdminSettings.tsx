import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../app/store';
import { User, Shield, LogOut, AlertTriangle, CheckCircle, Lock, Key, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function AdminSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const logout = useAuthStore(s => s.logout);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => setProfile(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.delete('/api/auth/me');
      alert('Your account has been deleted.');
      logout();
      window.location.href = '/login';
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete account: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading profile...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account & Plans</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoItem label="Full Name" value={profile?.name} icon={<User className="w-4 h-4 text-gray-400" />} />
                <InfoItem label="Email Address" value={profile?.email} icon={<CheckCircle className="w-4 h-4 text-green-500" />} />
                <InfoItem label="Role" value={profile?.role || 'ADMIN'} icon={<Shield className="w-4 h-4 text-purple-500" />} />
                <InfoItem label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Dec 2025'} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Security & Privacy
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Manage your password and account security settings. Regular password updates are recommended for better protection.
            </p>
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
               >
                 Change Password
               </button>
            </div>
          </section>

          <section className="bg-red-50/50 rounded-[40px] border border-red-100 p-8">
            <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
            <p className="text-sm text-red-600 mb-6 font-medium">
              Deleting your account is permanent and cannot be undone. All your restaurants, dishes, and order history will be permanently removed.
            </p>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-red-200"
            >
              Delete My Account
            </button>
          </section>
        </div>

        {/* Plan / Sidebar Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-xl shadow-blue-200">
            <h3 className="text-lg font-bold mb-2">Current Plan</h3>
            <div className="text-4xl font-black mb-4">Enterprise</div>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              You are on the highest tier plan with unlimited restaurants, staff members, and priority support.
            </p>
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-2xl">
                 <CheckCircle className="w-4 h-4 text-blue-300" />
                 <span>Unlimited Restaurants</span>
               </div>
               <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-2xl">
                 <CheckCircle className="w-4 h-4 text-blue-300" />
                 <span>24/7 Priority Support</span>
               </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-lg shadow-gray-100/50">
            <h4 className="font-bold mb-4">Need help?</h4>
            <p className="text-sm text-gray-500 mb-4">Our support team is available 24/7 to help you with any issues.</p>
            <a href="mailto:support@quickmenu.com" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2">
              Contact Support →
            </a>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Delete Account?</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              This action is <strong className="text-red-600">irreversible</strong>. You will lose access to all your restaurant data and history. Are you absolutely sure?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-200"
              >
                {deleting ? 'Deleting Account...' : 'Yes, Delete Forever'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      alert('Password updated successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <Card className="max-w-md w-full p-8 animate-in fade-in zoom-in duration-300 relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500 mt-2">Update your login credentials</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <Input 
            label="Current Password" 
            type="password" 
            value={currentPassword} 
            onChange={e => setCurrentPassword(e.target.value)}
            required
          />
          <Input 
            label="New Password" 
            type="password" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
          />
          <Input 
            label="Confirm New Password" 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          <div className="pt-4 flex gap-3">
            <Button className="flex-1" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</div>
        <div className="font-bold text-gray-900">{value || '—'}</div>
      </div>
    </div>
  );
}
