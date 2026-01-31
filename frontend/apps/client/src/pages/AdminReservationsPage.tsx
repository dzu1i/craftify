import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, LogOut, Calendar, Trash2, Loader2, User, Menu } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { reservationApi, type Reservation } from "../lib/api";
import { supabase } from "../lib/supabase";

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id?: string | null) {
  if (!id) return "";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export default function AdminReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [filter, setFilter] = useState<"all" | "booked">("all");

  const fetchReservations = async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setReservations([]);
        navigate("/");
        return;
      }

      const data = await reservationApi.listReservations(token);
      setReservations(data);
    } catch (err) {
      console.error("Failed to load reservations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReservations = useMemo(() => {
    if (filter === "booked") return reservations.filter((r) => r.status === "booked");
    return reservations;
  }, [reservations, filter]);

  const getCustomerLabel = (r: Reservation) =>
    r.customer?.email?.trim() || r.customer?.fullName?.trim() || r.userId;

  const handleCancel = async (id: string) => {
    if (!window.confirm("Opravdu chcete zrušit tuto rezervaci?")) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert("Chybí přihlášení (token)");
        navigate("/");
        return;
      }

      await reservationApi.adminCancelReservation(token, id);
      await fetchReservations();
    } catch (err) {
      console.error(err);
      alert("Chyba při rušení rezervace.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <div className="font-bold text-gray-900">Craftify Admin</div>
        <div className="w-10" />
      </div>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          className="lg:hidden fixed inset-0 bg-black/30 z-20"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-30 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-10`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <h1 className="font-bold text-gray-900 uppercase tracking-tight">Craftify Admin</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/admin"
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <LayoutDashboard className="w-5 h-5" /> Create a new class
          </Link>

          <Link
            to="/admin/reservations"
            className="flex items-center gap-3 w-full px-4 py-3 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            <Calendar className="w-5 h-5" /> Reservations
          </Link>

          <Link
            to="/home"
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <User className="w-5 h-5" /> User dashboard
          </Link>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-600 text-sm font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" /> Log out
          </button>
        </div>
      </aside>

      <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] p-4 pt-20 lg:p-6 xl:p-8 overflow-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Reservations</h2>
            <p className="text-sm text-gray-400 mt-1">
              Showing {filteredReservations.length} / {reservations.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                filter === "all"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("booked")}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                filter === "booked"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Booked only
            </button>

            {isLoading && <Loader2 className="animate-spin text-orange-500 w-6 h-6" />}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Class type</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredReservations.map((r) => {
                const isCanceled = r.status === "canceled";

                const categoryName = r.timeSlot?.classType?.category?.name ?? "—";
                const classTypeName = r.timeSlot?.classType?.name ?? "—";
                const eventTitle = r.timeSlot?.title ?? null;
                const startAt = formatDateTime(r.timeSlot?.startAt ?? null);

                const customerLabel = getCustomerLabel(r);
                const hasEmailOrName = Boolean(r.customer?.email || r.customer?.fullName);

                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5 align-top">
                      <div className="text-sm font-bold text-gray-900">{categoryName}</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">{shortId(r.timeSlotId)}</div>
                    </td>

                    <td className="px-8 py-5 align-top">
                      <div className="text-sm font-semibold text-gray-900">{classTypeName}</div>

                      {eventTitle && (
                        <div className="text-xs text-gray-500 mt-1">
                          {eventTitle}
                          {startAt ? <span className="text-gray-400"> · {startAt}</span> : null}
                        </div>
                      )}
                    </td>

                    <td className="px-8 py-5 align-top">
                      <div className="text-sm font-bold text-gray-900">{customerLabel}</div>
                      {!hasEmailOrName && (
                        <div className="text-xs text-gray-400 mt-1 font-mono">{shortId(r.userId)}</div>
                      )}
                    </td>

                    <td className="px-8 py-5 align-top">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          isCanceled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-right align-top">
                      <button
                        onClick={() => handleCancel(r.id)}
                        className={`transition-colors ${
                          isCanceled
                            ? "text-gray-200 cursor-not-allowed"
                            : "text-gray-300 hover:text-red-600"
                        }`}
                        title={isCanceled ? "Already canceled" : "Cancel reservation"}
                        disabled={isCanceled || isLoading}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredReservations.length === 0 && !isLoading && (
            <div className="p-20 text-center text-gray-400 text-sm">No reservations found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
