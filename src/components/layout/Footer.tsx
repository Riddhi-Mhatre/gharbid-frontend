import { Link, useLocation } from 'react-router-dom';

export const Footer = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/buyer') || location.pathname.startsWith('/seller')) {
    return null;
  }

  return (
    <footer className="border-t border-dark-border bg-dark-card mt-auto hidden md:block">
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 className="font-display font-bold text-gradient-gold text-lg mb-3">GharBid</h3>
        <p className="text-muted text-sm leading-relaxed">
          Trusted real estate marketplace bridging online discovery and offline legal trust.
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 text-white/80">Explore</h4>
        <ul className="space-y-2 text-muted text-sm">
          <li><Link to="/properties" className="hover:text-primary transition-colors">Properties</Link></li>
          <li><Link to="/auctions" className="hover:text-primary transition-colors">Live Auctions</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 text-white/80">Account</h4>
        <ul className="space-y-2 text-muted text-sm">
          <li><Link to="/register" className="hover:text-primary transition-colors">Register</Link></li>
          <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 text-white/80">Legal</h4>
        <ul className="space-y-2 text-muted text-sm">
          <li><span className="cursor-pointer hover:text-primary transition-colors">Privacy Policy</span></li>
          <li><span className="cursor-pointer hover:text-primary transition-colors">Terms of Service</span></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-dark-border py-4 text-center text-muted text-xs">
      © {new Date().getFullYear()} GharBid. All rights reserved.
    </div>
  </footer>
  );
};
