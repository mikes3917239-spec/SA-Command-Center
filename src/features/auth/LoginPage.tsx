import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthStore } from './auth-store';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export function LoginPage() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">
          SA Command Center
        </h1>
        <p className="text-gray-400">
          Your personal NetSuite Solution Architect cockpit
        </p>
      </div>
      <button
        onClick={handleLogin}
        className="flex items-center gap-3 rounded-lg bg-emerald-600 px-6 py-3 text-lg font-medium transition hover:bg-emerald-500"
      >
        <LogIn size={20} />
        Sign in with Google
      </button>
    </div>
  );
}
