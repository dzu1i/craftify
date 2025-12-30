// src/lib/api.ts
import { supabase } from "./supabase";

// Pomocná funkce pro vyčištění URL adresy (odstraní dvojitá lomítka)
const cleanUrl = (url: string) => url.replace(/([^:]\/)\/+/g, "$1");

export const CATALOG_URL = import.meta.env.VITE_CATALOG_URL || "http://localhost:3001";
export const RESERVATION_URL = import.meta.env.VITE_RESERVATION_URL || "http://localhost:3002";

export interface CreateEventData {
  title: string;
  description?: string;
  classTypeId: string;
  venueId: string;
  startAt: string;
  endAt: string;
  capacity: number;
  price: number;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  classTypeId?: string;
  venueId?: string;
  startAt?: string;
  endAt?: string;
  capacity?: number;
  price?: number;
  status?: string; // pokud máte enum, necháme string
}

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

// Základní funkce pro volání backendových služeb
async function fetchJson<T>(url: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const targetUrl = cleanUrl(url);

  try {
    const res = await fetch(targetUrl, {
      ...rest,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
        Accept: "application/json",
      },
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

    if (!res.ok) {
      throw { status: res.status, message: "Request failed", details: body } as ApiError;
    }

    return body as T;
  } catch (err) {
    console.error(`🔥 Backend Error na ${targetUrl}:`, err);
    throw err;
  }
}

// ---------- TYPES ----------
export type Category = { id: string; name: string };
export type Venue = { id: string; name: string; address?: string | null; city?: string | null };

export type ClassType = {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
};

export type TimeSlot = {
  id: string;
  title: string;
  description?: string | null;
  classTypeId: string;
  venueId: string;
  startAt: string;
  endAt: string;
  capacity: number;
  price: number;
  status?: string;
  classType?: ClassType;
  venue?: Venue;
  bookedCount?: number;
  spotsLeft?: number;
};

export type Reservation = {
  id: string;
  userId: string;
  timeSlotId: string;
  status: "booked" | "canceled";
  createdAt: string;
  timeSlot?: TimeSlot;
};

// ---------- HELPERS (Supabase reads) ----------
async function sbSelectAll<T>(table: string, orderBy?: string): Promise<T[]> {
  const q = supabase.from(table).select("*");
  const { data, error } = orderBy ? await q.order(orderBy) : await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

async function sbInsertSingle<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table).insert([row]).select().single();
  if (error) throw error;
  return data as T;
}

// ---------- API ----------
export const catalogApi = {
  // ===== READS (Supabase) =====
  listCategories: async (): Promise<Category[]> => {
    return sbSelectAll<Category>("Category", "name");
  },

  listClassTypes: async (categoryId?: string): Promise<ClassType[]> => {
    let q = supabase.from("ClassType").select("*").order("name");
    if (categoryId) q = q.eq("categoryId", categoryId);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ClassType[];
  },

  listVenues: async (): Promise<Venue[]> => {
    return sbSelectAll<Venue>("Venue", "name");
  },

  // ===== EVENTS (backend) =====
  listEvents: (): Promise<TimeSlot[]> => fetchJson<TimeSlot[]>(`${CATALOG_URL}/events`),

  getEvent: (id: string): Promise<TimeSlot> => fetchJson<TimeSlot>(`${CATALOG_URL}/events/${id}`),

  // ===== WRITES (backend + fallback Supabase) =====
  createCategory: async (token: string, name: string): Promise<Category> => {
    try {
      return await fetchJson<Category>(`${CATALOG_URL}/categories`, {
        method: "POST",
        token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch {
      console.warn("Backend fail → fallback Supabase insert Category");
      return sbInsertSingle<Category>("Category", { name });
    }
  },

  createClassType: async (token: string, payload: { name: string; categoryId: string }): Promise<ClassType> => {
    try {
      return await fetchJson<ClassType>(`${CATALOG_URL}/classtypes`, {
        method: "POST",
        token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      console.warn("Backend fail → fallback Supabase insert ClassType");
      return sbInsertSingle<ClassType>("ClassType", payload);
    }
  },

  createVenue: async (
    token: string,
    payload: { name: string; address?: string | null; city?: string | null }
  ): Promise<Venue> => {
    try {
      return await fetchJson<Venue>(`${CATALOG_URL}/venues`, {
        method: "POST",
        token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      console.warn("Backend fail → fallback Supabase insert Venue");
      return sbInsertSingle<Venue>("Venue", payload);
    }
  },

  createEvent: (token: string, data: CreateEventData): Promise<TimeSlot> =>
    fetchJson<TimeSlot>(`${CATALOG_URL}/events`, {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // ⚠️ u vás je PATCH ok (pokud máte implementováno)
  updateEvent: (token: string, id: string, data: UpdateEventData): Promise<TimeSlot> =>
    fetchJson<TimeSlot>(`${CATALOG_URL}/events/${id}`, {
      method: "PATCH",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};

export const reservationApi = {
  // My reservations (user)
  listMyReservations: (token: string): Promise<Reservation[]> =>
    fetchJson<Reservation[]>(`${RESERVATION_URL}/reservations/me`, { method: "GET", token }),

  // All reservations (admin/lector)
  listReservations: (token: string): Promise<Reservation[]> =>
    fetchJson<Reservation[]>(`${RESERVATION_URL}/reservations`, { method: "GET", token }),

  // Book
  createReservation: (token: string, timeSlotId: string): Promise<Reservation> =>
    fetchJson<Reservation>(`${RESERVATION_URL}/reservations`, {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeSlotId }),
    }),

  // Cancel own reservation (pokud to máte)
  cancelMyReservation: (token: string, id: string): Promise<Reservation> =>
    fetchJson<Reservation>(`${RESERVATION_URL}/reservations/${id}/cancel`, {
      method: "PATCH",
      token,
    }),

  // Admin cancel ✅ (tohle je vaše)
  adminCancelReservation: (token: string, id: string): Promise<Reservation> =>
    fetchJson<Reservation>(`${RESERVATION_URL}/reservations/${id}/admin-cancel`, {
      method: "PATCH",
      token,
    }),

  // 🔥 Alias aby sis nemusela přepisovat komponenty:
  // "deleteReservation" ve skutečnosti jen provede admin-cancel (PATCH)
  deleteReservation: (token: string, id: string): Promise<Reservation> =>
    fetchJson<Reservation>(`${RESERVATION_URL}/reservations/${id}/admin-cancel`, {
      method: "PATCH",
      token,
    }),
};