import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import VocabModal from '../components/VocabModal';

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
  const [vocabFilter, setVocabFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

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

  const deleteVocabWord = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/vocab/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVocab(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete vocab word:', err);
    }
  };

  const handleSaveWord = async (wordData: { word: string; form: string; meaning: string; example: string }) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, ...wordData })
      });
      if (res.ok) {
        const newWord: Vocab = await res.json();
        setVocab(prev => [newWord, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save word:', err);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'ALL' || session.context.toUpperCase() === activeFilter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

  const filteredVocab = vocab.filter(v =>
    v.word.toLowerCase().includes(vocabFilter.toLowerCase()) ||
    v.meaning.toLowerCase().includes(vocabFilter.toLowerCase())
  );

  const openSessionDetails = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const openFlashcards = () => {
    if (filteredVocab.length === 0) return;
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setIsFlashcardOpen(true);
  };

  const nextFlashcard = () => {
    setFlashcardFlipped(false);
    setTimeout(() => setFlashcardIndex(i => (i + 1) % filteredVocab.length), 150);
  };

  const prevFlashcard = () => {
    setFlashcardFlipped(false);
    setTimeout(() => setFlashcardIndex(i => (i - 1 + filteredVocab.length) % filteredVocab.length), 150);
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
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              {['ALL', 'BUSINESS', 'ACADEMIC', 'TECHNICAL', 'CASUAL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-mono border transition-all ${activeFilter === f ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted border-transparent hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-muted text-xs font-mono">
              <span>SORT_BY: DATE (DESC)</span>
              <span className="material-symbols-outlined text-[16px]">sort</span>
            </div>
          </div>

          {isLoading ? (
            <div className="w-full text-center py-12">
              <span className="text-muted text-sm font-mono tracking-widest animate-pulse">LOADING_HISTORICAL_DATA...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-muted text-[48px] mb-4">inbox</span>
              <p className="text-muted font-mono text-sm uppercase tracking-widest">No sessions found</p>
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

        {/* Vocab Bank Sidebar */}
        <aside className="hidden xl:flex flex-col w-[320px] bg-[#0c120f] border-l border-[#1f2b25] shrink-0 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">book_2</span>
              <h3 className="text-white font-bold tracking-tight text-lg">VOCAB_BANK</h3>
            </div>
            <button
              onClick={() => setIsVocabModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono hover:bg-primary/20 transition-all"
              title="Add new word"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              ADD
            </button>
          </div>

          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted material-symbols-outlined text-[14px]">search</span>
            <input
              className="w-full bg-[#111815] border border-[#333] text-white text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-primary placeholder-muted font-mono transition-all"
              placeholder="FILTER_WORDS..."
              type="text"
              value={vocabFilter}
              onChange={(e) => setVocabFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {filteredVocab.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <span className="material-symbols-outlined text-muted text-[32px]">book_2</span>
                <p className="text-muted text-xs font-mono uppercase tracking-wider">
                  {vocabFilter ? 'No words match' : 'No words yet'}
                </p>
                {!vocabFilter && (
                  <button
                    onClick={() => setIsVocabModalOpen(true)}
                    className="text-primary text-xs font-mono underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    Add your first word
                  </button>
                )}
              </div>
            ) : (
              filteredVocab.map((word) => (
                <div key={word.id} className="group relative p-4 bg-[#111815] border border-[#2a3830] rounded-lg hover:border-primary/50 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg tracking-tight">{word.word}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted font-mono bg-[#1f2b25] px-2 py-0.5 rounded">{word.form}</span>
                      <button
                        onClick={(e) => deleteVocabWord(word.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-accent transition-all"
                        title="Delete word"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 overflow-hidden max-h-0 group-hover:max-h-32 transition-all duration-300">
                    <p className="text-gray-400 text-sm italic mb-1.5">"{word.meaning}"</p>
                    <p className="text-primary text-xs font-mono">Ex: "{word.example}"</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={openFlashcards}
            disabled={filteredVocab.length === 0}
            className="mt-4 w-full py-3 bg-[#111815] border border-primary/20 text-primary hover:bg-primary hover:text-[#050505] text-xs font-bold rounded-lg transition-all font-mono uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">style</span>
            Review Flashcards ({filteredVocab.length})
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
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted hover:text-white transition-colors">
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

      {/* Add Word Modal */}
      {isVocabModalOpen && currentUser && (
        <VocabModal
          userId={currentUser.id}
          onClose={() => setIsVocabModalOpen(false)}
          onSave={handleSaveWord}
        />
      )}

      {/* Flashcard Modal */}
      {isFlashcardOpen && filteredVocab.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/90 backdrop-blur-md p-4">
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            {/* Header */}
            <div className="w-full flex items-center justify-between">
              <span className="text-muted text-xs font-mono uppercase tracking-widest">
                FLASHCARD {flashcardIndex + 1} / {filteredVocab.length}
              </span>
              <button onClick={() => setIsFlashcardOpen(false)} className="text-muted hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full h-0.5 bg-[#333] rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((flashcardIndex + 1) / filteredVocab.length) * 100}%` }}
              />
            </div>

            {/* Card */}
            <div
              className="relative w-full cursor-pointer"
              onClick={() => setFlashcardFlipped(f => !f)}
              style={{ perspective: '1000px' }}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{ transformStyle: 'preserve-3d', transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* Front */}
                <div
                  className="w-full p-10 bg-surface border border-[#333] rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[260px] shadow-2xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-xs text-muted font-mono bg-[#1f2b25] px-2 py-0.5 rounded">
                      {filteredVocab[flashcardIndex].form}
                    </span>
                  </div>
                  <p className="text-muted text-xs font-mono uppercase tracking-widest mb-2">WORD</p>
                  <h2 className="text-4xl font-bold text-white tracking-tight text-center">
                    {filteredVocab[flashcardIndex].word}
                  </h2>
                  <p className="text-muted text-xs font-mono mt-4 animate-pulse">tap to reveal</p>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 w-full p-10 bg-[#111815] border border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[260px] shadow-2xl"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <h2 className="text-2xl font-bold text-white tracking-tight text-center mb-1">
                    {filteredVocab[flashcardIndex].word}
                  </h2>
                  <p className="text-gray-300 text-base text-center italic">
                    "{filteredVocab[flashcardIndex].meaning}"
                  </p>
                  <div className="h-px w-16 bg-primary/30 my-1" />
                  <p className="text-primary text-sm font-mono text-center">
                    "{filteredVocab[flashcardIndex].example}"
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={prevFlashcard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-[#333] text-muted hover:text-white hover:border-[#555] transition-all font-mono text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                PREV
              </button>
              <button
                onClick={() => setFlashcardFlipped(f => !f)}
                className="px-5 py-2.5 rounded-xl border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 transition-all font-mono text-sm"
              >
                FLIP
              </button>
              <button
                onClick={nextFlashcard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-[#333] text-muted hover:text-white hover:border-[#555] transition-all font-mono text-sm"
              >
                NEXT
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
