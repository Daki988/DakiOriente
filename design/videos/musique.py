"""Musique d'accompagnement originale (synthèse, libre de droits) : nappe, arpège, basse, rythmique légère, clics.
Usage : python musique.py sortie.wav durée [clics séparés par des virgules] [tonalité: 0=do, 2=ré…] [bpm]"""
import sys
import wave

import numpy as np

out, D = sys.argv[1], float(sys.argv[2])
clics = [float(x) for x in sys.argv[3].split(",") if x] if len(sys.argv) > 3 else []
tr = int(sys.argv[4]) if len(sys.argv) > 4 else 0
bpm = float(sys.argv[5]) if len(sys.argv) > 5 else 100
SR = 44100
n = int(D * SR)
t = np.arange(n) / SR
mix = np.zeros((n, 2))
f = lambda m: 440 * 2 ** ((m - 69 + tr) / 12)  # noqa: E731
beat = 60 / bpm
bar = 4 * beat
# accords (do maj7, la m7, fa maj7, sol 6) : notes MIDI
ACC = [[48, 55, 59, 64, 67], [45, 52, 57, 60, 64], [41, 48, 53, 57, 64], [43, 50, 55, 59, 64]]
rng = np.random.default_rng(7)


def ajoute(sig, t0, gauche=1.0, droite=1.0):
    i = int(t0 * SR)
    if i >= n:
        return
    s = sig[: n - i]
    mix[i:i + len(s), 0] += s * gauche
    mix[i:i + len(s), 1] += s * droite


nb = int(D / bar) + 1
for k in range(nb):
    a = ACC[(k // 2) % 4]
    t0 = k * bar
    L = int(bar * SR * 1.15)
    tt = np.arange(L) / SR
    env = np.minimum(1, tt / 0.6) * np.exp(-tt / 6)
    pad = sum(np.sin(2 * np.pi * f(m) * tt) + 0.6 * np.sin(2 * np.pi * f(m) * 1.003 * tt) for m in a[1:]) * env * 0.035
    ajoute(pad, t0, 0.9, 1.0)
    # basse : temps 1 et 3
    for b in (0, 2):
        Lb = int(beat * 1.8 * SR); tb = np.arange(Lb) / SR
        bas = (np.sin(2 * np.pi * f(a[0] - 12) * tb) + 0.3 * np.sin(2 * np.pi * f(a[0]) * tb)) * np.exp(-tb / 0.5) * np.minimum(1, tb / 0.01) * 0.16
        ajoute(bas, t0 + b * beat)
    # arpège en croches
    motif = [a[1], a[2], a[3], a[4], a[3], a[2], a[3], a[4]]
    for j, m in enumerate(motif):
        Lp = int(0.6 * SR); tp = np.arange(Lp) / SR
        note = f(m + 12)
        pl = (np.sin(2 * np.pi * note * tp) + 0.35 * np.sin(2 * np.pi * 2 * note * tp)) * np.exp(-tp / 0.18) * np.minimum(1, tp / 0.004) * 0.055
        pan = 0.65 + 0.35 * (j % 2)
        ajoute(pl, t0 + j * beat / 2, pan, 1.65 - pan)
    # rythmique : grosse caisse douce + charleston
    if k >= 2:
        for b in range(4):
            Lk = int(0.25 * SR); tk = np.arange(Lk) / SR
            fr = 50 + 70 * np.exp(-tk / 0.03)
            kick = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tk / 0.09) * 0.22
            ajoute(kick, t0 + b * beat)
            Lh = int(0.06 * SR)
            hh = np.diff(rng.standard_normal(Lh + 1)) * np.exp(-np.arange(Lh) / SR / 0.015) * 0.02
            ajoute(hh, t0 + b * beat + beat / 2, 0.8, 1.0)
# clics (interface)
for c in clics:
    Lc = int(0.05 * SR); tc = np.arange(Lc) / SR
    clic = (np.sin(2 * np.pi * 2200 * tc) * 0.5 + np.diff(rng.standard_normal(Lc + 1)) * 0.3) * np.exp(-tc / 0.008) * 0.25
    ajoute(clic, c)
# fondu d'entrée et de sortie, normalisation
env = np.minimum(1, t / 1.2) * np.minimum(1, (D - t) / 2.5)
mix *= env[:, None]
mix /= max(1e-9, np.abs(mix).max()) / 0.8
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(out, D, "s")
