import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) return <div className="h-64 bg-dark-hover rounded-xl flex items-center justify-center text-muted">No images available</div>;

  return (
    <>
      <div className="relative rounded-xl overflow-hidden h-72 md:h-96">
        <img src={images[current]} alt={`${title} - ${current + 1}`} className="w-full h-full object-cover" />
        <button onClick={() => setLightbox(true)} className="absolute top-3 right-3 p-2 bg-dark-card/80 rounded-lg hover:bg-dark-card transition-colors" id="gallery-expand" aria-label="Fullscreen">
          <Maximize2 size={16} />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent((current - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-dark-card/80 rounded-lg hover:bg-dark-card" id="gallery-prev" aria-label="Previous"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrent((current + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-dark-card/80 rounded-lg hover:bg-dark-card" id="gallery-next" aria-label="Next"><ChevronRight size={18} /></button>
          </>
        )}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-white/40'}`} aria-label={`Image ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg" id="gallery-close" aria-label="Close"><X size={24} /></button>
          <img src={images[current]} alt={title} className="max-w-[90vw] max-h-[90vh] object-contain" />
        </div>
      )}
    </>
  );
};
