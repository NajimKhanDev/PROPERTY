'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CustomerViewPage() {
  const params = useParams();
  const customerId = params.id;

  // Mock data - in real app, fetch from API
  const customer = {
    id: customerId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    address: '123 Main St, City, State 12345',
    type: 'buyer' as 'buyer' | 'seller' | 'both',
    createdAt: '2024-01-15',
    totalTransactions: 3,
    totalAmount: 750000
  };

  return (
    <div className="p-6 text-gray-600">
      <div className="mb-6">
        <Link href="/customers" className="text-blue-600 hover:text-blue-800">
          ← Back to Customers
        </Link>
        <h1 className="text-2xl font-bold mt-2">Customer Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold">Customer Information</h2>
              <Link
                href={`/customers/${customerId}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit Customer
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <p className="text-lg font-medium">{customer.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-lg">{customer.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-lg">{customer.phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer Type</label>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  customer.type === 'buyer' ? 'bg-green-100 text-green-800' :
                  customer.type === 'seller' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {customer.type}
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                <p className="text-lg">{customer.address}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                <p className="text-lg">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{customer.totalTransactions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">${customer.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/customers/${customerId}/edit`}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Edit Customer
              </Link>
              <Link
                href="/properties/add"
                className="block w-full text-center bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Add Property
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}