import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Plus, 
  CheckCheck,
  Info,
  MessageSquare
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessagingService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export const KDSMessages = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', tenant?.id],
    queryFn: () => MessagingService.getConversations(tenant?.id || '', user?.id || ''),
    enabled: !!tenant?.id && !!user?.id,
  });

  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations, activeConversation]);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeConversation],
    queryFn: () => MessagingService.getMessages(activeConversation || ''),
    enabled: !!activeConversation,
    refetchInterval: 5000,
  });

  // Mark active conversation as read
  useEffect(() => {
    if (activeConversation && user?.id) {
      MessagingService.markMessagesAsRead(activeConversation, user.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations', tenant?.id] });
      });
    }
  }, [activeConversation, messages, user?.id, tenant?.id, queryClient]);

  useEffect(() => {
    if (!activeConversation) return;
    const channel = supabase
      .channel('kds-messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation}` },
        () => {
          if (activeConversation && user?.id) {
            MessagingService.markMessagesAsRead(activeConversation, user.id).then(() => {
              queryClient.invalidateQueries({ queryKey: ['conversations', tenant?.id] });
            });
          }
          queryClient.invalidateQueries({ queryKey: ['messages', activeConversation] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, tenant?.id, user?.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: () => MessagingService.sendMessage(activeConversation || '', user?.id || '', messageInput),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', tenant?.id] });
    }
  });

  const filteredConversations = conversations.filter((c: any) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConvData = conversations.find((c: any) => c.id === activeConversation);

  const getTimeLabel = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col md:flex-row gap-8 relative">

      {/* ── Responsive restaurant-themed background artwork (mobile/tablet only) ── */}
      <div className="lg:hidden fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* food cloche bottom-left */}
        <svg className="absolute bottom-20 -left-6 w-48 h-48 opacity-[0.035] text-white rotate-12" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 25 A 30 30 0 0 0 20 55 L 80 55 A 30 30 0 0 0 50 25 Z"/>
          <rect x="18" y="58" width="64" height="4" rx="2"/>
          <circle cx="50" cy="20" r="4"/>
        </svg>
        {/* coffee cup top-right */}
        <svg className="absolute top-16 -right-8 w-44 h-44 opacity-[0.03] text-white" viewBox="0 0 80 80" fill="currentColor">
          <rect x="10" y="30" width="40" height="35" rx="4"/>
          <path d="M50 38 Q65 38 65 48 Q65 58 50 58" fill="none" stroke="currentColor" strokeWidth="4"/>
          <rect x="15" y="22" width="30" height="10" rx="3"/>
          <path d="M22 18 Q22 10 28 10 Q28 18 28 18" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>

      {/* Sidebar: Contacts */}
      <Card className="w-full md:w-80 shrink-0 bg-[#0C0F24]/50 border border-[#232B5E]/20 shadow-2xl flex flex-col p-0 z-10">
        <div className="p-6 border-b border-[#232B5E]/20">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Kitchen Chat</h3>
              <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center cursor-pointer hover:bg-[#F97316]/20 transition-colors">
                 <Plus size={16} strokeWidth={3} />
              </div>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#1E293B]/20 border border-[#232B5E]/20 text-white text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]"
                placeholder="Search staff..."
              />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
           {filteredConversations.length > 0 ? (
             filteredConversations.map((conv: any) => (
               <div
                 key={conv.id}
                 onClick={() => setActiveConversation(conv.id)}
                 className={cn(
                   "p-4 rounded-2xl flex gap-4 cursor-pointer transition-all border border-transparent",
                   activeConversation === conv.id 
                     ? "bg-[#3A36A0]/25 border border-[#3A36A0]/40" 
                     : "hover:bg-[#1E293B]/30"
                 )}
               >
                  <div className="relative shrink-0">
                     <div className="w-12 h-12 rounded-xl bg-[#1E293B]/30 border border-[#232B5E]/20 flex items-center justify-center shadow-sm">
                       <MessageSquare size={20} className="text-[#94A3B8]" />
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white truncate">{conv.name}</h4>
                        <span className="text-[10px] text-[#94A3B8] font-medium">{getTimeLabel(conv.lastMessageTime)}</span>
                     </div>
                     <p className="text-[11px] text-[#94A3B8] truncate leading-tight">{conv.lastMessage || 'No messages yet'}</p>
                   </div>
               </div>
             ))
           ) : (
             <div className="p-6 text-center">
               <MessageSquare size={32} className="text-[#94A3B8] mx-auto mb-3" />
               <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">No conversations</p>
             </div>
           )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 bg-[#0C0F24]/50 border border-[#232B5E]/20 shadow-2xl flex flex-col p-0 overflow-hidden z-10">
         <div className="p-6 border-b border-[#232B5E]/20 flex items-center justify-between bg-[#131A38]/10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-[#1E293B]/30 border border-[#232B5E]/20 flex items-center justify-center shadow-sm">
                 <MessageSquare size={20} className="text-[#94A3B8]" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-white">{activeConvData?.name || 'Select a conversation'}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                  </div>
               </div>
            </div>
            <button className="w-10 h-10 rounded-xl bg-[#1E293B]/30 border border-[#232B5E]/20 text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/50 transition-all flex items-center justify-center cursor-pointer"><Info size={18} /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#090D1F]/20">
            {messages.length > 0 ? (
               messages.map((msg: any) => {
                 const isMe = msg.senderId === user?.id;
                 return (
                   <div key={msg.id} className={cn(
                     "flex flex-col max-w-[70%]",
                     isMe ? "ml-auto items-end" : "items-start"
                   )}>
                      {!isMe && <span className="text-[10px] font-bold text-indigo-300 mb-1">{msg.senderName}</span>}
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium shadow-sm",
                        isMe 
                          ? "bg-[#3A36A0]/80 text-white rounded-br-none" 
                          : "bg-[#1E293B]/40 text-white border border-[#232B5E]/20 rounded-bl-none"
                      )}>
                         {msg.content}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="text-[10px] font-bold text-[#94A3B8] uppercase">{getTimeLabel(msg.createdAt)}</span>
                         {isMe && <CheckCheck size={12} className="text-emerald-500" />}
                      </div>
                   </div>
                 );
               })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <MessageSquare size={40} className="text-[#232B5E] mb-3" />
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">No messages yet</p>
              </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         <div className="p-6 border-t border-[#232B5E]/20 bg-[#131A38]/10">
            <div className="relative">
               <input
                 value={messageInput}
                 onChange={(e) => setMessageInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && messageInput.trim() && activeConversation) sendMutation.mutate();
                 }}
                 className="w-full h-14 pl-6 pr-16 rounded-2xl bg-[#1E293B]/20 border border-[#232B5E]/20 text-white text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]"
                 placeholder="Type a message..."
                 disabled={!activeConversation}
               />
               <button
                 onClick={() => { if (messageInput.trim() && activeConversation) sendMutation.mutate(); }}
                 disabled={!messageInput.trim() || !activeConversation || sendMutation.isPending}
                 className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 hover:bg-[#ea580c] transition-all active:scale-[0.95] disabled:opacity-50 cursor-pointer"
               >
                  <Send size={18} strokeWidth={3} />
               </button>
            </div>
         </div>
      </Card>
    </div>
  );
};
