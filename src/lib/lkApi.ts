const AUTH_URL = "https://functions.poehali.dev/0436d73e-7867-4894-948e-8713c22a9f08";
const DATA_URL = "https://functions.poehali.dev/2ae992a7-035d-45e6-a244-bf1581660d49";

export function getToken(): string {
  return localStorage.getItem("lk_token") || "";
}

export function setToken(t: string) {
  localStorage.setItem("lk_token", t);
}

export function clearToken() {
  localStorage.removeItem("lk_token");
  localStorage.removeItem("lk_user");
}

export function getUser(): LkUser | null {
  try {
    const s = localStorage.getItem("lk_user");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function saveUser(u: LkUser) {
  localStorage.setItem("lk_user", JSON.stringify(u));
}

export interface LkUser {
  id: number;
  email: string;
  full_name: string;
  company: string;
  inn: string;
  phone: string;
  kpp: string;
  is_verified: boolean;
  is_admin: boolean;
  lk_role: "CLIENT" | "AGENT" | "PARTNER" | "PLATFORM_ADMIN";
  org_id?: string | null;
  org_role?: string | null;
}

async function callAuth(body: Record<string, unknown>) {
  const token = getToken();
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

async function callData(body: Record<string, unknown>) {
  const token = getToken();
  const res = await fetch(DATA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": token },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

// ── AUTH ─────────────────────────────────────────────────────────────
export const lkAuth = {
  registerClient: (p: { email: string; password: string; full_name: string; company_name: string; inn?: string; phone?: string }) =>
    callAuth({ action: "register_client", ...p }),

  registerAgent: (p: { email: string; password: string; full_name: string; org_name: string; org_inn?: string; org_kpp?: string; org_address?: string; phone?: string }) =>
    callAuth({ action: "register_agent", ...p }),

  login: (email: string, password: string) =>
    callAuth({ action: "login", email, password }),

  me: () => callAuth({ action: "me" }),

  saveProfile: (p: { full_name?: string; phone?: string; kpp?: string }) =>
    callAuth({ action: "save_profile", ...p }),

  logout: () => callAuth({ action: "logout" }),

  getOrg: () => callAuth({ action: "get_org" }),

  saveOrg: (p: Record<string, unknown>) =>
    callAuth({ action: "save_org", ...p }),

  orgMembers: () => callAuth({ action: "org_members" }),

  inviteMember: (email: string, role: string) =>
    callAuth({ action: "invite_member", email, role }),

  updateMember: (member_user_id: number, p: { role?: string; is_active?: boolean }) =>
    callAuth({ action: "update_member", member_user_id, ...p }),

  notifications: () => callAuth({ action: "notifications" }),

  readNotification: (notification_id?: string) =>
    callAuth({ action: "read_notification", notification_id }),
};

// ── REQUESTS ─────────────────────────────────────────────────────────
export const lkRequests = {
  list: (p?: { status?: string; page?: number }) =>
    callData({ action: "list", ...p }),

  get: (request_id: string) =>
    callData({ action: "get", request_id }),

  create: (p: { company_id: string; amount: number; currency: string; invoice_number?: string; invoice_date?: string; description?: string }) =>
    callData({ action: "create", ...p }),

  publish: (request_id: string, offers_until?: string) =>
    callData({ action: "publish", request_id, offers_until }),

  update: (request_id: string, p: Record<string, unknown>) =>
    callData({ action: "update", request_id, ...p }),

  selectOffer: (request_id: string, offer_id: string) =>
    callData({ action: "select_offer", request_id, offer_id }),

  markPaid: (request_id: string) =>
    callData({ action: "mark_paid", request_id }),

  cancel: (request_id: string) =>
    callData({ action: "cancel", request_id }),

  getContract: (request_id: string) =>
    callData({ action: "get_contract", request_id }),
};

// ── COMPANIES ─────────────────────────────────────────────────────────
export const lkCompanies = {
  list: () => callData({ action: "companies" }),

  create: (p: { name: string; inn?: string; kpp?: string; address?: string; email?: string; phone?: string; requisites?: Record<string, string> }) =>
    callData({ action: "create_company", ...p }),

  update: (company_id: string, p: Record<string, unknown>) =>
    callData({ action: "update_company", company_id, ...p }),
};

// ── OFFERS ────────────────────────────────────────────────────────────
export const lkOffers = {
  listMine: () => callData({ action: "offers_mine" }),

  create: (p: { request_id: string; percent_fee: number; fx_rate?: number; duration_workdays: number; pay_from_country?: string; use_nonresident_route?: boolean; comment?: string; agent_contract_url?: string }) =>
    callData({ action: "offer_create", ...p }),

  update: (offer_id: string, p: Record<string, unknown>) =>
    callData({ action: "offer_update", offer_id, ...p }),

  withdraw: (offer_id: string) =>
    callData({ action: "offer_withdraw", offer_id }),

  export: () => callData({ action: "offers_export" }),
};

// ── FILES ─────────────────────────────────────────────────────────────
export type FileType = "INVOICE" | "DOC" | "AGENT_CONTRACT" | "PAYMENT_PROOF" | "SIGNED_CONTRACT" | "CONTRACT";

export interface UploadedFile {
  id: string;
  filename: string;
  file_url: string;
  mime: string;
  size: number;
  type: FileType;
}

export const lkFiles = {
  upload: async (
    file: File,
    fileType: FileType,
    opts?: { request_id?: string; offer_id?: string }
  ): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const b64 = (reader.result as string).split(",")[1];
          const data = await callData({
            action: "upload_file",
            file_b64: b64,
            filename: file.name,
            file_type: fileType,
            request_id: opts?.request_id,
            offer_id: opts?.offer_id,
          });
          if (!data.success) throw new Error(data.error || "Ошибка загрузки");
          resolve(data.attachment as UploadedFile);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error("Ошибка чтения файла"));
      reader.readAsDataURL(file);
    });
  },

  delete: (attachment_id: string) =>
    callData({ action: "delete_file", attachment_id }),
};