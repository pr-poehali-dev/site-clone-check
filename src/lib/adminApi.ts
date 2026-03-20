import { getToken } from "./lkApi";

const ADMIN_URL = "https://functions.poehali.dev/f758ecae-a645-410a-8cfa-84490d910c0e";

async function call(action: string, params: Record<string, unknown> = {}) {
  const token = getToken();
  const res = await fetch(ADMIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token || "" },
    body: JSON.stringify({ action, ...params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const adminApi = {
  overview: () => call("lk_overview"),

  users: (p: { q?: string; role?: string; is_active?: boolean | string; page?: number }) => call("lk_users", p),
  userDetail: (user_id: number) => call("lk_user_detail", { user_id }),
  userUpdate: (user_id: number, data: Record<string, unknown>) => call("lk_user_update", { user_id, ...data }),

  orgs: (p: { q?: string; type?: string; page?: number }) => call("lk_orgs", p),
  orgDetail: (org_id: string) => call("lk_org_detail", { org_id }),
  orgUpdate: (org_id: string, data: Record<string, unknown>) => call("lk_org_update", { org_id, ...data }),

  companies: (p: { q?: string; page?: number }) => call("lk_companies", p),

  requests: (p: { q?: string; status?: string; currency?: string; page?: number }) => call("lk_requests", p),
  requestDetail: (request_id: string) => call("lk_request_detail", { request_id }),
  requestUpdate: (request_id: string, data: Record<string, unknown>) => call("lk_request_update", { request_id, ...data }),

  offers: (p: { q?: string; status?: string; page?: number }) => call("lk_offers", p),
  offerUpdate: (offer_id: string, data: Record<string, unknown>) => call("lk_offer_update", { offer_id, ...data }),

  files: (p: { q?: string; page?: number }) => call("lk_files", p),

  audit: (p: { q?: string; page?: number }) => call("lk_audit", p),

  settingsGet: () => call("lk_settings_get"),
  settingsSave: (key: string, value: unknown) => call("lk_settings_save", { key, value }),

  dictsCurrencies: () => call("lk_dicts_currencies"),
  dictsSaveCurrency: (data: Record<string, unknown>) => call("lk_dicts_save_currency", data),
  dictsCountries: () => call("lk_dicts_countries"),

  notificationsBroadcast: (title: string, body: string, user_ids?: number[]) =>
    call("lk_notifications_broadcast", { title, body, user_ids }),

  reportsQueue: (report_type: string, params?: Record<string, unknown>) =>
    call("lk_reports_queue", { report_type, params }),
  reportsList: () => call("lk_reports_list"),
};
