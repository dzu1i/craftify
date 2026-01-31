import { Brush } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function LandingPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/home",
      },
    });

    if (error) {
      alert("Chyba při přihlašování přes Google: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT */}
      <div className="relative w-full lg:w-1/2 h-64 lg:h-auto bg-gray-900">
        <div
          className="absolute top-8 left-8 flex items-center gap-2 z-10 cursor-pointer"
          onClick={() => navigate("/")}
          title="Home"
        >
          <Brush className="w-6 h-6 text-orange-500" />
          <span className="text-xl font-bold text-white">Craftify</span>
        </div>

        <img
          src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=2070&auto=format&fit=crop"
          alt="Pottery workshop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-24 py-12 bg-white relative">
        <div className="max-w-md w-full mx-auto lg:mx-0">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-4">
            Welcome to <br />
            Craftify
          </h1>
          <p className="text-xl text-gray-500 mb-10 font-light">
            Unlock your creativity. Discover local workshops.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-gray-900 font-semibold">Sign in with Google</span>
          </button>

          <button
            onClick={() => navigate("/catalog")}
            className="w-full mt-4 text-gray-500 text-sm hover:underline"
          >
            Or browse classes as guest
          </button>
        </div>

        <div className="mt-auto pt-12 flex flex-col lg:flex-row items-center gap-6 text-sm text-gray-500 lg:absolute lg:bottom-8 lg:left-24 lg:right-24">
          <span>© 2026 Craftify</span>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;