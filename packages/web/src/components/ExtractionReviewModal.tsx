import { useState } from 'react';
import * as api from '../services/api';
import type { ExtractedField } from '../types';

interface Props {
  fields: ExtractedField[];
  onApply: () => void;
  onClose: () => void;
}

function confidenceColor(c: number): string {
  if (c > 0.8) return 'bg-green-500/20 text-green-400';
  if (c > 0.5) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

export default function ExtractionReviewModal({ fields, onApply, onClose }: Props) {
  const [fieldStates, setFieldStates] = useState(
    fields.map((f) => ({ ...f, editedValue: f.field_value })),
  );
  const [applying, setApplying] = useState(false);

  const toggleField = async (index: number) => {
    const field = fieldStates[index];
    const newStatus = field.status === 'accepted' ? 'rejected' : 'accepted';
    await api.updateExtracted(field.id, { status: newStatus, field_value: field.editedValue });
    setFieldStates((prev) => prev.map((f, i) => i === index ? { ...f, status: newStatus } : f));
  };

  const updateValue = (index: number, value: string) => {
    setFieldStates((prev) => prev.map((f, i) => i === index ? { ...f, editedValue: value } : f));
  };

  const handleApply = async () => {
    // Save any edited values
    for (const field of fieldStates) {
      if (field.editedValue !== field.field_value && field.status === 'accepted') {
        await api.updateExtracted(field.id, { status: 'accepted', field_value: field.editedValue });
      }
    }
    setApplying(true);
    await onApply();
    setApplying(false);
  };

  const acceptedCount = fieldStates.filter((f) => f.status === 'accepted').length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-scout-surface border border-scout-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-scout-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Review Extracted Data</h3>
          <button onClick={onClose} className="text-scout-muted hover:text-white text-xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {fieldStates.length === 0 ? (
            <p className="text-scout-muted text-center py-8">No fields were extracted from this document.</p>
          ) : (
            fieldStates.map((field, i) => (
              <div key={field.id}
                className={`border rounded-lg p-3 transition-colors
                  ${field.status === 'accepted' ? 'border-green-500/30 bg-green-500/5' :
                    field.status === 'rejected' ? 'border-red-500/30 bg-red-500/5 opacity-60' :
                    'border-scout-border'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{field.label || field.field_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${confidenceColor(field.confidence)}`}>
                      {(field.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <button onClick={() => toggleField(i)}
                    className={`text-xs px-2 py-1 rounded ${
                      field.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      field.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-scout-border text-scout-muted hover:text-white'}`}
                  >
                    {field.status === 'accepted' ? 'Accepted' : field.status === 'rejected' ? 'Rejected' : 'Accept'}
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-scout-muted shrink-0">{field.field_name}:</span>
                  <input
                    value={field.editedValue}
                    onChange={(e) => updateValue(i, e.target.value)}
                    className="flex-1 bg-scout-bg border border-scout-border rounded px-2 py-1 text-sm font-mono text-white"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-scout-border flex items-center justify-between">
          <span className="text-xs text-scout-muted">{acceptedCount} of {fieldStates.length} fields accepted</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-scout-muted hover:text-white">
              Cancel
            </button>
            <button onClick={handleApply} disabled={applying || acceptedCount === 0}
              className="bg-scout-accent hover:bg-scout-accent/90 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {applying ? 'Applying...' : `Apply ${acceptedCount} Fields`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
