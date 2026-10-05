import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { Mic, MicOff, Send, Volume2, RotateCcw, ChevronRight, Star } from 'lucide-react';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'French', 'Spanish', 'German', 'Japanese', 'Mandarin', 'Arabic'];

export default function Interview() {
  const { user } = useStore();
  const [phase, setPhase] = useState('setup'); // setup | active | result
  const [language, setLanguage] = useState('English');
  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionNum, setQuestionNum] = useState(1);
  const [finalResult, setFinalResult] = useState(null);
  const [lastEval, setLastEval] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Web Speech API
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'Hindi' ? 'hi-IN' : language === 'Tamil' ? 'ta-IN' : language === 'Telugu' ? 'te-IN' : language === 'French' ? 'fr-FR' : language === 'Spanish' ? 'es-ES' : language === 'German' ? 'de-DE' : language === 'Japanese' ? 'ja-JP' : language === 'Mandarin' ? 'zh-CN' : language === 'Arabic' ? 'ar-SA' : 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      setCurrentAnswer(e.results[0][0].transcript);
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/interview/start', { language });
      setMessages([{ role: 'ai', content: res.data.question, questionNum: 1 }]);
      setQuestionNum(1);
      setPhase('active');
      speak(res.data.question);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (finish = false) => {
    if (!currentAnswer.trim()) return toast.error('Please provide an answer');
    const answer = currentAnswer;
    setCurrentAnswer('');
    setLoading(true);

    setMessages(m => [...m, { role: 'user', content: answer }]);

    try {
      const res = await api.post('/interview/answer', { answer, finish });
      setLastEval(res.data.evaluation);

      if (res.data.completed) {
        setFinalResult(res.data.result);
        setMessages(m => [...m, { role: 'ai', content: '✅ Interview completed! See your results below.', isEnd: true }]);
        setPhase('result');
      } else {
        const evalText = res.data.evaluation?.feedback
          ? `Feedback: ${res.data.evaluation.feedback.substring(0, 100)}...`
          : 'Got it!';
        setMessages(m => [
          ...m,
          { role: 'ai', content: evalText, isEval: true, score: res.data.evaluation?.score },
          { role: 'ai', content: res.data.nextQuestion, questionNum: res.data.questionNumber }
        ]);
        setQuestionNum(res.data.questionNumber);
        speak(res.data.nextQuestion);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  // ── RESULT VIEW ──────────────────────────────────────────────────────────
  if (phase === 'result' && finalResult) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎤</div>
          <h1 className="text-2xl font-bold text-white">Interview Complete!</h1>
          <p className="text-gray-400">AI evaluation of your {user?.careerDomain} interview</p>
        </div>

        <div className="glass-card glow-indigo p-8 text-center mb-6">
          <div className="text-5xl font-bold gradient-text mb-1">{finalResult.overallScore}%</div>
          <div className="badge badge-indigo text-sm mb-3">{finalResult.level}</div>
          <p className="text-gray-300 text-sm leading-relaxed">{finalResult.overallFeedback}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {finalResult.strongAreas?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-green-400 mb-3">✅ Strong Areas</h3>
              {finalResult.strongAreas.map(a => <div key={a} className="text-sm text-gray-300 mb-1">• {a}</div>)}
            </div>
          )}
          {finalResult.improvementAreas?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-amber-400 mb-3">📈 Improve</h3>
              {finalResult.improvementAreas.map(a => <div key={a} className="text-sm text-gray-300 mb-1">• {a}</div>)}
            </div>
          )}
        </div>

        {finalResult.nextSteps?.length > 0 && (
          <div className="glass-card p-5 mb-6">
            <h3 className="font-semibold text-white mb-3">🗺️ Next Steps</h3>
            {finalResult.nextSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className="text-indigo-400 font-bold text-sm">{i + 1}.</span>
                <span className="text-sm text-gray-300">{s}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { setPhase('setup'); setMessages([]); setFinalResult(null); }} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <RotateCcw size={16} /> Start New Interview
        </button>
      </div>
    );
  }

  // ── ACTIVE INTERVIEW ─────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <div className="flex flex-col h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`interview-avatar ${speaking ? 'speaking' : ''}`}>🤖</div>
            <div>
              <div className="font-semibold text-white">ProPath AI Interviewer</div>
              <div className="text-xs text-gray-400">{user?.careerDomain} Interview • {language}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-indigo">Q {questionNum}/10</span>
            <button onClick={() => submitAnswer(true)} className="btn-secondary text-sm">End Interview</button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                  <div>
                    {msg.questionNum && <div className="text-xs text-gray-500 mb-1 ml-1">Question {msg.questionNum}</div>}
                    {msg.isEval && msg.score && (
                      <div className="flex items-center gap-1 mb-1 ml-1">
                        <Star size={12} className="text-amber-400" />
                        <span className="text-xs text-amber-400">Score: {msg.score}/10</span>
                      </div>
                    )}
                    <div className={`chat-bubble-ai text-sm ${msg.isEval ? 'border-amber-500/30' : ''}`}>
                      {msg.content}
                    </div>
                    {msg.questionNum && (
                      <button onClick={() => speak(msg.content)} className="text-xs text-gray-600 hover:text-indigo-400 mt-1 ml-1 flex items-center gap-1">
                        <Volume2 size={12} /> Listen
                      </button>
                    )}
                  </div>
                </div>
              )}
              {msg.role === 'user' && (
                <div className="chat-bubble-user text-sm">{msg.content}</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm">🤖</div>
              <div className="chat-bubble-ai">
                <div className="flex gap-1"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="glass-card p-4">
          <div className="flex gap-3 items-end">
            <textarea
              className="input-field flex-1 resize-none"
              rows={2}
              placeholder="Type your answer or use the microphone..."
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitAnswer())}
              disabled={loading}
            />
            <div className="flex flex-col gap-2">
              <button
                className={`mic-button ${listening ? 'listening' : ''}`}
                onClick={listening ? stopListening : startListening}
                title={listening ? 'Stop recording' : 'Start recording'}
              >
                {listening ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
              </button>
              <button onClick={() => submitAnswer()} disabled={loading || !currentAnswer.trim()} className="btn-primary px-4 py-2.5">
                <Send size={18} />
              </button>
            </div>
          </div>
          {listening && <div className="text-xs text-red-400 mt-2 animate-pulse">🔴 Listening... speak clearly</div>}
        </div>
      </div>
    );
  }

  // ── SETUP VIEW ───────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="interview-avatar mx-auto mb-4" style={{ width: 80, height: 80, fontSize: 32 }}>🤖</div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Interview</h1>
        <p className="text-gray-400">Adaptive interview based on your {user?.careerDomain || 'career'} domain and roadmap progress</p>
      </div>

      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">Interview Language</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${language === lang ? 'bg-indigo-600 text-white' : 'bg-indigo-900/20 text-gray-300 hover:bg-indigo-900/40'}`}>
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4">How it works:</h3>
        <div className="space-y-3">
          {[
            { icon: '🤖', text: 'AI interviewer asks adaptive questions based on your domain & roadmap' },
            { icon: '🎤', text: 'Answer by typing or using voice (mic button)' },
            { icon: '⚡', text: 'AI evaluates each answer instantly and adapts the next question' },
            { icon: '📊', text: 'Get detailed feedback with score, strengths, and improvement areas' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-xl">{icon}</span>
              <p className="text-gray-300 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={startInterview} disabled={loading || !user?.careerDomain} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
        {loading ? <><span className="spinner" /> Starting...</> : <><Mic size={20} /> Start AI Interview</>}
      </button>
      {!user?.careerDomain && (
        <p className="text-center text-amber-400 text-sm mt-3">⚠️ Complete the domain assessment first</p>
      )}
    </div>
  );
}
