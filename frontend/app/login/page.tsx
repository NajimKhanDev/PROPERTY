'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (credentials.username === 'admin' && credentials.password === 'admin') {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-100">

      {/* ================= LEFT BRAND SECTION ================= */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-[#0070BB] to-[#005A99] text-white">
        <h1 className="text-4xl font-bold mb-4">
          Property Lending Platform
        </h1>
        <p className="text-lg text-blue-100 leading-relaxed">
          Manage property listings, loans, sales, and revenue insights —
          all from one secure dashboard.
        </p>

        <div className="mt-10 space-y-3 text-sm text-blue-100">
          <p>✔ Secure property financing</p>
          <p>✔ Sales & revenue analytics</p>
          <p>✔ Admin & agent management</p>
        </div>
      </div>

      {/* ================= RIGHT LOGIN FORM ================= */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8">

          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your property lending account
            </p>
          </div>

          <form className="space-y-5 text-black" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="admin"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-[#0070BB] focus:border-[#0070BB]"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base
                focus:outline-none focus:ring-2 focus:ring-[#0070BB] focus:border-[#0070BB]"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#0070BB] text-white font-medium
              hover:bg-[#005A99] transition
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070BB]"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Property Lending Platform. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
