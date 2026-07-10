import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProperty } from '../../../services/propertyService';
import { uploadDocumentToS3, saveDocumentsToProperty, getDocumentReadUrl } from '../../../services/sellerService';
import { toast } from 'sonner';
import {
  FileText, Upload, CheckCircle, XCircle, Loader2,
  AlertCircle, ShieldCheck, ArrowRight, X, Eye
} from 'lucide-react';

interface DocSlot {
  key: string;
  label: string;
  description: string;
  required: boolean;
  accept: string;
}

const REQUIRED_DOCS: DocSlot[] = [
  {
    key: 'ownership_proof',
    label: 'Ownership Proof',
    description: 'Title deed, registry document, or sale deed copy proving you own the property.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'sale_deed',
    label: 'Sale Deed',
    description: 'Registered sale deed from the sub-registrar office.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'tax_receipt',
    label: 'Property Tax Receipt',
    description: 'Latest property tax paid receipt from the municipal authority.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'occupancy_certificate',
    label: 'Occupancy Certificate',
    description: 'Issued by local authority confirming the building is fit for occupation.',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'noc',
    label: 'NOC (No Objection Certificate)',
    description: 'NOC from housing society or relevant authority (if applicable).',
    required: false,
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'encumbrance_certificate',
    label: 'Encumbrance Certificate',
    description: 'Confirms the property is free from any monetary or legal liability.',
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

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [uploads, setUploads] = useState<Record<string, UploadState>>(
    Object.fromEntries(REQUIRED_DOCS.map(d => [d.key, { status: 'idle' }]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

  const handlePreview = async (s3Key: string) => {
    try {
      setLoadingPreview(s3Key);
      const readUrl = await getDocumentReadUrl(s3Key);
      setPreviewDocUrl(readUrl);
    } catch (err: any) {
      toast.error('Failed to load document preview.');
    } finally {
      setLoadingPreview(null);
    }
  };

  const { data: propertyData } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getProperty(propertyId!),
    enabled: !!propertyId,
  });

  useEffect(() => {
    if (propertyData?.documents) {
      setUploads(prev => {
        const newUploads = { ...prev };
        Object.keys(propertyData.documents).forEach(key => {
          const s3Key = propertyData.documents[key];
          if (s3Key && newUploads[key]) {
            newUploads[key] = { status: 'done', s3Key, fileName: 'Uploaded Document' };
          }
        });
        return newUploads;
      });
    }
  }, [propertyData]);

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
      const s3Key = await uploadDocumentToS3(file, docKey);
      setUploadState(docKey, { status: 'done', s3Key, fileName: file.name });
    } catch (err: any) {
      setUploadState(docKey, {
        status: 'error',
        error: err?.message ?? 'Upload failed. Please try again.',
      });
    }

    // Reset input so same file can be re-uploaded
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
      if (propertyId) {
        // Collect all uploaded s3Keys and persist to property record
        const documentKeys: Record<string, string> = {};
        for (const [key, val] of Object.entries(uploads)) {
          if (val.status === 'done' && val.s3Key) {
            documentKeys[key] = val.s3Key;
          }
        }
        await saveDocumentsToProperty(propertyId, documentKeys);
        toast.success('Documents submitted successfully!');
      } else {
        // No propertyId in URL — documents uploaded to S3 but no property to attach to
        toast.success('Documents uploaded! Attach them to a property from your dashboard.');
      }
      navigate('/seller');
    } catch (err: any) {
      toast.error(err?.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <ShieldCheck size={20} className="text-secondary" />
            </div>
            <span className="text-xs text-secondary font-bold uppercase tracking-widest">Legal Verification</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Upload <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">Legal Documents</span>
          </h1>
          <p className="text-muted">
            All documents are stored securely in encrypted S3 storage.
            Your property will be published once all required documents are uploaded.
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-white">Upload Progress</span>
            <span className="text-sm text-muted">{doneCount} / {REQUIRED_DOCS.length} documents</span>
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
        <div className="flex gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-8">
          <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-200/80">
            Documents marked <span className="font-bold text-yellow-400">Required</span> must be uploaded before submitting.
            Optional documents improve your listing's credibility.
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
                          : 'bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/30'
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
                      <button
                        type="button"
                        onClick={() => {
                          if (state.s3Key) handlePreview(state.s3Key);
                        }}
                        disabled={loadingPreview === state.s3Key}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {loadingPreview === state.s3Key ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} 
                        {loadingPreview === state.s3Key ? 'Loading...' : 'View'}
                      </button>
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
            onClick={() => navigate('/seller')}
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

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0A0A0A] border border-dark-border rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-dark-border flex items-center justify-between bg-black/45">
              <h2 className="text-lg font-display font-bold text-white">Document Preview</h2>
              <button 
                onClick={() => setPreviewDocUrl(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            <div className="flex-1 bg-black/60 relative overflow-hidden">
              {previewDocUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) ? (
                <img src={previewDocUrl} alt="Preview" className="w-full h-full object-contain p-4" />
              ) : (
                <iframe src={previewDocUrl} className="w-full h-full border-none" title="Document Preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
