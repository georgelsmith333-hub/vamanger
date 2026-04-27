import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { API_PREFIX } from '@/lib/api-base';

export const ADMIN_TOKEN_KEY = 'va_admin_token';

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(ADMIN_TOKEN_KEY) === 'va-admin-authenticated-ok';
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_PREFIX}/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem(ADMIN_TOKEN_KEY, 'va-admin-authenticated-ok');
        navigate('/admin');
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Invalid password. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-zinc-400 text-sm">VA eBay Client Manager — System Control</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">Enter the admin password to access system controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Admin Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-10"
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isLoading || !password}>
                {isLoading ? 'Authenticating...' : 'Sign In to Admin Panel'}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <p className="text-xs text-zinc-500">
                <span className="text-zinc-400 font-medium">Default password:</span> admin123<br />
                Change it in Admin → Settings → Security.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            ← Back to App
          </button>
        </div>
      </div>
    </div>
  );
}
