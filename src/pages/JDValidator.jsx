import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';

export default function JDValidator() {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const validate = async () => {
    if (jd.trim().length < 50) return toast.error('Please paste a complete job description');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/jd/validate', { jobDescription: jd });
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const validityColor = (v) => {
    if (v === 'Valid') return 'text-green-400';
    if (v === 'Partially Valid') return 'text-amber-400';
    return 'text-red-400';
  };

  const validityIcon = (v) => {
    if (v === 'Valid') return <CheckCircle size={20} className="text-green-400" />;
    if (v === 'Partially Valid') return <AlertTriangle size={20} className="text-amber-400" />;
    return <XCircle size={20} className="text-red-400" />;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">JD Validator</h1>
        <p className="text-gray-400 text-sm">AI-powered job description analysis — extract, validate, and detect suspicious content</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <div className="glass-card p-5 mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <FileText size={16} /> Paste Job Description
            </label>
            <textarea
              className="input-field resize-none"
              rows={16}
              placeholder="Paste the full job description here...

Example:
Job Title: Senior Software Engineer
Company: Tech Corp
Requirements:
- 5+ years of experience
- Proficient in Python, React
..."
              value={jd}
              onChange={e => setJd(e.target.value)}
            />
            <div className="text-xs text-gray-600 mt-2">{jd.length} characters</div>
          </div>
          <button onClick={validate} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <><span className="spinner" /> Qwen is analyzing...</> : <><Search size={16} /> Validate JD</>}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="glass-card p-10 text-center">
              <FileText size={40} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">Paste a job description and click Validate to get AI analysis</p>
            </div>
          )}
          {loading && (
            <div className="glass-card p-10 text-center">
              <div className="spinner mx-auto mb-4" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p className="text-gray-400 text-sm">Qwen is analyzing the job description...</p>
            </div>
          )}
          {result && (
            <>
              {/* Overall verdict */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  {validityIcon(result.overallValidity)}
                  <div>
                    <div className="font-bold text-white">{result.jobTitle}</div>
                    <div className={`text-sm font-semibold ${validityColor(result.overallValidity)}`}>{result.overallValidity}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-bold gradient-text">{result.validationScore}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{result.feedback}</p>
              </div>

              {/* Extracted info */}
              <div className="glass-card p-5">
                <h3 className="font-semibold text-white mb-4">📋 Extracted Information</h3>
                <div className="space-y-3 text-sm">
                  {result.experienceRequired && (
                    <div className="flex gap-2"><span className="text-gray-500">Experience:</span><span className="text-gray-300">{result.experienceRequired}</span></div>
                  )}
                  {result.educationRequired && (
                    <div className="flex gap-2"><span className="text-gray-500">Education:</span><span className="text-gray-300">{result.educationRequired}</span></div>
                  )}
                  {result.salaryRange && (
                    <div className="flex gap-2"><span className="text-gray-500">Salary:</span><span className="text-gray-300">{result.salaryRange}</span></div>
                  )}
                  {result.requiredSkills?.length > 0 && (
                    <div>
                      <div className="text-gray-500 mb-2">Required Skills:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.requiredSkills.map(s => <span key={s} className="badge badge-indigo">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {result.technicalRequirements?.length > 0 && (
                    <div>
                      <div className="text-gray-500 mb-2">Technical:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.technicalRequirements.map(s => <span key={s} className="badge badge-cyan">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Issues & Suspicious */}
              {(result.issues?.length > 0 || result.suspicious?.length > 0) && (
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-white mb-4">⚠️ Issues Found</h3>
                  {result.issues?.map(i => <div key={i} className="text-sm text-amber-300 mb-1">• {i}</div>)}
                  {result.suspicious?.map(s => <div key={s} className="text-sm text-red-400 mb-1">🚩 {s}</div>)}
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-white mb-4">💡 Recommendations</h3>
                  {result.recommendations.map(r => <div key={r} className="text-sm text-gray-300 mb-1">• {r}</div>)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
