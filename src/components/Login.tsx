import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { LogIn, Mail, Lock, AlertCircle, Shield, Sparkles } from 'lucide-react';

interface LoginProps {
  onGuestLogin?: () => void;
}

export default function Login({ onGuestLogin }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let frenchMessage = "Une erreur est survenue lors de l'authentification.";
      if (err.code === 'auth/operation-not-allowed') {
        frenchMessage = 'Le fournisseur de connexion par E-mail/Mot de passe n\'est pas encore activé dans votre console Firebase. Veuillez l\'activer sous l\'onglet Authentication > Sign-in method de votre console Firebase.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        frenchMessage = 'Identifiants invalides. Veuillez réessayer.';
      } else if (err.code === 'auth/email-already-in-use') {
        frenchMessage = 'Cet e-mail est déjà associé à un compte.';
      } else if (err.code === 'auth/weak-password') {
        frenchMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      } else if (err.code === 'auth/invalid-email') {
        frenchMessage = 'Format de l\'e-mail invalide.';
      } else if (err.code === 'auth/network-request-failed') {
        frenchMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
      }
      setError(frenchMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Une erreur est survenue lors de la connexion Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/20 text-xl">
            ERP
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
          {isSignUp ? 'Créer un compte ERP' : 'Connexion à votre espace'}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Gestion de Paie & Performance RH
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-zinc-200/80 rounded-2xl shadow-xl shadow-zinc-200/30 sm:px-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 font-medium">{error}</div>
              </div>
              {error.includes('console Firebase') && (
                <a
                  href="https://console.firebase.google.com/project/erp-paie/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm self-start"
                >
                  Activer E-mail/Mot de passe dans la console ↗
                </a>
              )}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Adresse e-mail
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-zinc-400 transition-shadow bg-zinc-50/50"
                  placeholder="nom@entreprise.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-zinc-400 transition-shadow bg-zinc-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                id="btn-login-submit"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isSignUp ? "S'inscrire" : 'Se connecter'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-zinc-500">Ou continuer avec</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                id="btn-google-login"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-zinc-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {/* Clean inline SVG for Google G logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53 0-6.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Se connecter avec Google</span>
              </button>
            </div>

            {onGuestLogin && (
              <div className="mt-4 pt-4 border-t border-dashed border-zinc-200">
                <button
                  id="btn-guest-login"
                  type="button"
                  onClick={onGuestLogin}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-zinc-200 hover:border-zinc-300 rounded-xl shadow-sm text-xs font-bold text-zinc-800 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Accéder à l'ERP en Mode Démo (Hors-ligne)</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-xs text-zinc-500">
            {isSignUp ? (
              <p>
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-bold text-blue-600 hover:text-blue-500 underline"
                >
                  Connectez-vous
                </button>
              </p>
            ) : (
              <p>
                Nouveau sur l'ERP ?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-bold text-blue-600 hover:text-blue-500 underline"
                >
                  Créez un compte
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Safety / Compliance Banner */}
      <div className="mt-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-zinc-400" />
        <span>Authentification Cloud Sécurisée via Firebase Auth</span>
      </div>
    </div>
  );
}
