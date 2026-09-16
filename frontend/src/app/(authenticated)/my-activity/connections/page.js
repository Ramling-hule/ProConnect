import React from 'react';

export default function MyConnectionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Connections</h1>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <h2 className="text-xl font-bold mb-2">No connections</h2>
        <p className="text-slate-500">You haven't connected with anyone yet.</p>
      </div>
    </div>
  );
}
