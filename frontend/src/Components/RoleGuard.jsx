import React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function RoleGuard({ children, allowedRoles, fallbackRoute = '/dashboard' }) {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();

  if (!user) return null;

  const hasAccess = allowedRoles.map(r => r.toLowerCase()).includes(user.role?.toLowerCase() || 'student');

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          You don't have the necessary permissions to view this page. This area is restricted to {allowedRoles.join(', ')}s.
        </p>
        <button 
          onClick={() => router.push(fallbackRoute)}
          className="bg-brand-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-brand-primary/90 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
}
