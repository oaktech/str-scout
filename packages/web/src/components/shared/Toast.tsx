import { useStore } from '../../store';

export default function Toast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  if (!toast) return null;

  const bg =
    toast.type === 'success' ? 'bg-green-600' :
    toast.type === 'error' ? 'bg-red-600' :
    'bg-blue-600';

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
      <div className={`${bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
        <span>{toast.message}</span>
        <button onClick={clearToast} className="text-white/70 hover:text-white">
          &times;
        </button>
      </div>
    </div>
  );
}
