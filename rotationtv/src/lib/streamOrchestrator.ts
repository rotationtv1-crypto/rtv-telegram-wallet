/**
 * RotationTV — Stream Orchestrator
 * =================================
 * Low-latency WHIP/WHEP provisioning for real-time broadcasts.
 * Handles stream lifecycle: init → publish → subscribe → end.
 *
 * @module streamOrchestrator
 */

export interface StreamOrchestratorEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CF_STREAM_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
}

interface StreamConfig {
  stream_id: string;
  host_id: string;
  whip_url: string;
  whep_url: string;
  rtmp_url: string;
  playback_url: string;
  recording: boolean;
  created_at: string;
}

/**
 * Initialize a new live stream session.
 * Creates a Cloudflare Stream entry point + Supabase record.
 */
export async function initStream(
  hostId: string,
  title: string,
  env: StreamOrchestratorEnv
): Promise<{ success: boolean; stream?: StreamConfig; error?: string }> {
  const streamId = crypto.randomUUID();
  const now = new Date().toISOString();

  // If CF Stream API token is available, create a stream via API
  if (env.CF_STREAM_API_TOKEN && env.CF_ACCOUNT_ID) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream/live_inputs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.CF_STREAM_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meta: {
              name: title,
              host_id: hostId,
              stream_id: streamId,
            },
            recording: true,
          }),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as any;
        const result = data.result;

        const config: StreamConfig = {
          stream_id: streamId,
          host_id: hostId,
          whip_url: result?.rtmps?.whipUrl || '',
          whep_url: result?.rtmps?.whepUrl || '',
          rtmp_url: result?.rtmps?.url || '',
          playback_url: `https://watch.cloudflarestream.com/${result?.uid}`,
          recording: true,
          created_at: now,
        };

        // Insert into Supabase
        await fetch(`${env.SUPABASE_URL}/rest/v1/rtv_streams`, {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            id: streamId,
            host_id: hostId,
            title,
            is_live: true,
            connection_state: 'connected',
            whip_url: config.whip_url,
            whep_url: config.whep_url,
            playback_url: config.playback_url,
            recording_enabled: true,
            created_at: now,
          }),
        });

        return { success: true, stream: config };
      }
    } catch (err) {
      console.warn('CF Stream API failed, using fallback:', err);
    }
  }

  // Fallback: Create stream record without CF Stream (for local/dev)
  const config: StreamConfig = {
    stream_id: streamId,
    host_id: hostId,
    whip_url: '',
    whep_url: '',
    rtmp_url: '',
    playback_url: '',
    recording: false,
    created_at: now,
  };

  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/rtv_streams`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id: streamId,
        host_id: hostId,
        title,
        is_live: true,
        connection_state: 'pending',
        created_at: now,
      }),
    });
  } catch (err) {
    return { success: false, error: `Supabase insert failed: ${(err as Error).message}` };
  }

  return { success: true, stream: config };
}

/**
 * End a live stream and mark it as ended in Supabase.
 */
export async function endStream(
  streamId: string,
  env: StreamOrchestratorEnv
): Promise<{ success: boolean; error?: string }> {
  try {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/rtv_streams?id=eq.${streamId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          is_live: false,
          connection_state: 'disconnected',
          ended_at: new Date().toISOString(),
        }),
      }
    );

    // If CF Stream API is available, terminate the live input
    if (env.CF_STREAM_API_TOKEN && env.CF_ACCOUNT_ID) {
      // Would call DELETE /stream/live_inputs/{uid} here
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Get active streams for the broadcast grid.
 */
export async function getActiveStreams(
  env: StreamOrchestratorEnv
): Promise<Array<{ stream_id: string; host_id: string; title: string; is_live: boolean }>> {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rtv_streams?is_live=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) return [];

    const data = (await response.json()) as any[];
    return data.map((s) => ({
      stream_id: s.id,
      host_id: s.host_id,
      title: s.title,
      is_live: s.is_live,
    }));
  } catch {
    return [];
  }
}

/**
 * Record a viewer joining a stream.
 */
export async function recordViewer(
  streamId: string,
  viewerId: string,
  env: StreamOrchestratorEnv
): Promise<void> {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/rtv_stream_viewers`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        stream_id: streamId,
        viewer_id: viewerId,
        joined_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn('Failed to record viewer:', err);
  }
}
