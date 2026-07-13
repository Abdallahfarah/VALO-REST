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
import { UpgradePlaceholder } from '../../components/UpgradeDialog';

export const Messages = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  if (tenant?.plan === 'BASIC') {
    return <UpgradePlaceholder feature="Internal Messaging" requiredPlan="Professional" />;
  }
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Conversations ───
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', tenant?.id],
    queryFn: () => MessagingService.getConversations(tenant?.id || '', user?.id || ''),
    enabled: !!tenant?.id && !!user?.id,
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations, activeConversation]);

  // ─── Messages for active conversation ───
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeConversation],
    queryFn: () => MessagingService.getMessages(activeConversation || ''),
    enabled: !!activeConversation,
    refetchInterval: 5000,
  });

  // ─── Realtime message subscription ───
  useEffect(() => {
    if (activeConversation && user?.id) {
      MessagingService.markMessagesAsRead(activeConversation, user.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  }, [activeConversation, messages, user?.id, queryClient]);

  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', activeConversation] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, tenant?.id, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send message ───
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
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8">
      {/* Sidebar: Contacts */}
      <Card className="w-80 shrink-0 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col p-0 bg-white">
        <div className="p-6 border-b border-slate-50">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Messages</h3>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center cursor-pointer hover:bg-orange-100 transition-colors">
                 <Plus size={16} strokeWidth={3} />
              </div>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]"
                placeholder="Search contacts..."
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
                   "p-4 rounded-2xl flex gap-4 cursor-pointer transition-all",
                   activeConversation === conv.id ? "bg-indigo-50/50 border border-indigo-50" : "hover:bg-slate-50"
                 )}
               >
                  <div className="relative shrink-0">
                     <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-2xl shadow-sm">
                       <MessageSquare size={20} className="text-slate-400" />
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-[#0B1630] truncate">{conv.name}</h4>
                        <span className="text-[10px] text-[#94A3B8] font-medium">{getTimeLabel(conv.lastMessageTime)}</span>
                     </div>
                     <p className="text-[11px] text-[#94A3B8] truncate leading-tight">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                     <div className="w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center mt-1">
                        {conv.unreadCount}
                     </div>
                  )}
               </div>
             ))
           ) : (
             <div className="p-6 text-center">
               <MessageSquare size={32} className="text-[#94A3B8] mx-auto mb-3" />
               <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">No conversations</p>
               <p className="text-[11px] text-[#C4C4C4] mt-1">Start a new chat</p>
             </div>
           )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col p-0 overflow-hidden bg-white">
         {/* Chat Header */}
         <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-sm">
                 <MessageSquare size={20} className="text-slate-400" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-[#0B1630]">{activeConvData?.name || 'Select a conversation'}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button className="w-10 h-10 rounded-xl border border-slate-100 text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"><Info size={18} /></button>
            </div>
         </div>

         {/* Messages List */}
         <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
            {messages.length > 0 ? (
              messages.map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[70%]",
                    isMe ? "ml-auto items-end" : "items-start"
                  )}>
                     {!isMe && (
                       <span className="text-[10px] font-bold text-[#94A3B8] mb-1">{msg.senderName}</span>
                     )}
                     <div className={cn(
                       "p-4 rounded-2xl text-sm font-medium shadow-sm",
                       isMe ? "bg-[#0B1630] text-white rounded-br-none" : "bg-white text-[#0B1630] border border-slate-100 rounded-bl-none"
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
                <MessageSquare size={40} className="text-[#E2E8F0] mb-3" />
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">No messages yet</p>
                <p className="text-[11px] text-[#C4C4C4] mt-1">Send a message to start the conversation</p>
              </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* Message Input */}
         <div className="p-6 border-t border-slate-50 bg-white">
            <div className="relative">
               <input
                 value={messageInput}
                 onChange={(e) => setMessageInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && messageInput.trim() && activeConversation) {
                     sendMutation.mutate();
                   }
                 }}
                 className="w-full h-14 pl-6 pr-16 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]"
                 placeholder="Type your message here..."
                 disabled={!activeConversation}
               />
               <button
                 onClick={() => {
                   if (messageInput.trim() && activeConversation) {
                     sendMutation.mutate();
                   }
                 }}
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
