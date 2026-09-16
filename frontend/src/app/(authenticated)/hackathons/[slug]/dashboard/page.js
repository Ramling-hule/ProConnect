'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Users, Trophy, FileText, TrendingUp, CheckCircle, Loader2, BarChart2, Calendar, DollarSign, Download, Award, Gavel, Settings } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

const StatCard = ({ label, value, icon: Icon, color = 'indigo' }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-slate-400 text-sm font-medium">{label}</span>
      <div className={`p-2 rounded-xl bg-${color}-500/10`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
    </div>
    <p className="text-3xl font-black text-white">{value ?? '—'}</p>
  </div>
);

export default function HackathonDashboardPage() {
  const { slug }   = useParams();
  const id = slug;
  const { user }   = useSelector(state => state.auth);
  const router     = useRouter();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id || !user) return;
    const fetchDashboard = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/hackathons/${id}/dashboard`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
        else { toast.error('Not authorized or not found'); router.push('/hackathons'); }
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, [id, user, router]);

  const handleAction = async (endpoint, method = 'POST') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/hackathons/${id}/${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const json = await res.json();
      if (json.success || res.ok) {
        toast.success(json.message || 'Action completed successfully');
      } else {
        toast.error(json.message || 'Action failed');
      }
    } catch {
      toast.error('Network error during action');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );

  if (!data) return null;
  const { hackathon: h, registrations: r, teams, submissions } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-indigo-400 text-sm font-semibold mb-1">Organizer Dashboard</p>
            <h1 className="text-3xl font-extrabold text-white">{h.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${h.status === 'published' ? 'bg-green-500/20 text-green-400' : h.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                {h.status}
              </span>
              <Link href={`/hackathons/${h.slug}`} className="text-slate-400 hover:text-white text-sm transition-colors">
                View public page →
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/hackathons/${slug}/find-teammates`}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
            >
              Find Teammates
            </Link>
            <Link
              href={`/hackathons/${h._id}/edit`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
            >
              Edit Hackathon
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Registrations" value={r.total}     icon={Users}    color="indigo" />
          <StatCard label="Confirmed"            value={r.confirmed} icon={CheckCircle} color="green" />
          <StatCard label="Waitlisted"           value={r.waitlisted}icon={TrendingUp} color="amber" />
          <StatCard label="Teams Formed"         value={teams.total} icon={Users}    color="purple" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <StatCard label="Final Submissions"  value={submissions.final}  icon={FileText} color="blue" />
          <StatCard label="Draft Submissions"  value={submissions.drafts} icon={FileText} color="slate" />
          <StatCard label="Pending"            value={r.pending}          icon={Calendar} color="orange" />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-white text-lg mb-5">Registration Breakdown</h3>
          {r.total > 0 && (
            <div className="space-y-3">
              {[
                { label: 'Confirmed',  count: r.confirmed,  color: 'bg-green-500' },
                { label: 'Pending',    count: r.pending,    color: 'bg-amber-500' },
                { label: 'Waitlisted', count: r.waitlisted, color: 'bg-blue-500' },
                { label: 'Cancelled',  count: r.cancelled,  color: 'bg-slate-600' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="w-24 text-slate-400 text-sm text-right">{label}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${r.total > 0 ? (count / r.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-white text-sm font-bold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/hackathons/${id}/leaderboard`} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-all group">
            <Trophy className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">Leaderboard</h4>
            <p className="text-slate-500 text-sm">View and manage submissions ranking</p>
          </Link>
          <Link href={`/hackathons/${id}/submissions`} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-all group">
            <FileText className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">Submissions</h4>
            <p className="text-slate-500 text-sm">Review all submitted projects</p>
          </Link>
          <Link href={`/hackathons/${id}/participants`} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-all group">
            <Users className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">Participants</h4>
            <p className="text-slate-500 text-sm">Manage registrations and approvals</p>
          </Link>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
          <h3 className="font-bold text-white text-lg mb-5 flex items-center gap-2"><Settings className="w-5 h-5" /> Organizer Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => handleAction('registrations/export', 'GET')} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-slate-600">
              <Download className="w-6 h-6 text-indigo-400 mb-2" />
              <span className="text-sm font-semibold">Export Registrations</span>
            </button>
            <button onClick={() => {
              const email = prompt("Enter judge email:");
              if (email) {
                toast.success('Assigning judge...');
                fetch(`${API_BASE_URL}/api/hackathons/${id}/judges`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ judges: [{ user: email }] })
                }).then(res => res.json()).then(res => res.success ? toast.success("Judge assigned") : toast.error("Failed to assign"));
              }
            }} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-slate-600">
              <Gavel className="w-6 h-6 text-purple-400 mb-2" />
              <span className="text-sm font-semibold">Assign Judges</span>
            </button>
            <button onClick={() => { if(confirm('Are you sure you want to finalize results?')) handleAction('finalize-results'); }} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-slate-600">
              <Trophy className="w-6 h-6 text-amber-400 mb-2" />
              <span className="text-sm font-semibold">Finalize Results</span>
            </button>
            <button onClick={() => { if(confirm('Generate certificates for all attendees?')) handleAction('certificates/generate'); }} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-slate-600">
              <Award className="w-6 h-6 text-green-400 mb-2" />
              <span className="text-sm font-semibold">Generate Certificates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
