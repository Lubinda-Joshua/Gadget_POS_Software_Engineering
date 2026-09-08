"use client";

import { useEffect, useState } from "react";

export interface DeviceSettings {
  defaultPaymentMethod: "CASH" | "CARD" | "OTHER";
  soundOnSale: boolean;
  scannerBeepEnabled: boolean;
  printerType: "serial" | "usb" | "none";
}

const STORAGE_KEY = "gadget-pos-device-settings";

const DEFAULTS: DeviceSettings = {
  defaultPaymentMethod: "CASH",
  soundOnSale: false,
  scannerBeepEnabled: true,
  printerType: "serial",
};

export function getDeviceSettings(): DeviceSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveDeviceSettings(settings: Partial<DeviceSettings>): void {
  const current = getDeviceSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
}

export function useDeviceSettings(): [DeviceSettings, (s: Partial<DeviceSettings>) => void] {
  const [settings, setSettings] = useState<DeviceSettings>(DEFAULTS);

  useEffect(() => {
    setSettings(getDeviceSettings());
  }, []);

  function update(patch: Partial<DeviceSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveDeviceSettings(next);
  }

  return [settings, update];
}

/** Play a short beep on sale complete (if soundOnSale is enabled). */
export function playSaleSound(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // AudioContext not available
  }
}

/** Play a short low-pitched error beep for scanner not-found. */
export function playErrorBeep(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext not available
  }
}
