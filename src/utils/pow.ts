export const POW_DIFFICULTY = 5;
export const POW_CHALLENGE_TTL_MS = 60_000;
export const POW_MIN_NONCE = 1000;
export const POW_YIELD_EVERY = 1_500;

export interface PowChallenge {
  challengeToken: string;
  prefix: string;
  difficulty: number;
  expiresAt: number;
}

export interface PowSolution {
  challengeToken: string;
  nonce: number;
  hash: string;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function solvePowChallenge(
  challenge: PowChallenge,
  onProgress?: (attempts: number) => void,
  signal?: AbortSignal,
): Promise<PowSolution> {
  const target = '0'.repeat(challenge.difficulty);
  let nonce = POW_MIN_NONCE;

  while (true) {
    if (signal?.aborted) {
      throw new Error('Proof-of-work cancelled.');
    }

    const hash = await sha256Hex(`${challenge.prefix}:${nonce}`);
    if (hash.startsWith(target)) {
      onProgress?.(nonce);
      return {
        challengeToken: challenge.challengeToken,
        nonce,
        hash,
      };
    }

    nonce += 1;

    if (nonce % POW_YIELD_EVERY === 0) {
      onProgress?.(nonce);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
    }
  }
}

export function estimatePowProgress(attempts: number, difficulty: number): number {
  const expected = 16 ** difficulty;
  const ratio = attempts / expected;
  return Math.min(99, Math.floor(ratio * 100));
}
