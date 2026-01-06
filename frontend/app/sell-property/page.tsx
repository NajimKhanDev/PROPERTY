'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Property {
  id: string;
  address: string;
  type: string;
  price: number;
  owner: string;
  status: 'available' | 'sold';
}

export default function SellProperty() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [buyerData, setBuyerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    salePrice: '',
    saleDate: new Date().toISOString().split('T')[0],
  });

  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('isLoggedIn')) {
      router.push('/login');
      return;
    }

    const saved = localStorage.getItem('properties');
    if (saved) {
      setProperties(JSON.parse(saved).filter((p: Property) => p.status === 'available'));
    }
  }, [router]);

  const selectedPropertyDetails = properties.find(p => p.id === selectedProperty);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBuyerData({ ...buyerData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return alert('Please select a property');

    const allProperties = JSON.parse(localStorage.getItem('properties') || '[]');
    const idx = allProperties.findIndex((p: Property) => p.id === selectedProperty);

    if (idx !== -1) {
      allProperties[idx].status = 'sold';

      const saleRecord = {
        id: Date.now().toString(),
        propertyId: selectedProperty,
        propertyAddress: allProperties[idx].address,
        originalPrice: allProperties[idx].price,
        salePrice: Number(buyerData.salePrice),
        buyerName: buyerData.name,
        buyerPhone: buyerData.phone,
        buyerEmail: buyerData.email,
        buyerAddress: buyerData.address,
        saleDate: buyerData.saleDate,
        soldDate: new Date().toISOString(),
      };

      localStorage.setItem('properties', JSON.stringify(allProperties));

      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      localStorage.setItem('sales', JSON.stringify([...sales, saleRecord]));

      alert('Property sold successfully!');
      router.push('/dashboard');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sell Property</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a property and complete buyer & sale details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ================= PROPERTY SELECTION ================= */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Property Selection
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <Select
              label="Select Property"
              value={selectedProperty}
              onChange={(e: any) => setSelectedProperty(e.target.value)}
            >
              <option value="">Choose a property</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.address} • {p.type} • ${p.price.toLocaleString()}
                </option>
              ))}
            </Select>

            {selectedPropertyDetails && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
                <p><strong>Address:</strong> {selectedPropertyDetails.address}</p>
                <p><strong>Type:</strong> {selectedPropertyDetails.type}</p>
                <p><strong>Listed Price:</strong> ${selectedPropertyDetails.price.toLocaleString()}</p>
                <p><strong>Owner:</strong> {selectedPropertyDetails.owner}</p>
              </div>
            )}
          </div>
        </div>

        {/* ================= BUYER INFO ================= */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Buyer Information
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Buyer Name" name="name" value={buyerData.name} onChange={handleChange} />
            <Input label="Buyer Phone" name="phone" value={buyerData.phone} onChange={handleChange} />
            <Input label="Buyer Email" name="email" type="email" value={buyerData.email} onChange={handleChange} className="md:col-span-2" />
            <Input label="Buyer Address" name="address" value={buyerData.address} onChange={handleChange} className="md:col-span-2" />
          </div>
        </div>

        {/* ================= SALE DETAILS ================= */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Sale Details
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Sale Price ($)" name="salePrice" type="number" value={buyerData.salePrice} onChange={handleChange} />
            <Input label="Sale Date" name="saleDate" type="date" value={buyerData.saleDate} onChange={handleChange} />
          </div>
        </div>

        {/* ================= ACTION ================= */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-2.5 rounded-lg bg-[#0070BB] text-white font-medium
            hover:bg-[#005A99] focus:ring-2 focus:ring-offset-2 focus:ring-[#0070BB]"
          >
            Confirm Sale
          </button>
        </div>
      </form>
    </div>
  );
}

/* ================= REUSABLE FIELDS ================= */

function Input({ label, className = '', ...props }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        required
        className="w-full rounded-md border border-gray-300 text-black px-3 py-2 text-sm
        focus:ring-2 focus:ring-[#0070BB] focus:border-[#0070BB]"
      />
    </div>
  );
}

function Select({ label, children, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        {...props}
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black
        focus:ring-2 focus:ring-[#0070BB] focus:border-[#0070BB]"
      >
        {children}
      </select>
    </div>
  );
}
