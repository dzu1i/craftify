import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Active = "browse" | "reservations" | "admin" | "none";

type Props = {
  active?: Active;
};

export default function TopNav({ active = "none" }: Props) {
  const navigate = useNavigate();

  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadAuthAndRole() {
      setChecking(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!alive) return;

      setIsAuthed(!!token);

      // default
      setIsAdmin(false);

      // admin check (bez dalších BE změn):
      // zkusíme zavolat admin-only endpoint → pokud 200, ukážeme Admin.
      // POZN: pokud /reservations není admin-only, řekni a upravíme na jiný endpoint.
      if (token) {
        try {
          const base = import.meta.env.VITE_RESERVATION_URL || "http://localhost:3002";
          const r = await fetch(`${base}/reservations`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!alive) return;
          setIsAdmin(r.ok);
        } catch {
          if (!alive) return;
          setIsAdmin(false);
        }
      }

      if (!alive) return;
      setChecking(false);
    }

    loadAuthAndRole();

    // když se uživatel přihlásí/odhlásí, ať se navbar aktualizuje
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadAuthAndRole();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleBrandClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) navigate("/home");
    else navigate("/");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const linkClass = (key: Active) =>
    `text-sm font-medium transition-colors ${
      active === key ? "text-orange-600 font-bold" : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      <div
        className="text-orange-600 font-bold text-xl flex items-center gap-2 cursor-pointer"
        onClick={handleBrandClick}
        title="Go to My reservations"
      >
        <span>🎨</span> Craftify
      </div>

      <div className="flex items-center gap-8">
        {/* Když nejsme přihlášení, tak jen Browse + (volitelně) Login */}
        <button onClick={() => navigate("/catalog")} className={linkClass("browse")}>
          Browse Classes
        </button>

        {isAuthed && (
          <button onClick={() => navigate("/home")} className={linkClass("reservations")}>
            My reservations
          </button>
        )}

        {/* Admin jen když admin */}
        {!checking && isAuthed && isAdmin && (
          <button onClick={() => navigate("/admin")} className={linkClass("admin")}>
            Admin
          </button>
        )}

        {isAuthed ? (
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Log out
          </button>
        ) : (
          <button onClick={() => navigate("/")} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Log in
          </button>
        )}
      </div>
    </nav>
  );
}