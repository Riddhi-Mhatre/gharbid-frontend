import { useState, useRef } from 'react';
import { X, Calendar, FileText, Loader2, Clock } from 'lucide-react';
import { proposeMeet } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';

interface MeetSchedulerDialogProps {
  roomId: string;
  onClose: () => void;
}

const inputClass =
  'w-full bg-black/60 border border-dark-border/80 rounded-xl px-10 py-3 text-white text-sm placeholder-muted focus:border-secondary/60 focus:outline-none focus:ring-1 focus:ring-secondary/30 hover:border-white/20 transition-all duration-300 shadow-inner cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden';
const labelClass = 'block text-[10px] text-muted/80 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5';

const PickerInput = ({ type, value, onChange, icon: Icon, min, placeholder }: any) => {
  const ref = useRef<HTMLInputElement>(null);
  
  return (
    <div 
      className="relative group" 
      onClick={() => {
        try { ref.current?.showPicker(); } catch (e) {}
      }}
    >
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-hover:text-secondary group-focus-within:text-secondary transition-colors pointer-events-none">
        <Icon size={16} />
      </div>
      <input 
        ref={ref} 
        type={type} 
        className={inputClass} 
        value={value} 
        onChange={onChange} 
        min={min} 
        placeholder={placeholder}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/30 group-hover:text-muted/60 transition-colors pointer-events-none">
        <Calendar size={14} className={type === 'time' ? 'hidden' : 'block'} />
        <Clock size={14} className={type === 'date' ? 'hidden' : 'block'} />
      </div>
    </div>
  );
};

export const MeetSchedulerDialog = ({ roomId, onClose }: MeetSchedulerDialogProps) => {
  const { addMessage } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    primaryDate: '', primaryTime: '',
    alt1Date: '', alt1Time: '',
    alt2Date: '', alt2Time: '',
    notes: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const isValid = form.primaryDate && form.primaryTime;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const msg = await proposeMeet(roomId, form);
      addMessage(roomId, msg);
      onClose();
    } catch {
      alert('Failed to send meeting proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-gradient-to-br from-[#111] to-[#080808] border border-white/10 rounded-3xl w-full max-w-lg p-1 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(0,255,200,0.05)] animate-slide-up overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-[22px] p-6 md:p-8 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-white/5">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 shadow-[0_0_15px_rgba(0,255,200,0.1)]">
                <Calendar size={12} className="text-secondary animate-pulse" />
                <span className="text-[9px] text-secondary font-bold uppercase tracking-widest">Meeting Request</span>
              </div>
              <h2 className="text-3xl font-display font-extrabold text-white line-clamp-1 leading-tight tracking-tight">Schedule Visit</h2>
              <p className="text-xs text-muted mt-2 font-medium">Provide your preferred dates — seller will confirm one</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:rotate-90 transition-all duration-300 text-muted hover:text-white shrink-0 shadow-lg"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Primary slot */}
            <div className="p-5 rounded-2xl border border-secondary/30 bg-secondary/5 relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-secondary text-black flex items-center justify-center font-black">1</span>
                Primary Slot (Required)
              </p>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div>
                  <label className={labelClass}>Date</label>
                  <PickerInput type="date" icon={Calendar} value={form.primaryDate} onChange={(e: any) => set('primaryDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className={labelClass}>Time</label>
                  <PickerInput type="time" icon={Clock} value={form.primaryTime} onChange={(e: any) => set('primaryTime', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Alternative 1 */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-black">2</span>
                Alternative 1 (Optional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date</label>
                  <PickerInput type="date" icon={Calendar} value={form.alt1Date} onChange={(e: any) => set('alt1Date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className={labelClass}>Time</label>
                  <PickerInput type="time" icon={Clock} value={form.alt1Time} onChange={(e: any) => set('alt1Time', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Alternative 2 */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center font-black">3</span>
                Alternative 2 (Optional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date</label>
                  <PickerInput type="date" icon={Calendar} value={form.alt2Date} onChange={(e: any) => set('alt2Date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className={labelClass}>Time</label>
                  <PickerInput type="time" icon={Clock} value={form.alt2Time} onChange={(e: any) => set('alt2Time', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>
                <FileText size={14} className="text-muted/60" /> Notes / Agenda
              </label>
              <textarea
                className={`${inputClass} resize-none h-24 px-4`}
                placeholder="Location, documents to bring, any other notes..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-8 mt-6 border-t border-white/5">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-white/10 text-muted font-extrabold hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-[11px] uppercase tracking-widest hover:shadow-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-secondary to-teal-400 hover:from-teal-400 hover:to-secondary text-black font-extrabold text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,200,0.2)] hover:shadow-[0_0_30px_rgba(0,255,200,0.4)] transition-all duration-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={14} className="group-hover:scale-110 transition-transform" />}
              Send Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
