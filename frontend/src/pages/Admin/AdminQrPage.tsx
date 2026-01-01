import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import QRCode from 'qrcode';

export default function AdminQrPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [qr, setQr] = useState('');

  const menuUrl = `${window.location.origin}/menu/${id}`;
  const landingUrl = `${window.location.origin}/r/${id}`;

  useEffect(() => {
    api.get(`/api/restaurants/${id}`).then((res) => setRestaurant(res.data));
    QRCode.toDataURL(landingUrl, { width: 300 }).then(setQr);
  }, [id]);

  function copyLink() {
    navigator.clipboard.writeText(landingUrl);
    alert('Link copied!');
  }

  if (!restaurant) return null;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">QR for {restaurant.name}</h1>

      <img src={qr} className="w-72 h-72 mx-auto" />

      <div className="mt-4 space-y-2">
        <button onClick={copyLink} className="w-full border p-2 rounded">
          Copy Landing Page Link
        </button>

        <a href={menuUrl} target="_blank" className="block text-center text-blue-600">
          Open Menu
        </a>

        <button
          onClick={() => window.print()}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Print QR Sheet
        </button>
      </div>
    </div>
  );
}
