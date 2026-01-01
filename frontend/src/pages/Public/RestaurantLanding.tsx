import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import QRCode from 'qrcode';

export default function RestaurantLanding() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [qr, setQr] = useState<string>('');

  useEffect(() => {
    api.get(`/api/restaurants/${restaurantId}`).then((res) => {
      setRestaurant(res.data);
    });

    const menuUrl = `${window.location.origin}/menu/${restaurantId}`;
    QRCode.toDataURL(menuUrl, { width: 280 }).then(setQr);
  }, [restaurantId]);

  if (!restaurant) return <div className="p-6">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Banner */}
      {restaurant.bannerUrl && (
        <img src={restaurant.bannerUrl} className="w-full h-48 object-cover" />
      )}

      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <p className="text-gray-600 mt-2">
          {restaurant.description || 'Scan & order from your table'}
        </p>

        <div className="mt-6 flex justify-center">
          <img src={qr} className="w-64 h-64" />
        </div>

        <a
          href={`/menu/${restaurantId}`}
          className="mt-6 block bg-blue-600 text-white text-center py-3 rounded text-lg"
        >
          Open Menu
        </a>
      </div>
    </div>
  );
}
