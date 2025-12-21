// src/pages/Admin/AdminCreateRestaurant.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import QRCode from 'qrcode';
import ImageUploader from '../../components/ImageUploader';

type CreateReq = {
  name: string;
  ownerUserId?: string | null;
  timezone?: string;
  currency?: string;
  planId?: string;
  description?: string;
  bannerUrl?: string | null;
  address?: string;
};

export default function AdminCreateRestaurant() {
  const navigate = useNavigate();

  // form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('INR');
  const [planId, setPlanId] = useState('free');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: CreateReq = {
        name,
        description,
        timezone,
        currency,
        planId,
        bannerUrl: bannerUrl ?? null,
        address,
        ownerUserId: ownerUserId ?? null,
      };

      const res = await api.post('/api/restaurants', payload);
      const rest = res.data;
      setCreated(rest);

      const firstTableId = rest?.tables && rest.tables[0]?.id ? rest.tables[0].id : 'table-1';
      const target = `${window.location.origin}/menu/${rest?.id ?? rest?.restaurantId ?? ''}?tableId=${firstTableId}`;

      const dataUrl = await QRCode.toDataURL(target, { margin: 2, width: 360 });
      setQrDataUrl(dataUrl);

      if (qrCanvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const canvas = qrCanvasRef.current!;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = dataUrl;
      }
    } catch (err: any) {
      console.error('create restaurant fail', err);
      setError(err?.response?.data?.message || 'Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  }

  function downloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${created?.name ?? 'restaurant'}_qr.png`;
    a.click();
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Admin — Create Restaurant & QR</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <section className="bg-white rounded shadow">
          <form onSubmit={handleCreate} className="space-y-4 bg-white p-4 rounded shadow">
            <div>
              <label className="block text-sm font-medium">Restaurant name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Short description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 p-2 border rounded w-full"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Owner User ID (optional)</label>
              <input
                value={ownerUserId ?? ''}
                onChange={(e) => setOwnerUserId(e.target.value || null)}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">USA Eastern (New York)</option>
                  <option value="America/Los_Angeles">USA Pacific (Los Angeles)</option>
                  <option value="Europe/London">UK (London)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Currency</label>
                <input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm">Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="mt-1 p-2 border rounded"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm">Banner / logo (optional)</label>
              <div className="mt-1">
                <ImageUploader
                  value={bannerUrl}
                  uploadUrl="/api/uploads"
                  onUploadSuccess={(url) => setBannerUrl(url)}
                  onError={(e) => setError(String(e?.message ?? e))}
                  onProgress={() => {}}
                  maxSizeBytes={2 * 1024 * 1024}
                  autoUpload={true}
                />
                {bannerUrl && (
                  <div className="mt-2 text-xs text-gray-600">
                    Uploaded:{' '}
                    <a href={bannerUrl} target="_blank" rel="noreferrer" className="text-blue-600">
                      {bannerUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="text-red-600">{error}</div>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {loading ? 'Creating...' : 'Create restaurant & generate QR'}
              </button>

              {created && (
                <div className="text-sm text-gray-700">
                  Created: <strong>{created.name ?? created.restaurantName ?? created.id}</strong>
                </div>
              )}
            </div>
          </form>
        </section>
        <section className="">
          {qrDataUrl && created && (
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-semibold mb-2">
                QR for {created.name ?? created.restaurantName ?? created.id}
              </h3>
              <div className="flex gap-4 items-start">
                <img
                  src={qrDataUrl}
                  alt="QR"
                  style={{ width: 220, height: 220, background: 'white' }}
                />
                <div>
                  <div className="mb-2 text-sm">Scan URL:</div>
                  <div className="p-2 bg-gray-50 rounded text-xs break-all">{`${window.location.origin}/menu/${created.id}?tableId=table-1`}</div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={downloadQR}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Download PNG
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          `${window.location.origin}/menu/${created.id}?tableId=table-1`,
                        )
                      }
                      className="px-3 py-1 border rounded"
                    >
                      Copy URL
                    </button>
                  </div>
                  <canvas
                    ref={(c) => {
                      if (c) qrCanvasRef.current = c;
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
