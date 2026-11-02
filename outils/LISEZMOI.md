# Outils

`build_layers.py` découpe les images Nano Banana en calques WebP 720×960.

1. Placer les PNG/JPG dans `src/` : ref, blank, closed, bored, yawn, happy, crown (mêmes noms que dans le script).
2. `pip install numpy scipy pillow`
3. `python3 build_layers.py` → calques dans `out/`, puis copier dans `public/img/`.

Les positions des yeux et du cou affichées en sortie (`landmarks.json`) vont dans `src/assets/css/avatar.css` si le cadrage change.
