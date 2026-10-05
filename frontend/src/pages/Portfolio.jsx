import { useEffect, useState } from 'react';
import api from '../lib/api';
import useStore from '../store/useStore';
import { Star, CheckCircle, Briefcase, Mic, Award, ExternalLink } from 'lucide-react';

export default function Portfolio() {
  const { user } = useStore();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/profile/portfolio').then(r => setPortfolio(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="glass-card glow-indigo p-8 mb-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-4xl font-bold text-white">
          {portfolio?.name?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">{portfolio?.name}</h1>
        <p className="text-gray-400 mb-3">{portfolio?.email}</p>
        {portfolio?.careerDomain && (
          <div className="badge badge-indigo text-sm mb-4">{portfolio.careerDomain} Developer</div>
        )}
        <div className="flex justify-center gap-3">
          {portfolio?.linkedin && (
            <a href={portfolio.linkedin} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
              <ExternalLink size={16} /> LinkedIn
            </a>
          )}
          {portfolio?.github && (
            <a href={portfolio.github} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
              <ExternalLink size={16} /> GitHub
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Projects', value: portfolio?.totalProjects || 0, icon: Briefcase, color: '#f59e0b' },
          { label: 'Validated', value: portfolio?.validatedProjects || 0, icon: CheckCircle, color: '#10b981' },
          { label: 'Interviews', value: portfolio?.interviewResults?.length || 0, icon: Mic, color: '#6366f1' },
          { label: 'Best Score', value: portfolio?.bestInterviewScore ? `${portfolio.bestInterviewScore}%` : 'N/A', icon: Star, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <Icon size={20} style={{ color }} className="mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      {portfolio?.skills?.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Award size={18} /> Skills</h2>
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.map(s => <span key={s} className="badge badge-indigo text-sm">{s}</span>)}
          </div>
        </div>
      )}

      {/* Projects */}
      {portfolio?.projects?.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Briefcase size={18} /> Validated Projects</h2>
          <div className="space-y-4">
            {portfolio.projects.map((p, i) => (
              <div key={i} className="portfolio-card">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-white">{p.title}</span>
                  <div className="flex gap-2 items-center">
                    <span className="badge badge-cyan">{p.language}</span>
                    {p.validationScore > 0 && <span className="text-xs text-amber-400 flex items-center gap-1"><Star size={12} />{p.validationScore}</span>}
                  </div>
                </div>
                {p.description && <p className="text-sm text-gray-400 mb-2">{p.description}</p>}
                {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">View Repository →</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Results */}
      {portfolio?.interviewResults?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Mic size={18} /> Interview Results</h2>
          <div className="space-y-3">
            {portfolio.interviewResults.map((r, i) => (
              <div key={i} className="portfolio-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                  {r.score}%
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{r.domain} Interview</div>
                  <div className="text-xs text-gray-400">{r.level} • {new Date(r.completedAt).toLocaleDateString()}</div>
                  {r.strongAreas?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {r.strongAreas.slice(0, 3).map(a => <span key={a} className="badge badge-green text-xs">{a}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
