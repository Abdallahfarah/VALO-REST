import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MessageSquare, Search, Send, Plus, ArrowLeft, CheckCheck, 
  User, MessageCircle, AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessagingService, StaffService } from '../services/ApiService';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { toast } from '../lib/toast-store';

interface MessagingCenterDrawerProps {
  tenantId: string;
  userId: string;
  role: string;
  onClose: () => void;
}

export const MessagingCenterDrawer: React.FC<MessagingCenterDrawerProps> = ({ tenantId, userId, role, onClose }) => {
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = role === 'SUPER_ADMIN';

  // ─── Query Conversations ───
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', tenantId, userId],
    queryFn: () => MessagingService.getConversations(tenantId || '', userId),
    enabled: !!userId,
  });

  // ─── Query Staff for New Chat ───
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-chat-members', tenantId],
    queryFn: async () => {
      if (isSuperAdmin) {
        // Return a mock list of tenant admins or lookup profile users
        const { data: usersList } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role, tenants(name)')
          .eq('role', 'ADMIN');
        return (usersList || []).map((u: any) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name || ''} (${u.tenants?.name || 'Restaurant'})`,
          role: u.role
        }));
      } else {
        // Restaurant user can select other staff inside tenant
        const staff = await StaffService.getStaff(tenantId);
        // Also add the Platform Support Option
        const supportUser = {
          id: 'platform-support',
          name: '🛡️ VALO Platform Support (SUPER_ADMIN)',
          role: 'SUPER_ADMIN'
        };
        return [supportUser, ...staff.filter((s: any) => s.id !== userId)];
      }
    },
    enabled: isNewChatOpen && (!!tenantId || isSuperAdmin),
  });

  // ─── Query Messages ───
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeConversation],
    queryFn: () => MessagingService.getMessages(activeConversation || ''),
    enabled: !!activeConversation,
  });

  // Realtime messages & typing presence channels
  useEffect(() => {
    if (!userId || !tenantId) return;

    const channel = supabase
      .channel('messages-realtime-drawer')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `tenant_id=eq.${tenantId}` },
        (payload: any) => {
          if (activeConversation && payload.new.conversation_id === activeConversation) {
            refetchMessages();
            // Mark read timestamp
            localStorage.setItem(`last_read_${activeConversation}_${userId}`, new Date().toISOString());
          }
          refetchConversations();
          queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, tenantId, activeConversation, refetchMessages, refetchConversations, queryClient]);

  // Presence channel for Typing Indicator
  useEffect(() => {
    if (!activeConversation) return;

    const typingChannel = supabase.channel(`typing-${activeConversation}`);

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload.payload.userId !== userId) {
          const userName = payload.payload.userName;
          setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
          
          // Clear after 3 seconds of inactivity
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== userName));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [activeConversation, userId]);

  // Handle typing broadcast
  const handleTyping = () => {
    if (!activeConversation) return;

    // Broadcast typing event
    const typingChannel = supabase.channel(`typing-${activeConversation}`);
    const userName = localStorage.getItem('user_first_name') || 'Someone';
    
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, userName }
    });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConversation]);

  // Mutations
  const sendMutation = useMutation({
    mutationFn: () => MessagingService.sendMessage(activeConversation || '', userId, messageInput, tenantId),
    onSuccess: () => {
      setMessageInput('');
      refetchMessages();
      refetchConversations();
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    }
  });

  const createConvMutation = useMutation({
    mutationFn: async (targetUser: any) => {
      // Check if conversation already exists with this user
      // Create conversation
      let convName = targetUser.name;
      if (targetUser.role === 'SUPER_ADMIN') {
        convName = 'VALO Platform Support';
      }
      
      const conv = await MessagingService.createConversation(
        tenantId || '00000000-0000-0000-0000-000000000000',
        convName,
        [userId, targetUser.id]
      );
      return conv;
    },
    onSuccess: (newConv) => {
      setIsNewChatOpen(false);
      refetchConversations();
      setActiveConversation(newConv.id);
      toast.success('Conversation Created', 'Start typing to message.');
    },
    onError: (err: any) => {
      toast.error('Failed to create chat', err.message || 'Error occurred.');
    }
  });

  const handleOpenConversation = (convId: string) => {
    setActiveConversation(convId);
    // Mark as read
    localStorage.setItem(`last_read_${convId}_${userId}`, new Date().toISOString());
    refetchConversations();
    queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
  };

  const filteredConversations = conversations.filter((c: any) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvData = conversations.find((c: any) => c.id === activeConversation);

  const getTimeLabel = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-100 z-[999] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      
      {/* ─── Pane 1: Conversations List ─── */}
      {!activeConversation && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <div>
              <h3 className="text-base font-bold text-[#0B1630] uppercase tracking-wider">Enterprise Messenger</h3>
              <p className="text-[10px] text-[#94A3B8] font-bold mt-0.5 uppercase tracking-widest">
                {isSuperAdmin ? 'SUPERADMIN CONTROLS' : `Tenant Isolated Chat`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsNewChatOpen(true)}
                className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0b1630] hover:bg-slate-50 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-slate-50 bg-slate-50/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-100 bg-white text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] font-medium"
                placeholder="Search conversations..."
              />
            </div>
          </div>

          {/* Conversations container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/10">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv: any) => (
                <div
                  key={conv.id}
                  onClick={() => handleOpenConversation(conv.id)}
                  className="p-4 rounded-2xl flex gap-4 cursor-pointer hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                >
                  <div className="shrink-0 relative">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-[#F97316]">
                      <MessageCircle size={22} />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-[#0B1630] truncate">{conv.name || 'Chat'}</h4>
                      <span className="text-[9px] text-[#94A3B8] font-semibold">{getTimeLabel(conv.lastMessageTime)}</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] truncate font-medium leading-normal">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-[#F97316] text-white text-[9px] font-black flex items-center justify-center mt-1">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <MessageSquare size={32} className="text-slate-300 mb-3" />
                <h5 className="text-xs font-bold text-[#0b1630] uppercase tracking-wider">No conversations</h5>
                <p className="text-[11px] text-[#94A3B8] mt-1">Click the + button to message other staff members.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Pane 2: Chat Window ─── */}
      {activeConversation && activeConvData && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveConversation(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h4 className="text-xs font-bold text-[#0B1630]">{activeConvData.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0b1630] hover:bg-slate-50 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.map((msg: any) => {
              const isMe = msg.senderId === userId;
              return (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[75%]",
                  isMe ? "ml-auto items-end" : "items-start"
                )}>
                  {!isMe && (
                    <span className="text-[9px] font-bold text-[#94A3B8] mb-1">{msg.senderName}</span>
                  )}
                  <div className={cn(
                    "p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm",
                    isMe ? "bg-[#0B1630] text-white rounded-br-none" : "bg-white text-[#0B1630] border border-slate-100 rounded-bl-none"
                  )}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase">{getTimeLabel(msg.createdAt)}</span>
                    {isMe && <CheckCheck size={11} className="text-emerald-500" />}
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] font-bold italic animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>{typingUsers.join(', ')} is typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input controls */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <input
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && messageInput.trim() && activeConversation) {
                    sendMutation.mutate();
                  }
                }}
                className="w-full h-12 pl-4 pr-16 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]"
                placeholder="Type your message here..."
              />
              <button
                onClick={() => {
                  if (messageInput.trim() && activeConversation) {
                    sendMutation.mutate();
                  }
                }}
                disabled={!messageInput.trim() || sendMutation.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#F97316] text-white flex items-center justify-center hover:bg-[#ea580c] transition-all active:scale-[0.95] disabled:opacity-50 cursor-pointer shadow-md shadow-orange-500/10"
              >
                <Send size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── New Chat Modal ─── */}
      {isNewChatOpen && (
        <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-bold text-[#0B1630] uppercase tracking-wider">Start Conversation</h4>
              <button onClick={() => setIsNewChatOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]"
                placeholder="Search staff members..."
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {staffMembers
                .filter((member: any) => member.name.toLowerCase().includes(newChatSearch.toLowerCase()))
                .map((member: any) => (
                  <button
                    key={member.id}
                    onClick={() => createConvMutation.mutate(member)}
                    className="w-full p-3 rounded-xl flex items-center gap-3 text-left hover:bg-slate-50 transition-all border border-transparent hover:border-slate-50 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 text-[#F97316] flex items-center justify-center text-xs font-bold group-hover:bg-[#F97316] group-hover:text-white transition-all shrink-0">
                      <User size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#0B1630] truncate">{member.name}</p>
                      <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mt-0.5">{member.role}</p>
                    </div>
                  </button>
                ))}
              {staffMembers.length === 0 && (
                <div className="text-center py-6">
                  <AlertCircle size={20} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">No other members found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
