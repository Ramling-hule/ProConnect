"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Users, Plus, Lock, Globe, Search, Shield, Clock, Send } from 'lucide-react';
import { openAuthModal } from '@/redux/features/authSlice';
import GroupChatWindow from '@/Components/GroupChatWindow'; 
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-hot-toast';
import { groupSchema, getZodError } from '@/utils/schemas';

export default function GroupsPage() {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const authToken = user?.token;
  
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivacy, setNewPrivacy] = useState("public");
  const [newImage, setNewImage] = useState(null);
  const [newMemberLimit, setNewMemberLimit] = useState(50);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;

    const lowerQuery = searchQuery.toLowerCase();
    return groups.filter(g =>
        g.name.toLowerCase().includes(lowerQuery) ||
        (g.instituteName && g.instituteName.toLowerCase().includes(lowerQuery))
    );
  }, [groups, searchQuery]);

  const fetchGroups = useCallback(async () => {
     try {
         const res = await fetch(`${API_BASE_URL}/api/groups`, {
            headers: { Authorization: `Bearer ${authToken}` }
         });
         const data = await res.json();
         if(Array.isArray(data)) {
             setGroups(data);
         }
     } catch (err) {
         console.error("Failed to fetch groups", err);
     }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;

    const fetchInitialGroups = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/groups`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setGroups(data);
        }
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };

    fetchInitialGroups();
  }, [authToken]);

  const handleCreate = async (e) => {
     e.preventDefault();
     
     try {
       groupSchema.parse({ name: newName, description: newDesc, memberLimit: newMemberLimit });
     } catch (err) {
       toast.error(getZodError(err));
       return;
     }

     const formData = new FormData();
     formData.append('name', newName);
     formData.append('description', newDesc);
     formData.append('privacy', newPrivacy);
     formData.append('memberLimit', newMemberLimit);
     if(newImage) formData.append('image', newImage);

     try {
         await fetch(`${API_BASE_URL}/api/groups`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.token}` },
            body: formData
         });
         
         toast.success("Group created successfully!");
         setNewName("");
         setNewDesc("");
         setNewImage(null);
         setNewMemberLimit(50);
         setShowCreateModal(false);
         fetchGroups();
     } catch (error) {
         console.error("Failed to create group", error);
         toast.error("Failed to create group");
     }
  };

  const handleRequestJoin = async (groupId, groupName) => {
      if (!user) {
          dispatch(openAuthModal("Please sign in to join groups."));
          return;
      }
      try {
          const res = await fetch(`${API_BASE_URL}/api/groups/request-join`, {
             method: 'POST',
             headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}` 
             },
             body: JSON.stringify({ groupId })
          });

          if(res.ok) {
              toast.success(`Request sent to ${groupName} admins`);
              setGroups(prev => prev.map(g => 
                  g._id === groupId ? { ...g, hasRequested: true } : g
              ));
          } else {
              toast.error("Failed to send request");
          }
      } catch (error) {
          console.error("Failed to request join", error);
      }
  };

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden shadow-sm border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
       <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col transition-all duration-300
           ${isDark ? 'border-slate-800 bg-slate-900' : 'bg-white border-slate-100'} 
           ${activeGroup ? 'hidden md:flex' : 'flex'}`}>
         <div className={`p-4 border-b space-y-3 sticky top-0 z-10 ${isDark ? 'border-slate-800 bg-slate-900' : 'bg-white border-slate-100'}`}>
             <div className="flex justify-between items-center">
                 <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-800'}`}>Groups</h2>
                 {user && (
                   <button 
                      onClick={() => setShowCreateModal(true)} 
                      className="p-2 bg-brand-primary text-white rounded-full hover:bg-blue-700 transition shadow-md shadow-blue-500/30"
                      title="Create Group"
                   >
                      <Plus size={20} />
                   </button>
                 )}
             </div>
             <div className={`flex items-center px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <Search size={16} className="text-slate-400 mr-2"/>
                <input 
                    type="text"
                    placeholder="Search by Institute or Name..."
                    className="bg-transparent border-none outline-none text-sm w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
         </div>
         <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
             {!user ? (
                 <div className="flex flex-col items-center justify-center mt-10 text-slate-400">
                    <Users size={30} className="mb-2 opacity-50"/>
                    <p className="text-sm mb-4">Sign in to discover and join groups.</p>
                    <button onClick={() => dispatch(openAuthModal("Please sign in to continue."))} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">Sign In</button>
                 </div>
             ) : filteredGroups.length === 0 && (
                 <div className="flex flex-col items-center justify-center mt-10 text-slate-400">
                    <Users size={30} className="mb-2 opacity-50"/>
                    <p className="text-sm">No groups found.</p>
                 </div>
             )}
             
             {filteredGroups.map(group => {
                const currentUserId = user?.id || user?._id;
                const isAdmin = group.admins?.some((admin) => {
                  const adminId = typeof admin === 'object' ? admin._id : admin;
                  return adminId?.toString() === currentUserId?.toString();
                });
                const isMember = group.isMember || isAdmin;
                const isPending = group.hasRequested; 
                const isFull = group.members?.length >= (group.memberLimit || 50);

                return (
                <div key={group._id} 
                     onClick={() => isMember ? setActiveGroup(group) : null}
                     className={`p-3 rounded-xl border transition-all relative ${
                        activeGroup?._id === group._id 
                        ? 'border-brand-primary bg-blue-50 dark:bg-slate-800 dark:border-blue-900' 
                        : isDark 
                            ? 'border-slate-800 hover:bg-slate-800' 
                            : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                     } ${!isMember ? 'cursor-default' : 'cursor-pointer'}`}
                >
                   <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                         {group.image ? (
                             <img src={group.image} className="w-full h-full object-cover" alt="Group" />
                         ) : (
                             <Users className="text-slate-400" size={20}/>
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <h4 className={`font-bold text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {group.name}
                            </h4>
                            {group.privacy === 'private' 
                                ? <Lock size={12} className="text-slate-400 flex-shrink-0 mt-1" title="Private"/> 
                                : <Globe size={12} className="text-green-400 flex-shrink-0 mt-1" title="Public"/>
                            }
                         </div>
                         <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                 {group.members?.length || 1} / {group.memberLimit || 50}
                             </span>
                             {group.instituteName && (
                                 <span className="text-[10px] text-brand-primary font-medium">{group.instituteName}</span>
                             )}
                         </div>

                         <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400 mb-2">{group.description}</p>
                         <div className="flex items-center justify-between mt-1">
                            {isAdmin && (
                                <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                                    <Shield size={10} /> Admin
                                </span>
                            )}
                            {!isMember && (
                                isPending ? (
                                    <button disabled className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold cursor-not-allowed">
                                        <Clock size={10} /> Requested
                                    </button>
                                ) : isFull ? (
                                    <button disabled className="flex items-center gap-1 text-[10px] bg-red-100 text-red-500 px-3 py-1 rounded-full font-bold cursor-not-allowed">
                                        <Users size={10} /> Full
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRequestJoin(group._id, group.name);
                                        }}
                                        className="flex items-center gap-1 text-[10px] bg-brand-primary text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700 transition"
                                    >
                                        <Send size={10} /> Request to Join
                                    </button>
                                )
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             )})}
         </div>
       </div>
       <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/50 ${!activeGroup ? 'hidden md:flex' : 'flex'}`}>
         {activeGroup ? (
             <GroupChatWindow 
                key={activeGroup._id} 
                group={activeGroup} 
                user={user} 
                onBack={() => setActiveGroup(null)} 
             />
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <Users size={40} className="opacity-50"/>
                </div>
                <h3 className="text-lg font-semibold mb-2">Select a group</h3>
                <p className="text-sm max-w-xs text-center opacity-70">
                    Choose a group from the list to start chatting with your community.
                </p>
             </div>
         )}
       </div>
       {showCreateModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
             <form onSubmit={handleCreate} className={`p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Group</h3>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Group Name</label>
                    <input 
                       type="text" required 
                       className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                       value={newName} onChange={e => setNewName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                    <textarea 
                       className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                       rows="3"
                       value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Privacy</label>
                        <select 
                           value={newPrivacy} onChange={e => setNewPrivacy(e.target.value)}
                           className={`w-full p-2 border rounded-lg outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                        >
                           <option value="public">Public (Open)</option>
                           <option value="private">Private (Institute)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Member Limit</label>
                        <input 
                           type="number" min="2" max="1000"
                           className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                           value={newMemberLimit} onChange={e => setNewMemberLimit(e.target.value)}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Group Icon</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setNewImage(e.target.files[0])} 
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Create Group</button>
                </div>
             </form>
         </div>
       )}
    </div>
  );
}
