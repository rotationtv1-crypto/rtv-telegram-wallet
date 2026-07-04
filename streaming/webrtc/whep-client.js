// whep-client.js — WebRTC-HTTP Egress Protocol Client
// For RotationTV Network — viewer-side live stream playback
// NO HLS. NO DASH. NO players. Pure WebRTC with sub-second latency.

export class WHEPClient {
  constructor(whepUrl, videoElement) {
    this.whepUrl = whepUrl;
    this.videoElement = videoElement;
    this.pc = null;
  }

  async start() {
    // 1. Create RTCPeerConnection
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    // 2. Handle incoming video track
    this.pc.addEventListener('track', (event) => {
      this.videoElement.srcObject = event.streams[0];
      this.videoElement.play().catch(e => {
        // Autoplay might be blocked — user interaction needed
        console.warn('Autoplay blocked, user needs to tap play:', e);
      });
    });

    // 3. Create offer (viewer initiates)
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // 4. Wait for ICE gathering
    await this._waitForIceGathering();

    // 5. POST offer to Cloudflare Stream WHEP endpoint
    const response = await fetch(this.whepUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: this.pc.localDescription.sdp
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`WHEP failed: ${response.status} ${errBody}`);
    }

    // 6. Set Cloudflare's answer (contains the video stream)
    const answerSdp = await response.text();
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp
    });

    return true;
  }

  async stop() {
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
