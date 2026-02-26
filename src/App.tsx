import React, { useState, useRef } from 'react';
import { Search, User, FileText, Loader2, Shield, Globe, AlertCircle, ChevronRight, ExternalLink, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { analyzePerson, DossierResult } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DossierResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ name: string; date: string; result: DossierResult }[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzePerson(input);
      setResult(data);
      
      // Try to extract a name for history
      const nameMatch = input.split('\n')[0].slice(0, 30);
      setHistory(prev => [{ 
        name: nameMatch || 'Unnamed Analysis', 
        date: new Date().toLocaleTimeString(),
        result: data 
      }, ...prev].slice(0, 10));

      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] flex items-center justify-center rounded-sm">
            <Shield className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif italic text-xl leading-none">Persona Dossier</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono mt-1">Advanced Investigative Intelligence</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-wider font-mono opacity-70">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </div>
          <div>Gemini 2.5 Flash</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-mono opacity-50">
              <User size={14} />
              <span>Target Identification</span>
            </div>
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter name, social media handles, or raw text about the person..."
                className="w-full h-64 bg-transparent border border-[#141414] p-4 font-mono text-sm focus:outline-none focus:ring-0 resize-none placeholder:opacity-30 transition-all group-hover:bg-white/20"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => setInput('')}
                  className="p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors border border-[#141414]"
                  title="Clear Input"
                >
                  <History size={16} />
                </button>
              </div>
            </div>
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              className={cn(
                "w-full py-4 flex items-center justify-center gap-3 border border-[#141414] transition-all uppercase tracking-widest text-sm font-bold",
                isAnalyzing || !input.trim() 
                  ? "opacity-50 cursor-not-allowed" 
                  : "bg-[#141414] text-[#E4E3E0] hover:bg-transparent hover:text-[#141414]"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Generate Dossier
                </>
              )}
            </button>
          </section>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-red-500/50 bg-red-500/5 text-red-700 flex gap-3 items-start"
            >
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div className="text-xs font-mono">{error}</div>
            </motion.div>
          )}

          {/* History / Recent Searches */}
          {history.length > 0 && (
            <section className="space-y-4 pt-8 border-t border-[#141414]/10">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-mono opacity-50">
                <History size={14} />
                <span>Recent Analyses</span>
              </div>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setResult(item.result)}
                    className="w-full text-left p-3 border border-[#141414]/10 hover:border-[#141414] transition-all flex justify-between items-center group"
                  >
                    <span className="text-xs font-mono truncate max-w-[200px]">{item.name}</span>
                    <span className="text-[10px] opacity-40 font-mono">{item.date}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7" ref={scrollRef}>
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-6 border border-dashed border-[#141414]/20"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-[#141414]/10 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-t-2 border-[#141414] rounded-full animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-serif italic text-lg">Scanning Global Databases</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-mono">Bypassing restrictions • Aggregating sources</p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between border-b border-[#141414] pb-4">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-mono">
                    <FileText size={14} />
                    <span>Intelligence Report</span>
                  </div>
                  <div className="text-[10px] font-mono opacity-50">CONFIDENTIAL // INTERNAL USE ONLY</div>
                </div>

                <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:italic prose-headings:mt-8 prose-headings:mb-4 prose-p:leading-relaxed prose-p:mb-4 prose-li:mb-1 font-sans text-[#141414]">
                  <Markdown>{result.text}</Markdown>
                </div>

                {result.sources.length > 0 && (
                  <section className="pt-12 border-t border-[#141414]/10 space-y-4">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-mono opacity-50">
                      <Globe size={14} />
                      <span>Verified Sources</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 border border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-between group"
                        >
                          <div className="space-y-1 overflow-hidden">
                            <p className="text-[10px] font-bold uppercase truncate">{source.title || 'Source Link'}</p>
                            <p className="text-[9px] opacity-50 truncate font-mono">{new URL(source.uri).hostname}</p>
                          </div>
                          <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 border border-dashed border-[#141414]/20 opacity-30">
                <FileText size={48} strokeWidth={0.5} />
                <p className="text-xs font-mono uppercase tracking-widest">Awaiting Input</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] mt-24 p-8 bg-[#141414] text-[#E4E3E0]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Shield size={24} />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">Persona Dossier AI</p>
              <p className="text-[10px] opacity-50 font-mono">V2.5.0-FLASH-INTELLIGENCE</p>
            </div>
          </div>
          <div className="text-[10px] font-mono opacity-50 text-center md:text-right max-w-md">
            This tool uses advanced AI to aggregate publicly available information. Accuracy is not guaranteed. Use for investigative purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
}
