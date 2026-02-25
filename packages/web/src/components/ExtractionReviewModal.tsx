import { useState } from 'react';
import * as api from '../services/api';
import type { ExtractedField } from '../types';

interface Props {
  fields: ExtractedField[];
  onApply: () => void;
  onClose: () => void;
}

function confidenceDot(c: number): string {
  if (c > 0.8) return 'bg-emerald';
  if (c > 0.5) return 'bg-gold';
  return 'bg-coral';
}

function confidenceLabel(c: number): string {
  if (c > 0.8) return 'text-emerald-dark';
  if (c > 0.5) return 'text-gold-dark';
  return 'text-coral';
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
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
      <div className="bg-cream border border-sand rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-elevated animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-sand/60 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl text-ink">Review Extracted Data</h3>
            <p className="text-xs text-stone mt-0.5">Accept or reject each field before applying</p>
          </div>
          <button onClick={onClose} className="text-stone hover:text-ink text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-md hover:bg-sand/30">
            &times;
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {fieldStates.length === 0 ? (
            <p className="text-stone text-center py-12 font-serif italic">No fields were extracted from this document.</p>
          ) : (
            fieldStates.map((field, i) => (
              <div key={field.id}
                className={`border rounded-lg p-4 transition-all duration-200
                  ${field.status === 'accepted'
                    ? 'border-emerald/30 bg-emerald-light/30'
                    : field.status === 'rejected'
                    ? 'border-sand bg-parchment/50 opacity-50'
                    : 'border-sand/60 bg-white'}`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{field.label || field.field_name}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold ${confidenceLabel(field.confidence)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${confidenceDot(field.confidence)}`} />
                      {(field.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <button onClick={() => toggleField(i)}
                    className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded transition-colors
                      ${field.status === 'accepted'
                        ? 'text-emerald bg-emerald/10'
                        : field.status === 'rejected'
                        ? 'text-coral bg-coral/5'
                        : 'text-stone hover:text-ink hover:bg-parchment'}`}
                  >
                    {field.status === 'accepted' ? '\u2713 Accepted' : field.status === 'rejected' ? 'Rejected' : 'Accept'}
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] text-stone font-mono uppercase tracking-wider shrink-0">{field.field_name}</span>
                  <input
                    value={field.editedValue}
                    onChange={(e) => updateValue(i, e.target.value)}
                    className="flex-1 input-mono !py-1.5 text-xs"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sand/60 flex items-center justify-between">
          <span className="text-xs text-stone">{acceptedCount} of {fieldStates.length} fields accepted</span>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-stone hover:text-ink font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleApply} disabled={applying || acceptedCount === 0}
              className="bg-emerald hover:bg-emerald-dark text-white px-5 py-2 rounded-md text-sm font-semibold
                         disabled:opacity-40 transition-colors shadow-card">
              {applying ? 'Applying...' : `Apply ${acceptedCount} Fields`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
