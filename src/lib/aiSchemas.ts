/**
 * AI Moderation — Structured JSON Output Schema
 * Uses OpenAI response_format with json_schema for deterministic moderation results
 * Optionally routed through Cloudflare AI Gateway for caching + logging
 */

// JSON Schema for moderation results — compatible with OpenAI structured outputs
export const ModerationSchema = {
  type: "object" as const,
  properties: {
    action: {
      type: "string" as const,
      enum: ["allow", "warn", "ban"],
      description: "The moderation action to take",
    },
    reason: {
      type: "string" as const,
      description: "Brief explanation of the action",
    },
    severity: {
      type: "number" as const,
      description: "Severity score 0-10",
    },
    category: {
      type: "string" as const,
      enum: ["none", "harassment", "hate_speech", "sexual_content", "spam", "scam", "violence", "illegal"],
      description: "Violation category",
    },
    confidence: {
      type: "number" as const,
      description: "Confidence score 0-1",
    },
  },
  required: ["action", "reason", "severity", "category", "confidence"],
};

// JSON Schema for creator insights — structured AI analysis
export const CreatorInsightSchema = {
  type: "object" as const,
  properties: {
    summary: {
      type: "string" as const,
      description: "Brief summary of stream performance",
    },
    sentiment: {
      type: "string" as const,
      enum: ["positive", "neutral", "negative"],
      description: "Overall viewer sentiment",
    },
    engagement_score: {
      type: "number" as const,
      description: "Engagement score 0-100",
    },
    top_moment: {
      type: "string" as const,
      description: "Highlight of the stream period",
    },
    recommendation: {
      type: "string" as const,
      description: "Actionable recommendation for the creator",
    },
    risk_flags: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Any risk indicators detected",
    },
  },
  required: ["summary", "sentiment", "engagement_score", "top_moment", "recommendation"],
};

// JSON Schema for stream analytics
export const StreamAnalyticsSchema = {
  type: "object" as const,
  properties: {
    peak_viewers_estimate: { type: "number" as const },
    avg_watch_time_sec: { type: "number" as const },
    tip_velocity: {
      type: "string" as const,
      enum: ["low", "medium", "high", "viral"],
      description: "Rate of tips per minute",
    },
    audience_retention: { type: "number" as const, description: "0-1 retention rate" },
    growth_trend: {
      type: "string" as const,
      enum: ["growing", "stable", "declining"],
    },
    best_gift: { type: "string" as const, description: "Most sent gift this period" },
    recommended_actions: {
      type: "array" as const,
      items: { type: "string" as const },
    },
  },
  required: ["peak_viewers_estimate", "tip_velocity", "growth_trend"],
};

/**
 * Analyze a chat message using structured JSON output
 * Uses response_format: json_schema for deterministic results
 */
export async function analyzeMessage(
  apiKey: string,
  text: string,
  username: string,
  useGateway: boolean = false,
  gatewayUrl?: string
): Promise<{
  action: "allow" | "warn" | "ban";
  reason: string;
  severity: number;
  category: string;
  confidence: number;
}> {
  const { OpenAI } = await import("openai");

  const client = new OpenAI({
    apiKey,
    // Optional: route through Cloudflare AI Gateway for caching + logging
    ...(useGateway && gatewayUrl ? { baseUrl: gatewayUrl } : {}),
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a live stream moderation AI for RotationTV Network. Analyze the chat message and respond with the structured moderation result.",
      },
      {
        role: "user",
        content: `User: ${username} | Message: "${text}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      schema: ModerationSchema,
    },
    temperature: 0.3,
    max_tokens: 150,
  });

  // Parsed result is typed via the schema
  return response.choices[0].message.parsed as {
    action: "allow" | "warn" | "ban";
    reason: string;
    severity: number;
    category: string;
    confidence: number;
  };
}

/**
 * Generate structured creator insights
 */
export async function generateInsights(
  apiKey: string,
  streamStats: {
    stream_id: string;
    messages_analyzed: number;
    moderation_score: number;
    viewer_sentiment: string;
    total_tips_rtv: number;
    viewer_count: number;
    stream_hours: number;
  },
  useGateway: boolean = false,
  gatewayUrl?: string
): Promise<{
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  engagement_score: number;
  top_moment: string;
  recommendation: string;
  risk_flags?: string[];
}> {
  const { OpenAI } = await import("openai");

  const client = new OpenAI({
    apiKey,
    ...(useGateway && gatewayUrl ? { baseUrl: gatewayUrl } : {}),
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an AI analytics assistant for RotationTV Network. Analyze the stream stats and generate structured insights for the creator.",
      },
      {
        role: "user",
        content: JSON.stringify(streamStats),
      },
    ],
    response_format: {
      type: "json_schema",
      schema: CreatorInsightSchema,
    },
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0].message.parsed as any;
}
