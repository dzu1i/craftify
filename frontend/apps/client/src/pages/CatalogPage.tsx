import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Calendar, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { catalogApi, type TimeSlot, type Category } from "../lib/api";
import TopNav from "../components/TopNav";

const imageByCategory: Record<string, string> = {
  "Dog photography":
    "https://source.unsplash.com/d2s8WPKgYFc/900x600",
  Ceramics:
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=900&auto=format&fit=crop",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1523419409543-0b3bf4a1f9bb?q=80&w=900&auto=format&fit=crop";

function resolveEventImage(event: TimeSlot) {
  const key = event.classType?.category?.name || event.classType?.name || "";
  return (key && imageByCategory[key]) || fallbackImage;
}

function CatalogPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<TimeSlot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const [eventsData, categoriesData] = await Promise.all([
          catalogApi.listEvents(),
          catalogApi.listCategories(),
        ]);

        if (!alive) return;
        setEvents(eventsData);
        setCategories(categoriesData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load catalog data";
        if (!alive) return;
        setError(msg);
        console.error(err);
      } finally {
        if (!alive) return;
        setIsLoading(false);
      }
    }

    loadData();
    return () => {
      alive = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || event.classType?.category?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <TopNav active="browse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Your Next Hobby</h1>
          <p className="text-lg text-gray-600">
            Browse through our curated selection of local craft workshops.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for classes (e.g. Pottery, Painting)..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === "All"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              All
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate(`/class/${event.id}`)}
            >
              <div className="h-52 bg-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <img
                  src={resolveEventImage(event)}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange-600 uppercase tracking-wider shadow-sm">
                  {event.classType?.category?.name || "Workshop"}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                  {event.title}
                </h3>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    {new Date(event.startAt).toLocaleDateString("cs-CZ", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    {event.venue?.city || event.venue?.name || "—"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-gray-900">{event.price} Kč</span>
                    <span className="text-xs text-gray-400">including materials</span>
                  </div>

                  <button
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md shadow-orange-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/class/${event.id}`);
                    }}
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-xl text-gray-500">No classes found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 text-orange-500 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
