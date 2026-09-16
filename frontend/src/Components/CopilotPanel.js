"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  X, Sparkles, Send, Bot, ChevronRight, RotateCcw,
  Mic, MicOff, Volume2, VolumeX, Square, Settings2,
} from "lucide-react";
import apiClient from '@/services/apiClient';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  "How do I prepare for placements?",
  "Best skills for software engineering?",
  "How to write a strong resume?",
  "Recommend projects for my profile",
];

export default function CopilotPanel({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const isDark = useSelector((state) => state.theme?.isDark);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your **AI Career Copilot** ✨\n\nAsk me anything about careers, skill roadmaps, placements, or college life. I'm here to help!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [voices, setVoices]           = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voiceRate, setVoiceRate]     = useState(1.0);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const handleSendRef  = useRef(null);
  const isListeningRef = useRef(false);
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (v.length > 0) {
        const def =
          v.find((x) => x.lang.startsWith("en") && x.name.includes("Google")) ||
          v[0];
        setSelectedVoice(def.name);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.lang           = "en-US";

    rec.onstart  = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };
    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start(); } catch (e) { }
      } else {
        setIsListening(false);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        toast.error("Microphone permission denied. Please allow microphone access in your browser settings and try again.");
      } else if (e.error === "no-speech") {
        return;
      } else {
        console.error("SR error:", e.error);
      }
      isListeningRef.current = false;
      setIsListening(false);
    };
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcript += e.results[i][0].transcript;
        }
      }
      if (!transcript.trim()) return;
      setInput((prev) => (prev ? prev + " " + transcript.trim() : transcript.trim()));
    };

    recognitionRef.current = rec;
  }, []);
  const speakText = (text) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*#`_\-]/g, "").trim();
    const utt   = new SpeechSynthesisUtterance(clean);
    const vo    = voices.find((v) => v.name === selectedVoice);
    if (vo) utt.voice = vo;
    utt.rate = voiceRate;

    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    } else {
      stopSpeaking();
      setInput(""); // clear any previous partial text
      isListeningRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition already started:", err);
      }
    }
  };
  const handleSend = async (override) => {
    const text = (override ?? input).trim();
    if (!text || isTyping) return;

    const token = user?.token || localStorage.getItem("token");
    setMessages((p) => [...p, { role: "user", content: text }]);
    setInput("");
    setIsTyping(true);

    try {
      const { data } = await apiClient.post('/api/career/chat', { query: text });
      
      const reply = data.success
        ? data.text
        : "Sorry, I'm having trouble right now. Please try again!";

      setMessages((p) => [...p, { role: "assistant", content: reply }]);
      speakText(reply);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "An error occurred. Please check your connection." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };
  handleSendRef.current = handleSend;

  const handleSubmit = (e) => { e.preventDefault(); handleSend(); };

  const handleClear = () => {
    stopSpeaking();
    setMessages([{ role: "assistant", content: "Chat cleared! How can I help you today? 🚀" }]);
  };
  const renderContent = (text) =>
    text.split("**").map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-semibold text-blue-400">{part}</strong>
        : part
    );
  const surface  = isDark ? "rgba(6,11,24,0.95)"     : "rgba(255,255,255,0.98)";
  const border   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textP    = isDark ? "#E8EFF8" : "#0F172A";
  const textS    = isDark ? "#6B7FA3" : "#64748B";
  const inputBg  = isDark ? "#141F35" : "#F8FAFF";
  const bubbleAI = isDark ? "#141F35" : "#F0F4FF";
  const hoverBg  = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col w-full sm:w-[420px] transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: surface,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: `1px solid ${border}`,
          boxShadow: isDark
            ? "-8px 0 40px rgba(0,0,0,0.6)"
            : "-8px 0 40px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg,#4F8EF7,#818CF8)", boxShadow: "0 4px 14px rgba(79,142,247,0.35)" }}
            >
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: textP }}>AI Career Copilot</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-green-400">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setVoiceEnabled(!voiceEnabled); if (!voiceEnabled) stopSpeaking(); }}
              title={voiceEnabled ? "Mute voice output" : "Enable voice output"}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: voiceEnabled ? "#4F8EF7" : textS, background: voiceEnabled ? "rgba(79,142,247,0.1)" : "transparent" }}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              title="Voice settings"
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: showVoiceSettings ? "#818CF8" : textS, background: showVoiceSettings ? "rgba(129,140,248,0.1)" : "transparent" }}
            >
              <Settings2 size={15} />
            </button>
            <button
              onClick={handleClear}
              title="Clear chat"
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: textS }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: textS }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {showVoiceSettings && voices.length > 0 && (
          <div
            className="px-4 py-3 flex-shrink-0 text-xs grid grid-cols-2 gap-3"
            style={{ borderBottom: `1px solid ${border}`, background: isDark ? "rgba(20,31,53,0.8)" : "#F8FAFF" }}
          >
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider" style={{ color: textS }}>
                Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs font-medium"
                style={{
                  background: inputBg,
                  border: `1px solid ${border}`,
                  color: textP,
                  outline: "none",
                }}
              >
                {voices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider" style={{ color: textS }}>
                Speed ({voiceRate}×)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#4F8EF7" }}
              />
            </div>
          </div>
        )}
        {isListening && (
          <div
            className="flex items-center justify-center gap-2.5 py-2.5 text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(248,113,113,0.08)", borderBottom: `1px solid rgba(248,113,113,0.2)`, color: "#F87171" }}
          >
            <div className="flex gap-0.5 items-end">
              {[3, 5, 2, 4, 3].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-red-400 animate-bounce"
                  style={{ height: `${h * 3}px`, animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
            <span>Listening… tap mic to stop, then press Send ➤</span>
          </div>
        )}
        {isSpeaking && (
          <div
            className="flex items-center justify-center gap-2.5 py-2 text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(79,142,247,0.08)", borderBottom: `1px solid rgba(79,142,247,0.15)`, color: "#4F8EF7" }}
          >
            <div className="flex gap-0.5 items-end">
              {[3, 4, 2, 5, 3].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-blue-400 animate-pulse"
                  style={{ height: `${h * 3}px`, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
            Reading response aloud
            <button onClick={stopSpeaking} className="ml-1 flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors">
              <Square size={11} /> Stop
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"
                  style={{ background: "linear-gradient(135deg,#4F8EF7,#818CF8)" }}
                >
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[82%] shadow-sm"
                style={
                  msg.role === "user"
                    ? {
                        background: "linear-gradient(135deg,#4F8EF7,#3B78F0)",
                        color: "#fff",
                        borderTopRightRadius: 4,
                      }
                    : {
                        background: bubbleAI,
                        color: isDark ? "#B0BFDA" : "#334155",
                        border: `1px solid ${border}`,
                        borderTopLeftRadius: 4,
                      }
                }
              >
                {renderContent(msg.content)}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2.5 items-center">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg,#4F8EF7,#818CF8)" }}
              >
                <Bot size={13} className="text-white" />
              </div>
              <div
                className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                style={{ background: bubbleAI, border: `1px solid ${border}`, borderTopLeftRadius: 4 }}
              >
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          {messages.length === 1 && (
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: textS }}>
                Try asking
              </p>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-all hover:-translate-y-0.5 flex items-center justify-between gap-2 group"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFF",
                    border: `1px solid ${border}`,
                    color: isDark ? "#B0BFDA" : "#475569",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(79,142,247,0.35)";
                    e.currentTarget.style.background = isDark ? "rgba(79,142,247,0.07)" : "rgba(79,142,247,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "#F8FAFF";
                  }}
                >
                  <span>{s}</span>
                  <ChevronRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: `1px solid ${border}` }}
        >
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <button
              type="button"
              onClick={toggleMic}
              title={isListening ? "Stop listening" : "Speak your question"}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
              style={{
                background: isListening
                  ? "rgba(248,113,113,0.15)"
                  : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                color: isListening ? "#F87171" : textS,
                border: isListening ? "1px solid rgba(248,113,113,0.3)" : `1px solid ${border}`,
                animation: isListening ? "pulse 1s ease-in-out infinite" : "none",
              }}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask or tap mic to speak…"
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
              style={{
                background: inputBg,
                border: `1px solid ${border}`,
                color: textP,
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(79,142,247,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg,#4F8EF7,#818CF8)",
                boxShadow: "0 4px 14px rgba(79,142,247,0.3)",
              }}
            >
              <Send size={15} />
            </button>
          </form>

          <p className="text-center text-[10px] mt-2.5" style={{ color: isDark ? "#3D5280" : "#CBD5E1" }}>
            Powered by ProConnect AI · Speak or type your question
          </p>
        </div>
      </div>
    </>
  );
}
