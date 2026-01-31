import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Loader2,
  Calendar,
  User,
  Menu,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  catalogApi,
  reservationApi,
  type Venue,
  type ClassType,
  type Category,
} from "../lib/api";
import { supabase } from "../lib/supabase";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ bookings: 0, events: 0, revenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allClassTypes, setAllClassTypes] = useState<ClassType[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Create New Class (left form)
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    classTypeId: "",
    venueId: "",
    startAt: "",
    endAt: "",
    capacity: 4,
    price: 0,
  });

  // Right panel: new category
  const [newCatName, setNewCatName] = useState("");

  // Right panel: new class type (separate category state!)
  const [newClassTypeName, setNewClassTypeName] = useState("");
  const [newClassTypeCategoryId, setNewClassTypeCategoryId] = useState("");

  // Right panel: new venue
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueCity, setNewVenueCity] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");

  const refreshData = async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        navigate("/");
        return;
      }

      const [events, reservations, cats, cts, vs] = await Promise.all([
        catalogApi.listEvents(),
        reservationApi.listReservations(token),
        catalogApi.listCategories(),
        catalogApi.listClassTypes(),
        catalogApi.listVenues(),
      ]);

      setStats({
        bookings: reservations.length,
        events: events.length,
        revenue: events.reduce((acc, curr) => acc + (curr.price || 0), 0),
      });

      setCategories(cats || []);
      setAllClassTypes(cts || []);
      setVenues(vs || []);
    } catch (err: unknown) {
      console.error("Data load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter class types based on LEFT selected category
  const filteredTypes = useMemo(() => {
    if (!selectedCategoryId) return [];
    return allClassTypes.filter((ct) => ct.categoryId === selectedCategoryId);
  }, [selectedCategoryId, allClassTypes]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Please sign in");

      await catalogApi.createEvent(token, {
        ...formData,
        description,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      });

      alert("Workshop published!");
      setDescription("");
      setSelectedCategoryId("");
      setFormData({
        title: "",
        classTypeId: "",
        venueId: "",
        startAt: "",
        endAt: "",
        capacity: 10,
        price: 0,
      });

      await refreshData();
    } catch (err: unknown) {
      console.error("Publishing failed:", err);
      alert("Error publishing workshop");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Please sign in");

      await catalogApi.createCategory(token, name);
      setNewCatName("");
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to add category");
    }
  };

  const handleAddClassType = async () => {
    const name = newClassTypeName.trim();
    const categoryId = newClassTypeCategoryId;

    if (!categoryId) return alert("Choose category first");
    if (!name) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Please sign in");

      await catalogApi.createClassType(token, { name, categoryId });

      setNewClassTypeName("");
      setNewClassTypeCategoryId("");
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to add class type");
    }
  };

  const handleAddVenue = async () => {
    const name = newVenueName.trim();
    const city = newVenueCity.trim();
    const address = newVenueAddress.trim();

    if (!name || !city) return alert("Venue needs at least name + city");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return alert("Please sign in");

      await catalogApi.createVenue(token, {
        name,
        city,
        address: address || null,
      });

      setNewVenueName("");
      setNewVenueCity("");
      setNewVenueAddress("");
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to add venue");
    }
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
          <h1 className="font-bold text-gray-900 uppercase tracking-tight">
            Craftify Admin
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/admin"
            className="flex items-center gap-3 w-full px-4 py-3 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>

          <Link
            to="/admin/reservations"
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg text-sm font-medium transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <Calendar className="w-5 h-5" /> Reservations
          </Link>

          {/* link back to user side */}
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
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 w-full lg:ml-64 p-4 pt-20 lg:p-6 xl:p-8 overflow-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              Workshop Management
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {stats.events} events • {stats.bookings} bookings • {stats.revenue} Kč
              revenue
            </p>
          </div>
          {isLoading && (
            <Loader2 className="animate-spin text-orange-500 w-6 h-6" />
          )}
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Events
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-4xl font-black text-gray-900">{stats.events}</div>
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-black">
                E
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">Published workshops</div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Bookings
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-4xl font-black text-gray-900">{stats.bookings}</div>
              <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black">
                B
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">Total reservations</div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Revenue
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-4xl font-black text-gray-900">{stats.revenue} Kč</div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                Kč
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">Sum of event prices</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: CREATE EVENT */}
          <div className="lg:col-span-2">
            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <PlusCircle className="text-orange-500 w-6 h-6" /> Create New Class
              </h3>

              <form
                onSubmit={handleCreateEvent}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Workshop Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saturday Pottery for Beginners"
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    1. Category
                  </label>
                  <select
                    required
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none"
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      setFormData({ ...formData, classTypeId: "" });
                    }}
                  >
                    <option value="">Choose Category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    2. Class Type
                  </label>
                  <select
                    required
                    disabled={!selectedCategoryId}
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none disabled:opacity-50"
                    value={formData.classTypeId}
                    onChange={(e) =>
                      setFormData({ ...formData, classTypeId: e.target.value })
                    }
                  >
                    <option value="">Choose Type...</option>
                    {filteredTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Price (CZK)
                  </label>
                  <input
                    type="number"
                    required
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Capacity (Persons)
                  </label>
                  <input
                    type="number"
                    required
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Venue
                  </label>
                  <select
                    required
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none"
                    value={formData.venueId}
                    onChange={(e) =>
                      setFormData({ ...formData, venueId: e.target.value })
                    }
                  >
                    <option value="">Select Venue</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none"
                    value={formData.startAt}
                    onChange={(e) =>
                      setFormData({ ...formData, startAt: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Ends At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none"
                    value={formData.endAt}
                    onChange={(e) =>
                      setFormData({ ...formData, endAt: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Description (Detail)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-gray-50 border-none p-3 rounded-xl outline-none min-h-[100px] resize-none"
                    placeholder="What will participants learn?"
                  />
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                >
                  Publish Workshop
                </button>
              </form>
            </section>
          </div>

          {/* RIGHT: QUICK CREATE */}
          <aside className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-6">
            {/* NEW CATEGORY */}
            <div>
              <h3 className="text-lg font-bold mb-3">Make a new category</h3>
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Painting"
                className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm mb-3 outline-none"
              />
              <button
                onClick={handleAddCategory}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm
                transition-colors
                hover:bg-gray-800"              >
                Add Category
              </button>
            </div>

            <div className="h-px bg-gray-100" />

            {/* NEW CLASS TYPE */}
            <div>
              <h3 className="text-lg font-bold mb-3">Make a new class type</h3>

              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Category
              </label>
              <select
                className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm mt-2 mb-3 outline-none"
                value={newClassTypeCategoryId}
                onChange={(e) => setNewClassTypeCategoryId(e.target.value)}
              >
                <option value="">Choose Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                value={newClassTypeName}
                onChange={(e) => setNewClassTypeName(e.target.value)}
                placeholder="e.g. Beginner Ceramics"
                className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm mb-3 outline-none"
              />

              <button
                onClick={handleAddClassType}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm
                transition-colors
                hover:bg-gray-800"              >
                Add Class Type
              </button>
            </div>

            <div className="h-px bg-gray-100" />

            {/* NEW VENUE */}
            <div>
              <h3 className="text-lg font-bold mb-3">Make a new venue</h3>

              <input
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                placeholder="Venue name (e.g. Craftify Studio Brno)"
                className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm mb-3 outline-none"
              />
              <input
                value={newVenueCity}
                onChange={(e) => setNewVenueCity(e.target.value)}
                placeholder="City (e.g. Brno)"
                className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm mb-3 outline-none"
              />
              <input
                value={newVenueAddress}
                onChange={(e) => setNewVenueAddress(e.target.value)}
                placeholder="Address (e.g. Veveří 2)"
                className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm mb-3 outline-none"
              />

              <button
                onClick={handleAddVenue}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm
                transition-colors
                hover:bg-gray-800"              >
                Add Venue
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
