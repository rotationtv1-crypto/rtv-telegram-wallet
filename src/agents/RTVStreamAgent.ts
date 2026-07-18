import { Agent, AgentNamespace, Connection, WSMessage, routeAgentRequest } from "agents";
import { OpenAI } from "openai";

interface Env {
  RTV_STREAM_AGENT: AgentNamespace<RTVStreamAgent>;
  CREATOR_PAYOUT_WORKFLOW: Workflow;
  OPENAI_API_KEY: string;
  MODEL?: string;
}

interface AgentState {
  stream_id: string;
  creator_id: string;
  insights: string[];
  understanding: number;
  moderation_score: number;
  safety_flags: string[];
  viewer_sentiment: "positive" | "neutral" | "negative";
  last_moderation_check: number;
  total_messages_analyzed: number;
  banned_users: string[];
  warned_users: string[];
}

interface Prompt {
  userId: string;
  user: string;
  system: string;
  metadata: Record<string, string>;
}

interface History {
  timestamp: string;
  entry: string;
}

/**
 * RTV Stream Agent — AI moderation + creator insights + chat reasoning
 * 
 * Uses:
 * - this.sql for embedded SQLite (chat history, user records, moderation log)
 * - this.setState for evolving agent state
 * - this.schedule for periodic moderation checks + hourly insights
 * - OpenAI for real-time chat moderation + reasoning
 * - WebSocket for real-time connection to stream viewers
 * - Workflow orchestration for creator payouts
 */
export class RTVStreamAgent extends Agent<Env, AgentState> {
  initialState: AgentState = {
    stream_id: "",
    creator_id: "",
    insights: [],
    understanding: 0,
    moderation_score: 100,
    safety_flags: [],
    viewer_sentiment: "neutral",
    last_moderation_check: 0,
    total_messages_analyzed: 0,
    banned_users: [],
    warned_users: [],
  };

  // ==================== HTTP HANDLER ====================
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/insights") {
      return Response.json({
        stream_id: this.state.stream_id,
        insights: this.state.insights,
        understanding: this.state.understanding,
        moderation_score: this.state.moderation_score,
        viewer_sentiment: this.state.viewer_sentiment,
        messages_analyzed: this.state.total_messages_analyzed,
      });
    }

    if (url.pathname === "/moderation/status") {
      return Response.json({
        moderation_score: this.state.moderation_score,
        safety_flags: this.state.safety_flags,
        banned_users: this.state.banned_users,
        warned_users: this.state.warned_users,
        last_check: this.state.last_moderation_check,
      });
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      const { message, user_id, username } = await request.json();
      const analysis = await this.moderateMessage(message, user_id, username);
      return Response.json(analysis);
    }

    if (url.pathname === "/reason" && request.method === "POST") {
      const prompt = await request.json() as Prompt;
      const result = await this.callReasoningModel(prompt);
      return Response.json({ response: result });
    }

    if (url.pathname === "/history" && request.method === "GET") {
      const userId = url.searchParams.get("userId") || "";
      const history = await this.getUserHistory(userId);
      return Response.json({ history });
    }

    if (url.pathname === "/payout/trigger" && request.method === "POST") {
      const data = await request.json();
      await this.runPayoutWorkflow(data);
      return Response.json({ success: true, message: "Payout workflow triggered" });
    }

    return new Response("Not found", { status: 404 });
  }

  // ==================== WEBSOCKET HANDLERS ====================
  async onConnect(connection: Connection) {
    connection.accept();
    connection.send(JSON.stringify({
      type: "agent_connected",
      state: {
        moderation_score: this.state.moderation_score,
        viewer_sentiment: this.state.viewer_sentiment,
        insights_count: this.state.insights.length,
      },
    }));
  }

  async onMessage(connection: Connection, message: WSMessage) {
    try {
      const data = JSON.parse(message as string);

      if (data.type === "chat_message") {
        const analysis = await this.moderateMessage(data.text, data.user_id, data.username);
        connection.send(JSON.stringify({
          type: "moderation_result",
          user_id: data.user_id,
          action: analysis.action,
          reason: analysis.reason,
          severity: analysis.severity,
        }));

        if (analysis.action === "ban") {
          this.broadcast({
            type: "user_banned",
            user_id: data.user_id,
            username: data.username,
            reason: analysis.reason,
          });
        }
      }

      if (data.type === "stream_frame") {
        const result = await this.analyzeFrame(data.frame_base64);
        connection.send(JSON.stringify({
          type: "frame_analysis",
          moderation_score: this.state.moderation_score,
          safety_flags: this.state.safety_flags,
        }));
      }

      if (data.type === "request_insights") {
        connection.send(JSON.stringify({
          type: "insights",
          insights: this.state.insights,
          viewer_sentiment: this.state.viewer_sentiment,
          understanding: this.state.understanding,
        }));
      }

      if (data.type === "inquiry") {
        // Use reasoning model with chat history
        const response = await this.callReasoningModel({
          userId: data.user_id,
          user: data.content,
          system: "You are the RTV Stream AI assistant. Provide helpful, concise insights about the live stream.",
          metadata: { stream_id: this.state.stream_id },
        });
        connection.send(JSON.stringify({
          type: "reasoning_response",
          response,
          understanding: this.state.understanding,
        }));
      }
    } catch (err) {
      console.error("Agent message error:", err);
    }
  }

  // ==================== AI MODERATION ====================
  async moderateMessage(text: string, userId: string, username: string): Promise<{
    action: "allow" | "warn" | "ban";
    reason: string;
    severity: number;
  }> {
    this.setState({
      ...this.state,
      total_messages_analyzed: this.state.total_messages_analyzed + 1,
    });

    const ai = new OpenAI({ apiKey: this.env.OPENAI_API_KEY });

    try {
      const response = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a live stream moderation AI for RotationTV Network. Analyze this chat message for violations. Categories: harassment, hate speech, sexual content, spam, scams, violence, illegal activity. Respond as JSON: {"action":"allow"|"warn"|"ban","reason":"...","severity":0-10}`,
          },
          { role: "user", content: `User: ${username} | Message: "${text}"` },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const result = JSON.parse(response.choices[0].message.content);

      // Log moderation action to SQLite
      this.sql`INSERT INTO moderation_log (timestamp, user_id, username, message, action, reason, severity) VALUES (${new Date().toISOString()}, ${userId}, ${username}, ${text}, ${result.action}, ${result.reason}, ${result.severity})`;

      if (result.action === "warn" && !this.state.warned_users.includes(userId)) {
        this.setState({ ...this.state, warned_users: [...this.state.warned_users, userId] });
      }

      if (result.action === "ban") {
        this.setState({
          ...this.state,
          banned_users: [...this.state.banned_users, userId],
          moderation_score: Math.max(0, this.state.moderation_score - 5),
        });
        this.evolve(`Banned user ${username} for: ${result.reason}`);
      }

      if (result.severity >= 7) {
        this.setState({
          ...this.state,
          moderation_score: Math.max(0, this.state.moderation_score - 2),
          safety_flags: [...new Set([...this.state.safety_flags, result.reason])],
        });
      }

      return result;
    } catch {
      return { action: "allow", reason: "Moderation unavailable", severity: 0 };
    }
  }

  // ==================== REASONING MODEL (with this.sql history) ====================
  async callReasoningModel(prompt: Prompt): Promise<string> {
    // Fetch user history from embedded SQLite
    const result = this.sql<History>`SELECT * FROM history WHERE user = ${prompt.userId} ORDER BY timestamp DESC LIMIT 1000`;
    const context: string[] = [];
    for await (const row of result) {
      context.push(row.entry);
    }

    const client = new OpenAI({ apiKey: this.env.OPENAI_API_KEY });

    const systemPrompt = prompt.system || "You are a helpful assistant.";
    const userPrompt = `${prompt.user}\n\nUser history:\n${context.join("\n")}`;

    try {
      const completion = await client.chat.completions.create({
        model: this.env.MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0].message.content || "";

      // Store response in SQLite history
      this.sql`INSERT INTO history (timestamp, user, entry) VALUES (${new Date().toISOString()}, ${prompt.userId}, ${responseText})`;

      return responseText;
    } catch (error) {
      console.error("Reasoning model error:", error);
      throw error;
    }
  }

  // Query user from embedded SQLite
  async queryUser(userId: string) {
    type User = { id: string; name: string; email: string };
    const user = await this.sql<User>`SELECT * FROM users WHERE id = ${userId}`;
    return user;
  }

  // Get user chat history
  async getUserHistory(userId: string): Promise<string[]> {
    const result = this.sql<History>`SELECT * FROM history WHERE user = ${userId} ORDER BY timestamp DESC LIMIT 50`;
    const history: string[] = [];
    for await (const row of result) {
      history.push(row.entry);
    }
    return history;
  }

  // ==================== FRAME ANALYSIS ====================
  async analyzeFrame(frameBase64: string): Promise<{ safe: boolean; flags: string[]; score: number }> {
    this.setState({ ...this.state, last_moderation_check: Date.now() });
    return {
      safe: this.state.moderation_score >= 70,
      flags: this.state.safety_flags,
      score: this.state.moderation_score,
    };
  }

  // ==================== EVOLVE + STATE ====================
  async evolve(newInsight: string): Promise<void> {
    this.setState({
      ...this.state,
      insights: [...(this.state.insights || []), newInsight],
      understanding: this.state.understanding + 1,
    });
  }

  onStateUpdate(state: AgentState, source: string) {
    console.log(`RTVStreamAgent state: understanding=${state.understanding}, score=${state.moderation_score}, source=${source}`);
  }

  // ==================== WORKFLOW ORCHESTRATION ====================
  async runPayoutWorkflow(data: { creator_id: string; period: string; stream_ids: string[] }) {
    let instance = await this.env.CREATOR_PAYOUT_WORKFLOW.create({
      id: crypto.randomUUID(),
      params: data,
    });

    // Schedule a status check every 5 minutes
    await this.schedule("*/5 * * * *", "checkWorkflowStatus", { id: instance.id });
  }

  async checkWorkflowStatus(data: { id: string }) {
    const instance = await this.env.CREATOR_PAYOUT_WORKFLOW.get(data.id);
    const status = await instance.status();
    console.log(`Workflow ${data.id} status:`, status);

    // If complete, notify connections
    if (status.status === "complete") {
      this.broadcast({ type: "payout_complete", workflow_id: data.id, status });
    }
  }

  // ==================== SCHEDULED TASKS ====================
  async scheduledModerationCheck(data: { stream_id: string }) {
    const currentScore = this.state.moderation_score;

    if (currentScore < 100 && this.state.safety_flags.length === 0) {
      this.setState({ ...this.state, moderation_score: Math.min(100, currentScore + 1) });
    }

    if (this.state.total_messages_analyzed > 0 && this.state.total_messages_analyzed % 50 === 0) {
      this.evolve(`Analyzed ${this.state.total_messages_analyzed} messages. Safety score: ${this.state.moderation_score}`);
    }

    this.broadcast({
      type: "moderation_update",
      moderation_score: this.state.moderation_score,
      viewer_sentiment: this.state.viewer_sentiment,
      messages_analyzed: this.state.total_messages_analyzed,
    });
  }

  async hourlyInsightReport(data: { creator_id: string }) {
    const ai = new OpenAI({ apiKey: this.env.OPENAI_API_KEY });
    try {
      const response = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI stream analytics assistant for RotationTV Network. Generate a brief insight for the stream creator.",
          },
          {
            role: "user",
            content: `Stream: ${this.state.stream_id} | Messages: ${this.state.total_messages_analyzed} | Score: ${this.state.moderation_score} | Sentiment: ${this.state.viewer_sentiment}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const insight = response.choices[0].message.content || "";
      this.evolve(`Hourly insight: ${insight}`);
      this.broadcast({ type: "creator_insight", insight, understanding: this.state.understanding });
    } catch (err) {
      console.error("Insight generation failed:", err);
    }
  }

  // ==================== HELPERS ====================
  private broadcast(data: any): void {
    for (const connection of this.getConnections()) {
      try { connection.send(JSON.stringify(data)); } catch {}
    }
  }
}
