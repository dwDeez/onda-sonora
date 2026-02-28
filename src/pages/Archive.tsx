import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface Issue {
  id: number;
  type: string;
  description: string;
}

interface Session {
  id: number;
  title: string;
  context: string;
  date: string;
  score: number;
  issues: Issue[];
}

interface Vocab {
  id: number;
  word: string;
  form: string;
  meaning: string;
  example: string;
}

export default function Archive() {
  const { currentUser } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [sessionsRes, vocabRes] = await Promise.all([
        fetch(`/api/sessions?user_id=${currentUser.id}`),
        fetch(`/api/vocab?user_id=${currentUser.id}`)
      ]);
      const sessionsData = await sessionsRes.json();
      const vocabData = await vocabRes.json();
      setSessions(sessionsData);
      setVocab(vocabData);
    } catch (err) {
      console.error('Failed to fetch archive data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const deleteSession = async (id: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'ALL' || session.context.toUpperCase() === activeFilter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

  const openSessionDetails = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      <header className="flex flex-shrink-0 items-center justify-between px-8 py-6 border-b border-[#1f2b25] bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-white tracking-tighter">ARCHIVE_LOG</h2>
          <div className="flex items-center gap-2 text-muted text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>SESSION_HISTORY // TOTAL_ENTRIES: {sessions.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted material-symbols-outlined text-[18px]">search</span>
            <input
              className="bg-surface border border-[#333] text-white text-sm rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted font-mono transition-all"
              placeholder="SEARCH_LOGS..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-background-dark text-sm font-bold rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>EXPORT_DATA</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded text-xs font-mono border transition-all ${activeFilter === 'ALL' ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted border-transparent hover:text-white'}`}>ALL</button>
              <button
                onClick={() => setActiveFilter('BUSINESS')}
                className={`px-3 py-1 rounded text-xs font-mono border transition-all ${activeFilter === 'BUSINESS' ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted border-transparent hover:text-white'}`}>BUSINESS</button>
              <button
                onClick={() => setActiveFilter('ACADEMIC')}
                className={`px-3 py-1 rounded text-xs font-mono border transition-all ${activeFilter === 'ACADEMIC' ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted border-transparent hover:text-white'}`}>ACADEMIC</button>
              <button
                onClick={() => setActiveFilter('TECHNICAL')}
                className={`px-3 py-1 rounded text-xs font-mono border transition-all ${activeFilter === 'TECHNICAL' ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted border-transparent hover:text-white'}`}>TECHNICAL</button>
              <button
                onClick={() => setActiveFilter('CASUAL')}
                className={`px-3 py-1 rounded text-xs font-mono border transition-all ${activeFilter === 'CASUAL' ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted border-transparent hover:text-white'}`}>CASUAL</button>
            </div>
            <div className="flex items-center gap-2 text-muted text-xs font-mono cursor-pointer hover:text-white">
              <span>SORT_BY: DATE (DESC)</span>
              <span className="material-symbols-outlined text-[16px]">sort</span>
            </div>
          </div>

          {isLoading ? (
            <div className="w-full text-center py-12">
              <span className="text-muted text-sm font-mono tracking-widest animate-pulse">LOADING_HISTORICAL_DATA...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => openSessionDetails(session)}
                  className="group relative bg-surface hover:bg-surface-highlight border border-[#333] hover:border-primary transition-all duration-300 rounded-xl p-6 cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-neon"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-primary text-xs font-mono font-bold tracking-wider">{session.date}</span>
                      <h3 className="text-white text-xl font-bold tracking-tight">{session.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full border border-primary/30 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <span className="text-primary font-bold text-sm">{session.score}%</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                        className="p-2 text-muted hover:text-accent transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="h-px w-full bg-[#333] mb-4 group-hover:bg-primary/20 transition-colors"></div>
                  <div className="flex flex-col gap-3">
                    <p className="text-muted text-xs font-mono uppercase tracking-wider mb-1">Detected Issues</p>
                    {session.issues.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No issues detected.</p>
                    ) : (
                      session.issues.map((issue) => (
                        <div key={issue.id} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-accent mt-1 material-symbols-outlined text-[14px]">error</span>
                          <span>{issue.type}: <span className="text-gray-500">{issue.description}</span></span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-primary text-xs font-bold uppercase tracking-widest">View Analysis</span>
                    <span className="material-symbols-outlined text-primary text-[20px]">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="hidden xl:flex flex-col w-[320px] bg-[#0c120f] border-l border-[#1f2b25] shrink-0 p-6 z-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[20px]">book_2</span>
            <h3 className="text-white font-bold tracking-tight text-lg">VOCAB_BANK</h3>
          </div>
          <div className="relative mb-4">
            <input className="w-full bg-[#111815] border border-[#333] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-primary placeholder-muted font-mono" placeholder="FILTER_WORDS..." type="text" />
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {vocab.map((word) => (
              <div key={word.id} className="group relative p-4 bg-[#111815] border border-[#2a3830] rounded-lg hover:border-primary transition-all cursor-help">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-lg tracking-tight">{word.word}</span>
                  <span className="text-xs text-muted font-mono bg-[#1f2b25] px-2 py-0.5 rounded">{word.form}</span>
                </div>
                <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mt-3 transition-all duration-300">
                  <p className="text-gray-400 text-sm italic mb-2">"{word.meaning}"</p>
                  <p className="text-primary text-xs font-mono">Example: "{word.example}"</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-3 bg-[#111815] border border-primary/20 text-primary hover:bg-primary hover:text-[#050505] text-xs font-bold rounded-lg transition-all font-mono uppercase tracking-widest">
            Review Flashcards
          </button>
        </aside>
      </div>

      {/* Analysis Modal */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm">
          <div className="bg-surface border border-[#333] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-[#1f2b25] flex justify-between items-center bg-[#111815]">
              <div>
                <span className="text-primary text-xs font-mono font-bold tracking-wider">{selectedSession.date}</span>
                <h3 className="text-white text-2xl font-bold tracking-tight">{selectedSession.title}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background-dark/20 text-gray-300">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 rounded-xl bg-[#111815] border border-[#1f2b25]">
                  <p className="text-muted text-xs font-mono uppercase tracking-widest mb-1">Session Context</p>
                  <p className="text-primary font-bold">{selectedSession.context}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#111815] border border-[#1f2b25]">
                  <p className="text-muted text-xs font-mono uppercase tracking-widest mb-1">Overall Score</p>
                  <p className="text-primary font-bold text-xl">{selectedSession.score}%</p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent text-[20px]">assignment</span>
                  LINGUISTIC_ANALYSIS
                </h4>
                <div className="space-y-4">
                  {selectedSession.issues.length === 0 ? (
                    <p className="text-gray-500 italic bg-[#111815] p-4 rounded-lg border border-[#1f2b25]">Perfect performance. No major issues detected.</p>
                  ) : (
                    selectedSession.issues.map((issue) => (
                      <div key={issue.id} className="p-4 rounded-lg bg-[#111815] border border-[#1f2b25] flex gap-4">
                        <span className="text-accent material-symbols-outlined mt-0.5">error</span>
                        <div>
                          <p className="text-white font-bold text-sm uppercase tracking-wider mb-1">{issue.type}</p>
                          <p className="text-gray-400 text-sm">{issue.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                  IMPROVEMENT_SUGGESTIONS
                </h4>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Based on this session, focus on expanding your vocabulary related to {selectedSession.context.toLowerCase()} scenarios.
                    Your fluency is improving, but pay attention to the specific patterns identified above.
                  </p>
                </div>
              </div>
            </div>

            <footer className="p-6 border-t border-[#1f2b25] bg-[#111815] flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                CLOSE_ANALYSIS
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
