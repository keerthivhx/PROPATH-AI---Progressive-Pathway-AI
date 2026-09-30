import { useState, useEffect } from 'react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { User, Link2, Save, RefreshCw } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useStore();
  const [form, setForm] = useState({ name: '', linkedin: '', github: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile').then(r => {
      setForm({ name: r.data.name, linkedin: r.data.linkedin || '', github: r.data.github || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/profile', form);
      setUser({ ...user, ...form });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="spinner mx-auto" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      {/* Avatar */}
      <div className="glass-card p-6 mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white">
          {form.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold text-white">{form.name}</div>
          <div className="text-gray-400 text-sm">{user?.email}</div>
          {user?.careerDomain && (
            <div className="badge badge-indigo mt-2">{user.careerDomain}</div>
          )}
        </div>
      </div>

      {/* Edit form */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold text-white mb-5">Edit Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><User size={14} /> Full Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><Link2 size={14} /> LinkedIn URL</label>
            <input className="input-field" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/yourprofile" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><Link2 size={14} /> GitHub URL</label>
            <input className="input-field" value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} placeholder="https://github.com/yourusername" />
          </div>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <><span className="spinner" /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Read-only info */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-300">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Career Domain</span><span className="text-gray-300">{user?.careerDomain || 'Not assessed'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Assessment</span><span className={user?.assessmentCompleted ? 'text-green-400' : 'text-amber-400'}>{user?.assessmentCompleted ? 'Completed' : 'Pending'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Skills</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {user?.skills?.slice(0, 4).map(s => <span key={s} className="badge badge-indigo">{s}</span>) || <span className="text-gray-500">None yet</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
