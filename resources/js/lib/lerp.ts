/**
 * Utilitas untuk interpolasi pergerakan.
 * Bahasa: Indonesia
 */

/**
 * Menghitung nilai alpha untuk lerp yang frame-rate independent.
 * Formula: 1 - damping^delta
 * @param damping Nilai damping (0 - 1)
 * @param delta Waktu antar frame (dalam detik)
 */
export function computeAlpha(damping: number, delta: number): number {
    return 1 - Math.pow(damping, delta);
}
