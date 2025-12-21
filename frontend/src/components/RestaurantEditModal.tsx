import ImageUploader from './ImageUploader';

export default function RestaurantEditModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  editing,
  modalSubmitting,
  onBannerUploaded,
  setError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  editing: boolean;
  modalSubmitting: boolean;
  onBannerUploaded: (url: string) => void;
  setError: (msg: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded max-w-xl w-full p-4 shadow-lg overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">
            {editing ? 'Edit restaurant' : 'Create restaurant'}
          </h3>
          <button type="button" className="text-gray-600" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm">Short description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm">Address</label>
            <input
              value={form.address ?? ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Owner User ID {editing ? '(Readonly once assigned)' : ''}
            </label>
            <input
              value={form.ownerUserId ?? ''}
              onChange={(e) => setForm({ ...form, ownerUserId: e.target.value || null })}
              className="mt-1 p-2 border rounded w-full"
              disabled={!!editing}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">Timezone</label>
              <input
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm">Plan</label>
            <select
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              className="mt-1 p-2 border rounded"
              disabled={!!editing}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm">Banner / logo (optional)</label>
            <div className="mt-1">
              <ImageUploader
                value={form.bannerUrl ?? null}
                uploadUrl="/api/uploads"
                onUploadSuccess={(url) => onBannerUploaded(url)}
                onError={(e) => setError(String(e?.message ?? e))}
                autoUpload={true}
              />
              {form.bannerUrl && (
                <div className="mt-2 text-xs text-gray-600">
                  Uploaded:{' '}
                  <a
                    href={form.bannerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600"
                  >
                    {form.bannerUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white rounded"
            disabled={modalSubmitting}
          >
            {modalSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
