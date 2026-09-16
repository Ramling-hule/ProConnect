"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import {
  Send, Paperclip, ArrowLeft, FileText, Check, X, Copy, Users, UserPlus,
  Download, Image as ImageIcon, File as FileIcon, Loader2,
  FolderOpen, Grid, Shield, Trash2, Smile, Link as LinkIcon, AlertTriangle, Info
} from "lucide-react";
import { API_BASE_URL } from "@/utils/config";
import { toast } from "react-hot-toast";
import { format, isToday, isYesterday } from "date-fns";
import { useRouter } from "next/navigation";

let socket;

export default function GroupChatWindow({ group: initialGroup, user, onBack }) {
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

  const [activeSidePanel, setActiveSidePanel] = useState(null);
  const [mediaFiles, setMediaFiles] = useState({ images: [], docs: [], links: [] });
  const [mediaTab, setMediaTab] = useState("images");

  const messagesEndRef = useRef(null);

  const isAdmin = useMemo(() => {
    if (!group?.admins || !user) return false;
    const myId = user.id || user._id;
    return group.admins.some((admin) => {
      const adminId = typeof admin === "object" ? admin._id : admin;
      return adminId?.toString() === myId?.toString();
    });
  }, [group.admins, user]);

  useEffect(() => { setGroup(initialGroup); }, [initialGroup]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    socket = io(`${API_BASE_URL}`);
    socket.emit("join_group", group._id);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}/messages`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        setMessages(data);
        extractLinks(data);
      } catch (e) { console.error(e); }
    };

    const fetchGroupDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (data._id) setGroup(prev => ({ ...prev, ...data }));
      } catch (e) { console.error(e); }
    };

    fetchMessages();
    fetchGroupDetails();

    socket.on("receive_group_message", (msg) => {
      setMessages((prev) => {
        const newMsgs = [...prev, msg];
        extractLinks(newMsgs);
        return newMsgs;
      });
      if (msg.fileUrl) updateLocalMedia(msg);
    });

    return () => socket.disconnect();
  }, [group._id, user.token]);

  const extractLinks = (msgs) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundLinks = [];
    msgs.forEach((msg) => {
      if (msg.text) {
        const matches = msg.text.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            foundLinks.push({ url, sender: msg.sender, createdAt: msg.createdAt });
          });
        }
      }
    });
    setMediaFiles((prev) => ({ ...prev, links: foundLinks.reverse() }));
  };

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}/media`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      const images = data.filter((m) => m.fileType === "image");
      const docs = data.filter((m) => m.fileType === "file");
      setMediaFiles((prev) => ({ ...prev, images, docs }));
    } catch (error) { console.error(error); }
  }, [group._id, user.token]);

  useEffect(() => { if (activeSidePanel === "media") fetchMedia(); }, [activeSidePanel, fetchMedia]);

  const updateLocalMedia = (msg) => {
    if (msg.fileType === "image") setMediaFiles((prev) => ({ ...prev, images: [msg, ...prev.images] }));
    else setMediaFiles((prev) => ({ ...prev, docs: [msg, ...prev.docs] }));
  };

  const handleDeleteGroup = async () => {
    if (!confirm("⚠️ DANGER: This will permanently delete the group. Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        toast.success("Group deleted");
        onBack();
        window.location.reload();
      } else { toast.error("Failed to delete group"); }
    } catch (error) { toast.error("Server error"); }
  };

  const removeMember = async (memberId) => {
    if (!confirm("Remove this user?")) return;
    setGroup(prev => ({ ...prev, members: prev.members.filter(m => (typeof m === 'object' ? m._id : m) !== memberId) }));
    toast.success("Member removed");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setIsUploading(true);
    setShowEmojiPicker(false);

    try {
      let fileUrl = "", fileType = "none", fileName = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST", headers: { Authorization: `Bearer ${user.token}` }, body: formData,
        });
        const d = await uploadRes.json();
        fileUrl = d.url; fileName = file.name;
        fileType = file.type.startsWith("image/") ? "image" : "file";
      }
      socket.emit("send_group_message", {
        senderId: user.id || user._id, groupId: group._id, text, fileUrl, fileType, fileName,
      });
      setText(""); setFile(null);
    } catch (e) { toast.error("Error sending message"); }
    finally { setIsUploading(false); }
  };

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}/requests`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      setJoinRequests(data);
    } catch (error) { console.error("Failed to fetch requests", error); }
  }, [group._id, user.token]);

  useEffect(() => { if (showInviteModal && isAdmin) fetchRequests(); }, [showInviteModal, isAdmin, fetchRequests]);

  const handleRequestAction = async (requesterId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/handle-request`, {
        method: 'POST',
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ groupId: group._id, requesterId, action })
      });
      if (res.ok) {
        setJoinRequests(prev => prev.filter(req => req._id !== requesterId));
        if (action === 'accept') {
          toast.success("User added!");
          setGroup(prev => ({ ...prev, members: [...prev.members, requesterId] }));
        } else toast.success("Rejected");
      }
    } catch (error) { toast.error("Action failed"); }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement("a"); link.href = url; link.download = filename || "download";
    link.target = "_blank"; link.rel = "noopener noreferrer";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const renderMessageContent = (msg, isMe) => {
    if (msg.fileType === "image" && msg.fileUrl) {
      return (
        <div className="mt-1">
          {msg.text && <p className="mb-2">{msg.text}</p>}
          <div className="relative group cursor-pointer overflow-hidden rounded-lg border dark:border-slate-700">
            <img src={msg.fileUrl} alt="attachment" className="max-w-full h-auto max-h-60 object-cover rounded-lg" onClick={() => window.open(msg.fileUrl, "_blank")} />
            <button onClick={(e) => { e.stopPropagation(); handleDownload(msg.fileUrl, msg.fileName); }} className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Download size={16} /></button>
          </div>
        </div>
      );
    }
    if (msg.fileType === "file" && msg.fileUrl) {
      return (
        <div className="mt-1">
          {msg.text && <p className="mb-2">{msg.text}</p>}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? "bg-white/10 border-white/20" : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"}`}>
            <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg"><FileText size={24} className="text-slate-600 dark:text-slate-300" /></div>
            <div className="flex-1 overflow-hidden"><p className="text-sm font-bold truncate pr-2">{msg.fileName || "File"}</p><p className="text-[10px] opacity-70 uppercase">Document</p></div>
            <button onClick={() => handleDownload(msg.fileUrl, msg.fileName)} className={`p-2 rounded-full transition ${isMe ? "hover:bg-white/20" : "hover:bg-slate-200 dark:hover:bg-slate-600"}`}><Download size={18} /></button>
          </div>
        </div>
      );
    }
    return <p>{msg.text}</p>;
  };

  const renderMessagesWithDates = () => {
    let lastDate = null;
    return messages.map((msg, i) => {
      const dateString = new Date(msg.createdAt).toDateString();
      let showDateSeparator = false;
      if (dateString !== lastDate) { showDateSeparator = true; lastDate = dateString; }

      const msgSenderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
      const myId = user.id || user._id;
      const isMe = msgSenderId?.toString() === myId?.toString();
      const senderName = typeof msg.sender === "object" ? msg.sender.name : "Unknown";
      const senderPic = typeof msg.sender === "object" ? msg.sender.profilePicture : null;

      return (
        <React.Fragment key={i}>
          {showDateSeparator && (
            <div className="flex justify-center my-4"><span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{format(new Date(msg.createdAt), "MMMM d, yyyy")}</span></div>
          )}
          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            {!isMe && (
              <div className="w-8 h-8 rounded-full bg-slate-200 mr-2 overflow-hidden flex-shrink-0">
                {senderPic ? <img src={senderPic} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">{senderName?.[0]}</div>}
              </div>
            )}
            <div className={`max-w-[75%] sm:max-w-[60%] p-3 rounded-2xl ${isMe ? "bg-brand-primary text-white rounded-tr-none" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none"}`}>
              {!isMe && <p className="text-xs font-bold opacity-70 mb-1">{senderName}</p>}
              {renderMessageContent(msg, isMe)}
              <p className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-100" : "opacity-50"}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (

    <div className="flex flex-col h-[100dvh] bg-white dark:bg-slate-900 overflow-hidden relative">

      <div className={`flex-1 flex flex-col h-full relative ${activeSidePanel ? "hidden md:flex" : "flex"}`}>

        <div className="sticky top-0 z-50 p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={onBack} className="md:hidden p-2 flex-shrink-0"><ArrowLeft /></button>
            <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0">
              {group.image ? <img src={group.image} className="w-full h-full object-cover" alt="Group Icon" /> : <span className="text-slate-500 font-bold">{group.name?.[0]}</span>}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold dark:text-white truncate">{group.name}</h3>

              <p className="text-xs text-slate-500 truncate">
                {group.description || `${group.members?.length || 0} members`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setActiveSidePanel(activeSidePanel === "media" ? null : "media")} className={`p-2 rounded-full transition ${activeSidePanel === "media" ? "bg-brand-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-white"}`} title="Resources"><FolderOpen size={18} /></button>
            <button onClick={() => setActiveSidePanel(activeSidePanel === "members" ? null : "members")} className={`p-2 rounded-full transition ${activeSidePanel === "members" ? "bg-brand-primary text-white" : "hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-white"}`} title="Members"><Users size={18} /></button>
            <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 text-xs bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-full dark:text-white hover:bg-slate-300 transition ml-2"><UserPlus size={14} /><span className="hidden sm:inline">Invite</span></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {renderMessagesWithDates()}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900 relative">
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-10 shadow-xl rounded-xl">
              <EmojiPicker onEmojiClick={(emoji) => setText(prev => prev + emoji.emoji)} theme="auto" />
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-yellow-500 transition hover:bg-slate-100 rounded-full"><Smile size={20} /></button>
            <label className={`p-2 rounded-full cursor-pointer transition ${file ? "bg-brand-primary text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              <Paperclip size={20} />
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <div className="flex-1 flex flex-col relative">
              {file && (
                <div className="absolute -top-12 left-0 right-0 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg flex justify-between items-center text-xs animate-in slide-in-from-bottom-2 border dark:border-slate-700">
                  <span className="truncate max-w-[200px] flex items-center gap-1 dark:text-white">{file.type.startsWith("image/") ? <ImageIcon size={12} /> : <FileIcon size={12} />} {file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-slate-500 hover:text-red-500"><X size={14} /></button>
                </div>
              )}
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." disabled={isUploading} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-full outline-none dark:text-white disabled:opacity-50" />
            </div>
            <button type="submit" disabled={isUploading || (!text.trim() && !file)} className="p-3 bg-brand-primary text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center">
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>

      {activeSidePanel && (
        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950 border-l dark:border-slate-800 h-full flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold dark:text-white">{activeSidePanel === "media" ? "Resources Hub" : "Members"}</h3>
            <button onClick={() => setActiveSidePanel(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} className="text-slate-500" /></button>
          </div>

          {activeSidePanel === "media" && (
            <>
              <div className="flex border-b dark:border-slate-800">
                <button onClick={() => setMediaTab("images")} className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${mediaTab === "images" ? "border-b-2 border-brand-primary text-brand-primary" : "text-slate-500"}`}><ImageIcon size={14} /> IMG</button>
                <button onClick={() => setMediaTab("docs")} className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${mediaTab === "docs" ? "border-b-2 border-brand-primary text-brand-primary" : "text-slate-500"}`}><FileText size={14} /> DOCS</button>
                <button onClick={() => setMediaTab("links")} className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${mediaTab === "links" ? "border-b-2 border-brand-primary text-brand-primary" : "text-slate-500"}`}><LinkIcon size={14} /> LINKS</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {mediaTab === "links" ? (
                  <div className="space-y-3">
                    {mediaFiles.links.length === 0 && <p className="text-center text-xs text-slate-400 mt-10">No links shared</p>}
                    {mediaFiles.links.map((link, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 hover:shadow-sm transition">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-lg h-fit"><LinkIcon size={16} /></div>
                        <div className="overflow-hidden">
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-primary hover:underline truncate block">{link.url}</a>
                          <p className="text-[10px] text-slate-400 mt-1">By {typeof link.sender === "object" ? link.sender.name : "User"} • {format(new Date(link.createdAt), "MMM d")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : mediaTab === "images" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {mediaFiles.images.map((img, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-200 cursor-pointer border dark:border-slate-800">
                        <img src={img.fileUrl} alt="media" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button onClick={() => window.open(img.fileUrl, "_blank")} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"><Grid size={14} /></button>
                          <button onClick={() => handleDownload(img.fileUrl, img.fileName)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"><Download size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mediaFiles.docs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 hover:shadow-sm transition">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg"><FileText size={20} /></div>
                        <div className="flex-1 overflow-hidden"><p className="text-sm font-medium truncate dark:text-slate-200">{doc.fileName}</p><p className="text-[10px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p></div>
                        <button onClick={() => handleDownload(doc.fileUrl, doc.fileName)} className="p-2 text-slate-400 hover:text-brand-primary"><Download size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSidePanel === "members" && (
            <div className="flex-1 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                {group.members && group.members.map((member) => {
                  if (typeof member === "string") return null;

                  const memberId = member._id;
                  const memberName = member.name || "Unknown User";
                  const memberPic = member.profilePicture;
                  const isMemberAdmin = group.admins.some((a) => (typeof a === "object" ? a._id : a) === memberId);
                  const isCurrentUser = memberId?.toString() === (user.id || user._id)?.toString();

                  return (
                    <div key={memberId} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        {memberPic ? <img src={memberPic} className="w-full h-full object-cover" alt={memberName} /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{memberName[0]}</div>}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm dark:text-white">{memberName}</h4>
                        <span className="text-[10px] text-slate-500">{isMemberAdmin ? "Admin" : member.instituteName || "Student"}</span>
                      </div>
                      {isAdmin && !isCurrentUser && (
                        <button onClick={() => removeMember(memberId)} className="ml-auto text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
              {isAdmin && (
                <div className="p-4 border-t dark:border-slate-800 bg-red-50 dark:bg-red-900/10">
                  <h4 className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-2"><AlertTriangle size={14} /> Danger Zone</h4>
                  <button onClick={handleDeleteGroup} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 text-red-600 p-3 rounded-lg hover:bg-red-500 hover:text-white transition text-sm font-bold"><Trash2 size={16} /> Delete Group</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 relative border dark:border-slate-800">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition"><X size={20} /></button>
            <h3 className="font-bold mb-4 text-lg dark:text-white">Invite to Group</h3>
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Group Link</label>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-transparent focus-within:border-brand-primary transition">
                <code className="text-sm flex-1 truncate text-slate-600 dark:text-slate-300">{window.location.origin}/join/{group._id}</code>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${group._id}`); toast.success("Link copied!"); }} className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm hover:text-brand-primary transition" title="Copy Link"><Copy size={16} /></button>
              </div>
            </div>

            {isAdmin && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Users size={14} /> Pending Requests</label>
                  {joinRequests.length > 0 && <span className="bg-brand-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{joinRequests.length}</span>}
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border dark:border-slate-800">
                  {joinRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2"><Users size={24} className="opacity-20" /> No pending requests</div>
                  ) : (
                    joinRequests.map(req => (
                      <div key={req._id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                            {req.profilePicture ? <img src={req.profilePicture} className="w-full h-full object-cover" alt={req.name} /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{req.name?.[0]}</div>}
                          </div>
                          <div><h4 className="font-bold text-sm dark:text-white">{req.name}</h4><p className="text-[10px] text-slate-500">{req.instituteName || "Student"}</p></div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleRequestAction(req._id, 'reject')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition" title="Reject"><X size={16} /></button>
                          <button onClick={() => handleRequestAction(req._id, 'accept')} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition" title="Accept"><Check size={16} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
