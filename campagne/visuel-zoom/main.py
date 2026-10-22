# Visuel « Zoomez… » : main dessinée en SVG (dos de la main, geste « tout petit »)
import math

SKIN, SKIN_D, SKIN_L, SKIN_H = '#8a5434', '#55301b', '#b27b53', '#c9946c'
NAIL, NAIL_TIP = '#c39176', '#ead6c7'

def _norm(dx, dy):
    d = math.hypot(dx, dy) or 1
    return dx / d, dy / d

def curve(p0, p1, p2, k=16):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / k for i in range(k + 1)]]

def finger(pts, w0, w1, gid, nail_side=1):
    """Doigt effilé (contour lisse, bout arrondi), dégradé perpendiculaire, ongle, plis."""
    n = len(pts)
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, n - 1)]
        ux, uy = _norm(b[0] - a[0], b[1] - a[1])
        nx, ny = -uy, ux
        w = (w0 + (w1 - w0) * (i / (n - 1)) ** .8) / 2
        L.append((x + nx * w, y + ny * w)); R.append((x - nx * w, y - ny * w))
    r = w1 / 2
    tx, ty = pts[-1]
    ux, uy = _norm(tx - pts[-2][0], ty - pts[-2][1])
    # bout : courbe de Bézier qui dépasse la pointe (forme de pulpe)
    c1 = (L[-1][0] + ux * r * 1.25, L[-1][1] + uy * r * 1.25)
    c2 = (R[-1][0] + ux * r * 1.25, R[-1][1] + uy * r * 1.25)
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in L)
    d += f' C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {R[-1][0]:.1f} {R[-1][1]:.1f}'
    d += ' L' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in reversed(R)) + ' Z'
    mx, my = pts[n // 2]
    ax, ay = _norm(pts[-1][0] - pts[0][0], pts[-1][1] - pts[0][1])
    nx, ny = -ay, ax
    grad = (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{mx + nx * w0 * .55:.0f}" y1="{my + ny * w0 * .55:.0f}" x2="{mx - nx * w0 * .55:.0f}" y2="{my - ny * w0 * .55:.0f}">'
            f'<stop offset="0" stop-color="{SKIN_H}"/><stop offset=".22" stop-color="{SKIN_L}"/><stop offset=".62" stop-color="{SKIN}"/><stop offset="1" stop-color="{SKIN_D}"/></linearGradient>')
    # ongle sur le dos du doigt, près du bout
    ang = math.degrees(math.atan2(uy, ux))
    cx, cy = tx + ux * r * .15 + nx * r * .12 * nail_side, ty + uy * r * .15 + ny * r * .12 * nail_side
    nail = (f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({ang:.1f})">'
            f'<rect x="{-r * 1.05:.1f}" y="{-r * .6:.1f}" width="{r * 1.55:.1f}" height="{r * 1.2:.1f}" rx="{r * .6:.1f}" fill="{NAIL}"/>'
            f'<rect x="{r * .12:.1f}" y="{-r * .52:.1f}" width="{r * .34:.1f}" height="{r * 1.04:.1f}" rx="{r * .17:.1f}" fill="{NAIL_TIP}"/>'
            f'<rect x="{-r * .85:.1f}" y="{-r * .42:.1f}" width="{r * .6:.1f}" height="{r * .2:.1f}" rx="{r * .1:.1f}" fill="#fff" opacity=".35"/></g>')
    creases = ''
    for f in (.36, .66):
        k = int(f * (n - 1)); x, y = pts[k]
        a = pts[max(k - 1, 0)]; b = pts[min(k + 1, n - 1)]
        ux2, uy2 = _norm(b[0] - a[0], b[1] - a[1]); nx2, ny2 = -uy2, ux2
        w = (w0 + (w1 - w0) * f) / 2 * .5
        for off in (0, 5):
            creases += (f'<path d="M{x + nx2 * w + ux2 * off:.1f} {y + ny2 * w + uy2 * off:.1f} Q{x + ux2 * (off + 5):.1f} {y + uy2 * (off + 5):.1f} {x - nx2 * w + ux2 * off:.1f} {y - ny2 * w + uy2 * off:.1f}" '
                        f'stroke="{SKIN_D}" stroke-width="{1.8 if off else 2.4}" fill="none" opacity="{.25 if off else .42}" stroke-linecap="round"/>')
    rim = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in L[n // 2:-1])   # reflet seulement sur la partie visible
    rim_s = f'<path d="{rim}" stroke="{SKIN_H}" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round" transform="translate({-nx * 3:.1f} {-ny * 3:.1f})"/>'
    return grad, f'<path d="{d}" fill="url(#{gid})"/>{rim_s}{creases}{nail}'

def hand(dx=0, dy=0):
    defs, back = [], []
    # doigts relevés (majeur, annulaire, auriculaire), légèrement recourbés
    for gid, p, w0, w1 in [('fp', curve((900, 700), (885, 610), (835, 520)), 54, 46),
                           ('fr', curve((850, 680), (800, 560), (730, 430)), 62, 54),
                           ('fm', curve((795, 680), (725, 545), (640, 395)), 66, 57)]:
        g, s = finger(p, w0, w1, gid); defs.append(g); back.append(s)
    # index (haut de la pince) et pouce (bas de la pince), base cachée sous la main
    gi, si = finger(curve((800, 712), (620, 690), (440, 722)), 74, 60, 'fi')
    gt, st = finger(curve((860, 1000), (650, 915), (450, 864)), 86, 66, 'ft', -1)
    defs += [gi, gt]
    # dos de la main et avant-bras
    body = ('M712 668 C745 640 790 628 830 630 C875 632 915 648 940 676 C968 712 978 790 982 860 '
            'C990 930 1030 1000 1090 1080 L1200 1240 L1720 2000 L1180 2000 L990 1400 C960 1290 925 1190 880 1110 '
            'C850 1062 815 1040 790 1012 C770 990 768 962 782 944 C760 912 738 862 728 812 C716 770 706 712 712 668 Z')
    defs.append(f'<radialGradient id="dos" cx="780" cy="700" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{SKIN_L}"/><stop offset=".45" stop-color="{SKIN}"/><stop offset="1" stop-color="{SKIN_D}"/></radialGradient>')
    knuckles = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{SKIN_H}" opacity=".45" transform="rotate({a} {x} {y})"/>'
                       for x, y, rx, ry, a in [(735, 700, 22, 15, -10), (790, 655, 22, 14, -25), (848, 652, 20, 13, -35), (905, 680, 16, 11, -50)])
    tendons = ''.join(f'<path d="{d}" stroke="{SKIN_L}" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>'
                      for d in ('M745 715 C800 800 860 880 905 960', 'M795 672 C840 770 880 860 930 940', 'M850 668 C880 760 905 840 950 920'))
    web = f'<path d="M733 820 C752 880 772 920 790 942" stroke="{SKIN_D}" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>'
    hand_svg = (f'<g transform="translate({dx} {dy})" filter="url(#ombre)">{"".join(back)}{si}{st}'
                f'<path d="{body}" fill="url(#dos)"/>{knuckles}{tendons}{web}</g>')
    return defs, hand_svg
