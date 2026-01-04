import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import QRCode from 'qrcode';

export default function RestaurantLanding() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [qr, setQr] = useState<string>('');

  const [showWakeupMsg, setShowWakeupMsg] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowWakeupMsg(true);
      }, 5000);
    } else {
      setShowWakeupMsg(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    api.get(`/api/restaurants/${restaurantId}`)
      .then((res) => {
        setRestaurant(res.data);
      })
      .finally(() => setLoading(false));

    const menuUrl = `${window.location.origin}/menu/${restaurantId}`;
    QRCode.toDataURL(menuUrl, { width: 280 }).then(setQr);
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-900 font-bold">Loading restaurant details...</p>
        {showWakeupMsg && (
          <p className="mt-2 text-sm text-blue-600 font-bold animate-pulse text-center px-4">
            Server is waking up, please wait...
          </p>
        )}
      </div>
    );
  }

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
