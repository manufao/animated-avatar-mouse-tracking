# Tools

`build_layers.py` cuts the Nano Banana images into aligned 720×960 WebP layers.

1. Put the seven JPG pictures (1792 × 2400, same framing) in `src/`: ref, blank, closed, bored, yawn, happy, crown (same names as in the script).
2. `pip install numpy scipy pillow`
3. `python3 build_layers.py` → layers in `out/`, then copy them to `public/img/`.

If the framing changes, the eye and neck positions printed in `landmarks.json` go into `src/assets/css/avatar.css`.
