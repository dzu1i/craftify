import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Users, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { catalogApi, reservationApi, type TimeSlot } from "../lib/api";
import { supabase } from "../lib/supabase";
import TopNav from "../components/TopNav";
import dogImage from "../assets/dog.jpg";

const imageByCategory: Record<string, string> = {
  "Dog photography": dogImage,
  Ceramics:
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200&auto=format&fit=crop",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1523419409543-0b3bf4a1f9bb?q=80&w=1200&auto=format&fit=crop";

function resolveEventImage(event: TimeSlot) {
  const key = event.classType?.category?.name || event.classType?.name || "";
  return (key && imageByCategory[key]) || fallbackImage;
}

function ClassDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [userReservationId, setUserReservationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshEvent = useCallback(async () => {
    if (!id) return;
    const eventData = await catalogApi.getEvent(id);
    setEvent(eventData);
  }, [id]);

  const refreshMyReservationStatus = useCallback(async () => {
    if (!id) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setUserReservationId(null);
      return;
    }

    const myRes = await reservationApi.listMyReservations(token);
    const existing = myRes.find((r) => r.timeSlotId === id && r.status === "booked");
    setUserReservationId(existing ? existing.id : null);
  }, [id]);

  useEffect(() => {
    async function fetchDetailAndStatus() {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        await Promise.all([refreshEvent(), refreshMyReservationStatus()]);
      } catch (err: unknown) {
        console.error(err);
        setError("Kurz se nepodařilo načíst.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetailAndStatus();
  }, [id, refreshEvent, refreshMyReservationStatus]);

  const handleBookingToggle = async () => {
    if (!id) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      alert("Pro tuto akci se prosím přihlaste.");
      navigate("/");
      return;
    }

    setIsBooking(true);
    try {
      if (userReservationId) {
        if (window.confirm("Chcete zrušit svou rezervaci?")) {
          await reservationApi.cancelMyReservation(token, userReservationId);
          setUserReservationId(null);
          alert("Rezervace zrušena.");
        }
      } else {
        await reservationApi.createReservation(token, id);
        alert("Rezervace úspěšná!");
        navigate("/home");
      }

      await Promise.all([refreshEvent(), refreshMyReservationStatus()]);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Chyba při komunikaci se serverem.";
      alert(msg);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{error || "Kurz nebyl nalezen."}</p>
        <button onClick={() => navigate("/catalog")} className="text-orange-500 font-bold">
          Zpět do katalogu
        </button>
      </div>
    );
  }

  const spotsLeft = (event as any).spotsLeft ?? event.capacity;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <TopNav active="browse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
          <span className="hover:text-orange-500 cursor-pointer transition-colors" onClick={() => navigate("/")}>
            Home
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="hover:text-orange-500 cursor-pointer transition-colors" onClick={() => navigate("/catalog")}>
            Catalog
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{event.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">{event.title}</h1>
            <p className="text-gray-400 mb-2 text-xl font-bold uppercase tracking-widest">
              {event.classType?.name || "Workshop"}
            </p>
            <p className="text-gray-600 font-medium mb-8">
              {event.venue?.name ? `${event.venue?.name}` : ""}{event.venue?.address ? ` • ${event.venue.address}` : ""}{event.venue?.city ? ` • ${event.venue.city}` : ""}
            </p>

            <div className="rounded-[2.5rem] overflow-hidden h-[500px] mb-12 shadow-2xl shadow-orange-100 bg-gray-200 border-8 border-white">
              <img
                src={resolveEventImage(event)}
                className="w-full h-full object-cover"
                alt=""
              />
            </div>

            <div className="prose max-w-none">
              <h3 className="text-2xl font-black text-gray-900 mb-6 italic">About this workshop</h3>
              <p className="text-xl leading-relaxed text-gray-600 font-medium">
                {(event as any).description ||
                  "Join us for an immersive crafting experience. All necessary tools and materials are provided on-site."}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-50 p-10 sticky top-24">
              <div className="flex items-baseline justify-between mb-10">
                <span className="text-5xl font-black text-gray-900">{event.price} Kč</span>
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">total</span>
              </div>

              <div className="space-y-8 mb-12">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-orange-50 rounded-2xl text-orange-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="font-bold text-gray-700">
                      {new Date(event.startAt).toLocaleDateString("cs-CZ", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</p>
                    <p className="font-bold text-gray-700">
                      {new Date(event.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(event.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="p-4 bg-green-50 rounded-2xl text-green-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spots</p>
                    <p className="font-bold text-gray-700">{spotsLeft} left</p>
                  </div>
                </div>
              </div>

              <button
                disabled={isBooking || (!userReservationId && spotsLeft <= 0)}
                onClick={handleBookingToggle}
                className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
                  userReservationId
                    ? "bg-red-50 text-red-500 hover:bg-red-100"
                    : "bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-200"
                }`}
              >
                {isBooking ? (
                  <Loader2 className="animate-spin" />
                ) : userReservationId ? (
                  <>
                    <Trash2 size={20} /> Cancel Spot
                  </>
                ) : (
                  "Reserve My Spot"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassDetailPage;
