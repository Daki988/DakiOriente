import { createHash, randomBytes, randomInt } from "node:crypto";

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const otpCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
