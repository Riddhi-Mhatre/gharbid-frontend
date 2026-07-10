import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Gavel, MessageCircle, TrendingUp, Home, ChevronDown, Building, MapPin, Landmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '../services/propertyService';
import { PropertyCard } from '../components/properties/PropertyCard';
import { Loader } from '../components/common/Loader';
import { ROUTES } from '../utils/constants';
import { useAuthStore } from '../store/authStore';

const STATS = [
  { label: 'Verified Properties', value: '500+' },
  { label: 'Live Auctions', value: '25+' },
  { label: 'Happy Buyers', value: '1,200+' },
  { label: 'Cities Covered', value: '12' },
];

const STEPS = [
  { icon: Shield, title: 'Browse Verified Listings', desc: 'All properties are verified with legal documents before listing.' },
  { icon: Gavel, title: 'Bid or Express Interest', desc: 'Join live English auctions or express direct purchase interest.' },
  { icon: MessageCircle, title: 'Chat with Sellers', desc: 'Secure one-to-one chat unlocked after expressing interest or winning an auction.' },
  { icon: TrendingUp, title: 'Complete Offline', desc: 'Schedule inspection, legal verification, and ownership transfer offline.' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => getProperties({ status: 'approved' }),
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient min-h-[calc(100vh-64px)] flex flex-col justify-center px-4 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,215,0,0.08),transparent_60%)]" />
        
        {/* Dynamic Glowing Blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] sm:w-[60vw] sm:h-[60vw] max-w-[800px] max-h-[800px] bg-primary/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/4 right-1/4 w-[60vw] h-[60vw] sm:w-[40vw] sm:h-[40vw] max-w-[500px] max-h-[500px] bg-secondary/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] max-w-[400px] max-h-[400px] bg-purple-500/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        
        {/* Decorative Background Icons */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Building size={120} className="absolute top-[10%] left-[5%] text-white/5 animate-float" style={{ animationDelay: '0s' }} />
          <Home size={100} className="absolute bottom-[20%] left-[15%] text-white/5 animate-float" style={{ animationDelay: '2s' }} />
          <Gavel size={140} className="absolute top-[15%] right-[8%] text-primary/5 animate-float" style={{ animationDelay: '1s' }} />
          <MapPin size={80} className="absolute bottom-[25%] right-[20%] text-secondary/5 animate-float" style={{ animationDelay: '3s' }} />
          <Landmark size={110} className="absolute top-[50%] left-[80%] text-white/5 animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 w-full pt-4 md:pt-0">
          <div className="badge-live inline-flex mb-4 md:mb-6 text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-1.5">🔴 Live Auctions Happening Now</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-3 md:mb-6 tracking-tight">
            Find Your Perfect Property
            <br className="hidden sm:block" />
            <span className="text-gradient-gold block mt-1 sm:mt-0 sm:inline">With Complete Trust</span>
          </h1>
          <p className="text-muted text-sm sm:text-base md:text-xl max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
            GharBid is India's most trusted real estate marketplace — verified listings, live English auctions, and secure communications. All offline transactions, zero hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-[280px] sm:max-w-none mx-auto px-2 sm:px-0">
            {isAuthenticated ? (
              <Link to={`/${user?.role}/dashboard`} className="flex items-center justify-center gap-2 text-sm md:text-base py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-primary to-yellow-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.7)] hover:scale-105 active:scale-95 transition-all duration-300" id="hero-dashboard-btn">
                Go to Dashboard <ArrowRight size={18} className="animate-pulse" />
              </Link>
            ) : (
              <Link to={ROUTES.REGISTER} className="flex items-center justify-center gap-2 text-sm md:text-base py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-primary to-yellow-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.7)] hover:scale-105 active:scale-95 transition-all duration-300" id="hero-register-btn">
                Get Started <ArrowRight size={18} className="animate-pulse" />
              </Link>
            )}
            <Link to={ROUTES.PROPERTIES} className="flex items-center justify-center gap-2 text-sm md:text-base py-3 px-6 rounded-xl font-bold bg-dark-card/80 backdrop-blur-md border border-white/10 text-white shadow-lg hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all duration-300" id="hero-browse-btn">
              Browse Properties
            </Link>
            <Link to="/auctions" className="flex items-center justify-center gap-2 text-sm md:text-base py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-secondary to-teal-400 text-black shadow-[0_0_20px_rgba(0,128,128,0.4)] hover:shadow-[0_0_30px_rgba(0,128,128,0.7)] hover:scale-105 active:scale-95 transition-all duration-300" id="hero-auction-btn">
              <Gavel size={18} className="animate-bounce hidden sm:block" /> Auctions
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          className="absolute bottom-8 left-0 right-0 mx-auto w-fit flex flex-col items-center text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.6)] cursor-pointer animate-bounce hover:text-yellow-300 transition-colors" 
          onClick={() => window.scrollTo({ top: window.innerHeight - 64, behavior: 'smooth' })}
          aria-label="Scroll down"
        >
          <Home size={24} className="mb-1" />
          <ChevronDown size={20} />
        </div>
      </section>

      {/* Partition 2: Stats & How it Works */}
      <div className="min-h-screen flex flex-col justify-center">
        {/* Stats */}
        <section className="py-12 px-4 border-y border-dark-border bg-dark-card/50">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(stat => (
              <div key={stat.label}>
                <p className="text-3xl font-display font-bold text-gradient-gold">{stat.value}</p>
                <p className="text-muted text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 px-6 md:px-8 flex-1 flex flex-col justify-center">
          <div className="max-w-5xl mx-auto w-full">
            <h2 className="section-title text-center mb-2">How <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary drop-shadow-[0_0_10px_rgba(0,128,128,0.3)]">GharBid</span> Works</h2>
            <p className="section-subtitle text-center mb-12">A simple, transparent process from discovery to ownership</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
              {STEPS.map((step, i) => (
                <div key={step.title} className="card p-6 text-center group border-b-2 border-b-transparent hover:border-b-primary hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] active:scale-95 active:-translate-y-1 transition-all duration-300 bg-dark-card relative w-full max-w-[340px] sm:max-w-none">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <step.icon size={22} className="text-primary" />
                  </div>
                  <div className="text-xs text-primary font-bold mb-1">Step {i + 1}</div>
                  <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
                  <p className="text-muted text-xs leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Partition 3: Featured Properties & CTA */}
      <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center bg-dark-card/30">
        {/* Featured Properties */}
        <section className="py-16 px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="section-title flex items-center gap-3">
                  <span className="w-8 h-1 bg-gradient-to-r from-primary to-transparent rounded-full"></span>
                  <span className="text-gradient-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">Featured Properties</span>
                </h2>
                <p className="section-subtitle">Verified and ready for viewing</p>
              </div>
              <Link to={ROUTES.PROPERTIES} className="btn-ghost text-sm flex items-center gap-1 active:scale-95 transition-transform" id="see-all-properties">
                See All <ArrowRight size={14} />
              </Link>
            </div>
            {isLoading ? (
              <Loader label="Loading featured properties..." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center">
                {(properties ?? []).slice(0, 4).map((property: any) => (
                  <div key={property.propertyId} className="w-full max-w-[360px] sm:max-w-none">
                    <PropertyCard property={property} featured />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        {!isAuthenticated && (
          <section className="py-16 px-4 text-center mt-auto">
            <div className="max-w-2xl mx-auto">
              <h2 className="section-title mb-4">Ready to Find Your Dream Property?</h2>
              <p className="text-muted mb-8">Join 1,200+ buyers and sellers who trust GharBid for transparent real estate transactions.</p>
              <Link to={ROUTES.REGISTER} className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all duration-300" id="landing-cta-register">
                Get Started Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
