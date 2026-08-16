"use client";

export function SignOutConfirm({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
        <div>
          <h3 className="text-base font-bold text-white">Sign out?</h3>
          <p className="text-sm text-carbon-300 mt-1">
            You&apos;ll need to sign in again to access the registry.
          </p>
        </div>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-carbon-750 hover:bg-carbon-700 text-xs font-medium text-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-500/90 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
