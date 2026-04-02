import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  console.log("Testing create category...");

  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre: "mascotas_test", icono: "😁" })
    .select()
    .single();

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
    await supabase.from("categorias").delete().eq("id", data.id);
  }
  process.exit(0);
}

test();
