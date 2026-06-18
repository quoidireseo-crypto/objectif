import { useCallback, useState } from 'react';

const LOCK_KEY = 'skopos_lock'; // { salt, hash }
const SESSION_KEY = 'skopos_unlocked';

interface StoredLock {
  salt: string;
  hash: string;
}

function getLock(): StoredLock | null {
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    return raw ? (JSON.parse(raw) as StoredLock) : null;
  } catch {
    return null;
  }
}

// Hachage du mot de passe. Utilise Web Crypto (SHA-256) quand disponible
// (contexte sécurisé : https ou localhost), avec un repli simple sinon.
async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}::${password}`;
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const buffer = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(buffer));
    return 'sha256_' + btoa(String.fromCharCode(...bytes));
  }
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return 'fb_' + (h >>> 0).toString(16);
}

function makeSalt(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useAuth() {
  const [hasPassword, setHasPassword] = useState<boolean>(() => !!getLock());
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (!getLock()) return true; // pas de mot de passe : accès direct
    return window.sessionStorage.getItem(SESSION_KEY) === 'true';
  });

  const verifyPassword = useCallback(async (password: string): Promise<boolean> => {
    const lock = getLock();
    if (!lock) return true;
    const hash = await hashPassword(password, lock.salt);
    return hash === lock.hash;
  }, []);

  // Définit (ou remplace) le mot de passe et déverrouille la session.
  const setPassword = useCallback(async (password: string): Promise<void> => {
    const salt = makeSalt();
    const hash = await hashPassword(password, salt);
    window.localStorage.setItem(LOCK_KEY, JSON.stringify({ salt, hash }));
    window.sessionStorage.setItem(SESSION_KEY, 'true');
    setHasPassword(true);
    setIsUnlocked(true);
  }, []);

  // Retire le mot de passe (après vérification). Retourne false si incorrect.
  const removePassword = useCallback(async (password: string): Promise<boolean> => {
    const lock = getLock();
    if (!lock) return true;
    const hash = await hashPassword(password, lock.salt);
    if (hash !== lock.hash) return false;
    window.localStorage.removeItem(LOCK_KEY);
    window.sessionStorage.setItem(SESSION_KEY, 'true');
    setHasPassword(false);
    setIsUnlocked(true);
    return true;
  }, []);

  // Déverrouille la session si le mot de passe est correct (ou s'il n'y en a pas).
  const unlock = useCallback(async (password: string): Promise<boolean> => {
    const ok = await verifyPassword(password);
    if (ok) {
      window.sessionStorage.setItem(SESSION_KEY, 'true');
      setIsUnlocked(true);
    }
    return ok;
  }, [verifyPassword]);

  // Se déconnecter : reverrouille la session (retour à l'écran d'accueil).
  const logout = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setIsUnlocked(false);
  }, []);

  return { hasPassword, isUnlocked, setPassword, removePassword, verifyPassword, unlock, logout };
}
