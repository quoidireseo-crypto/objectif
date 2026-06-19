import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Garde-fou : si une vue plante au rendu, on affiche un message lisible avec le
// détail de l'erreur, au lieu d'une page entièrement blanche. Indispensable sur
// une PWA, où un crash silencieux est très déroutant pour l'utilisateur.
export class ErrorBoundary extends Component<Props, State> {
  // props / setState sont déclarés ici car les typings de React résolus dans ce
  // projet n'exposent pas correctement les membres hérités de Component.
  declare props: Props;
  declare setState: (state: Partial<State>) => void;

  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Trace en console pour le diagnostic.
    console.error('Une vue a planté :', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto text-center py-16 px-6">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-light text-stone-800 dark:text-stone-100 mb-2">
            Oups, cet écran a rencontré un souci
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6 leading-relaxed">
            Rien n'est perdu : tes données sont en sécurité. Tu peux réessayer.
          </p>
          {this.state.error?.message && (
            <pre className="text-left text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 mb-6 overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 bg-stone-800 dark:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-sans uppercase tracking-widest text-xs hover:bg-stone-900 dark:hover:bg-emerald-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
