import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useStore();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return toast.error('All fields are required');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to ProPath AI 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="fixed top-20 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl">🚀</div>
            <span className="text-2xl font-bold gradient-text">ProPath AI</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-1 text-sm">Start your AI-powered career journey</p>
        </div>

        <div className="glass-card glow-indigo p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={form.name}
                autoComplete="name"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                autoComplete="email"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={form.password}
                autoComplete="new-password"
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button
              id="reg-submit"
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="spinner" /> Creating account...</span>
                : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Powered by Qwen AI • Local Processing via Ollama
        </p>
      </div>
    </div>
  );
}
