// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Přidej si sem tyhle dva logy, abys v konzoli viděla, jestli ty klíče vůbec máš
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key existuje:", !!supabaseAnonKey);

// src/lib/supabase.ts
// ... tvoje stávající importy a inicializace ...

console.log("AKTIVNÍ URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("AKTIVNÍ KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "ANO, MÁM HO" : "CHYBÍ!!!");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
