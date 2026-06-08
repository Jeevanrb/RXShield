import { useState, useEffect, useRef } from 'react';
import { useMedical } from '../context/MedicalContext';
import { Send, Bot, User, Trash2, HelpCircle, Activity } from 'lucide-react';
import axios from 'axios';

// Static counter to generate unique message IDs without calling impure Date.now() in state updates
let msgIdCounter = 100;

const AIAssistant = () => {
  const { prescription } = useMedical();
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('medChatLog');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        sender: 'ai',
        text: `Hello! I am your **Clinical Health Intelligence Concierge**. I can assist you with drug interactions, side effects, allergies, and contraindications.

How can I help you support patient safety today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Synchronize session log
  useEffect(() => {
    sessionStorage.setItem('medChatLog', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputText;
    if (query.trim().length === 0) return;

    // User Message
    const userMsg = {
      id: ++msgIdCounter,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const payload = {
        message: query,
        prescription: prescription.map(d => ({
          name: d.name,
          dosage: d.dosage
        }))
      };

      const res = await axios.post('/api/chat', payload);
      
      // AI Message structure (but we will animate the text!)
      const aiResponseId = ++msgIdCounter;
      const aiResponseText = res.data.text;
      
      const newAiMsg = {
        id: aiResponseId,
        sender: 'ai',
        text: '', // Start empty, will fill character by character
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newAiMsg]);
      setTypingMessageId(aiResponseId);

      // Typing animation simulator
      let i = 0;
      const speed = 8; // ms per char
      
      const typeNextChar = () => {
        if (i < aiResponseText.length) {
          setMessages(prev => 
            prev.map(m => m.id === aiResponseId ? { ...m, text: aiResponseText.substring(0, i + 1) } : m)
          );
          i++;
          setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          setTypingMessageId(null);
        }
      };
      
      typeNextChar();

    } catch (err) {
      console.error('Chat AI failed:', err);
      setMessages(prev => [...prev, {
        id: ++msgIdCounter,
        sender: 'ai',
        text: '⚠️ Connection timeout. Failed to reach the Clinical Reasoning Engine. Please ensure the Express server is active on Port 5000.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    const defaultMsg = [
      {
        id: 1,
        sender: 'ai',
        text: `Session cleared. Hello! I am your **Clinical Health Intelligence Advisor**. How can I support your prescription diagnostics today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
  };

  const suggestions = [
    'Is it safe to prescribe Warfarin and Aspirin?',
    'What are the side effects of Metformin?',
    'Can I take Amoxicillin if I have Penicillin Allergy?',
    'Tell me about Albuterol.'
  ];

  // Markdown parsing helper for chat text
  const formatMessage = (text) => {
    // Escape HTML tags to prevent cross site scripting
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Handle header sizes
    formatted = formatted.replace(/^### (.*$)/gim, '<h4 class="font-bold text-slate-800 text-sm mt-3 mb-1">$1</h4>');
    formatted = formatted.replace(/^#### (.*$)/gim, '<h5 class="font-bold text-slate-700 text-xs mt-2 mb-1">$1</h5>');
    
    // Bold tags
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    
    // Code ticks
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-emerald-700/5 px-1 py-0.5 rounded text-[10px] text-medical-cyan font-mono">$1</code>');
    
    // Lists
    formatted = formatted.replace(/^\* (.*$)/gim, '<li class="list-disc ml-5 pl-1 mb-1 font-light text-slate-650">$1</li>');
    
    // Alerts
    formatted = formatted.replace(/🔴 (.*$)/gim, '<span class="text-severity-critical font-bold">🔴 $1</span>');
    formatted = formatted.replace(/⚠️ (.*$)/gim, '<span class="text-severity-moderate font-bold">⚠️ $1</span>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-fade-in gap-4">
      
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl border border-slate-200/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-medical-cyan/15 p-2 rounded-xl text-medical-cyan border border-medical-cyan/20">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Clinical AI Concierge</h2>
            <p className="text-[10px] text-slate-600">Heuristic reasoning and pharmacological warnings</p>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="p-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all"
          title="Clear Chat Logs"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main chat window */}
      <div className="flex-1 min-h-0 border border-slate-200/50 rounded-2xl bg-white/40 p-4 overflow-y-auto flex flex-col gap-4 shadow-inner">
        {messages.map((m) => (
          <div 
            key={m.id}
            className={`flex gap-3 max-w-[85%] ${
              m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar widget */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              m.sender === 'user' 
                ? 'bg-medical-purple/10 border-medical-purple/20 text-medical-purple' 
                : 'bg-medical-cyan/10 border-medical-cyan/20 text-medical-cyan'
            }`}>
              {m.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-medical-purple/10 border-medical-purple/20 text-slate-800 rounded-tr-none'
                : 'bg-white border-slate-200/60 text-slate-700 rounded-tl-none shadow-sm'
            }`}>
              {formatMessage(m.text)}
              {typingMessageId === m.id && <span className="typing-cursor" />}
              <span className="text-[8px] text-slate-650 block text-right mt-2">{m.timestamp}</span>
            </div>
          </div>
        ))}
        {isTyping && typingMessageId === null && (
          <div className="flex gap-3 mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-medical-cyan/10 border border-medical-cyan/20 text-medical-cyan flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="flex gap-1.5 p-3 rounded-2xl border border-slate-200 bg-white shadow-sm items-center">
              <span className="w-1.5 h-1.5 bg-medical-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-medical-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-medical-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion list */}
      {messages.length === 1 && (
        <div className="flex flex-col gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-medical-cyan" /> Suggested Queries</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(s)}
                className="text-left text-xs bg-white border border-slate-200/60 hover:border-medical-cyan/30 hover:bg-medical-cyan/5 p-2.5 rounded-xl text-slate-700 transition-all font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="flex gap-2 shrink-0 relative">
        <input 
          type="text" 
          placeholder="Ask AI Concierge about drug safety or patient conditions..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-medical-cyan/40 shadow-sm"
        />
        
        {/* Dynamic Context Tag */}
        {prescription.length > 0 && (
          <div className="absolute right-16 top-4 hidden md:flex items-center gap-1.5 bg-medical-cyan/10 border border-medical-cyan/20 px-2.5 py-0.5 rounded-full text-[9px] font-semibold text-medical-cyan">
            <Activity className="w-3 h-3 animate-pulse" /> Rx Context Active
          </div>
        )}

        <button 
          onClick={() => handleSend()}
          disabled={inputText.trim().length === 0}
          className="p-4 rounded-2xl btn-gold disabled:opacity-40 disabled:hover:scale-100 text-white shadow-neon-cyan hover:shadow-neon-cyan/80 transform hover:-translate-y-0.5 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>

    </div>
  );
};

export default AIAssistant;
