// src/pages/Admin/AdminCreateRestaurant.tsx
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import QRCode from 'qrcode';
import ImageUploader from '../../components/ImageUploader';
import { useAuthStore } from '../../app/store';

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
  const { user } = useAuthStore();
  const [ownerUserId, setOwnerUserId] = useState<string | null>(user?.email || null);

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
    <div className="p-4 lg:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Setup New Restaurant</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Configure your menu and generate customer QR codes</p>
          </div>
          <button
            onClick={() => navigate('/admin/restaurants')}
            className="h-11 px-6 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
          >
            All Restaurants
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <section className="xl:col-span-3">
            <form onSubmit={handleCreate} className="bg-white rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xl shadow-gray-200/20 border border-gray-100">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Restaurant Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. The Gourmet Kitchen"
                    className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Short Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your cuisine or vibe..."
                    className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Address</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main St, New York"
                    className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Owner Email</label>
                  <input
                    value={ownerUserId ?? ''}
                    disabled
                    className="border border-gray-100 bg-gray-100/50 rounded-xl p-3 text-sm font-bold text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    >
                      <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">USA Eastern</option>
                      <option value="Europe/London">UK (London)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Subscription Plan</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlanId('free')}
                      className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        planId === 'free' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      Free Tier
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanId('pro')}
                      className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        planId === 'pro' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      Pro Tier
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Banner / Logo</label>
                  <div className="mt-1">
                    <ImageUploader
                      value={bannerUrl}
                      uploadUrl="/api/uploads"
                      onUploadSuccess={(url) => setBannerUrl(url)}
                      onError={(e) => setError(String(e?.message ?? e))}
                      autoUpload={true}
                    />
                    {bannerUrl && (
                      <div className="mt-2 text-[10px] font-bold text-blue-600 truncate border border-blue-100 bg-blue-50/30 px-3 py-1.5 rounded-lg">
                        Uploaded: <a href={bannerUrl} target="_blank" rel="noreferrer" className="underline">{bannerUrl}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-4">{error}</div>}

              <div className="pt-6 border-t border-gray-50">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Create Restaurant & Generate QR'}
                </button>
              </div>
            </form>
          </section>

          <section className="xl:col-span-2 space-y-8">
            {qrDataUrl && created ? (
              <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xl shadow-gray-200/20 border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Success! QR Code Ready</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">For {created.name ?? created.restaurantName}</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 flex items-center justify-center mb-6 shadow-inner">
                  <img
                    src={qrDataUrl}
                    alt="QR"
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain mix-blend-multiply"
                  />
                </div>

                <div className="space-y-4">
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Menu Link</label>
                      <div className="p-3 bg-gray-50/50 rounded-xl text-[10px] font-bold text-gray-500 break-all border border-gray-100">
                        {`${window.location.origin}/menu/${created.id}?tableId=table-1`}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={downloadQR}
                        className="h-11 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                      >
                        Download PNG
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(`${window.location.origin}/menu/${created.id}?tableId=table-1`);
                           alert('URL copied to clipboard');
                        }}
                        className="h-11 bg-gray-50 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                      >
                        Copy URL
                      </button>
                   </div>
                </div>
                <canvas ref={qrCanvasRef} className="hidden" />
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-10 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                   <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                   </svg>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest max-w-[160px]">Fill the form to generate your menu QR code</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
