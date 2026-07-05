import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { ValoAiService } from '../services/ValoAiService';
import { useCurrency } from '../services/CurrencyService';
import { toast } from '../lib/toast-store';

interface ValoAiPanelProps {
  onClose: () => void;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  timestamp: Date;
  content: string;
  type?: 'text' | 'card' | 'insight';
  data?: any;
}

export const ValoAiPanel: React.FC<ValoAiPanelProps> = ({ onClose }) => {
  const { tenant } = useTenant();
  const { format } = useCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    setMessages([
      {
        sender: 'assistant',
        timestamp: new Date(),
        content: `Hello! I am your **VALO AI Operations Assistant**. I am connected to **${tenant?.name || 'this restaurant'}**'s real-time workspace data. \n\nSelect a quick prompt below or type your operations question!`,
        type: 'text'
      }
    ]);
  }, [tenant]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ─── Plan Protection Guard ───
  if (tenant?.plan !== 'ENTERPRISE') {
    return (
      <div className="h-full flex flex-col justify-center items-center p-8 bg-slate-900 text-white relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="max-w-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
            <Sparkles size={32} />
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-black uppercase tracking-wide">VALO AI Assistant</h3>
            <p className="text-sm font-black text-orange-500 leading-tight">
              VALO AI is available with the Enterprise Plan.
            </p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed pt-2">
              Unlock a context-aware smart assistant inside the POS cashier view. Split bills, calculate tax splits, audit daily sales figures, and answer operational questions instantly.
            </p>
          </div>

          <div className="pt-6">
            <button 
              onClick={() => toast.info('Upgrade Subscription', 'Ask your platform administrator to upgrade your plan to Enterprise.')}
              className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              Request Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Query handler ───
  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    setInputVal('');
    setLoading(true);

    // Append user message
    setMessages(prev => [
      ...prev,
      { sender: 'user', timestamp: new Date(), content: userText, type: 'text' }
    ]);

    try {
      // Fetch operational AI response
      const res = await ValoAiService.processMessage(userText, tenant?.id || '');
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          timestamp: new Date(),
          content: res.message,
          type: res.type,
          data: res.data
        }
      ]);
    } catch (err: any) {
      toast.error('AI Operations', 'Calculations timed out.');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Split Table 3', query: 'Split Table 3 bill by 2 people' },
    { label: 'Sales Today', query: 'Show today\'s revenue' },
    { label: 'VAT for 1500', query: 'Calculate VAT for 1500' },
    { label: 'Refund Policy', query: 'Explain refund policy' }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0B1630] text-[#F97316] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1630] uppercase tracking-wider leading-none">VALO AI</h3>
            <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest mt-1 block">Enterprise Copilot</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Bubble Message */}
            <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-[#F97316] text-white font-semibold rounded-tr-none' 
                : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none font-medium'
            }`}>
              {msg.content.split('\n').map((para, idx) => (
                <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{para}</p>
              ))}
            </div>

            {/* Custom Interactive Calculation Cards */}
            {msg.sender === 'assistant' && msg.type === 'card' && msg.data && (
              <div className="mt-3 w-[85%] bg-slate-50 border border-slate-200/70 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <h4 className="text-xs font-bold text-[#0B1630] uppercase tracking-wider">{msg.data.title}</h4>
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck size={12} />
                  </div>
                </div>

                {/* Split list */}
                {msg.data.divisor && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#64748B] font-medium">
                      <span>Total Amount</span>
                      <span className="font-bold text-[#0B1630]">{format(msg.data.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#64748B] font-medium">
                      <span>Split Divisor</span>
                      <span className="font-bold text-[#0B1630]">{msg.data.divisor} Persons</span>
                    </div>
                    <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center bg-[#F97316]/5 p-2 rounded-xl border border-[#F97316]/10">
                      <span className="text-xs font-bold text-[#0B1630]">Per Guest</span>
                      <span className="text-sm font-black text-[#F97316]">{format(msg.data.perPerson)}</span>
                    </div>
                  </div>
                )}

                {/* VAT breakdown */}
                {msg.data.subtotal && !msg.data.divisor && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[#64748B]">
                      <span>Base Subtotal</span>
                      <span className="font-bold text-[#0B1630]">{format(msg.data.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#64748B]">
                      <span>VAT (15.0%)</span>
                      <span className="font-bold text-red-500">{format(msg.data.tax)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-xs text-[#0B1630]">
                      <span>Grand Total</span>
                      <span>{format(msg.data.total)}</span>
                    </div>
                  </div>
                )}

                {/* Orders table list */}
                {msg.data.ordersList && (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {msg.data.ordersList.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] p-2 bg-white rounded-xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0B1630]">Order #{item.id}</span>
                          <span className="text-[9px] text-[#94A3B8] font-medium">{item.time || `Table ${item.table}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-orange-50 text-[#F97316] font-bold text-[8px]">{item.status}</span>
                          <span className="font-bold text-[#0B1630]">{format(Number(item.total))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom Dashboard Summary Insight Cards */}
            {msg.sender === 'assistant' && msg.type === 'insight' && msg.data && (
              <div className="mt-3 w-[85%] grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200/70 rounded-2xl p-4 shadow-sm">
                <div className="col-span-2 pb-2 border-b border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B1630] uppercase tracking-wider">Restaurant Insights</span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Live Audit</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Today's Sales</span>
                  <span className="text-xs font-black text-[#0B1630] mt-1">{format(msg.data.revenue)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Active Tables</span>
                  <span className="text-xs font-black text-[#0B1630] mt-1">{msg.data.activeTables} Occupied</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Settled Orders</span>
                  <span className="text-xs font-black text-[#0B1630] mt-1">{msg.data.completedOrders} Orders</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Pending Orders</span>
                  <span className="text-xs font-black text-orange-500 mt-1">{msg.data.pendingOrders} Orders</span>
                </div>
              </div>
            )}

            {/* Time Stamp */}
            <span className="text-[8px] text-[#94A3B8] mt-1.5 px-2">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {/* AI Loading Thinking state */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 animate-pulse text-[10px] font-bold uppercase tracking-widest pl-2">
            <Sparkles size={12} className="animate-spin text-[#F97316]" />
            VALO AI is processing...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Prompt chips */}
      <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/50 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-[#0B1630] hover:border-[#F97316] hover:text-[#F97316] transition-all cursor-pointer whitespace-nowrap shadow-sm disabled:opacity-50 shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input container */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputVal);
        }}
        className="p-4 border-t border-slate-100 flex gap-2 shrink-0 bg-white"
      >
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask VALO AI calculation / insights..."
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#F97316] disabled:opacity-50 font-medium"
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="bg-[#0B1630] text-white p-3 rounded-xl hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-30 disabled:scale-100 flex items-center justify-center shrink-0 w-11 h-11"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
