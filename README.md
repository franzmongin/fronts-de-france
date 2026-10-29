# Fronts de France

FPS historique en cinq missions (507 → 1944). Three.js + Vite.

    npm install
    npm run dev      # développement
    npm run build    # télécharge les personnages KayKit (CC0) puis construit dist/

Déploiement Vercel : framework « Vite », commande `npm run build`, dossier `dist`.
Le code est assemblé depuis `parts/` par `tools/cat.sh` (génère `src/main.js`).
