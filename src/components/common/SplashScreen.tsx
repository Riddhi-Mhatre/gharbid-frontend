import { useEffect, useState } from 'react';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const brandName = "GharBid".split('');

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark overflow-hidden transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Background Grid & Noise */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-gold mix-blend-screen"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[120px] animate-pulse-gold mix-blend-screen" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-[150px] mix-blend-screen"></div>

      {/* Floating Geometric Elements */}
      <div className="absolute w-32 h-32 border border-primary/20 rounded-full animate-float right-[15%] top-[20%]"></div>
      <div className="absolute w-24 h-24 border border-secondary/20 rotate-45 animate-spin-slow left-[15%] bottom-[20%]"></div>

      <div className="relative flex flex-col items-center z-10">
        {/* Main Text Container */}
        <div className="flex space-x-1 perspective-1000">
          {brandName.map((char, index) => (
            <span
              key={index}
              className="text-6xl md:text-8xl font-display font-bold text-gradient-gold inline-block animate-letter-reveal opacity-0 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              {char}
            </span>
          ))}
        </div>
        
        {/* Subtitle */}
        <div className="mt-6 overflow-hidden">
          <p 
            className="text-muted tracking-[0.3em] uppercase text-xs md:text-sm animate-splash-text opacity-0 font-medium" 
            style={{ animationDelay: '1s' }}
          >
            Premium Real Estate
          </p>
        </div>

        {/* Fancy Progress Bar */}
        <div className="mt-12 w-64 h-1 bg-dark-border rounded-full overflow-hidden relative opacity-0 animate-splash-text" style={{ animationDelay: '1.2s' }}>
          <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary to-secondary animate-progress-fill rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)]"></div>
        </div>
      </div>
    </div>
  );
};
