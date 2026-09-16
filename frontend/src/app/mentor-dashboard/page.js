"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '@/services/apiClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/utils/errorHelper';
import { 
  LayoutDashboard, Layers, Calendar, Users, Plus, Trash2, 
  Clock, DollarSign, Star, Video, Activity, ChevronRight, CheckCircle2,
  Trash
} from 'lucide-react';

export default function MentorDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const [newService, setNewService] = useState({
    title: '', description: '', duration: 30, price: 500, meetingType: 'online'
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['mentorDashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/mentor/me/dashboard');
      return data;
    },
    enabled: !!user
  });

  const { data: profileData } = useQuery({
    queryKey: ['mentorProfile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/mentor/me/profile');
      return data;
    },
    enabled: !!user
  });

  const { data: servicesData } = useQuery({
    queryKey: ['myServices'],
    queryFn: async () => {
      const mentorId = profileData?.mentor?._id;
      if (!mentorId) return { services: [] };
      const { data } = await apiClient.get(`/api/mentor/${mentorId}/services`);
      return data;
    },
    enabled: !!profileData?.mentor?._id
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data) => {
      const { data: responseData } = await apiClient.post('/api/mentor/services', data);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
      setNewService({ title: '', description: '', duration: 30, price: 500, meetingType: 'online' });
      toast.success("Service created beautifully!");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Failed to create service'));
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId) => {
      const { data } = await apiClient.delete(`/api/mentor/services/${serviceId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
      toast.success("Service deleted!");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Failed to delete service'));
    }
  });

  const [availability, setAvailability] = useState({
    monday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
    saturday: { isAvailable: false, slots: [] },
    sunday: { isAvailable: false, slots: [] }
  });
  useEffect(() => {
    if (dashboardData?.mentor?.availability?.weeklySchedule) {
      setAvailability(dashboardData.mentor.availability.weeklySchedule);
    }
  }, [dashboardData]);

  const updateAvailabilityMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.put('/api/mentor/availability', { weeklySchedule: availability });
      return data;
    },
    onSuccess: () => {
      toast.success("Availability updated successfully!");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Failed to update availability'));
    }
  });

  if (!user) return <div className="min-h-screen bg-[#060B18] flex justify-center items-center text-white">Please login.</div>;
  if (isLoading) return (
    <div className="min-h-screen bg-[#060B18] flex justify-center items-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
    </div>
  );

  const analytics = dashboardData?.analytics || { totalEarnings: 0, totalSessions: 0, averageRating: 0 };
  const todaysBookings = dashboardData?.todaysBookings || [];
  const upcomingBookings = dashboardData?.upcomingBookings || [];
  const services = servicesData?.services || [];

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'bookings', label: 'Bookings', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-[#060B18] text-slate-200 font-sans pb-20">
      {}
      <div className="sticky top-0 z-30 bg-[#060B18]/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-primary/20">
              {user.name?.[0] || 'M'}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Mentor Dashboard</h1>
              <p className="text-sm font-medium text-slate-400 mt-1">Welcome back, <span className="text-brand-primary">{user.name}</span></p>
            </div>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${isActive ? 'bg-gradient-to-r from-brand-primary to-blue-500 text-white shadow-lg shadow-brand-primary/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        
        {}
        {activeTab === 'overview' && (
          <div className="animate-fade-up space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign size={24} />
                </div>
                <p className="text-slate-400 font-bold mb-1 text-sm uppercase tracking-wider">Total Earnings</p>
                <h3 className="text-4xl font-black text-white">₹{analytics.totalEarnings}</h3>
              </div>
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all"></div>
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                  <Activity size={24} />
                </div>
                <p className="text-slate-400 font-bold mb-1 text-sm uppercase tracking-wider">Completed Sessions</p>
                <h3 className="text-4xl font-black text-white">{analytics.totalSessions}</h3>
              </div>
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full group-hover:bg-amber-500/30 transition-all"></div>
                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-4">
                  <Star size={24} />
                </div>
                <p className="text-slate-400 font-bold mb-1 text-sm uppercase tracking-wider">Average Rating</p>
                <h3 className="text-4xl font-black text-white">{analytics.averageRating.toFixed(1)} <span className="text-xl text-amber-400">★</span></h3>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-3xl rounded-full pointer-events-none"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Calendar className="text-brand-primary" /> Today&apos;s Sessions
                </h2>
              </div>
              
              {todaysBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500 mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-lg font-bold text-white mb-2">You're all caught up!</p>
                  <p className="text-slate-400 font-medium text-sm">No sessions scheduled for today. Time to relax or create new services.</p>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  {todaysBookings.map(b => (
                    <div key={b._id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/10 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <img src={b.user?.profilePicture || 'https://api.dicebear.com/7.x/notionists/svg?seed='+b.user?.name} className="w-12 h-12 rounded-full bg-slate-800 object-cover" alt="User" />
                        <div>
                          <p className="font-bold text-lg text-white">{b.user?.name}</p>
                          <p className="text-sm font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md inline-flex mt-1">{b.service?.title} • {b.startTime}</p>
                        </div>
                      </div>
                      <a href={b.meetingLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-blue-600 hover:from-blue-500 hover:to-brand-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5">
                        <Video size={16} /> Join Meeting
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {activeTab === 'services' && (
          <div className="animate-fade-up grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Layers className="text-brand-primary" /> Active Services
                </h2>
                <span className="bg-white/10 text-white font-bold px-3 py-1 rounded-lg text-sm">{services.length} Total</span>
              </div>
              
              {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                  <Layers size={48} className="text-slate-500 mb-4 opacity-50" />
                  <p className="text-xl font-bold text-white mb-2">No services yet</p>
                  <p className="text-slate-400 font-medium">Create your first service to start accepting bookings.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(s => (
                    <div key={s._id} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:bg-white/10">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-brand-primary/20 text-brand-primary w-10 h-10 rounded-xl flex items-center justify-center">
                            <Star size={20} />
                          </div>
                          <span className="bg-white/10 text-slate-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{s.meetingType}</span>
                        </div>
                        <h3 className="font-bold text-white text-xl mb-2 line-clamp-1">{s.title}</h3>
                        <p className="text-sm font-medium text-slate-400 line-clamp-2 mb-6 h-10">{s.description}</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Price</span>
                          <span className="text-lg font-black text-emerald-400">₹{s.price} <span className="text-slate-500 text-sm font-medium">/ {s.duration}m</span></span>
                        </div>
                        <button 
                          onClick={() => { if(confirm('Are you sure you want to delete this service?')) deleteServiceMutation.mutate(s._id); }} 
                          className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                          title="Delete Service"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl h-fit sticky top-32 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <Plus className="text-blue-400" /> Create New Service
              </h2>
              <form onSubmit={(e) => { e.preventDefault(); createServiceMutation.mutate(newService); }} className="space-y-5 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Service Title</label>
                  <input required placeholder="e.g. 1-on-1 Resume Review" value={newService.title} onChange={e=>setNewService({...newService, title: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea required placeholder="What will the mentee learn or achieve?" rows="3" value={newService.description} onChange={e=>setNewService({...newService, description: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all resize-none placeholder-slate-600"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (Mins)</label>
                    <input required type="number" min="15" step="15" placeholder="30" value={newService.duration} onChange={e=>setNewService({...newService, duration: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Price (₹)</label>
                    <input required type="number" min="0" placeholder="500" value={newService.price} onChange={e=>setNewService({...newService, price: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                  </div>
                </div>
                <button disabled={createServiceMutation.isPending} type="submit" className="w-full bg-gradient-to-r from-brand-primary to-blue-500 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4">
                  <Plus size={18} /> {createServiceMutation.isPending ? 'Creating...' : 'Launch Service'}
                </button>
              </form>
            </div>
          </div>
        )}

        {}
        {activeTab === 'availability' && (
          <div className="animate-fade-up max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Clock className="text-brand-primary" /> Weekly Availability
              </h2>
              <p className="text-slate-400 text-sm font-medium">Set your standard working hours</p>
            </div>

            <div className="space-y-3 relative z-10">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const data = availability[day] || { isAvailable: false, slots: [] };
                return (
                  <div key={day} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${data.isAvailable ? 'bg-brand-primary/5 border-brand-primary/20' : 'bg-white/5 border-white/5'}`}>
                    
                    <div className="flex items-center gap-4 w-full sm:w-1/3 mb-4 sm:mb-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={data.isAvailable}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setAvailability(prev => ({ 
                              ...prev, 
                              [day]: { 
                                isAvailable: isChecked, 
                                slots: isChecked ? [{ start: "09:00", end: "17:00" }] : [] 
                              } 
                            }));
                          }}
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                      <span className={`font-bold text-lg capitalize ${data.isAvailable ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                    </div>

                    <div className="flex-1 flex justify-end">
                      {data.isAvailable && data.slots.length > 0 ? (
                        <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-white/10">
                          <input 
                            type="time" 
                            value={data.slots[0]?.start || "09:00"} 
                            onChange={(e) => setAvailability(prev => {
                              const newDay = { ...prev[day] }; 
                              if(!newDay.slots[0]) newDay.slots[0] = {start:"09:00", end:"17:00"};
                              newDay.slots[0].start = e.target.value; 
                              return { ...prev, [day]: newDay };
                            })} 
                            className="bg-transparent text-white font-bold px-2 py-1 outline-none text-sm cursor-pointer" 
                          />
                          <span className="text-brand-primary font-bold px-1">-</span>
                          <input 
                            type="time" 
                            value={data.slots[0]?.end || "17:00"} 
                            onChange={(e) => setAvailability(prev => {
                              const newDay = { ...prev[day] }; 
                              if(!newDay.slots[0]) newDay.slots[0] = {start:"09:00", end:"17:00"};
                              newDay.slots[0].end = e.target.value; 
                              return { ...prev, [day]: newDay };
                            })} 
                            className="bg-transparent text-white font-bold px-2 py-1 outline-none text-sm cursor-pointer" 
                          />
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium text-sm italic px-4 py-2">Unavailable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end relative z-10">
              <button 
                onClick={() => updateAvailabilityMutation.mutate()} 
                disabled={updateAvailabilityMutation.isPending} 
                className="bg-gradient-to-r from-brand-primary to-blue-500 text-white font-black px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 flex items-center gap-2"
              >
                {updateAvailabilityMutation.isPending ? 'Saving...' : 'Save Availability Changes'}
              </button>
            </div>
          </div>
        )}

        {}
        {activeTab === 'bookings' && (
          <div className="animate-fade-up space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Users className="text-brand-primary" /> Manage Bookings
              </h2>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
              {upcomingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-500 mb-6">
                    <Calendar size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No upcoming bookings</h3>
                  <p className="text-slate-400 font-medium max-w-md mx-auto">Your schedule is currently clear. Once a student books a session with you, it will appear here so you can track your registered mentees.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {upcomingBookings.map(b => (
                    <div key={b._id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 hover:bg-white/10 p-6 rounded-2xl border border-white/10 transition-colors gap-6 group">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <img src={b.user?.profilePicture || 'https://api.dicebear.com/7.x/notionists/svg?seed='+b.user?.name} className="w-14 h-14 rounded-2xl bg-slate-800 object-cover" alt="User" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#060B18] rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-bold text-lg text-white mb-1">{b.user?.name} <span className="text-slate-500 text-sm font-medium ml-2">@{b.user?.username || 'mentee'}</span></p>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                            <span className="bg-brand-primary/20 text-brand-primary px-2.5 py-1 rounded-md">{b.service?.title}</span>
                            <span className="bg-white/5 px-2.5 py-1 rounded-md flex items-center gap-1.5"><Calendar size={12}/> {new Date(b.date).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</span>
                            <span className="bg-white/5 px-2.5 py-1 rounded-md flex items-center gap-1.5"><Clock size={12}/> {b.startTime}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 border-t border-white/10 md:border-0 pt-4 md:pt-0">
                        <div className="text-left md:text-right">
                          <p className="text-emerald-400 font-black text-lg">₹{b.amount - (b.platformFee || 0)}</p>
                          <div className="flex items-center gap-1.5 justify-start md:justify-end mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Confirmed</span>
                          </div>
                        </div>
                        {b.meetingLink && (
                          <a href={b.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/10 hover:bg-brand-primary text-white hover:text-white px-5 py-2 rounded-xl font-bold text-sm transition-all group-hover:shadow-lg">
                            <Video size={16} /> Connect
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
