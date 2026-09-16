"use client";
import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'prizes', label: 'Prizes' },
  { id: 'faqs', label: 'FAQs' },
];

export default function HackathonScrollNav({ hackathon }) {
  const [activeSection, setActiveSection] = useState('about');

  useEffect(() => {
    const handleScroll = () => {
      let current = 'about';
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            current = section.id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };
  const availableSections = SECTIONS.filter(sec => {
    if (sec.id === 'about') return !!hackathon.description;
    if (sec.id === 'tracks') return hackathon.tracks?.length > 0;
    if (sec.id === 'prizes') return hackathon.prizes?.length > 0;
    if (sec.id === 'faqs') return hackathon.faqs?.length > 0;
    return false;
  });

  if (availableSections.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 mb-8 pt-4">
      <div className="max-w-5xl mx-auto px-4 md:px-8 flex gap-6 overflow-x-auto no-scrollbar">
        {availableSections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(sec.id)}
            className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeSection === sec.id
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>
    </div>
  );
}
