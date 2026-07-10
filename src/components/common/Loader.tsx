export const Loader = ({ size = 'md', label = 'Loading...' }: { size?: 'sm' | 'md' | 'lg'; label?: string }) => {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8" role="status" aria-label={label}>
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-dark-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      {size !== 'sm' && <p className="text-muted text-sm">{label}</p>}
    </div>
  );
};

export const FullPageLoader = () => (
  <div className="fixed inset-0 bg-dark flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <span className="text-2xl font-display font-bold text-gradient-gold">GharBid</span>
      <Loader size="lg" label="Loading..." />
    </div>
  </div>
);
