import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, ChevronDown, ChevronUp, RefreshCw, Lock } from 'lucide-react';

export default function Roadmap() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [roadmap, setRoadmap]       = useState(null);
  const [progress, setProgress]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedYear, setExpandedYear] = useState(0);

  useEffect(() => {
    if (!user?.careerDomain) { setLoading(false); return; }
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roadmap');
      setRoadmap(res.data.roadmap);
      const serverProgress = res.data.progress || {};
      if (res.data.roadmap?.years) {
        const full = { ...serverProgress };
        res.data.roadmap.years.forEach((yr, yi) => {
          yr.quarters?.forEach(q => {
            q.topics?.forEach(topic => {
              const key = `y${yi}t-${topic}`;
              if (!(key in full)) full[key] = false;
            });
          });
        });
        setProgress(full);
      } else {
        setProgress(serverProgress);
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('ECONNREFUSED') || msg.includes('11434')) {
        toast.error('Start Ollama first: run "ollama serve" in a terminal');
      } else if (msg.includes('assessment')) {
        // silently ignore - guard above handles it
      } else {
        toast.error(msg || 'Failed to load roadmap');
      }
    } finally {
      setLoading(false);
    }
  };


  const regenerate = async () => {
    if (!confirm('Regenerate roadmap? Progress will be reset.')) return;
    setGenerating(true);
    try {
      const res = await api.post('/roadmap/regenerate');
      setRoadmap(res.data.roadmap);
      setProgress({});
      toast.success('Roadmap regenerated!');
    } catch (err) {
      toast.error('Failed to regenerate');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTopic = async (key, current) => {
    const newVal = !current;
    setProgress(p => ({ ...p, [key]: newVal }));
    try {
      await api.patch('/roadmap/progress', { topicKey: key, completed: newVal });
    } catch {
      setProgress(p => ({ ...p, [key]: current })); // revert on error
    }
  };

  const totalTopics     = Object.keys(progress).length;
  const completedTopics = Object.values(progress).filter(Boolean).length;
  const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // ── Guard: no domain ────────────────────────────────────────────────────
  if (!user?.careerDomain) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="glass-card p-10">
          <Lock size={40} className="mx-auto mb-4 text-gray-500" />
          <h2 className="text-xl font-bold text-white mb-2">Complete Domain Assessment First</h2>
          <p className="text-gray-400 mb-6">Your personalized roadmap is generated after AI identifies your career domain.</p>
          <button onClick={() => navigate('/assessment')} className="btn-primary">Start Assessment →</button>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="spinner mb-4" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p className="text-gray-400">Generating your personalized roadmap...</p>
        <p className="text-gray-600 text-sm mt-1">Qwen AI is crafting your 4-year journey</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">No roadmap yet.</p>
        <button onClick={fetchRoadmap} className="btn-primary">Generate Roadmap</button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Your 4-Year Roadmap</h1>
          <p className="text-gray-400 text-sm">{roadmap.domain} • {roadmap.overview}</p>
        </div>
        <button onClick={regenerate} disabled={generating} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="glass-card p-5 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300 font-medium">Overall Progress</span>
          <span className="text-indigo-400">{completedTopics}/{totalTopics} topics • {pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Year cards */}
      <div className="space-y-4">
        {roadmap.years?.map((yr, yi) => {
          const isOpen = expandedYear === yi;
          const yearTopics = (yr.quarters || []).flatMap(q => (q.topics || []).map(t => `y${yi}t-${t}`));
          const yearDone   = yearTopics.filter(k => progress[k]).length;

          return (
            <div key={yi} className="glass-card overflow-hidden">
              {/* Year header — toggle */}
              <button
                className="w-full p-5 flex items-center justify-between text-left"
                onClick={() => setExpandedYear(isOpen ? -1 : yi)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
                    Y{yr.year}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{yr.title}</div>
                    <div className="text-xs text-gray-400">{yr.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{yearDone}/{yearTopics.length}</span>
                  {isOpen
                    ? <ChevronUp  size={18} className="text-gray-400" />
                    : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </button>

              {/* Year body */}
              {isOpen && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
                  {/* Skills & certifications */}
                  <div className="flex flex-wrap gap-2 mt-4 mb-5">
                    {yr.skills?.map(s        => <span key={s} className="badge badge-indigo">{s}</span>)}
                    {yr.certifications?.map(c => <span key={c} className="badge badge-green">🏆 {c}</span>)}
                  </div>

                  {/* Quarters */}
                  <div className="space-y-5">
                    {yr.quarters?.map((q, qi) => (
                      <div key={qi} className="roadmap-year ml-4">
                        <div className="font-medium text-gray-200 text-sm mb-3">
                          Q{q.quarter}: {q.title}
                        </div>

                        {/* Topics */}
                        {q.topics?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-2">📚 Topics</div>
                            <div className="space-y-1.5">
                              {q.topics.map(topic => {
                                const key  = `y${yi}t-${topic}`;
                                const done = !!progress[key];
                                return (
                                  <button key={topic}
                                    onClick={() => toggleTopic(key, done)}
                                    className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
                                  >
                                    {done
                                      ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                                      : <Circle      size={16} className="text-gray-600 flex-shrink-0" />}
                                    <span className={`text-sm ${done ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                      {topic}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Projects */}
                        {q.projects?.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-2">💼 Projects</div>
                            {q.projects.map(p => (
                              <div key={p} className="text-sm text-amber-300 flex items-center gap-2">→ {p}</div>
                            ))}
                          </div>
                        )}

                        {/* Resources */}
                        {q.resources?.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2">🔗 Resources</div>
                            {q.resources.map(r => (
                              <div key={r} className="text-sm text-cyan-400">• {r}</div>
                            ))}
                          </div>
                        )}

                        {/* Milestones */}
                        {q.milestones?.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">🎯 Milestones</div>
                            {q.milestones.map(m => (
                              <div key={m} className="text-sm text-violet-300">• {m}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
