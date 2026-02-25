import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { useStore } from '../store';
import ExtractionReviewModal from './ExtractionReviewModal';
import LoadingSpinner from './shared/LoadingSpinner';
import type { Document as DocType, ExtractedField } from '../types';

interface Props {
  propertyId: number;
  onExtracted: () => void;
}

export default function DocumentUploadZone({ propertyId, onExtracted }: Props) {
  const showToast = useStore((s) => s.showToast);
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [reviewDoc, setReviewDoc] = useState<{ docId: number; fields: ExtractedField[] } | null>(null);

  const refreshDocs = useCallback(async () => {
    const result = await api.getDocuments(propertyId);
    setDocs(result);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { refreshDocs(); }, [refreshDocs]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const doc = await api.uploadDocument(propertyId, file);
        showToast(`Uploaded ${file.name}`, 'success');
        setExtracting(doc.id);
        try {
          const result = await api.triggerExtraction(doc.id);
          showToast(`Extracted ${result.extracted} fields`, 'success');
          const fields = await api.getExtracted(doc.id);
          setReviewDoc({ docId: doc.id, fields });
        } catch (err: any) {
          showToast(`Extraction failed: ${err.message}`, 'error');
        }
        setExtracting(null);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      refreshDocs();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleExtractExisting = async (docId: number) => {
    setExtracting(docId);
    try {
      await api.triggerExtraction(docId);
      const fields = await api.getExtracted(docId);
      setReviewDoc({ docId, fields });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setExtracting(null);
  };

  const handleDelete = async (docId: number) => {
    await api.deleteDocument(docId);
    refreshDocs();
    showToast('Document deleted', 'success');
  };

  const handleApply = async () => {
    try {
      const result = await api.applyExtracted(propertyId);
      showToast(`Applied ${result.applied} fields`, 'success');
      setReviewDoc(null);
      onExtracted();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Upload dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer
          ${dragOver
            ? 'border-emerald bg-emerald-light/50 scale-[1.01]'
            : 'border-sand hover:border-stone bg-white/50'}`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,application/pdf';
          input.multiple = true;
          input.onchange = () => handleUpload(input.files);
          input.click();
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <span className="text-sm text-stone">Uploading...</span>
          </div>
        ) : extracting !== null ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <span className="text-sm text-stone font-serif italic">Extracting data with AI...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-parchment flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#B8AFA3" strokeWidth="1.5">
                <path d="M10 3v10M6 7l4-4 4 4" /><path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
              </svg>
            </div>
            <p className="text-charcoal font-medium mb-1">Drop property documents here</p>
            <p className="text-xs text-stone">PDF, JPEG, PNG, WebP &mdash; max 10 MB</p>
          </>
        )}
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : docs.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-baseline gap-3 mb-4">
            <h3 className="font-serif text-lg text-ink">Documents</h3>
            <div className="flex-1 border-t border-sand/60 translate-y-[-2px]" />
          </div>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-white border border-sand/40 rounded-md px-5 py-3 shadow-card">
                <div>
                  <p className="text-sm text-ink font-medium">{doc.original_name}</p>
                  <p className="text-xs text-stone mt-0.5">
                    {(doc.size_bytes / 1024).toFixed(0)} KB &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleExtractExisting(doc.id)} disabled={extracting === doc.id}
                    className="text-emerald text-xs font-semibold uppercase tracking-wider hover:text-emerald-dark disabled:opacity-50 transition-colors">
                    {extracting === doc.id ? 'Extracting...' : 'Extract'}
                  </button>
                  <button onClick={() => handleDelete(doc.id)}
                    className="text-coral/60 text-xs font-medium hover:text-coral transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {reviewDoc && (
        <ExtractionReviewModal fields={reviewDoc.fields} onApply={handleApply} onClose={() => setReviewDoc(null)} />
      )}
    </div>
  );
}
