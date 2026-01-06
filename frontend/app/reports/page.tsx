'use client';

import { useState } from 'react';

interface ReportData {
  totalCustomers: number;
  totalProperties: number;
  totalPayments: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; amount: number }[];
  propertyTypes: { type: string; count: number }[];
  customerTypes: { type: string; count: number }[];
  recentTransactions: {
    id: number;
    property: string;
    customer: string;
    amount: number;
    date: string;
    type: string;
  }[];
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<'overview' | 'customers' | 'properties' | 'payments'>('overview');

  // Mock data
  const reportData: ReportData = {
    totalCustomers: 25,
    totalProperties: 15,
    totalPayments: 42,
    totalRevenue: 2500000,
    monthlyRevenue: [
      { month: 'Jan', amount: 450000 },
      { month: 'Feb', amount: 380000 },
      { month: 'Mar', amount: 520000 },
      { month: 'Apr', amount: 610000 },
      { month: 'May', amount: 540000 }
    ],
    propertyTypes: [
      { type: 'Residential', count: 12 },
      { type: 'Commercial', count: 3 }
    ],
    customerTypes: [
      { type: 'Buyer', count: 15 },
      { type: 'Seller', count: 8 },
      { type: 'Both', count: 2 }
    ],
    recentTransactions: [
      { id: 1, property: 'Modern Villa', customer: 'John Doe', amount: 150000, date: '2024-01-20', type: 'Payment' },
      { id: 2, property: 'Downtown Apartment', customer: 'Jane Smith', amount: 75000, date: '2024-01-18', type: 'Payment' },
      { id: 3, property: 'Office Complex', customer: 'Bob Wilson', amount: 200000, date: '2024-01-15', type: 'Sale' }
    ]
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
          <p className="text-3xl font-bold text-blue-600">{reportData.totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Properties</h3>
          <p className="text-3xl font-bold text-green-600">{reportData.totalProperties}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
          <p className="text-3xl font-bold text-purple-600">{reportData.totalPayments}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-red-600">${reportData.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
          <div className="space-y-2">
            {reportData.monthlyRevenue.map((item) => (
              <div key={item.month} className="flex justify-between items-center">
                <span>{item.month}</span>
                <span className="font-medium">${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Property Types</h3>
          <div className="space-y-2">
            {reportData.propertyTypes.map((item) => (
              <div key={item.type} className="flex justify-between items-center">
                <span>{item.type}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.property}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                    ${transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.type === 'Sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportData.customerTypes.map((item) => (
          <div key={item.type} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{item.type} Customers</h3>
            <p className="text-3xl font-bold text-blue-600">{item.count}</p>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Customer Distribution</h3>
        <div className="space-y-4">
          {reportData.customerTypes.map((item) => (
            <div key={item.type}>
              <div className="flex justify-between mb-1">
                <span>{item.type}</span>
                <span>{Math.round((item.count / reportData.totalCustomers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(item.count / reportData.totalCustomers) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPropertyReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportData.propertyTypes.map((item) => (
          <div key={item.type} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{item.type} Properties</h3>
            <p className="text-3xl font-bold text-green-600">{item.count}</p>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Property Type Distribution</h3>
        <div className="space-y-4">
          {reportData.propertyTypes.map((item) => (
            <div key={item.type}>
              <div className="flex justify-between mb-1">
                <span>{item.type}</span>
                <span>{Math.round((item.count / reportData.totalProperties) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(item.count / reportData.totalProperties) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
          <p className="text-3xl font-bold text-purple-600">{reportData.totalPayments}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Average Payment</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${Math.round(reportData.totalRevenue / reportData.totalPayments).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
        <div className="space-y-4">
          {reportData.monthlyRevenue.map((item) => (
            <div key={item.month}>
              <div className="flex justify-between mb-1">
                <span>{item.month}</span>
                <span>${item.amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(item.amount / Math.max(...reportData.monthlyRevenue.map(r => r.amount))) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 text-black">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Comprehensive insights into your property business</p>
      </div>

      {/* Report Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'customers', label: 'Customers' },
              { key: 'properties', label: 'Properties' },
              { key: 'payments', label: 'Payments' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedReport(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedReport === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && renderOverview()}
      {selectedReport === 'customers' && renderCustomerReport()}
      {selectedReport === 'properties' && renderPropertyReport()}
      {selectedReport === 'payments' && renderPaymentReport()}
    </div>
  );
}