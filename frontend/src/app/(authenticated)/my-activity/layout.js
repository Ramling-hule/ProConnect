"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Target, Video, Users, Layers } from 'lucide-react';

export default function MyActivityLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    { id: 'sessions', label: 'Sessions', href: '/my-activity/sessions', icon: Calendar },
    { id: 'pods', label: 'Pods', href: '/my-activity/pods', icon: Target },
    { id: 'webinars', label: 'Webinars', href: '/my-activity/webinars', icon: Video },
    { id: 'connections', label: 'Connections', href: '/my-activity/connections', icon: Users },
    { id: 'groups', label: 'Groups', href: '/my-activity/groups', icon: Layers },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-4 overflow-x-auto custom-scrollbar shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link 
              key={tab.id} 
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </Link>
          );
        })}
      </div>
      
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
