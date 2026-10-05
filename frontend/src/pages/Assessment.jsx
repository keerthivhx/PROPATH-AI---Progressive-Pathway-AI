import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { Brain, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const QUICK_ANSWERS = ['Yes', 'No', 'Sometimes', 'I love it', 'Not really', 'Definitely'];

export default function Assessment() {
  const { user, refreshUser } = useStore();
  const navigate = useNavigate();

  const [phase, setPhase]         = useState('intro');   // intro | questions | result
  const [question, setQuestion]   = useState('');
  const [qNumber, setQNumber]     = useState(1);
  const [answer, setAnswer]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [history, setHistory]     = useState([]);
  const [ollamaError, setOllamaError] = useState(false);

  useEffect(() => {
    if (user?.assessmentCompleted) setPhase('result');
  }, [user]);

  const startAssessment = async () => {
    setLoading(true);
    setOllamaError(false);
    try {
      const res = await api.get('/assessment/question');
      if (res.data.completed) {
        await refreshUser();
        setPhase('result');
        return;
      }
      setQuestion(res.data.question);
      setQNumber(res.data.questionNumber);
      setPhase('questions');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('ECONNREFUSED') || msg.includes('11434')) {
        setOllamaError(true);
      } else {
        toast.error(msg || 'Failed to start assessment');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (ans) => {
    const finalAns = ans || answer.trim();
    if (!finalAns) return toast.error('Please provide an answer');
    setLoading(true);
    setOllamaError(false);
    const currentQ = question;
    try {
      const res = await api.post('/assessment/answer', { question: currentQ, answer: finalAns });
      setHistory(h => [...h, { question: currentQ, answer: finalAns }]);
      setAnswer('');

      if (res.data.completed) {
        setResult(res.data.result);
        await refreshUser();
        setPhase('result');
        toast.success(`Domain identified: ${res.data.result.domain} 🎯`);
      } else {
        setQuestion(res.data.nextQuestion);
        setQNumber(res.data.questionNumber);
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('ECONNREFUSED') || msg.includes('11434')) {
        setOllamaError(true);
      } else {
        toast.error(msg || 'Failed to submit answer');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAssessment = async () => {
    if (!confirm('Reset assessment? All progress will be lost.')) return;
    try {
      await api.delete('/assessment/reset');
      await refreshUser();
      setPhase('intro');
      setHistory([]);
      setResult(null);
      setQuestion('');
      setAnswer('');
    } catch {
      toast.error('Failed to reset');
    }
  };

  // ── Ollama Error Banner ───────────────────────────────────────────────────
  const OllamaErrorBanner = () => (
    <div className="glass-card p-6 mb-6 border-red-500/30" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-red-300 mb-1">Ollama is not running</div>
          <p className="text-sm text-gray-400 mb-3">
            Qwen AI needs Ollama to be running on your PC. Open a new terminal and run:
          </p>
          <div className="bg-black/50 rounded-lg px-4 py-2 font-mono text-sm text-green-400 mb-3">
            ollama serve
          </div>
          <p className="text-xs text-gray-500">Keep that terminal open, then click Retry below.</p>
          <button onClick={phase === 'intro' ? startAssessment : () => submitAnswer(answer)} className="btn-primary mt-3 text-sm">
            Retry →
          </button>
        </div>
      </div>
    </div>
  );

  // ── RESULT PHASE ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const displayResult = result || { domain: user?.careerDomain, keyStrengths: user?.skills || [], suggestedSkills: user?.skills || [] };
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="glass-card glow-indigo p-8 text-center mb-6">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Domain Identified!</h1>
          <div className="text-xl font-bold text-white mt-4 mb-1">{displayResult.domain}</div>
          {displayResult.confidence && (
            <div className="text-gray-400 text-sm mb-4">Confidence: {displayResult.confidence}%</div>
          )}
          {displayResult.reasoning && (
            <p className="text-gray-300 text-sm mb-6 max-w-xl mx-auto">{displayResult.reasoning}</p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/roadmap')} className="btn-primary">View Your Roadmap →</button>
            <button onClick={resetAssessment} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={14} /> Retake
            </button>
          </div>
        </div>

        {displayResult.keyStrengths?.length > 0 && (
          <div className="glass-card p-6 mb-4">
            <h3 className="font-semibold text-white mb-4">💪 Key Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {displayResult.keyStrengths.map(s => <span key={s} className="badge badge-green">{s}</span>)}
            </div>
          </div>
        )}
        {displayResult.suggestedSkills?.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">🛠️ Skills to Learn</h3>
            <div className="flex flex-wrap gap-2">
              {displayResult.suggestedSkills.map(s => <span key={s} className="badge badge-indigo">{s}</span>)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── QUESTIONS PHASE ───────────────────────────────────────────────────────
  if (phase === 'questions') {
    const pct = ((qNumber - 1) / 10) * 100;
    return (
      <div className="p-8 max-w-2xl mx-auto">
        {ollamaError && <OllamaErrorBanner />}

        {/* Progress */}
        <div className="glass-card p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300 font-medium">Assessment Progress</span>
            <span className="text-indigo-400">Question {qNumber} of 10</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="glass-card glow-indigo p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
              {qNumber}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Qwen AI — Adaptive Question</div>
          </div>

          {loading && !question ? (
            <div className="flex items-center gap-3 text-gray-400">
              <div className="spinner" />
              <span>Qwen is generating your question...</span>
            </div>
          ) : (
            <p className="text-lg text-white font-medium leading-relaxed mb-6">{question}</p>
          )}

          {/* Quick answer buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_ANSWERS.map(q => (
              <button
                key={q}
                onClick={() => !loading && submitAnswer(q)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Custom answer */}
          <div className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="Or type your own answer..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && submitAnswer()}
              disabled={loading}
            />
            <button
              onClick={() => submitAnswer()}
              disabled={loading || !answer.trim()}
              className="btn-primary px-5"
            >
              {loading ? <span className="spinner" /> : 'Submit'}
            </button>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Previous Answers</h3>
            <div className="space-y-2">
              {history.slice(-3).map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 flex-1 truncate">{h.question}</span>
                  <span className="text-indigo-300">{h.answer}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── INTRO PHASE ───────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Only show error after user clicked Start and it failed */}
      {ollamaError && <OllamaErrorBanner />}

      <div className="glass-card glow-indigo p-8 text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-4">🧠</div>
        <h1 className="text-2xl font-bold text-white mb-2">AI Domain Assessment</h1>
        <p className="text-gray-400 mb-8">
          Answer 10 adaptive questions. Qwen AI analyzes each response to tailor the next question and identify your ideal career domain — no hardcoded paths, 100% AI-driven.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          {[
            { icon: '❓', title: 'Adaptive Questions', desc: 'Each question is uniquely generated based on your previous answer' },
            { icon: '🤖', title: 'Qwen AI Analysis', desc: 'Real-time AI analysis — no hardcoded career paths' },
            { icon: '💬', title: 'Natural Answers', desc: 'Answer naturally — Yes/No or short explanations work' },
            { icon: '🎯', title: 'Precise Domain ID', desc: 'After 10 questions, Qwen identifies your ideal domain' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="glass-card p-4">
              <div className="text-xl mb-2">{icon}</div>
              <div className="font-semibold text-white text-sm mb-1">{title}</div>
              <div className="text-gray-500 text-xs">{desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={startAssessment}
          disabled={loading}
          className="btn-primary w-full py-4 text-base"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="spinner" /> Qwen is preparing your first question...</span>
            : 'Start AI Assessment →'}
        </button>
      </div>
    </div>
  );
}
