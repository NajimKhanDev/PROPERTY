'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterProperty() {
  const [formData, setFormData] = useState({
    address: '',
    type: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    description: '',
  });

  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('isLoggedIn')) {
      router.push('/login');
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProperty = {
      id: Date.now().toString(),
      address: formData.address,
      type: formData.type,
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      area: Number(formData.area),
      owner: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      ownerEmail: formData.ownerEmail,
      description: formData.description,
      status: 'available',
      registeredDate: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('properties') || '[]');
    localStorage.setItem('properties', JSON.stringify([...existing, newProperty]));

    alert('Property registered successfully!');
    router.push('/dashboard');
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Register Property
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter complete property and owner details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ================= PROPERTY DETAILS ================= */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Property Details
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Property Address" name="address" value={formData.address} onChange={handleChange} />
            <Select label="Property Type" name="type" value={formData.type} onChange={handleChange} />

            <Input label="Price ($)" name="price" type="number" value={formData.price} onChange={handleChange} />
            <Input label="Area (sq ft)" name="area" type="number" value={formData.area} onChange={handleChange} />

            <Input label="Bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} />
            <Input label="Bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} />
          </div>
        </div>

        {/* ================= OWNER DETAILS ================= */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Owner Information
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleChange} />
            <Input label="Owner Phone" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} />
            <Input
              label="Owner Email"
              name="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={handleChange}
              className="md:col-span-2"
            />

            <Textarea
              label="Property Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="md:col-span-2"
            />
          </div>
        </div>

        {/* ================= ACTION ================= */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-2.5 rounded-lg bg-[#0070BB] text-white font-medium
            hover:bg-[#005A99] focus:ring-2 focus:ring-offset-2 focus:ring-[#0070BB]"
          >
            Register Property
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

function Select({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        {...props}
        required
        className="w-full rounded-md border border-gray-300 text-black px-3 py-2 text-sm
        focus:ring-2 focus:ring-[#0070BB] focus:border-[#0070BB]"
      >
        <option value="">Select Type</option>
        <option value="House">House</option>
        <option value="Apartment">Apartment</option>
        <option value="Condo">Condo</option>
        <option value="Townhouse">Townhouse</option>
        <option value="Commercial">Commercial</option>
      </select>
    </div>
  );
}

function Textarea({ label, className = '', ...props }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        {...props}
        rows={4}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
        focus:ring-2 focus:ring-[#0070BB] focus:border-[#0070BB]"
      />
    </div>
  );
}
