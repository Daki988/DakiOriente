# Texture « papier aquarelle » (1080 × 1350), générée : grain fin + relief doux
import numpy as np
from PIL import Image
W, H = 1080, 1350
rng = np.random.default_rng(3)
def blur(a, r):
    """Flou gaussien en nombres réels (FFT), puis normalisation : pas de stries de quantification."""
    fy = np.fft.fftfreq(a.shape[0])[:, None]; fx = np.fft.fftfreq(a.shape[1])[None, :]
    b = np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (np.pi * r) ** 2 * (fx ** 2 + fy ** 2))))
    return (b - b.mean()) / (b.std() or 1)
relief = blur(rng.standard_normal((H, W)), 1.6) * .5 + blur(rng.standard_normal((H, W)), 5) * .8 + blur(rng.standard_normal((H, W)), 40) * .4
# éclairage rasant : différence entre le relief et sa version décalée
light = relief - np.roll(np.roll(relief, 2, 0), 2, 1)
grain = rng.standard_normal((H, W)) * .012
base = np.array([244, 241, 235], float)
img = base[None, None, :] * (1 + light[..., None] * .028 + grain[..., None]) + relief[..., None] * 1.6
Image.fromarray(np.clip(img, 0, 255).astype('uint8')).save('papier.jpg', quality=92)
print('papier.jpg')
