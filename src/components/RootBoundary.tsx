import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Vide le service worker + tous les caches, puis recharge. Sert à sortir d'un
// état de PWA cassée (page blanche après mise à jour) directement depuis l'app.
async function repairAndReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {
    // on recharge quand même
  }
  window.location.reload();
}

// Garde-fou racine : enveloppe toute l'application. En cas de crash (y compris
// au-dessus des vues), affiche un écran de secours au lieu d'une page blanche.
export class RootBoundary extends Component<Props, State> {
  declare props: Props;
  declare setState: (state: Partial<State>) => void;

  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Crash racine :', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#F5F5F0', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
            <h1 style={{ fontSize: 22, fontWeight: 300, color: '#1c1917', marginBottom: 8 }}>
              Un instant…
            </h1>
            <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.6, marginBottom: 20 }}>
              L'application n'a pas réussi à démarrer correctement. Tes données sont en sécurité.
              Essaie de recharger — ou, si l'écran reste blanc, « Réparer » remet l'app à neuf.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => window.location.reload()}
                style={{ background: '#047857', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
              >
                Recharger l'application
              </button>
              <button
                onClick={repairAndReload}
                style={{ background: 'transparent', color: '#78716c', border: '1px solid #d6d3d1', padding: '12px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
              >
                Réparer (vider le cache)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
