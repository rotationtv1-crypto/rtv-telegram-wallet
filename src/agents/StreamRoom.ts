import { DurableObject } from "cloudflare:workers";

interface ChatMessage {
  user_id: string;
  username: string;
  avatar_url?: string;
  text: string;
  ts: number;
  is_creator?: boolean;
  is_tip?: boolean;
  tip_amount_rtv?: number;
  gift_emoji?: string;
}

interface StreamRoomState {
  stream_id: string;
  creator_id: string;
  creator_name: string;
  title: string;
  category: string;
  viewer_count: number;
  peak_viewers: number;
  total_tips_rtv: number;
  tip_count: number;
  is_live: boolean;
  started_at: number;
  pk_battle_active: boolean;
  pk_opponent_id?: string;
  pk_total_pool_rtv?: number;
}

const SECONDS = 1000;
const SYNC_INTERVAL = 30 * SECONDS;

export class StreamRoom extends DurableObject {
  state: StreamRoomState | null = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get("Upgrade");

    if (upgradeHeader !== "websocket") {
      if (url.pathname === "/state") {
        return Response.json(this.state || { error: "Room not initialized" });
      }

      if (url.pathname === "/init" && request.method === "POST") {
        const body = await request.json() as Partial<StreamRoomState>;
        this.state = {
          stream_id: body.stream_id || crypto.randomUUID(),
          creator_id: body.creator_id || "",
          creator_name: body.creator_name || "",
          title: body.title || "",
          category: body.category || "talk",
          viewer_count: 0,
          peak_viewers: 0,
          total_tips_rtv: 0,
          tip_count: 0,
          is_live: true,
          started_at: Date.now(),
          pk_battle_active: false,
        };
        await this.ctx.storage.put("state", this.state);
        const currentAlarm = await this.ctx.storage.getAlarm();
        if (currentAlarm === null) await this.ctx.storage.setAlarm(Date.now() + SYNC_INTERVAL);
        return Response.json({ success: true, stream_id: this.state.stream_id });
      }

      if (url.pathname === "/tip" && request.method === "POST") {
        const tip = await request.json() as { amount_rtv: number; user_id: string; username: string; gift_emoji: string };
        if (!this.state) return Response.json({ error: "Room not initialized" }, { status: 400 });
        this.state.total_tips_rtv += tip.amount_rtv;
        this.state.tip_count += 1;
        const tipMsg: ChatMessage = { user_id: tip.user_id, username: tip.username, text: `sent ${tip.amount_rtv} RTV!`, ts: Date.now(), is_tip: true, tip_amount_rtv: tip.amount_rtv, gift_emoji: tip.gift_emoji };
        this.broadcast({ type: "tip", message: tipMsg, room_state: this.state });
        await this.ctx.storage.put("state", this.state);
        return Response.json({ success: true, total_tips: this.state.total_tips_rtv });
      }

      if (url.pathname === "/pk/start" && request.method === "POST") {
        const { opponent_id, stake_rtv } = await request.json() as { opponent_id: string; stake_rtv: number };
        if (!this.state) return Response.json({ error: "Room not initialized" }, { status: 400 });
        this.state.pk_battle_active = true;
        this.state.pk_opponent_id = opponent_id;
        this.state.pk_total_pool_rtv = stake_rtv * 2;
        this.broadcast({ type: "pk_start", opponent_id, total_pool: this.state.pk_total_pool_rtv });
        await this.ctx.storage.put("state", this.state);
        return Response.json({ success: true });
      }

      if (url.pathname === "/pk/end" && request.method === "POST") {
        const { winner_id } = await request.json() as { winner_id: string };
        if (!this.state) return Response.json({ error: "Room not initialized" }, { status: 400 });
        this.broadcast({ type: "pk_end", winner_id, total_pool: this.state.pk_total_pool_rtv });
        this.state.pk_battle_active = false;
        this.state.pk_opponent_id = undefined;
        this.state.pk_total_pool_rtv = undefined;
        await this.ctx.storage.put("state", this.state);
        return Response.json({ success: true });
      }

      if (url.pathname === "/end" && request.method === "POST") {
        if (!this.state) return Response.json({ error: "Room not initialized" }, { status: 400 });
        this.state.is_live = false;
        this.broadcast({ type: "stream_end" });
        await this.ctx.storage.put("state", this.state);
        await this.ctx.storage.deleteAlarm();
        return Response.json({ success: true, final_state: this.state });
      }

      return new Response("Not found", { status: 404 });
    }

    // WebSocket upgrade
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    if (this.state) {
      this.state.viewer_count = this.ctx.getWebSockets().length;
      if (this.state.viewer_count > this.state.peak_viewers) this.state.peak_viewers = this.state.viewer_count;
    }
    server.send(JSON.stringify({ type: "connected", room_state: this.state }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string);
      if (data.type === "chat") {
        const chatMsg: ChatMessage = { user_id: data.user_id, username: data.username, avatar_url: data.avatar_url, text: data.text, ts: Date.now(), is_creator: data.is_creator || false };
        this.broadcast({ type: "chat", message: chatMsg });
      }
      if (data.type === "gift") {
        if (this.state) { this.state.total_tips_rtv += data.amount_rtv; this.state.tip_count += 1; }
        const tipMsg: ChatMessage = { user_id: data.user_id, username: data.username, text: `sent ${data.gift_name} (${data.amount_rtv} RTV)!`, ts: Date.now(), is_tip: true, tip_amount_rtv: data.amount_rtv, gift_emoji: data.gift_emoji };
        this.broadcast({ type: "tip", message: tipMsg, room_state: this.state });
      }
      if (data.type === "ping") ws.send(JSON.stringify({ type: "pong", viewer_count: this.ctx.getWebSockets().length }));
    } catch {}
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    if (this.state) this.state.viewer_count = this.ctx.getWebSockets().length;
    ws.close(code, "StreamRoom closing connection");
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error in StreamRoom:", error);
    ws.close(1011, "WebSocket error");
  }

  async alarm(alarmInfo: { retryCount?: number }): Promise<void> {
    if (alarmInfo?.retryCount && alarmInfo.retryCount > 0) console.log(`Alarm retry #${alarmInfo.retryCount} for stream ${this.state?.stream_id}`);
    if (!this.state || !this.state.is_live) return;
    this.state.viewer_count = this.ctx.getWebSockets().length;
    this.broadcast({ type: "stats_update", room_state: this.state });
    await this.ctx.storage.put("state", this.state);
    await this.ctx.storage.setAlarm(Date.now() + SYNC_INTERVAL);
  }

  private broadcast(data: any): void {
    const msg = JSON.stringify(data);
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(msg); } catch {}
    }
  }
}
