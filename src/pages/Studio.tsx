import { useState, useRef } from 'react';
import { ollama } from '../services/ollamaApi';

export default function Studio() {
  const [activeTab, setActiveTab] = useState<'tts' | 'transcribe' | 'translate'>('tts');
  const [ttsText, setTtsText] = useState('');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Translator state
  const [translateText, setTranslateText] = useState('');
  const [translatedResult, setTranslatedResult] = useState('');
  const [translateDirection, setTranslateDirection] = useState<'es-en' | 'en-es'>('es-en');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleGenerateSpeech = async () => {
    if (!ttsText.trim() || isGenerating) return;
    setIsGenerating(true);
    setTtsAudioUrl(null);

    try {
      // Local synthesis fallback
      console.log('Using local speech synthesis');
      const synthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.onend = () => setIsGenerating(false);
      synthesis.speak(utterance);
      // We don't have a URL to set, but it will play directly
      setTtsAudioUrl('local');
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsGenerating(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsGenerating(true);
    setTranscription('Transcribing...');
    try {
      // For local transcription, we advise the user to use the real-time 'Void' session
      setTranscription("Local transcription from audio files requires a client-side STT library. Please use the real-time 'Void' session for local speech-to-text.");
      setIsGenerating(false);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscription('Error: Transcription failed.');
      setIsGenerating(false);
    }
  };

  const handleTranslate = async () => {
    if (!translateText.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const result = await ollama.translate(translateText, translateDirection);
      setTranslatedResult(result);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedResult('Error: Translation failed. Please check your connection to Ollama.');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      <header className="flex flex-shrink-0 items-center justify-between px-8 py-6 border-b border-[#1f2b25] bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold text-white tracking-tighter">THE_STUDIO</h2>
          <div className="flex items-center gap-2 text-muted text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span>AUDIO_PROCESSING_UNIT</span>
          </div>
        </div>
        <div className="flex bg-[#111815] border border-[#2a3830] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('tts')}
            className={`px-4 py-2 rounded-md text-xs font-mono font-bold tracking-widest transition-colors ${activeTab === 'tts' ? 'bg-primary text-background-dark' : 'text-muted hover:text-white'}`}
          >
            TEXT_TO_SPEECH
          </button>
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`px-4 py-2 rounded-md text-xs font-mono font-bold tracking-widest transition-colors ${activeTab === 'transcribe' ? 'bg-primary text-background-dark' : 'text-muted hover:text-white'}`}
          >
            TRANSCRIBE
          </button>
          <button
            onClick={() => setActiveTab('translate')}
            className={`px-4 py-2 rounded-md text-xs font-mono font-bold tracking-widest transition-colors ${activeTab === 'translate' ? 'bg-primary text-background-dark' : 'text-muted hover:text-white'}`}
          >
            TRANSLATE
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col items-center justify-center">
        {activeTab === 'tts' && (
          <div className="w-full max-w-2xl bg-surface border border-[#333] rounded-xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[24px]">record_voice_over</span>
              <h3 className="text-white text-xl font-bold tracking-tight">Generate Speech</h3>
            </div>

            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Enter text to synthesize..."
              className="w-full h-32 bg-background-dark border border-[#333] text-white rounded-lg p-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted font-mono transition-all resize-none mb-6"
            />

            <div className="flex justify-between items-center">
              <button
                onClick={handleGenerateSpeech}
                disabled={isGenerating || !ttsText.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-background-dark text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    <span>GENERATE_AUDIO</span>
                  </>
                )}
              </button>

              {ttsAudioUrl && (
                <div className="flex items-center gap-4">
                  <span className="text-primary text-xs font-mono tracking-widest uppercase">Output Ready</span>
                  <audio controls src={ttsAudioUrl} className="h-10" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transcribe' && (
          <div className="w-full max-w-2xl bg-surface border border-[#333] rounded-xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[24px]">speech_to_text</span>
              <h3 className="text-white text-xl font-bold tracking-tight">Audio Transcription</h3>
            </div>

            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#333] rounded-xl mb-6 bg-background-dark/50">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                  ? 'bg-accent/20 border-2 border-accent text-accent shadow-glow-accent animate-pulse'
                  : 'bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 hover:shadow-glow-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-[40px]">
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </button>
              <p className="mt-6 text-muted font-mono text-sm tracking-widest uppercase">
                {isRecording ? 'RECORDING_IN_PROGRESS...' : 'CLICK_TO_RECORD'}
              </p>
            </div>

            {(transcription || isGenerating) && (
              <div className="w-full bg-background-dark border border-[#333] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4 opacity-50">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary">TRANSCRIPT_OUTPUT</span>
                </div>
                <p className="text-white font-light leading-relaxed whitespace-pre-wrap">
                  {transcription}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'translate' && (
          <div className="w-full max-w-2xl bg-surface border border-[#333] rounded-xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[24px]">translate</span>
                <h3 className="text-white text-xl font-bold tracking-tight">Vocabulary Translator</h3>
              </div>
              <button
                onClick={() => setTranslateDirection(prev => prev === 'es-en' ? 'en-es' : 'es-en')}
                className="flex items-center gap-2 px-3 py-1 bg-[#111815] border border-[#2a3830] text-primary text-[10px] font-mono rounded hover:border-primary transition-colors"
              >
                <span>{translateDirection === 'es-en' ? 'SPANISH_TO_ENGLISH' : 'ENGLISH_TO_SPANISH'}</span>
                <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <textarea
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                  placeholder={translateDirection === 'es-en' ? "Escribe algo en español..." : "Write something in English..."}
                  className="w-full h-40 bg-background-dark border border-[#333] text-white rounded-lg p-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-muted font-mono transition-all resize-none"
                />
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !translateText.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-background-dark text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isTranslating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                      <span>TRANSLATING...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">g_translate</span>
                      <span>PROCESS_TRANSLATION</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-2 h-full">
                <div className="flex-1 bg-background-dark border border-[#333] rounded-lg p-4 relative group">
                  <div className="flex items-center gap-2 mb-2 opacity-30">
                    <span className="material-symbols-outlined text-[14px]">output</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary">RESULT</span>
                  </div>
                  <p className="text-white font-light leading-relaxed whitespace-pre-wrap">
                    {translatedResult || <span className="text-muted italic">Awaiting translation...</span>}
                  </p>
                  {translatedResult && (
                    <button
                      onClick={() => copyToClipboard(translatedResult)}
                      className="absolute top-2 right-2 p-1 text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy to clipboard"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

