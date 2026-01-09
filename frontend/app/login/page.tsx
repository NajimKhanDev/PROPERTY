'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProjectApi from '../api/ProjectApis';

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(ProjectApi.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');

      // ✅ redirect
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
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
      </div>

      {/* ================= RIGHT LOGIN FORM ================= */}
      <div className="flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>

          <form className="space-y-5 text-black" onSubmit={handleLogin}>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@gmail.com"
                className="w-full rounded-lg border px-3 py-2"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border px-3 py-2"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#0070BB] text-white font-medium hover:bg-[#005A99]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Property Lending Platform
          </div>
        </div>
      </div>
    </div>
  );
}
