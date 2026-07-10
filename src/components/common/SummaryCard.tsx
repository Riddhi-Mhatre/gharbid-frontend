import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  count: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export function SummaryCard({ label, count, icon: Icon, trend, trendUp, color = 'text-primary' }: SummaryCardProps) {
  // Map color names to glow colors for dynamic shadows and border highlights on hover
  const getGlowColor = (colorClass: string) => {
    if (colorClass.includes('emerald')) return 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)] hover:border-emerald-500/30';
    if (colorClass.includes('rose')) return 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.05)] hover:border-rose-500/30';
    if (colorClass.includes('accent') || colorClass.includes('purple')) return 'hover:shadow-[0_8px_30px_rgba(168,85,247,0.05)] hover:border-purple-500/30';
    return 'hover:shadow-[0_8px_30px_rgba(255,215,0,0.05)] hover:border-primary/30';
  };

  return (
    <div className={`relative overflow-hidden bg-dark-card/50 backdrop-blur-md border border-dark-border p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 group ${getGlowColor(color)}`}>
      {/* Background glow hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className={`p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-105 transition-all duration-300 ${color}`}>
          <Icon size={22} />
        </div>
        
        {trend ? (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors duration-300 ${
            trendUp 
              ? 'bg-secondary/10 text-secondary border-secondary/20' 
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {trendUp ? '+' : ''}{trend}
          </span>
        ) : (
          <ArrowUpRight size={16} className="text-muted group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
        )}
      </div>

      <div className="relative z-10">
        <p className="text-4xl font-display font-extrabold text-white tracking-tight mb-1">{count}</p>
        <p className="text-xs text-muted font-semibold uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
