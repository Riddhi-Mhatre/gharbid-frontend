import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { uploadIdentityDocumentToS3, updateProfile } from '../../../services/userService';
import { toast } from 'sonner';
import {
  FileText, Upload, CheckCircle, XCircle, Loader2,
  AlertCircle, ShieldCheck, ArrowRight, X, Eye
} from 'lucide-react';
import { ROUTES } from '../../../utils/constants';

interface DocSlot {
  key: string;
  label: string;
  description: string;
  required: boolean;
  accept: string;
}

const REQUIRED_DOCS: DocSlot[] = [
  {
    key: 'aadhar_proof',
    label: 'Aadhaar Card',
    description: 'Upload a copy of both front and back of your Aadhaar card as a single PDF or image.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'pan_proof',
    label: 'PAN Card',
    description: 'Upload a clear copy of your Permanent Account Number card.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'address_proof',
    label: 'Address Proof',
    description: 'Latest electricity bill, telephone bill, or bank statement (not older than 3 months).',
    required: false,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
];

interface UploadState {
  status: 'idle' | 'uploading' | 'done' | 'error';
  fileName?: string;
  s3Key?: string;
  error?: string;
}

export default function BuyerLegalDocumentsPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [uploads, setUploads] = useState<Record<string, UploadState>>(
    Object.fromEntries(REQUIRED_DOCS.map(d => [d.key, { status: 'idle' }]))
  );
  const [submitting, setSubmitting] = useState(false);

  const setUploadState = (key: string, state: Partial<UploadState>) =>
    setUploads(prev => ({ ...prev, [key]: { ...prev[key], ...state } }));

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState(docKey, { status: 'uploading', error: undefined });

    try {
      const s3Key = await uploadIdentityDocumentToS3(file, docKey);
      setUploadState(docKey, { status: 'done', s3Key, fileName: file.name });
      toast.success(`${file.name} uploaded successfully.`);
    } catch (err: any) {
      setUploadState(docKey, {
        status: 'error',
        error: err?.message ?? 'Upload failed. Please try again.',
      });
      toast.error('File upload failed.');
    }

    // Reset input
    e.target.value = '';
  };

  const clearUpload = (key: string) =>
    setUploadState(key, { status: 'idle', fileName: undefined, s3Key: undefined, error: undefined });

  const requiredDocs = REQUIRED_DOCS.filter(d => d.required);
  const allRequiredDone = requiredDocs.every(d => uploads[d.key].status === 'done');
  const doneCount = Object.values(uploads).filter(u => u.status === 'done').length;

  const handleSubmit = async () => {
    if (!allRequiredDone) return;
    setSubmitting(true);
    try {
      const documentKeys: Record<string, string> = {};
      for (const [key, val] of Object.entries(uploads)) {
        if (val.status === 'done' && val.s3Key) {
          documentKeys[key] = val.s3Key;
        }
      }

      // Save to user profile and mark user as verified
      await updateProfile({
        kycDocuments: documentKeys,
        isVerified: true,
      });

      // Update local state in authStore
      updateUser({ isVerified: true });

      toast.success('Identity proof documents submitted successfully! You are now a verified buyer.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Verification submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-3xl">
      <div className="flex items-center gap-4 border-b border-dark-border pb-6">
        <div className="p-3 bg-accent/10 rounded-lg">
          <FileText size={28} className="text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-black uppercase tracking-widest text-white">Identity Documents</h1>
          <p className="text-muted text-sm mt-1">Manage and access your verified identity and financial proofs.</p>
        </div>
      </div>

      {user?.isVerified ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4 mt-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-emerald-400" size={32} />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Identity Verified Successfully</h2>
          <p className="text-muted max-w-md mx-auto">
            You are recognized as a verified buyer on GharBid. You can now securely bid on properties and contact sellers.
          </p>
          <button
            onClick={() => navigate(ROUTES.BUYER_DASHBOARD)}
            className="mt-4 px-6 py-2.5 bg-dark-hover border border-dark-border rounded-lg text-sm font-bold hover:bg-white/5 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="mt-8">
          {/* Progress bar */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-white">Upload Progress</span>
              <span className="text-sm text-muted">{doneCount} / {REQUIRED_DOCS.length} uploaded</span>
            </div>
            <div className="h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500 rounded-full"
                style={{ width: `${(doneCount / REQUIRED_DOCS.length) * 100}%` }}
              />
            </div>
            {allRequiredDone && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle size={12} /> All required documents uploaded — ready to submit!
              </p>
            )}
          </div>

          {/* Info Banner */}
          <div className="flex gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-8">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200/80">
              Documents marked <span className="font-bold text-red-400">Required</span> must be uploaded to become a verified buyer. Verified buyers have more privileges on the platform.
            </p>
          </div>

          {/* Document Cards */}
          <div className="space-y-4 mb-10">
            {REQUIRED_DOCS.map(doc => {
              const state = uploads[doc.key];
              const isDone = state.status === 'done';
              const isUploading = state.status === 'uploading';
              const isError = state.status === 'error';

              return (
                <div
                  key={doc.key}
                  className={`border rounded-xl p-5 transition-all duration-300 ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isError
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-dark-border bg-dark-card hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-emerald-500/20' : isError ? 'bg-red-500/20' : 'bg-dark-hover'
                      }`}>
                        {isDone
                          ? <CheckCircle size={20} className="text-emerald-400" />
                          : isError
                          ? <XCircle size={20} className="text-red-400" />
                          : isUploading
                          ? <Loader2 size={20} className="text-secondary animate-spin" />
                          : <FileText size={20} className="text-muted" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-white">{doc.label}</h3>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            doc.required
                              ? 'text-red-400 bg-red-500/10 border-red-500/30'
                              : 'text-muted bg-dark-border border-transparent'
                          }`}>
                            {doc.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{doc.description}</p>

                        {isDone && state.fileName && (
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-emerald-400 font-medium truncate max-w-xs">
                              ✓ {state.fileName}
                            </p>
                          </div>
                        )}
                        {isError && (
                          <p className="text-xs text-red-400 mt-1">{state.error}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isDone && (
                        <button
                          onClick={() => clearUpload(doc.key)}
                          title="Remove and re-upload"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-hover hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                      {!isDone && (
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${
                          isUploading
                            ? 'bg-dark-border text-muted cursor-not-allowed'
                            : isError
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                            : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'
                        }`}>
                          {isUploading
                            ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                            : isError
                            ? <><Upload size={14} /> Retry</>
                            : <><Upload size={14} /> Upload</>
                          }
                          <input
                            type="file"
                            accept={doc.accept}
                            className="hidden"
                            disabled={isUploading}
                            onChange={e => handleFileChange(e, doc.key)}
                          />
                        </label>
                      )}
                      {isDone && (
                        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                          <Eye size={14} /> Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-dark-border pt-8">
            <button
              onClick={() => navigate(ROUTES.BUYER_DASHBOARD)}
              className="text-muted hover:text-white text-sm transition-colors"
            >
              ← Back to Dashboard
            </button>

            <button
              onClick={handleSubmit}
              disabled={!allRequiredDone || submitting}
              className="flex items-center gap-2 px-10 py-4 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,215,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting
                ? <><Loader2 size={18} className="animate-spin" /> Submitting for Review...</>
                : <><ShieldCheck size={18} /> Submit Documents <ArrowRight size={16} /></>
              }
            </button>
          </div>

          {!allRequiredDone && (
            <p className="text-xs text-muted text-center mt-4">
              {requiredDocs.filter(d => uploads[d.key].status !== 'done').length} required document(s) still pending.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
