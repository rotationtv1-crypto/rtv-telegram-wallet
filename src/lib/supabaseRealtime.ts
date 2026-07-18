export class SupabaseClient {
  constructor(private url: string, private key: string) {}
  async select(table: string, q?: string) {
    const r = await fetch(`${this.url}/rest/v1/${table}${q?'?'+q:''}`, {headers:{apikey:this.key,Authorization:`Bearer ${this.key}`}});
    return r.ok ? r.json() : [];
  }
  async insert(table: string, data: any) {
    const r = await fetch(`${this.url}/rest/v1/${table}`, {method:'POST',headers:{apikey:this.key,Authorization:`Bearer ${this.key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(data)});
    return r.ok ? r.json() : null;
  }
  async update(table: string, q: string, data: any) {
    const r = await fetch(`${this.url}/rest/v1/${table}?${q}`, {method:'PATCH',headers:{apikey:this.key,Authorization:`Bearer ${this.key}`,'Content-Type':'application/json'},body:JSON.stringify(data)});
    return r.ok;
  }
}
export async function createStream(s: SupabaseClient, d: any) { return s.insert('live_streams',{...d,status:'pending',viewer_count:0,created_at:new Date().toISOString()}); }
export async function logTransaction(s: SupabaseClient, d: any) { return s.insert('transactions',{...d,status:'completed',created_at:new Date().toISOString()}); }
