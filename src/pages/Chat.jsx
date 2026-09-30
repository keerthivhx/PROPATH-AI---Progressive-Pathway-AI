import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { Send, Trash2, Bot } from 'lucide-react';

const SUGGESTED = [
  'What career paths are best for someone interested in AI?',
  'How do I prepare for a technical interview?',
  'What projects should I build to get a job?',
  'Explain REST APIs simply',
  'How long does it take to learn web development?',
];

export default function Chat() {
  const { user } = useStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0]}! 👋 I'm ProPath AI, your career guidance assistant. ${user?.careerDomain ? `I see you're on the ${user.careerDomain} path!` : ''} Ask me anything about careers, learning, projects, or tech!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const newMsg = { role: 'user', content: msg };
    setMessages(m => [...m, newMsg]);
    setLoading(true);

    try {
      const apiMessages = [...messages, newMsg]
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const res = await api.post('/chat', { messages: apiMessages });
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      toast.error('Failed to get response');
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Failed to get response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: `Chat cleared! What would you like to talk about?` }]);
  };

  return (
    <div className="flex flex-col h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl">🤖</div>
          <div>
            <div className="font-semibold text-white">ProPath AI Chat</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" /> Powered by Qwen via Ollama
            </div>
          </div>
        </div>
        <button onClick={clearChat} className="btn-secondary text-sm flex items-center gap-1.5">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Suggested prompts (only if only 1 message) */}
      {messages.length === 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs px-3 py-2 rounded-xl text-indigo-300 border border-indigo-800/50 bg-indigo-900/20 hover:bg-indigo-900/40 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0 self-end">
                🤖
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 self-end">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0 self-end">🤖</div>
            <div className="chat-bubble-ai">
              <div className="flex gap-1"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="glass-card p-3 flex gap-3 items-end">
        <textarea
          className="input-field flex-1 resize-none border-0 bg-transparent p-0 focus:ring-0"
          style={{ outline: 'none', boxShadow: 'none' }}
          rows={2}
          placeholder="Ask ProPath AI anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          disabled={loading}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="btn-primary p-3 rounded-xl">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
