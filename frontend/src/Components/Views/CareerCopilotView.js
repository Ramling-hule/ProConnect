"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Sparkles, Mic, MicOff, Volume2, VolumeX, Play, Square, RefreshCw, Award, BookOpen, AlertCircle, Compass, Send } from 'lucide-react';
import { openAuthModal } from '@/redux/features/authSlice';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-hot-toast';

export default function CareerCopilotView() {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user?.name || 'Student'}! I am your AI Career Copilot. Ask me any career or academic questions, or click "Generate Roadmap" to audit your profile!` }
  ]);
  const [query, setQuery] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voiceRate, setVoiceRate] = useState(1.0);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  const speakText = (text) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\-]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (voices.length > 0) {
      const voiceObj = voices.find(v => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }
    utterance.rate = voiceRate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      toast.success("Voice feedback stopped");
    }
  };

  const handleSendQuery = async (overrideQuery) => {
    const textToSend = overrideQuery || query;
    if (!textToSend.trim()) return;

    if (!user) {
      dispatch(openAuthModal("Please sign in to chat with the AI Copilot."));
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setQuery("");
    setLoadingChat(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/career/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ query: textToSend })
      });

      if (!res.ok) throw new Error("Failed to get copilot answer");
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      speakText(data.text);

    } catch (err) {
      toast.error("Error communicating with AI Copilot");
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in to generate a career roadmap."));
      return;
    }
    setLoadingRoadmap(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/career/recommend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) throw new Error("Roadmap generation failed");
      const data = await res.json();
      setRoadmap(data);
      toast.success("Academic & Career Roadmap Generated!");

    } catch (err) {
      toast.error("Failed to generate career insights");
      console.error(err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0) {
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || availableVoices[0];
          setSelectedVoice(defaultVoice.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          toast.success("Voice recognition started. Speak now...");
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (e) => {
          console.error("Speech Recognition Error:", e);
          setIsListening(false);
          toast.error("Speech recognition error: " + e.error);
        };

        rec.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          handleSendQuery(transcript);
        };

        recognitionRef.current = rec;
      }
    }
  }, [selectedVoice, voiceEnabled, voiceRate, handleSendQuery]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Stop any reading
        setIsSpeaking(false);
      }
      recognitionRef.current.start();
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Career & Academic Copilot</h2>
            <p className="text-xs text-slate-500">Get context-aware advice, profile score analysis, and roadmaps.</p>
          </div>
        </div>
        <button
          onClick={handleGenerateRoadmap}
          disabled={loadingRoadmap}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-50"
        >
          {loadingRoadmap ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Compass size={16} />
          )}
          Generate Roadmap
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-[500px]">
          <div className={`flex-1 rounded-2xl border flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'}`}>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Interactive Copilot</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition ${voiceEnabled ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                  title="Toggle voice output"
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span className="hidden sm:inline">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
                </button>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-red-100"
                  >
                    <Square size={14} /> Stop
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isAI 
                        ? isDark ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        : 'bg-brand-primary text-white rounded-tr-none'
                    }`}>
                      {isAI && (
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">Copilot</span>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              {loadingChat && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                    <RefreshCw size={12} className="animate-spin" /> Copilot is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {isListening && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 flex items-center justify-center gap-2 border-t dark:border-slate-800 animate-pulse text-xs text-red-600 dark:text-red-400 font-bold">
                <div className="flex gap-0.5 items-center justify-center">
                  <span className="w-1 bg-red-500 h-3 rounded animate-bounce"></span>
                  <span className="w-1 bg-red-500 h-5 rounded animate-bounce delay-75"></span>
                  <span className="w-1 bg-red-500 h-2 rounded animate-bounce delay-150"></span>
                  <span className="w-1 bg-red-500 h-4 rounded animate-bounce"></span>
                </div>
                Listening to your voice... Speak clearly
              </div>
            )}
            {isSpeaking && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center gap-2 border-t dark:border-slate-800 text-xs text-blue-600 dark:text-blue-400 font-bold">
                <div className="flex gap-0.5 items-center justify-center">
                  <span className="w-1 bg-blue-500 h-3 rounded animate-pulse"></span>
                  <span className="w-1 bg-blue-500 h-4 rounded animate-pulse delay-75"></span>
                  <span className="w-1 bg-blue-500 h-2 rounded animate-pulse delay-150"></span>
                </div>
                Copilot is reading response aloud
              </div>
            )}
            <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-100 bg-white'}`}>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-full transition flex items-center justify-center relative ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-primary'
                  }`}
                  title={isListening ? "Stop listening" : "Start Voice Assistant Input"}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <input
                  type="text"
                  placeholder="Ask a question or speak your query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  disabled={loadingChat}
                  className={`flex-1 bg-transparent border rounded-full px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-800 text-white focus:border-brand-primary' : 'border-slate-200 text-slate-900 focus:border-brand-primary'}`}
                />
                <button
                  onClick={() => handleSendQuery()}
                  disabled={loadingChat || !query.trim()}
                  className="p-3 bg-brand-primary text-white rounded-full hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center"
                >
                  <Send size={18} className="translate-x-[1px]" />
                </button>
              </div>
              {voiceEnabled && voices.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-[10px] text-slate-400">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold uppercase">Synthesizer Voice</label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="bg-transparent border-none text-[10px] outline-none text-slate-500 font-medium"
                    >
                      {voices.map((v, i) => (
                        <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold uppercase">Speed Rate ({voiceRate}x)</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceRate}
                      onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        <div className="space-y-6">
          <div className={`p-5 rounded-2xl border shadow-sm transition-colors min-h-[500px] flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            {roadmap ? (
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Audit</span>
                  <span className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full font-bold">Active</span>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border dark:border-slate-800">
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-bold text-lg">
                    {roadmap.profileScore}%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold dark:text-white">Profile Readiness</h4>
                    <p className="text-[10px] text-slate-500">Based on ProConnect CV completer</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Compass size={14} /> Ideal Career Tracks</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.targetRoles?.map((role, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2.5 py-1 rounded-md">{role}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><AlertCircle size={14} /> Profile Audits</h4>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    {roadmap.suggestions?.map((sug, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 select-none">•</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><BookOpen size={14} /> Next Skills to Learn</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.skillsToLearn?.map((skill, i) => (
                      <span key={i} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2.5 py-1 rounded-md">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Award size={14} /> Badges to Target</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.badgesToTarget?.map((badge, i) => (
                      <span key={i} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[10px] font-semibold px-2.5 py-1 rounded-md">{badge}</span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t dark:border-slate-800 space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-xl text-xs">
                    <span className="font-bold text-brand-primary block mb-0.5">Short Term Prep</span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{roadmap.roadmap?.shortTerm}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Compass size={40} className="text-slate-300 dark:text-slate-700 animate-spin-slow" />
                <h4 className="text-sm font-bold dark:text-white">Academic Roadmap Pending</h4>
                <p className="text-xs text-slate-500">Click the generate button at the top to crawl your profile details and compute personalized roadmaps.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
