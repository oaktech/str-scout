import { useState } from 'react';
import * as api from '../services/api';
import type { ExtractedField } from '../types';

interface Props {
  fields: ExtractedField[];
  onApply: () => void;
  onClose: () => void;
}

function confidenceStyle(c: number): string {
  if (c > 0.8) return 'bg-scout-mint/10 text-scout-mint border border-scout-mint/20';
  if (c > 0.5) return 'bg-scout-amber/10 text-scout-amber border border-scout-amber/20';
  return 'bg-scout-rose/10 text-scout-rose border border-scout-rose/20';
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-scout-carbon border border-scout-ash rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col
                       shadow-2xl shadow-black/50">
        <div className="p-5 border-b border-scout-ash flex items-center justify-between">
          <h3 className="font-display text-xl text-scout-bone">Review Extracted Data</h3>
          <button onClick={onClose} className="text-scout-drift hover:text-scout-chalk text-xl transition-colors">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {fieldStates.length === 0 ? (
            <p className="text-scout-fossil text-center py-8">No fields were extracted from this document.</p>
          ) : (
            fieldStates.map((field, i) => (
              <div key={field.id}
                className={`border rounded-lg p-4 transition-all duration-200
                  ${field.status === 'accepted'
                    ? 'border-scout-mint/20 bg-scout-mint/[0.03]'
                    : field.status === 'rejected'
                      ? 'border-scout-rose/20 bg-scout-rose/[0.03] opacity-50'
                      : 'border-scout-ash hover:border-scout-flint'}`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-scout-chalk">{field.label || field.field_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${confidenceStyle(field.confidence)}`}>
                      {(field.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <button onClick={() => toggleField(i)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all
                      ${field.status === 'accepted'
                        ? 'bg-scout-mint/10 text-scout-mint border border-scout-mint/20'
                        : field.status === 'rejected'
                          ? 'bg-scout-rose/10 text-scout-rose border border-scout-rose/20'
                          : 'bg-scout-ash text-scout-fossil border border-scout-ash hover:text-scout-chalk hover:border-scout-flint'}`}
                  >
                    {field.status === 'accepted' ? 'Accepted' : field.status === 'rejected' ? 'Rejected' : 'Accept'}
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] text-scout-drift shrink-0 font-mono uppercase tracking-wide">{field.field_name}:</span>
                  <input
                    value={field.editedValue}
                    onChange={(e) => updateValue(i, e.target.value)}
                    className="flex-1 bg-scout-soot border border-scout-ash rounded-md px-2.5 py-1.5 text-sm font-mono text-scout-bone
                               focus:outline-none focus:border-scout-mint/50 transition-colors"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-scout-ash flex items-center justify-between">
          <span className="text-[11px] text-scout-drift font-mono">{acceptedCount} of {fieldStates.length} fields accepted</span>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2.5 text-sm text-scout-fossil hover:text-scout-chalk transition-colors">
              Cancel
            </button>
            <button onClick={handleApply} disabled={applying || acceptedCount === 0}
              className="bg-scout-mint text-scout-void px-5 py-2.5 rounded-lg text-sm font-semibold
                         hover:bg-scout-mint/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {applying ? 'Applying...' : `Apply ${acceptedCount} Fields`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
