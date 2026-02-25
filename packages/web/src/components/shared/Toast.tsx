import { useStore } from '../../store';

const TOAST_STYLES = {
  success: 'bg-scout-mint/10 border-scout-mint/30 text-scout-mint',
  error: 'bg-scout-rose/10 border-scout-rose/30 text-scout-rose',
  info: 'bg-scout-blue/10 border-scout-blue/30 text-scout-blue',
};

export default function Toast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-toast-in">
      <div className={`${TOAST_STYLES[toast.type]} border backdrop-blur-sm px-4 py-3 rounded-lg
                        shadow-2xl shadow-black/40 flex items-center gap-3 font-body text-sm`}>
        <span>{toast.message}</span>
        <button onClick={clearToast} className="opacity-60 hover:opacity-100 transition-opacity text-lg leading-none">
          &times;
        </button>
      </div>
    </div>
  );
}
