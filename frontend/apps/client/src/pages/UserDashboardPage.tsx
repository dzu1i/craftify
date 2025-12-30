import { useState, useEffect } from "react";
import { Search, Calendar, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { reservationApi, type Reservation } from "../lib/api";
import { type User } from "@supabase/supabase-js";
import TopNav from "../components/TopNav";

function UserDashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getProfileAndData() {
      try {
        setIsLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          navigate("/");
          return;
        }

        setUser(session.user);

        const reservations = await reservationApi.listMyReservations(session.access_token);
        const active = reservations.filter((res) => res.status === "booked");
        setUpcomingClasses(active.slice(0, 2));
      } catch (err: unknown) {
        console.error("Chyba při načítání dat uživatele:", err);
      } finally {
        setIsLoading(false);
      }
    }

    getProfileAndData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Maker";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ✅ unified navbar like on screenshot */}
      <TopNav active="reservations" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ready to create, {firstName}?</h1>
          <p className="text-gray-500 text-lg">
            You have <span className="text-orange-500 font-bold">{upcomingClasses.length} workshops</span>{" "}
            scheduled for this period.
          </p>

          <div className="relative max-w-3xl mt-8">
            <div className="flex shadow-sm rounded-2xl overflow-hidden border border-gray-200">
              <div className="flex-1 relative bg-white">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for pottery, painting, or baking..."
                  className="w-full pl-12 pr-4 py-4 outline-none text-gray-700"
                />
              </div>
              <button
                onClick={() => navigate("/catalog")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 font-bold transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Upcoming Classes</h2>
            <button
              onClick={() => navigate("/home")}
              className="text-orange-500 text-sm font-bold hover:underline"
            >
              Full Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((res) => (
                <div
                  key={res.id}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center justify-center w-20 h-20 bg-orange-50 rounded-2xl text-orange-600 flex-shrink-0">
                    <span className="text-xs font-black uppercase">
                      {res.timeSlot?.startAt
                        ? new Date(res.timeSlot.startAt).toLocaleString("default", { month: "short" })
                        : ""}
                    </span>
                    <span className="text-2xl font-black">
                      {res.timeSlot?.startAt ? new Date(res.timeSlot.startAt).getDate() : ""}
                    </span>
                  </div>

                  <div className="flex-1">
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Confirmed
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{res.timeSlot?.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {res.timeSlot?.startAt
                        ? new Date(res.timeSlot.startAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/class/${res.timeSlotId}`)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Details
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-12 bg-white rounded-3xl text-center border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-medium mb-4">No workshops scheduled yet.</p>
                <button
                  onClick={() => navigate("/catalog")}
                  className="bg-orange-50 text-orange-600 px-6 py-2 rounded-xl font-bold hover:bg-orange-100 transition-colors"
                >
                  Explore Catalog
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Right Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-60">
            <div className="bg-gray-200 h-48 rounded-2xl animate-pulse"></div>
            <div className="bg-gray-200 h-48 rounded-2xl animate-pulse"></div>
            <div className="bg-gray-200 h-48 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboardPage;