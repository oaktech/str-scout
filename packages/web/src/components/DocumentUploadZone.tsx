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
          // Open review modal
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
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-scout-accent bg-scout-accent/5' : 'border-scout-border hover:border-scout-accent/50'}`}
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
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner />
            <span className="text-sm text-scout-muted">Uploading...</span>
          </div>
        ) : extracting !== null ? (
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner />
            <span className="text-sm text-scout-muted">Extracting data with AI...</span>
          </div>
        ) : (
          <>
            <p className="text-scout-muted mb-1">Drag & drop property documents here</p>
            <p className="text-xs text-scout-muted">PDF, JPEG, PNG, WebP (max 10MB)</p>
          </>
        )}
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : docs.length > 0 ? (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold mb-3">Uploaded Documents</h3>
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-scout-surface border border-scout-border rounded-lg p-3">
              <div>
                <p className="text-sm text-white">{doc.original_name}</p>
                <p className="text-xs text-scout-muted">
                  {(doc.size_bytes / 1024).toFixed(0)} KB &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExtractExisting(doc.id)}
                  disabled={extracting === doc.id}
                  className="text-scout-accent text-xs hover:underline disabled:opacity-50">
                  {extracting === doc.id ? 'Extracting...' : 'Extract'}
                </button>
                <button onClick={() => handleDelete(doc.id)}
                  className="text-red-400 text-xs hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
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
