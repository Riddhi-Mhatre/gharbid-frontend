import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  BUYER_SUGGESTIONS,
  SELLER_SUGGESTIONS,
  AUCTION_BUYER_SUGGESTIONS,
  AUCTION_SELLER_SUGGESTIONS,
} from '../../utils/messageSuggestions';
import { ChevronLeft, MessageCircle, Gavel } from 'lucide-react';

interface MessageSuggestionsProps {
  onSelectSuggestion: (message: string) => void;
  isAuctionRoom?: boolean;
}

export const MessageSuggestions = ({ onSelectSuggestion, isAuctionRoom }: MessageSuggestionsProps) => {
  const { user } = useAuthStore();
  const isBuyer = user?.role === 'buyer';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAuctionSuggestions, setShowAuctionSuggestions] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // ── Auction chat: flat chip list ──────────────────────────────────────────
  if (isAuctionRoom) {
    const auctionSuggestions = isBuyer ? AUCTION_BUYER_SUGGESTIONS : AUCTION_SELLER_SUGGESTIONS;

    if (showAuctionSuggestions) {
      return (
        <div className="p-3 border-t border-dark-border bg-dark-card/50">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowAuctionSuggestions(false)}
              className="p-1 hover:bg-dark-hover rounded-full transition-colors flex items-center justify-center text-muted hover:text-white"
              aria-label="Close suggestions"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Gavel size={13} className="text-primary" />
              {isBuyer ? 'Buyer' : 'Seller'} Suggestions
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {auctionSuggestions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectSuggestion(option);
                  setShowAuctionSuggestions(false);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-dark-border bg-dark hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted hover:text-white text-left flex items-center gap-1.5"
              >
                {option.startsWith('👋') || option.startsWith('🎉') || option.startsWith('📄') || option.startsWith('📅') || option.startsWith('📍') || option.startsWith('📞') || option.startsWith('🏠') || option.startsWith('⏰') || option.startsWith('📝') || option.startsWith('💰') || option.startsWith('✅') 
                  ? option 
                  : <><MessageCircle size={12} className="text-primary/70" /> {option}</>
                }
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="px-3 py-2 border-t border-dark-border bg-dark-card/50 flex items-center gap-2">
        <button
          onClick={() => setShowAuctionSuggestions(true)}
          className="whitespace-nowrap flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-colors text-primary"
        >
          <Gavel size={12} />
          Quick Suggestions
        </button>
      </div>
    );
  }

  // ── Property chat: categorized suggestions ────────────────────────────────
  const suggestions = isBuyer ? BUYER_SUGGESTIONS : SELLER_SUGGESTIONS;

  const handleSelectOption = (option: string) => {
    onSelectSuggestion(option);
    setSelectedCategory(null);
  };

  if (selectedCategory) {
    const categoryData = suggestions.find((s) => s.category === selectedCategory);
    return (
      <div className="p-3 border-t border-dark-border bg-dark-card/50">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-white">
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-1 hover:bg-dark-hover rounded-full transition-colors flex items-center justify-center text-muted hover:text-white"
            aria-label="Back to categories"
          >
            <ChevronLeft size={18} />
          </button>
          <span>{selectedCategory}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryData?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectOption(option)}
              className="text-xs px-3 py-1.5 rounded-full border border-dark-border bg-dark hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted hover:text-white text-left"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (showCategories) {
    return (
      <div className="p-3 border-t border-dark-border bg-dark-card/50">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowCategories(false)}
            className="p-1 hover:bg-dark-hover rounded-full transition-colors flex items-center justify-center text-muted hover:text-white"
            aria-label="Close suggestions"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <MessageCircle size={13} className="text-primary" />
            Suggestion Categories
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(suggestion.category)}
              className="whitespace-nowrap flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dark-border bg-dark hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted hover:text-white"
            >
              <MessageCircle size={12} className="text-primary/70" />
              {suggestion.category}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-t border-dark-border bg-dark-card/50 flex items-center gap-2">
      <button
        onClick={() => setShowCategories(true)}
        className="whitespace-nowrap flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-colors text-primary"
      >
        <MessageCircle size={12} />
        Quick Suggestions
      </button>
    </div>
  );
};
