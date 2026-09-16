"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Send, Minimize2, Paperclip, Search, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { closeChat } from '@/redux/features/chatSlice';
import io from 'socket.io-client';
import apiClient from '@/services/apiClient';
import { API_BASE_URL } from '@/utils/config';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/utils/errorHelper';

let socket; 

export default function ChatWindow() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isOpen, activeChatUser } = useSelector((state) => state.chat);
  const { isDark } = useSelector((state) => state.theme);

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef(null);

  const currentUserId = user?.id || user?._id;
  const otherUserId = activeChatUser?._id || activeChatUser?.id;

  const getRoomId = (id1, id2) => {
    if (!id1 || !id2) return "default_room";
    return [id1, id2].sort().join('_');
  };

  useEffect(() => {
    if (isOpen && currentUserId && otherUserId) {
      socket = io(`${API_BASE_URL}`);
      
      const roomId = getRoomId(currentUserId, otherUserId);
      socket.emit('join_chat', roomId);
      socket.emit('read_messages', { senderId: otherUserId, receiverId: currentUserId });

      apiClient.get(`/api/messages/${currentUserId}/${otherUserId}`)
        .then(({ data }) => {
            const msgs = data.data || data;
            if (Array.isArray(msgs)) {
                setChatHistory(msgs);
            } else {
                console.error("API Error: Expected array but got:", data);
                setChatHistory([]); 
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            setChatHistory([]); 
        });

      socket.on('receive_message', (newMessage) => {
         if (newMessage.sender === otherUserId) {
            setChatHistory((prev) => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
            socket.emit('read_messages', { senderId: otherUserId, receiverId: currentUserId });
         }
      });

      socket.on('messages_read', ({ senderId, receiverId }) => {
         if (senderId === currentUserId && receiverId === otherUserId) {
            setChatHistory((prev) => 
               prev.map(msg => 
                  msg.sender === currentUserId ? { ...msg, status: 'read' } : msg
               )
            );
         }
      });

      socket.on('messages_delivered', ({ senderId, receiverId }) => {
         if (senderId === currentUserId && receiverId === otherUserId) {
            setChatHistory((prev) => 
               prev.map(msg => 
                  msg.sender === currentUserId && msg.status === 'sent' ? { ...msg, status: 'delivered' } : msg
               )
            );
         }
      });

      socket.on('message_status_update', ({ messageId, status }) => {
         setChatHistory((prev) => 
            prev.map(msg => 
               msg._id === messageId ? { ...msg, status } : msg
            )
         );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, currentUserId, otherUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUserId || !otherUserId) return;

    const roomId = getRoomId(currentUserId, otherUserId);
    const msgData = {
      senderId: currentUserId,
      receiverId: otherUserId,
      text: message,
      room: roomId,
    };

    socket.emit('send_message', msgData);

    setChatHistory((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { 
            sender: currentUserId, 
            text: message, 
            status: 'sent',
            createdAt: new Date().toISOString() 
        }
    ]);

    setMessage("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data: uploadData } = await apiClient.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const roomId = getRoomId(currentUserId, otherUserId);
      const msgData = {
        senderId: currentUserId,
        receiverId: otherUserId,
        text: "",
        fileUrl: uploadData.url,
        fileType: uploadData.resource_type === 'image' ? 'image' : 'file',
        fileName: uploadData.original_filename || file.name,
        room: roomId,
      };

      socket.emit('send_message', msgData);

      setChatHistory((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { 
          sender: currentUserId, 
          text: "", 
          fileUrl: uploadData.url,
          fileType: uploadData.resource_type === 'image' ? 'image' : 'file',
          fileName: uploadData.original_filename || file.name,
          status: 'sent',
          createdAt: new Date().toISOString() 
        }
      ]);
    } catch (err) {
      const msg = extractErrorMessage(err, "File upload failed. Please try again.");
      console.error("File upload failed:", msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <mark key={index} className="bg-yellow-300 text-black rounded px-0.5">{part}</mark> 
        : part
    );
  };

  const renderTicks = (msg) => {
    if (msg.sender !== currentUserId) return null;
    if (msg.status === 'read') {
      return <span className="text-blue-400 font-bold ml-1 text-[10px]" title="Read">✓✓</span>;
    }
    if (msg.status === 'delivered') {
      return <span className="text-slate-300 font-bold ml-1 text-[10px]" title="Delivered">✓✓</span>;
    }
    return <span className="text-slate-400 font-bold ml-1 text-[10px]" title="Sent">✓</span>;
  };

  const renderMessageContent = (msg, isMe) => {
    if (msg.fileType === "image" && msg.fileUrl) {
      return (
        <div className="mt-1">
          {msg.text && <p className="mb-2">{msg.text}</p>}
          <div className="relative group cursor-pointer overflow-hidden rounded-lg border dark:border-slate-700">
            <img 
              src={msg.fileUrl} 
              alt="attachment" 
              className="max-w-full h-auto max-h-40 object-cover rounded-lg" 
              onClick={() => window.open(msg.fileUrl, "_blank")} 
            />
          </div>
        </div>
      );
    }
    if (msg.fileType === "file" && msg.fileUrl) {
      return (
        <div className="mt-1">
          {msg.text && <p className="mb-2">{msg.text}</p>}
          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${isMe ? "bg-white/10 border-white/20" : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"}`}>
            <FileText size={16} />
            <span className="truncate flex-1 font-bold">{msg.fileName || "File"}</span>
            <a 
              href={msg.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`p-1 rounded text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-600 ${isMe ? 'text-white' : 'text-brand-primary'}`}
            >
              Get
            </a>
          </div>
        </div>
      );
    }
    return <p>{highlightText(msg.text || "", searchQuery)}</p>;
  };
  const displayedMessages = searchQuery.trim()
    ? chatHistory.filter(msg => msg.text && msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatHistory;

  if (!isOpen || !activeChatUser) return null;

  return (
    <div className={`fixed bottom-12 right-4 w-80 md:w-96 rounded-t-xl shadow-2xl border z-50 flex flex-col ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} style={{ height: '450px' }}>
      <div className="bg-brand-primary text-white p-3 rounded-t-xl flex justify-between items-center cursor-pointer shadow-md">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
               {activeChatUser.name?.[0] || "?"}
            </div>
            <div>
               <h4 className="font-bold text-sm">{activeChatUser.name}</h4>
               <span className="text-[10px] opacity-80 block leading-none">Online</span>
            </div>
         </div>
         <div className="flex items-center gap-1.5">
             <button onClick={() => setShowSearch(!showSearch)} className="p-1 hover:bg-white/20 rounded" title="Search Messages">
                <Search size={16} />
             </button>
             <button onClick={() => dispatch(closeChat())} className="p-1 hover:bg-white/20 rounded"><Minimize2 size={16} /></button>
             <button onClick={() => dispatch(closeChat())} className="p-1 hover:bg-white/20 rounded"><X size={16} /></button>
         </div>
      </div>
      {showSearch && (
        <div className={`p-2 border-b flex items-center gap-2 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent border-none outline-none text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-[10px] text-slate-400 hover:text-slate-600">Reset</button>
          )}
        </div>
      )}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
         {displayedMessages?.map((msg, index) => {
            const isMe = msg.sender === currentUserId;
            return (
               <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      isMe 
                      ? 'bg-brand-primary text-white rounded-br-none' 
                      : isDark ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-white text-slate-800 border rounded-bl-none'
                  }`}>
                      {renderMessageContent(msg, isMe)}
                      <div className="flex items-center justify-end mt-1">
                        <span className={`text-[9px] block ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                           {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {renderTicks(msg)}
                      </div>
                  </div>
               </div>
            );
         })}
          {searchQuery && displayedMessages.length === 0 && (
            <p className="text-center text-xs text-slate-400 mt-10">No messages found matching &quot;{searchQuery}&quot;</p>
          )}
         <div ref={scrollRef} />
      </div>
      <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 items-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
         <label className="p-1.5 text-slate-400 hover:text-brand-primary rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            {isUploading ? (
              <Loader2 size={18} className="animate-spin text-brand-primary" />
            ) : (
              <Paperclip size={18} />
            )}
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
         </label>
         <input 
            type="text" 
            placeholder="Type a message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isUploading}
            className={`flex-1 bg-transparent outline-none text-sm px-2 ${isDark ? 'text-white' : 'text-slate-900'} disabled:opacity-50`}
         />
         <button 
           type="submit" 
           disabled={isUploading || !message.trim()}
           className="p-2 bg-brand-primary text-white rounded-full hover:opacity-90 transition-transform active:scale-95 disabled:opacity-50"
         >
            <Send size={18} />
         </button>
      </form>

    </div>
  );
}