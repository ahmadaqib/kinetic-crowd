/**
 * Konstanta global untuk aplikasi Kinetic Crowd.
 * Bahasa: Indonesia
 */

// Rate pengiriman data pergerakan (20Hz = 50ms)
export const TICK_MS = 50;

// Nama channel default (YAGNI multi-room untuk sprint ini)
export const DEFAULT_ROOM_ID = 'default';
export const PRESENCE_CHANNEL = `presence-room.${DEFAULT_ROOM_ID}`;
export const MOVEMENT_CHANNEL = `private-movement.${DEFAULT_ROOM_ID}`;

// Damping untuk lerp (semakin kecil semakin smooth tapi semakin "lambat" mengejar)
export const LERP_DAMPING = 0.001; 
