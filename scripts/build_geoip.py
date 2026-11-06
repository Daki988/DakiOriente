#!/usr/bin/env python3
"""Base pays-IP compacte pour la mesure d'audience (sans service tiers).

Source : DB-IP « IP to Country Lite » (licence CC BY 4.0, https://db-ip.com), mise à jour chaque mois.
Usage : python3 scripts/build_geoip.py [AAAA-MM]  → data/geoip/pays-ip.bin

Format (gros-boutiste) : « NGIP1 », n4 (u32), n6 (u32), nc (u16), codes (2 octets × nc),
débuts IPv4 (u32 × n4), indices de pays (u8 × n4), débuts IPv6 sur 64 bits (u32 haut + u32 bas × n6), indices (u8 × n6).
"""
import datetime
import gzip
import io
import ipaddress
import os
import struct
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mois = sys.argv[1] if len(sys.argv) > 1 else datetime.date.today().strftime("%Y-%m")
url = f"https://download.db-ip.com/free/dbip-country-lite-{mois}.csv.gz"
req = urllib.request.Request(url, headers={"User-Agent": "curl/8.5.0"})
data = gzip.decompress(urllib.request.urlopen(req, timeout=120).read()).decode()

v4, v6, codes = [], [], {}
for line in io.StringIO(data):
    a, _b, c = line.strip().split(",")
    c = c if len(c) == 2 else "ZZ"
    idx = codes.setdefault(c, len(codes))
    ip = ipaddress.ip_address(a)
    if ip.version == 4:
        if not v4 or v4[-1][1] != idx:
            v4.append((int(ip), idx))
    else:
        start = int(ip) >> 64
        if not v6 or (v6[-1][1] != idx and v6[-1][0] != start):
            v6.append((start, idx))
        elif v6[-1][0] == start:
            v6[-1] = (start, idx)

liste = sorted(codes, key=codes.get)
out = bytearray(b"NGIP1")
out += struct.pack(">IIH", len(v4), len(v6), len(liste))
out += "".join(liste).encode()
out += b"".join(struct.pack(">I", s) for s, _ in v4) + bytes(i for _, i in v4)
out += b"".join(struct.pack(">II", s >> 32, s & 0xFFFFFFFF) for s, _ in v6) + bytes(i for _, i in v6)
dest = os.path.join(ROOT, "data", "geoip", "pays-ip.bin")
open(dest, "wb").write(out)
print(f"{dest} : {len(v4)} plages IPv4, {len(v6)} plages IPv6, {len(liste)} pays, {len(out) // 1024} Ko (DB-IP {mois})")
