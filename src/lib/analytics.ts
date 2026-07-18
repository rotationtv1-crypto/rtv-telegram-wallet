interface AnalyticsEvent {
  event_type: "stream_view" | "tip_sent" | "gift_sent" | "pk_battle" | "subscription" | "creator_join" | "user_join";
  user_id: string;
  stream_id?: string;
  creator_id?: string;
  amount_rtv?: number;
  amount_usd?: number;
  gift_id?: string;
  pk_battle_id?: string;
  country?: string;
  device?: "ios" | "android" | "web" | "desktop";
  ts: number;
}

export function trackEvent(dataset: AnalyticsEngineDataset, event: AnalyticsEvent): void {
  const doubles: number[] = [];
  const blobs: string[] = [event.event_type];
  const indexes: string[] = [event.user_id];
  if (event.amount_rtv) doubles.push(event.amount_rtv);
  if (event.amount_usd) doubles.push(event.amount_usd);
  if (event.stream_id) blobs.push(event.stream_id);
  if (event.creator_id) blobs.push(event.creator_id);
  if (event.gift_id) blobs.push(event.gift_id);
  if (event.pk_battle_id) blobs.push(event.pk_battle_id);
  if (event.country) blobs.push(event.country);
  if (event.device) blobs.push(event.device);
  dataset.writeDataPoint({ indexes, doubles, blobs });
}

export function trackBatch(dataset: AnalyticsEngineDataset, events: AnalyticsEvent[]): void {
  for (const event of events) trackEvent(dataset, event);
}
