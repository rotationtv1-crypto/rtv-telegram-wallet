// whip-client.js — WebRTC-HTTP Ingestion Protocol Client
// For RotationTV Network — Bigo/Tango-style streaming
// NO RTMP. NO stream keys. Pure WebRTC from browser camera.
// Based on Cloudflare Stream's WHIP implementation (~100 lines)

export class WHIPClient {
  constructor(whipUrl, videoElement) {
    this.whipUrl = whipUrl;
    this.videoElement = videoElement;
    this.pc = null;
    this.localStream = null;
  }

  async start() {
    // 1. Get camera + microphone from browser
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Show local preview (mirrored for front camera)
    this.videoElement.srcObject = this.localStream;
    this.videoElement.muted = true;
    await this.videoElement.play();

    // 2. Create RTCPeerConnection with Cloudflare STUN
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    // 3. Add camera/audio tracks to connection
    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream);
    });

    // 4. Create SDP offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // 5. Wait for ICE candidates
    await this._waitForIceGathering();

    // 6. POST offer to Cloudflare Stream WHIP endpoint
    const response = await fetch(this.whipUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: this.pc.localDescription.sdp
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`WHIP failed: ${response.status} ${errBody}`);
    }

    // 7. Set Cloudflare's answer as remote description
    const answerSdp = await response.text();
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    });

    return true;
  }

  async stop() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  _waitForIceGathering(timeout = 2000) {
    return new Promise((resolve) => {
      if (this.pc.iceGatheringState === 'complete') return resolve();
      const check = () => {
        if (this.pc.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      this.pc.addEventListener('icegatheringstatechange', check);
      setTimeout(() => {
        this.pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }, timeout);
    });
  }
}
