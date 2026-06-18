<div align="center">

# SKOPOS

**Reprendre le cap, fixer ses intentions et devenir l'acteur de ses journées.**

</div>

SKOPOS est un outil personnel de gestion de vie, d'objectifs et de quotidien.
C'est une application **100 % locale et privée** : toutes tes données restent
dans le navigateur de ton appareil, rien n'est envoyé sur Internet.

## Lancer en local

**Prérequis :** [Node.js](https://nodejs.org)

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Démarrer l'application :
   ```bash
   npm run dev
   ```

Aucune clé API ni configuration n'est nécessaire.

## Construire la version de production

```bash
npm run build      # génère le dossier dist/
npm run preview    # prévisualise le build localement
```

L'application est un site **statique** : le dossier `dist/` peut être hébergé
gratuitement (Netlify, Vercel, GitHub Pages…) ou installé sur ton téléphone
en « Ajouter à l'écran d'accueil » (PWA), même hors connexion.

## Sauvegarde des données

Tes données vivent uniquement sur cet appareil. Pense à exporter une
sauvegarde régulière depuis **Paramètres → Sauvegarde Manuelle** pour ne rien
perdre ou pour transférer tes données vers un autre appareil.
