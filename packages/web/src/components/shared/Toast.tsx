import { useStore } from '../../store';

export default function Toast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  if (!toast) return null;

  const styles =
    toast.type === 'success' ? 'bg-emerald text-white' :
    toast.type === 'error'   ? 'bg-coral text-white' :
    'bg-ink text-cream';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`${styles} pl-4 pr-3 py-3 rounded-lg shadow-elevated flex items-center gap-3 font-body text-sm`}>
        <span>{toast.message}</span>
        <button onClick={clearToast} className="opacity-60 hover:opacity-100 text-lg leading-none ml-1">&times;</button>
      </div>
    </div>
  );
}
