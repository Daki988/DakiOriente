# Bande-son originale de la vidéo « Budget du client » (synthétisée, libre de droits)
import wave, os
import numpy as np

SR = 44100
DUR = 29.0
N = int(SR * DUR)
mix = np.zeros(N)
rng = np.random.default_rng(7)

def put(sig, t, gain=1.0):
    i = int(t * SR)
    j = min(N, i + len(sig))
    if i < N:
        mix[i:j] += sig[:j - i] * gain

def env(n, attack=.004, decay=.12):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)

def kick():
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t / .045)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .14)

def hat():
    n = int(.06 * SR)
    noise = rng.standard_normal(n)
    noise = np.diff(noise, prepend=0)           # aigus
    return noise * env(n, .001, .018) * .35

def clap():
    n = int(.18 * SR)
    noise = rng.standard_normal(n)
    return noise * env(n, .002, .05) * .4

def sweep(f0, f1, d, decay=None):
    n = int(d * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .005, decay or d / 2.5)

def pop(f=520):
    n = int(.12 * SR); t = np.arange(n) / SR
    fr = f * (1 + 1.5 * np.exp(-t / .015))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, .001, .035) * .8

def riser(d):
    n = int(d * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # bruit filtré de plus en plus clair
    out = np.zeros(n); y = 0.0
    for k in range(n):
        a = .02 + .5 * (t[k] / d) ** 2
        y += a * (noise[k] - y); out[k] = y
    return out * (t / d) ** 1.6 * .9

def boom():
    n = int(1.2 * SR); t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t / .08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .45) * 1.3

def chord(freqs, d):
    n = int(d * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) for f in freqs)
    a = np.clip(t / .25, 0, 1) * np.clip((d - t) / 1.2, 0, 1)
    return s * a / len(freqs) * .5

# Rythme (120 bpm) pendant que le budget baisse
for b in np.arange(0, 12.5, .5):
    put(kick(), b, .9)
    put(hat(), b + .25, .8)
    if int(b * 2) % 4 == 2:
        put(clap(), b, .5)
# Changements de budget : petit glissé descendant
for t in [2.5, 4.5, 6.5, 8.5, 10.5]:
    put(sweep(900, 260, .22), t, .35)
# Disparitions
for t in [2.55, 2.62, 4.55, 4.62, 6.55, 8.55]:
    put(pop(480), t, .6)
# « On vous paiera en visibilité » : la musique s'effondre
put(sweep(420, 70, .9, .5), 12.5, .7)
for b in np.arange(13.0, 15.0, 1.0):
    put(kick(), b, .45)
# La question : battements sourds puis montée
for t in [15.3, 16.1, 16.8]:
    put(kick(), t, .8)
put(riser(1.9), 16.6, .55)
# Retour de toute l'équipe
put(boom(), 18.5, .9)
for k in range(7):
    put(pop(560 + 40 * k), 18.55 + k * .13, .55)
for b in np.arange(18.5, 25.0, .5):
    put(kick(), b, 1.0)
    put(hat(), b + .25, 1.0)
    put(hat(), b + .125, .45)
    if int(b * 2) % 2 == 1:
        put(clap(), b, .55)
# Carte finale : accord lumineux
put(chord([261.63, 329.63, 392.0, 523.25], 4.0), 25.0, .9)
put(sweep(1800, 1600, .9, .35), 25.2, .25)

mix /= np.max(np.abs(mix)) / .7                  # environ −3 dB
stereo = np.stack([mix, mix], axis=1)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'son.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype('<i2').tobytes())
print('son.wav', round(DUR, 1), 's')
