import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemTitle: string;
  itemType: 'Project' | 'Chat';
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  itemTitle,
  itemType,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to delete ${itemType.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md rounded-2xl bg-[#090d10] border border-red-500/30 p-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm uppercase tracking-wider">
            <AlertTriangle size={16} />
            <span>Delete {itemType}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Message */}
        <div className="mt-4 text-sm text-zinc-300 font-sans leading-relaxed">
          Are you sure you want to delete <strong className="text-white">&ldquo;{itemTitle}&rdquo;</strong>?
          {itemType === 'Project' && (
            <p className="mt-2 text-xs text-zinc-400">
              Chats inside this project will remain available in Standalone Chats.
            </p>
          )}
          <p className="mt-2 text-xs text-red-400 font-mono">
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
