import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, PaperAirplaneIcon, MicrophoneIcon, StopIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import mockApi from '../services/mockApi';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'Which rooms are free right now?',
  'How do I book a lab?',
  'Show campus stats',
  'What are peak hours?',
  'How to report a complaint?',
];

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 mt-1">
          <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] sm:max-w-[80%]`}>
        <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
          isUser ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-dark-700 text-slate-200 rounded-tl-sm border border-dark-500'
        }`}>
          {msg.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1' : ''}>
              {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part
              )}
            </p>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your IntelliCampus AI assistant.\n\nI can help you find available rooms, guide bookings, track complaints, and answer campus queries. What do you need today?`,
    timestamp: new Date(),
    suggestions: SUGGESTIONS.slice(0, 3),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [rooms, setRooms] = useState([]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    mockApi.rooms.list().then(res => setRooms(res.rooms));
    // Voice setup
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = e => { setInput(e.results[0][0].transcript); setIsListening(false); };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await mockApi.ai.chat(msg, rooms);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply, timestamp: new Date(), suggestions: res.suggestions }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble right now. Please try again.", timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) { alert('Voice not supported in this browser'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: `Chat cleared! How can I help you, ${user?.name?.split(' ')[0]}?`,
    timestamp: new Date(),
    suggestions: SUGGESTIONS.slice(0, 3),
  }]);

  const lastMsg = messages[messages.length - 1];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm sm:text-base">AI Campus Assistant</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">Online · IntelliCampus AI</span>
            </div>
          </div>
        </div>
        <button onClick={clearChat} className="p-2 hover:bg-dark-600 rounded-lg text-slate-400 hover:text-white transition-all" title="Clear chat">
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass-card p-3 sm:p-4 mb-3 sm:mb-4 min-h-0">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
              <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="bg-dark-700 border border-dark-500 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-400 rounded-full" />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggestion chips after AI reply */}
        {!loading && lastMsg?.role === 'assistant' && lastMsg?.suggestions && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 ml-9 sm:ml-11">
            {lastMsg.suggestions.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs rounded-xl hover:bg-brand-500/20 transition-all">
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Initial suggestions */}
      {messages.length <= 1 && (
        <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)}
              className="px-2.5 sm:px-3 py-1.5 bg-dark-700 border border-dark-500 text-slate-400 text-xs rounded-xl hover:text-white hover:border-brand-500/30 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 sm:gap-3 flex-shrink-0">
        <div className="flex-1 relative">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask anything about the campus..."
            rows={1}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-700 border border-dark-500 rounded-2xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none transition-colors"
            style={{ minHeight: '44px', maxHeight: '100px' }} />
        </div>
        <button onClick={toggleVoice}
          className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-dark-700 border border-dark-500 text-slate-400 hover:text-white'}`}>
          {isListening ? <StopIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicrophoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          className="p-2.5 sm:p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all disabled:opacity-40 flex-shrink-0">
          <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
