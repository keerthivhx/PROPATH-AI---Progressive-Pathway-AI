import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useStore from '../store/useStore';
import { Brain, Map, Code, Mic, Briefcase, Rocket, TrendingUp, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, setUser } = useStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile/dashboard').then(r => {
      setStats(r.data);
      setUser(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    { icon: Brain, label: 'Domain Assessment', desc: stats?.assessmentCompleted ? `Domain: ${stats.careerDomain}` : 'Discover your career path', to: '/assessment', color: 'from-indigo-500 to-violet-600', done: stats?.assessmentCompleted },
    { icon: Map, label: '4-Year Roadmap', desc: `${stats?.roadmapProgress?.percentage || 0}% complete`, to: '/roadmap', color: 'from-violet-500 to-purple-600', done: (stats?.roadmapProgress?.percentage || 0) > 0 },
    { icon: Code, label: 'Learning Tasks', desc: 'Practice with AI validation', to: '/tasks', color: 'from-cyan-500 to-blue-600', done: false },
    { icon: Mic, label: 'AI Interview', desc: stats?.interviewStats?.total > 0 ? `${stats.interviewStats.total} sessions done` : 'Practice with AI interviewer', to: '/interview', color: 'from-pink-500 to-rose-600', done: stats?.interviewStats?.total > 0 },
    { icon: Briefcase, label: 'Projects', desc: `${stats?.projectStats?.validated || 0} validated`, to: '/projects', color: 'from-amber-500 to-orange-600', done: stats?.projectStats?.validated > 0 },
    { icon: Rocket, label: 'Portfolio', desc: 'Showcase your work', to: '/portfolio', color: 'from-emerald-500 to-teal-600', done: false },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white">
            {stats?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {stats?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-gray-400">
              {stats?.careerDomain ? `Career Path: ${stats.careerDomain}` : 'Start your assessment to discover your career path'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Roadmap Progress', value: `${stats?.roadmapProgress?.percentage || 0}%`, icon: TrendingUp, color: '#6366f1' },
          { label: 'Projects Validated', value: stats?.projectStats?.validated || 0, icon: CheckCircle, color: '#10b981' },
          { label: 'Interviews Done', value: stats?.interviewStats?.total || 0, icon: Mic, color: '#f59e0b' },
          { label: 'Best Score', value: stats?.interviewStats?.bestScore ? `${stats.interviewStats.bestScore}%` : 'N/A', icon: Rocket, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{label}</span>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Roadmap progress bar */}
      {stats?.roadmapProgress?.total > 0 && (
        <div className="glass-card p-5 mb-8">
          <div className="flex justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Overall Roadmap Progress</span>
            <span className="text-sm text-indigo-400">{stats.roadmapProgress.completed} / {stats.roadmapProgress.total} topics</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.roadmapProgress.percentage}%` }} />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {quickActions.map(({ icon: Icon, label, desc, to, color, done }) => (
          <button key={to} onClick={() => navigate(to)}
            className="glass-card p-5 text-left hover:border-indigo-500/40 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
              </div>
              {done && <span className="badge badge-green">Done</span>}
            </div>
            <div className="font-semibold text-white text-sm mb-1">{label}</div>
            <div className="text-gray-400 text-xs">{desc}</div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      {stats?.recentActivity?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {stats.recentActivity.map((act, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${act.type === 'project' ? 'bg-amber-500/20' : 'bg-pink-500/20'}`}>
                  {act.type === 'project' ? '💼' : '🎤'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{act.title}</div>
                  <div className="text-xs text-gray-500">{new Date(act.date).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${act.status === 'validated' ? 'badge-green' : act.status === 'pending' ? 'badge-yellow' : 'badge-indigo'}`}>
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
