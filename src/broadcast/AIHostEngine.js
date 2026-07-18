// ============================================
// ROTATIONTV — AI HOST ENGINE
// Connects AI hosts to TTS + Avatar renderer
// DO NOT MODIFY SPECS
// ============================================

import { AI_HOSTS, RENDER_CONFIG } from './AI_HOSTS_CONFIG';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || '';

// ============================================
// TTS INTEGRATION (ElevenLabs / OpenAI Realtime)
// ============================================
export class AIHostEngine {
  constructor(ttsProvider = 'ElevenLabs') {
    this.ttsProvider = ttsProvider;
    this.activeHosts = {};
    this.chatQueue = [];
    this.currentSpeaker = null;
  }

  // ---- Generate a real script for a host via Venice AI ----
  // Calls the deployed worker's /api/venice/host-lines route, which uses
  // this exact host's tone/specialty/exitLine from AI_HOSTS_CONFIG to
  // generate live broadcast content — not hardcoded per-run text.
  async generateScript(hostId, topic, context = {}) {
    const host = this.activeHosts[hostId] || AI_HOSTS.find((h) => h.id === hostId);
    if (!host) throw new Error(`Unknown host '${hostId}'`);

    const resp = await fetch(`${API_BASE}/api/venice/host-lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId,
        topic,
        viewer_count: context.viewer_count ?? 0,
        is_first_broadcast: context.is_first_broadcast ?? false,
        trending_gifts: context.trending_gifts ?? [],
        segment_number: context.segment_number ?? 1,
      }),
    });

    if (!resp.ok) throw new Error(`Venice host-lines request failed: HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || 'Venice returned no script');
    return data; // { intro_line, lines, exit_line }
  }

  // ---- Generate a script, then speak the full segment in order ----
  // This is the real "go live" path for an AI host: intro → lines → (later) exit.
  async runSegment(hostId, topic, context = {}) {
    const script = await this.generateScript(hostId, topic, context);
    await this.speak(hostId, script.intro_line);
    for (const line of script.lines) {
      await this.speak(hostId, line);
    }
    return script;
  }

  // Initialize all AI hosts
  async initializeHosts() {
    for (const host of AI_HOSTS) {
      this.activeHosts[host.id] = {
        ...host,
        state: 'idle', // idle | speaking | listening | exiting
        fatigue: 0,    // 0-100, affects blink/voice/gesture
      };
    }
    console.log('[AIHostEngine] All 6 hosts initialized');
  }

  // Set a host as the current speaker
  setSpeaker(hostId) {
    if (this.currentSpeaker) {
      this.activeHosts[this.currentSpeaker].state = 'listening';
    }
    this.currentSpeaker = hostId;
    this.activeHosts[hostId].state = 'speaking';
  }

  // Generate speech for a host
  async speak(hostId, text, options = {}) {
    const host = this.activeHosts[hostId];
    if (!host) return;

    this.setSpeaker(hostId);

    const renderOptions = {
      voice: host.appearance.voice,
      fatigue: host.fatigue,
      eyeContact: RENDER_CONFIG.eyeContact,
      naturalBlinking: RENDER_CONFIG.naturalBlinking,
      microGestures: RENDER_CONFIG.microGestures,
      ...options,
    };

    // Fatigue effects
    if (RENDER_CONFIG.fatigueSimulation.enabled) {
      renderOptions.blinkRate = 1 + (host.fatigue / 100) * 0.5;
      renderOptions.voicePitch = 1 - (host.fatigue / 100) * 0.15;
      renderOptions.gestureIntensity = 1 - (host.fatigue / 100) * 0.4;
    }

    if (this.ttsProvider === 'ElevenLabs') {
      return this._elevenLabsSpeak(hostId, text, renderOptions);
    } else if (this.ttsProvider === 'OpenAI') {
      return this._openAIRealtimeSpeak(hostId, text, renderOptions);
    }
  }

  // ---- ElevenLabs TTS ----
  async _elevenLabsSpeak(hostId, text, options) {
    // TODO: Connect ElevenLabs API
    // POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
    console.log(`[ElevenLabs] ${hostId} speaking: "${text}"`);
    return { provider: 'ElevenLabs', hostId, text, options };
  }

  // ---- OpenAI Realtime TTS ----
  async _openAIRealtimeSpeak(hostId, text, options) {
    // TODO: Connect OpenAI Realtime API
    // wss://api.openai.com/v1/realtime
    console.log(`[OpenAI Realtime] ${hostId} speaking: "${text}"`);
    return { provider: 'OpenAI', hostId, text, options };
  }

  // ---- Chat Reaction ----
  async reactToChat(message) {
    // Pick a random active host to react to chat
    const hostIds = Object.keys(this.activeHosts).filter(
      (id) => this.activeHosts[id].state !== 'exiting'
    );
    if (hostIds.length === 0) return;

    const reactingHost = hostIds[Math.floor(Math.random() * hostIds.length)];
    await this.speak(reactingHost, `"${message}" — interesting!`);
  }

  // ---- Increase Fatigue Over Time ----
  tickFatigue(hostId, amount = 1) {
    if (this.activeHosts[hostId]) {
      this.activeHosts[hostId].fatigue = Math.min(
        100,
        this.activeHosts[hostId].fatigue + amount
      );
    }
  }

  // ---- Trigger Exit Sequence ----
  async triggerExit(hostId) {
    const host = this.activeHosts[hostId];
    if (!host) return;
    host.state = 'exiting';
    const exitLine = host.exitLine;
    await this.speak(hostId, exitLine, { final: true });
    return exitLine;
  }

  // ---- Get Host State ----
  getHostState(hostId) {
    return this.activeHosts[hostId] || null;
  }

  // ---- Get All Active Hosts ----
  getAllHosts() {
    return Object.values(this.activeHosts);
  }
}

export default AIHostEngine;
