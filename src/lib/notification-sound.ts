"use client";

// Generate a notification chime using Web Audio API
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    
    // Resume if suspended (browsers require user interaction first)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create a pleasant two-tone chime
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, now);
      
      gainNode.gain.setValueAtTime(0, now + i * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(now + i * 0.15);
      oscillator.stop(now + i * 0.15 + 0.8);
    });
  } catch {
    // Audio not supported or blocked
    console.warn("Could not play notification sound");
  }
}
