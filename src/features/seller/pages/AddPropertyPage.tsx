import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createProperty, updateProperty, getProperty } from '../../../services/propertyService';
import { uploadFileToS3 } from '../../../services/sellerService';
import {
  Building2, MapPin, DollarSign, Info, Check,
  Upload, ChevronRight, ChevronLeft, Loader2, X, AlertCircle, Sparkles,
  Type, AlignLeft, Home, Maximize, Bath, Bed, Map, Hash
} from 'lucide-react';

const AMENITY_OPTIONS = [
  'Lift', 'Parking', 'Gym', 'Garden',
  'Security', 'Power Backup', 'Swimming Pool', 'Club House',
];

const STEPS = [
  { id: 1, label: 'Basic Info', icon: Info },
  { id: 2, label: 'Pricing', icon: DollarSign },
  { id: 3, label: 'Location', icon: MapPin },
  { id: 4, label: 'Media & Amenities', icon: Building2 },
];

const inputClass =
  'w-full bg-black/60 border border-dark-border/80 rounded-xl px-10 py-3.5 text-white placeholder-muted focus:border-primary/60 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/20 hover:border-white/20 transition-all duration-300 shadow-inner text-sm font-medium';
const labelClass = 'block text-[10px] font-bold text-muted/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5';

type PincodeStatus = 'idle' | 'loading' | 'success' | 'error';

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  const [step, setStep] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<PincodeStatus>('idle');
  const [pincodePostOfficeName, setPincodePostOfficeName] = useState('');
  const [locationAutoFilled, setLocationAutoFilled] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'apartment',
    salePrice: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    amenities: [] as string[],
    images: [] as string[],
  });

  const { data: propertyData} = useQuery({
    queryKey: ['property', editId],
    queryFn: () => getProperty(editId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (propertyData) {
      setForm({
        title: propertyData.title || '',
        description: propertyData.description || '',
        type: propertyData.type || 'apartment',
        salePrice: propertyData.salePrice ? String(propertyData.salePrice) : propertyData.price ? String(propertyData.price) : '',
        bedrooms: propertyData.bedrooms ? String(propertyData.bedrooms) : '',
        bathrooms: propertyData.bathrooms ? String(propertyData.bathrooms) : '',
        area: propertyData.area ? String(propertyData.area) : '',
        address: propertyData.location?.address || propertyData.address || '',
        city: propertyData.location?.city || propertyData.city || '',
        state: propertyData.location?.state || propertyData.state || '',
        pincode: propertyData.location?.pincode || propertyData.pincode || '',
        amenities: propertyData.amenities || [],
        images: propertyData.images || [],
      });
      if (propertyData.location?.pincode || propertyData.pincode) {
        setPincodeStatus('success');
      }
    }
  }, [propertyData]);

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const fetchLocationByPincode = useCallback(async (pincode: string) => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      if (locationAutoFilled) {
        setForm(prev => ({ ...prev, city: '', state: '' }));
        setLocationAutoFilled(false);
        setPincodePostOfficeName('');
      }
      setPincodeStatus('idle');
      return;
    }

    setPincodeStatus('loading');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const result = data[0];

      if (result.Status === 'Success' && result.PostOffice?.length > 0) {
        const postOffice = result.PostOffice[0];
        setForm(prev => ({
          ...prev,
          city: postOffice.District || postOffice.Block || '',
          state: postOffice.State || '',
        }));
        setPincodePostOfficeName(postOffice.Name);
        setLocationAutoFilled(true);
        setPincodeStatus('success');
      } else {
        setForm(prev => ({ ...prev, city: '', state: '' }));
        setLocationAutoFilled(false);
        setPincodePostOfficeName('');
        setPincodeStatus('error');
      }
    } catch {
      setForm(prev => ({ ...prev, city: '', state: '' }));
      setLocationAutoFilled(false);
      setPincodePostOfficeName('');
      setPincodeStatus('error');
    }
  }, [locationAutoFilled]);

  const handlePincodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    set('pincode', digits);
    fetchLocationByPincode(digits);
  };

  const toggleAmenity = (a: string) =>
    set(
      'amenities',
      form.amenities.includes(a)
        ? form.amenities.filter(x => x !== a)
        : [...form.amenities, a]
    );  

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;

    setUploadingImages(true);
    try {
      const files = Array.from(e.target.files);
      const urls = await Promise.all(
        files.map(uploadFileToS3)
      );
      set('images', [...form.images, ...urls]);
    } catch (error) {
      console.error("Image upload error:", error);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (idx: number) =>
    set('images', form.images.filter((_, i) => i !== idx));

  const { mutate: submitProperty, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        listingType: 'sale',
        salePrice: Number(form.salePrice),
        price: Number(form.salePrice),
        bedrooms: (form.type === 'plot' || form.type === 'commercial') ? 0 : Number(form.bedrooms),
        bathrooms: (form.type === 'plot' || form.type === 'commercial') ? 0 : Number(form.bathrooms),
        area: Number(form.area),
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        amenities: form.amenities,
        images: form.images,
      };
      if (isEditMode) {
        return updateProperty(editId!, payload);
      }
      return createProperty(payload);
    },

    onSuccess: (data) => {
      navigate(`/seller/documents?propertyId=${isEditMode ? editId : data.propertyId}`);
    },

    onError: () => {
      alert(`Failed to ${isEditMode ? 'update' : 'add'} property. Please try again.`);
    },
  });

  const isStepValid = () => {
    if (step === 1) return form.title.trim() && form.description.trim();
    if (step === 2) return !!form.salePrice;
    if (step === 3) return form.city.trim() && form.state.trim() && form.address.trim();
    return true;
  };

  return (
    <div className="min-h-screen text-white bg-dark pb-16 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/4 bottom-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-10 relative z-10">

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
            <Sparkles size={12} className="animate-pulse" /> {isEditMode ? 'Edit Listing Wizard' : 'New Listing Wizard'}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
            {isEditMode ? 'Edit ' : 'Add New '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-yellow-600 font-black">Property</span>
          </h1>
          <p className="text-muted/90 font-light text-sm max-w-xl">{isEditMode ? 'Update the details of your property.' : 'Fill in the details to list your property on GharBid.'}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-0 w-full">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step > s.id
                      ? 'bg-primary border-primary text-black shadow-gold scale-105'
                      : step === s.id
                      ? 'border-primary text-primary bg-primary/10 font-bold scale-105 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                      : 'border-dark-border text-muted/60 bg-dark-card/40'
                  }`}
                >
                  {step > s.id ? <Check size={18} /> : <s.icon size={16} />}
                </div>
                <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider hidden md:block ${step >= s.id ? 'text-white' : 'text-muted/50'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-[2px] flex-1 transition-all duration-500 mx-2 ${step > s.id ? 'bg-primary' : 'bg-dark-border/60'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-dark-card/50 backdrop-blur-md border border-dark-border rounded-2xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><Info size={20} className="text-primary" /> Basic Information</h2>
                <p className="text-xs text-muted mt-1">Let's start with structural and listing characteristics</p>
              </div>

              <div className="group">
                <label className={labelClass}>Property Title</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                    <Type size={16} />
                  </div>
                  <input className={inputClass} placeholder="e.g. Spacious 3BHK in Bandra West" value={form.title} onChange={e => set('title', e.target.value)} />
                </div>
              </div>

              <div className="group">
                <label className={labelClass}>Description</label>
                <div className="relative">
                  <div className="absolute left-3 top-4 text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                    <AlignLeft size={16} />
                  </div>
                  <textarea className={`${inputClass} min-h-[120px] resize-none py-3`} placeholder="Describe the property, its features, neighbourhood..." value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="group">
                  <label className={labelClass}>Property Type</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none z-10">
                      <Home size={16} />
                    </div>
                    <select className={`${inputClass} cursor-pointer appearance-none relative z-0`} value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="apartment" className="bg-[#0A0A0A] text-white">Apartment</option>
                      <option value="house" className="bg-[#0A0A0A] text-white">House</option>
                      <option value="villa" className="bg-[#0A0A0A] text-white">Villa</option>
                      <option value="plot" className="bg-[#0A0A0A] text-white">Plot / Land</option>
                      <option value="commercial" className="bg-[#0A0A0A] text-white">Commercial</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              {form.type !== 'plot' && form.type !== 'commercial' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="group">
                    <label className={labelClass}>Bedrooms</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                        <Bed size={16} />
                      </div>
                      <input className={inputClass} type="number" min="0" placeholder="0" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
                    </div>
                  </div>
                  <div className="group">
                    <label className={labelClass}>Bathrooms</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-blue-400 transition-colors pointer-events-none">
                        <Bath size={16} />
                      </div>
                      <input className={inputClass} type="number" min="0" placeholder="0" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
                    </div>
                  </div>
                  <div className="group">
                    <label className={labelClass}>Area (sq ft)</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                        <Maximize size={16} />
                      </div>
                      <input className={inputClass} type="number" min="0" placeholder="1200" value={form.area} onChange={e => set('area', e.target.value)} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="group max-w-sm">
                  <label className={labelClass}>Area (sq ft)</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                      <Maximize size={16} />
                    </div>
                    <input className={inputClass} type="number" min="0" placeholder="1200" value={form.area} onChange={e => set('area', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><DollarSign size={20} className="text-primary" /> Pricing Details</h2>
                <p className="text-xs text-muted mt-0.5">Specify your listing evaluation price and charges</p>
              </div>

              <div className="group max-w-sm">
                <label className={labelClass}>Sale Price (₹)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                    <DollarSign size={16} />
                  </div>
                  <input className={inputClass} type="number" min="0" placeholder="e.g. 8500000" value={form.salePrice} onChange={e => set('salePrice', e.target.value)} />
                </div>
                <p className="text-[10px] text-muted/70 mt-2 font-medium flex items-center gap-1"><Info size={12} className="text-primary/70" /> Enter value in rupees (e.g. 85,00,000 = 8500000)</p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.05)] mt-8">
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                <p className="text-[10px] text-primary font-extrabold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Sparkles size={12} className="animate-pulse" /> Platform Listing Fee</p>
                <p className="text-4xl font-display font-black text-white mt-2 mb-1">₹999</p>
                <p className="text-xs text-muted/80 leading-relaxed max-w-sm font-medium">
                  One-time fee to publish your listing immediately after verification. No hidden charges.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><MapPin size={20} className="text-primary" /> Location</h2>
                <p className="text-xs text-muted mt-0.5">Provide detailed location information for buyers</p>
              </div>

              <div className="group">
                <label className={labelClass}>Full Address</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                    <Map size={16} />
                  </div>
                  <input className={inputClass} placeholder="Street address, building name, floor..." value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
              </div>

              {/* Pincode with auto-fill */}
              <div className="group max-w-sm">
                <label className={labelClass}>Pincode</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none z-10">
                    <Hash size={16} />
                  </div>
                  <input
                    className={`${inputClass} pr-12 ${
                      pincodeStatus === 'error' ? 'border-red-500/80 focus:border-red-500/80 focus:ring-red-500/30 bg-red-500/5' :
                      pincodeStatus === 'success' ? 'border-green-500/80 focus:border-green-500/80 focus:ring-green-500/30 bg-green-500/5' : ''
                    }`}
                    placeholder="e.g. 400050"
                    maxLength={6}
                    value={form.pincode}
                    onChange={e => handlePincodeChange(e.target.value)}
                    inputMode="numeric"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    {pincodeStatus === 'loading' && (
                      <Loader2 size={18} className="text-primary animate-spin" />
                    )}
                    {pincodeStatus === 'success' && (
                      <Check size={18} className="text-green-400" />
                    )}
                    {pincodeStatus === 'error' && (
                      <AlertCircle size={18} className="text-red-400" />
                    )}
                  </div>
                </div>
                {pincodeStatus === 'success' && pincodePostOfficeName && (
                  <p className="text-[11px] text-green-400 mt-2 flex items-center gap-1.5 font-medium">
                    <Check size={12} />
                    Auto-filled from <span className="font-bold text-white">{pincodePostOfficeName}</span>
                  </p>
                )}
                {pincodeStatus === 'error' && (
                  <p className="text-[11px] text-red-400 mt-2 flex items-center gap-1.5 font-medium">
                    <AlertCircle size={12} />
                    Invalid pincode. Please check and try again.
                  </p>
                )}
                {pincodeStatus === 'loading' && (
                  <p className="text-[11px] text-primary mt-2 flex items-center gap-1.5 font-medium">
                    <Loader2 size={12} className="animate-spin" /> Looking up location...
                  </p>
                )}
              </div>

              {/* City & State - auto-filled from pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="group">
                  <label className={labelClass}>
                    City
                    {locationAutoFilled && (
                      <span className="ml-2 text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-black flex items-center gap-1 shadow-sm"><Check size={8} /> Auto</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                      <MapPin size={16} />
                    </div>
                    <input
                      className={`${inputClass} ${
                        locationAutoFilled ? 'border-green-500/40 bg-green-900/10 text-green-300 focus:border-green-500/60 focus:ring-green-500/20' : ''
                      }`}
                      placeholder="e.g. Mumbai"
                      value={form.city}
                      onChange={e => { set('city', e.target.value); setLocationAutoFilled(false); }}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className={labelClass}>
                    State
                    {locationAutoFilled && (
                      <span className="ml-2 text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-black flex items-center gap-1 shadow-sm"><Check size={8} /> Auto</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                      <MapPin size={16} />
                    </div>
                    <input
                      className={`${inputClass} ${
                        locationAutoFilled ? 'border-green-500/40 bg-green-900/10 text-green-300 focus:border-green-500/60 focus:ring-green-500/20' : ''
                      }`}
                      placeholder="e.g. Maharashtra"
                      value={form.state}
                      onChange={e => { set('state', e.target.value); setLocationAutoFilled(false); }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Step 4: Media & Amenities */}
          {step === 4 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><Building2 size={20} className="text-primary" /> Photos & Amenities</h2>
                <p className="text-xs text-muted mt-0.5">Add visual assets and select internal facilities</p>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <label className={labelClass}>Property Photos</label>

                <label
                  className={`relative flex flex-col items-center justify-center gap-3 border border-dashed border-dark-border hover:border-primary/50 bg-black/40 hover:bg-primary/5 rounded-2xl h-48 cursor-pointer transition-all duration-500 group overflow-hidden ${
                    uploadingImages ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {uploadingImages ? (
                    <>
                      <Loader2 size={32} className="text-primary animate-spin" />
                      <span className="text-primary text-xs font-bold uppercase tracking-widest">Uploading Media...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-dark-border/50 group-hover:bg-primary/20 flex items-center justify-center transition-colors duration-500 mb-2">
                        <Upload size={24} className="text-muted/65 group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
                      </div>
                      <span className="text-muted/80 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors duration-200">
                        Click or drag to upload photos
                      </span>
                      <span className="text-[10px] text-muted/50 font-medium">Supports JPG, PNG (Max 5MB each)</span>
                    </>
                  )}

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>

                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {form.images.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-28 h-28 rounded-2xl overflow-hidden border border-dark-border/80 group shadow-lg"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                        
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-red-500/20 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 scale-75 group-hover:scale-100"
                        >
                          <X size={18} />
                        </button>

                        {i === 0 && (
                          <span className="absolute bottom-2 left-2 text-[8px] bg-primary text-black font-black px-2 py-0.5 rounded shadow-lg z-10 uppercase tracking-widest">
                            Cover Photo
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className="space-y-4 pt-4 border-t border-dark-border/50">
                <label className={labelClass}>Amenities & Facilities</label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AMENITY_OPTIONS.map((a) => {
                    const isSelected = form.amenities.includes(a);
                    return (
                      <button
                        type="button"
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`py-3.5 px-4 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 text-primary shadow-[0_0_20px_rgba(255,215,0,0.1)] scale-[1.02]'
                            : 'bg-black/40 border-dark-border/80 text-muted hover:text-white hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {isSelected && <Check size={14} className="shrink-0" />}
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t border-dark-border/60">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 text-muted font-extrabold hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-300 text-[11px] uppercase tracking-widest active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:shadow-lg"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary via-yellow-400 to-yellow-600 hover:from-yellow-400 hover:via-yellow-300 hover:to-primary text-black font-extrabold uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none group"
              >
                Continue <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => submitProperty()}
                disabled={isPending}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary via-yellow-400 to-yellow-600 hover:from-yellow-400 hover:via-yellow-300 hover:to-primary text-black font-extrabold uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none group"
              >
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> {isEditMode ? 'Updating...' : 'Submitting...'}</>
                ) : (
                  <><Check size={16} className="group-hover:scale-110 transition-transform" /> {isEditMode ? 'Save Changes' : 'Submit Listing'}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
