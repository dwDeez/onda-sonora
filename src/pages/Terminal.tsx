import { useState, useRef, useEffect } from 'react';
import { ollama } from '../services/ollamaApi';
import { useLocation } from 'react-router-dom';
import { promptService } from '../services/promptService';

export default function Terminal() {
  const location = useLocation();
  const context = location.state?.context || 'CASUAL';
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, thinking?: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Use Ollama exclusively
      const ollamaMessages = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));
      ollamaMessages.push({ role: 'user', content: userMessage });

      const systemInstruction = promptService.getSystemInstruction(context);

      const responseText = await ollama.generateChatResponse(ollamaMessages, systemInstruction);

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      console.error('Error generating response:', error);
      const errorMsg = error.message || 'Connection to AI core failed.';
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      <header className="flex flex-shrink-0 items-center justify-between px-8 py-6 border-b border-[#1f2b25] bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-white tracking-tighter">THE_TERMINAL</h2>
          <div className="flex items-center gap-4 text-muted text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>AI_CORE // DEEP_THINKING_ENABLED</span>
            </div>
            <div className="flex items-center gap-2 border-l border-[#1f2b25] pl-4">
              <span className="w-1.5 h-1.5 rounded-full bg-muted"></span>
              <span>CONTEXT: {context}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted font-mono text-sm tracking-widest">
            AWAITING_INPUT...
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl p-4 ${msg.role === 'user' ? 'bg-primary/10 border border-primary/30 text-white' : 'bg-surface border border-[#333] text-gray-300'}`}>
              <div className="flex items-center gap-2 mb-2 opacity-50">
                <span className="material-symbols-outlined text-[14px]">
                  {msg.role === 'user' ? 'person' : 'smart_toy'}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  {msg.role === 'user' ? 'USER_INPUT' : 'SYSTEM_RESPONSE'}
                </span>
              </div>
              <div className="whitespace-pre-wrap font-light leading-relaxed">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl p-4 bg-surface border border-primary/30 text-primary">
              <div className="flex items-center gap-2 mb-2 opacity-50">
                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                <span className="text-[10px] font-mono uppercase tracking-widest">SYSTEM_THINKING</span>
              </div>
              <div className="flex gap-1 items-center h-4">
                <div className="w-1 h-2 bg-primary/40 rounded-full animate-pulse"></div>
                <div className="w-1 h-3 bg-primary/60 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-4 bg-primary rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-background-dark border-t border-[#1f2b25]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <span className="absolute left-4 text-primary material-symbols-outlined">chevron_right</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="ENTER_QUERY..."
            className="w-full bg-surface border border-[#333] text-white rounded-lg pl-12 pr-12 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted font-mono transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-4 text-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
