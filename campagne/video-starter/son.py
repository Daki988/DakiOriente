# Bande-son originale de la vidéo « Une journée d'entrepreneur » (synthétisée, libre de droits)
import wave, os
import numpy as np

SR = 44100
DUR = 36.0
N = int(SR * DUR)
mix = np.zeros(N)
rng = np.random.default_rng(11)

def put(sig, t, gain=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if 0 <= i < N:
        mix[i:j] += sig[:j - i] * gain

def env(n, attack=.004, decay=.12):
    t = np.arange(n) / SR
    return np.clip(t / attack, 0, 1) * np.exp(-t / decay)

def tone(f, d, decay=.25, attack=.004, harm=.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + harm * np.sin(4 * np.pi * f * t)) * env(n, attack, decay)

def tick(hi=True):
    n = int(.03 * SR); noise = rng.standard_normal(n)
    return np.diff(noise, prepend=0) * env(n, .0005, .006) * (.5 if hi else .35)

def ping():                       # notification : deux notes montantes
    return np.concatenate([tone(880, .09, .05), tone(1318.5, .25, .09)])

def buzz():                       # vibration d'appel manqué
    n = int(.45 * SR); t = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * 150 * t)) * .25 * (np.sin(2 * np.pi * 12 * t) > 0) * np.clip((.45 - t) / .1, 0, 1)

def chime(f):                     # validation : note claire
    return tone(f, 1.2, .5, .002, .15)

def pad(freqs, d, fade=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t) for f in freqs) / len(freqs)
    a = np.clip(t / fade, 0, 1) * np.clip((d - t) / fade, 0, 1)
    return s * a * .45

def kick():
    n = int(.3 * SR); t = np.arange(n) / SR
    f = 48 + 80 * np.exp(-t / .04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .12)

# Intro : pièce calme
put(pad([220, 277.18, 329.63], 2.8, .6), 0, .6)
# Journée : l'horloge accélère
T0, T1 = 2.6, 13.8
t = T0; k = 0
while t < T1:
    put(tick(k % 2 == 0), t, .9)
    p = (t - T0) / (T1 - T0)
    t += .5 - .32 * p; k += 1
for b in np.arange(T0, T1, .5):
    put(kick(), b, .25 + .35 * (b - T0) / (T1 - T0))
DAY = [420, 555, 700, 780, 980, 1125, 1290, 1430]
for m in DAY:
    tt = T0 + (m - 390) / (1430 - 390) * (T1 - T0)
    put(buzz() if m == 1125 else ping(), tt, .5)
# Retournement : silence, puis note grave
put(tone(55, 3.5, 1.6, .02, .1), 14.0, .9)
put(tone(110, 2.5, 1.2, .02, .1), 15.8, .5)
# Le lendemain : calme, chaque réponse en place sonne juste
put(pad([261.63, 329.63, 392.0], 8.6, 1.5), 18.3, .7)
notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
for i, f in enumerate(notes):
    put(chime(f), 19.2 + i * 1.05, .35)
put(pad([293.66, 369.99, 440.0], 4.2, 1.2), 26.6, .6)
# Carte finale
put(pad([261.63, 329.63, 392.0, 523.25], 5.6, 1.0), 30.3, .9)
put(chime(1046.5), 30.6, .3)

mix /= np.max(np.abs(mix)) / .7
stereo = np.stack([mix, mix], axis=1)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'son.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype('<i2').tobytes())
print('son.wav', DUR, 's')
