import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../contexts/UserContext';

export default function Airlock() {
  const { availableModels, selectedModel, setSelectedModel } = useUser();
  const navigate = useNavigate();
  const [context, setContext] = useState('CASUAL');

  const handleInitialize = () => {
    navigate('/void', { state: { context } });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center items-center bg-background-dark font-display overflow-hidden selection:bg-primary selection:text-background-dark">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]"></div>
      </div>

      <main className="relative z-10 w-full max-w-[420px] px-6 flex flex-col gap-12 animate-[fadeIn_0.8s_ease-out]">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 select-none">
            <span className="text-text-main font-bold text-5xl tracking-tighter">ONDA</span>
            <span className="text-outline font-bold text-5xl tracking-tighter">SONORA</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-primary text-xs tracking-[0.2em] font-mono">
            <span className="material-symbols-outlined text-[14px] animate-pulse">wifi_tethering</span>
            <span>SYSTEM READY</span>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="group relative">
            <label className="block text-text-muted text-xs font-mono tracking-widest mb-3 uppercase pl-1 group-focus-within:text-primary transition-colors duration-300">
              Neural Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableModels.map(model => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`py-2 px-1 rounded-lg border font-mono text-[9px] tracking-tight transition-all duration-300 ${selectedModel === model
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-transparent border-text-muted text-text-muted hover:border-primary/30'
                    }`}
                >
                  {model.replace(':latest', '').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="group relative">
            <label className="block text-text-muted text-xs font-mono tracking-widest mb-3 uppercase pl-1 group-focus-within:text-primary transition-colors duration-300" htmlFor="context">
              Session Context
            </label>
            <div className="relative">
              <select
                className="w-full bg-transparent border border-text-muted text-text-main text-lg font-display rounded-lg py-4 px-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-300 cursor-pointer appearance-none hover:border-text-main/50"
                id="context"
                name="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              >
                <option className="bg-surface text-text-main py-2" value="BUSINESS">BUSINESS NEGOTIATION</option>
                <option className="bg-surface text-text-main py-2" value="CASUAL">CASUAL CONVERSATION</option>
                <option className="bg-surface text-text-main py-2" value="ACADEMIC">ACADEMIC DEFENSE</option>
                <option className="bg-surface text-text-main py-2" value="TECHNICAL">TECHNICAL INTERVIEW</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className="group relative">
            <label className="block text-text-muted text-xs font-mono tracking-widest mb-3 uppercase pl-1 group-focus-within:text-primary transition-colors duration-300">
              Input Source
            </label>
            <div className="flex items-center justify-between border border-text-muted rounded-lg p-4 hover:border-text-main/50 transition-colors cursor-pointer group/mic">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-muted group-hover/mic:text-primary transition-colors">mic</span>
                <span className="text-text-main font-display text-sm">System Default Microphone</span>
              </div>
              <div className="flex gap-1 items-end h-4">
                <div className="w-1 h-2 bg-primary/40 rounded-full animate-pulse"></div>
                <div className="w-1 h-3 bg-primary/60 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-4 bg-primary rounded-full animate-pulse delay-150"></div>
                <div className="w-1 h-2 bg-primary/40 rounded-full animate-pulse delay-100"></div>
              </div>
            </div>
          </div>

          <button
            onClick={handleInitialize}
            className="group relative w-full overflow-hidden rounded-lg bg-transparent border border-primary py-4 transition-all duration-300 hover:bg-primary hover:shadow-[0_0_20px_rgba(0,255,148,0.4)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark mt-4"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <span className="text-primary font-bold tracking-widest text-sm group-hover:text-background-dark transition-colors font-mono">INITIALIZE LINK</span>
              <span className="material-symbols-outlined text-primary text-sm group-hover:text-background-dark transition-colors group-hover:translate-x-1 duration-300">arrow_forward</span>
            </div>
          </button>

          <div className="flex justify-between items-center text-text-muted text-[10px] font-mono tracking-wider pt-8 border-t border-surface/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-900 border border-emerald-500/30"></span>
              <span>SERVER: US-WEST-2</span>
            </div>
            <span>V.2.0.4</span>
          </div>
        </div>
      </main>

      <div className="fixed top-8 left-8 text-text-muted/30 font-mono text-xs hidden md:block">
        ID: 8X-9920<br />
        SECURE CONNECTION
      </div>
      <div className="fixed bottom-8 right-8 text-text-muted/30 font-mono text-xs hidden md:block text-right">
        LATENCY: 12MS<br />
        AUDIO ENGINE: STANDBY
      </div>
    </div>
  );
}
