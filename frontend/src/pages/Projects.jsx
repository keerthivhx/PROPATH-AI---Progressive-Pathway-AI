import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, XCircle, Clock, Star, Code } from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML/CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validation, setValidation] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', repoUrl: '', language: 'javascript', code: '' });

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!form.title || !form.code) return toast.error('Title and code are required');
    setSubmitting(true);
    setValidation(null);
    try {
      const res = await api.post('/projects/submit', form);
      setProjects(p => [res.data.submission, ...p]);
      setValidation(res.data.validation);
      toast.success('Project submitted and validated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    if (status === 'validated') return <span className="badge badge-green">✅ Validated</span>;
    if (status === 'rejected') return <span className="badge badge-red">❌ Rejected</span>;
    return <span className="badge badge-yellow">⏳ Pending</span>;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm">Submit projects for AI validation and analysis</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setValidation(null); }} className="btn-primary flex items-center gap-2">
          <Upload size={16} /> {showForm ? 'Cancel' : 'Submit Project'}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h3 className="font-semibold text-white mb-5">Submit Project</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project Title *</label>
              <input className="input-field" placeholder="My Awesome Project"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Repository URL</label>
              <input className="input-field" placeholder="https://github.com/..."
                value={form.repoUrl} onChange={e => setForm(f => ({ ...f, repoUrl: e.target.value }))} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Describe your project..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Language tabs */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button key={l.value} onClick={() => setForm(f => ({ ...f, language: l.value }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${form.language === l.value ? 'bg-indigo-600 text-white' : 'bg-indigo-900/30 text-gray-300 hover:bg-indigo-900/50'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Code editor */}
          <div className="monaco-container mb-4" style={{ height: 300 }}>
            <Editor
              height="300px"
              language={form.language}
              value={form.code}
              onChange={val => setForm(f => ({ ...f, code: val || '' }))}
              theme="vs-dark"
              options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 10 }, automaticLayout: true }}
            />
          </div>

          <button onClick={submit} disabled={submitting} className="btn-primary flex items-center gap-2">
            {submitting ? <><span className="spinner" /> Validating with AI...</> : <><Code size={16} /> Submit & Validate</>}
          </button>

          {/* Validation result */}
          {validation && (
            <div className="mt-5 p-5 rounded-xl" style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex items-center gap-3 mb-4">
                {validation.status === 'validated'
                  ? <CheckCircle size={20} className="text-green-400" />
                  : <XCircle size={20} className="text-red-400" />}
                <span className="font-semibold text-white">AI Validation Result</span>
                <span className="badge badge-indigo ml-auto">Score: {validation.score}/100</span>
              </div>
              <p className="text-sm text-gray-300 mb-3">{validation.feedback}</p>
              <div className="grid grid-cols-2 gap-4">
                {validation.strengths?.length > 0 && (
                  <div>
                    <div className="text-xs text-green-400 mb-2">✅ Strengths</div>
                    {validation.strengths.map(s => <div key={s} className="text-xs text-gray-300">• {s}</div>)}
                  </div>
                )}
                {validation.issues?.length > 0 && (
                  <div>
                    <div className="text-xs text-red-400 mb-2">⚠️ Issues</div>
                    {validation.issues.map(s => <div key={s} className="text-xs text-gray-300">• {s}</div>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="text-center py-12"><div className="spinner mx-auto" style={{ width: 32, height: 32 }} /></div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">💼</div>
          <h3 className="text-white font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-400 text-sm">Submit your first project to get AI validation</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p, i) => (
            <div key={i} className="glass-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg flex-shrink-0">💼</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-white">{p.title}</span>
                  {statusBadge(p.status)}
                  <span className="badge badge-cyan ml-auto">{p.language}</span>
                </div>
                {p.description && <p className="text-sm text-gray-400 mb-2">{p.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {p.validationScore > 0 && (
                    <span className="flex items-center gap-1"><Star size={12} /> Score: {p.validationScore}/100</span>
                  )}
                  {p.repoUrl && (
                    <a href={p.repoUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">View Repo</a>
                  )}
                  <span><Clock size={12} className="inline mr-1" />{new Date(p.submittedAt).toLocaleDateString()}</span>
                </div>
                {p.validationResult && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{p.validationResult}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
