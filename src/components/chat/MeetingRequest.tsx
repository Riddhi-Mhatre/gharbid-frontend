import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface MeetingRequestProps {
  roomId: string;
  onSend?: (date: string, time: string, note: string) => void;
}

export const MeetingRequest = ({ onSend }: MeetingRequestProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const handleSend = () => {
    if (!date || !time) return;
    onSend?.(date, time, note);
    setOpen(false);
  };

  return (
    <>
      <button
        id="meeting-request-btn"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-secondary border border-secondary/30 px-3 py-1.5 rounded-lg hover:bg-secondary/10 transition-colors"
      >
        <Calendar size={12} />
        Request Meeting
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="card p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold">Schedule a Meeting</h3>
            <input type="date" id="meeting-date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
            <input type="time" id="meeting-time" value={time} onChange={e => setTime(e.target.value)} className="input-field" />
            <textarea id="meeting-note" value={note} onChange={e => setNote(e.target.value)} placeholder="Agenda / notes..." className="input-field resize-none" rows={3} />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={handleSend} id="meeting-send">Send Request</button>
              <button className="btn-ghost flex-1" onClick={() => setOpen(false)} id="meeting-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
