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

        // Auto-trigger extraction
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
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 cursor-pointer
          ${dragOver
            ? 'border-scout-mint bg-scout-mint/5 shadow-inner'
            : 'border-scout-ash hover:border-scout-mint/30 hover:bg-scout-carbon/50'}`}
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
            <span className="text-sm text-scout-fossil">Uploading...</span>
          </div>
        ) : extracting !== null ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <span className="text-sm text-scout-mint">Extracting data with AI...</span>
          </div>
        ) : (
          <>
            <div className="text-3xl text-scout-flint mb-3">&uarr;</div>
            <p className="text-scout-fossil mb-1">Drag & drop property documents here</p>
            <p className="text-[11px] text-scout-drift">PDF, JPEG, PNG, WebP (max 10MB)</p>
          </>
        )}
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : docs.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-[11px] text-scout-drift uppercase tracking-[0.15em] font-medium">Uploaded Documents</h3>
            <div className="divider flex-1" />
          </div>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-scout-carbon border border-scout-ash
                                           rounded-lg p-4 hover:border-scout-flint transition-colors">
                <div>
                  <p className="text-sm text-scout-chalk">{doc.original_name}</p>
                  <p className="text-[11px] text-scout-drift font-mono mt-0.5">
                    {(doc.size_bytes / 1024).toFixed(0)} KB &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleExtractExisting(doc.id)}
                    disabled={extracting === doc.id}
                    className="text-scout-mint text-xs hover:text-scout-mint-dim disabled:opacity-50 font-medium transition-colors">
                    {extracting === doc.id ? 'Extracting...' : 'Extract'}
                  </button>
                  <button onClick={() => handleDelete(doc.id)}
                    className="text-scout-rose/60 text-xs hover:text-scout-rose transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Extraction review modal */}
      {reviewDoc && (
        <ExtractionReviewModal
          fields={reviewDoc.fields}
          onApply={handleApply}
          onClose={() => setReviewDoc(null)}
        />
      )}
    </div>
  );
}
