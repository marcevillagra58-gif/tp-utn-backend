import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing insert...");
  const insertPayload = {
    username: "testred_local2",
    email: "testred_local2@test.com",
    password: "hashedpassword123",
    role: "producer"
  };

  const { data, error } = await supabase
    .from("users")
    .insert(insertPayload)
    .select("id, username, email, role, avatar, is_blocked, created_at")
    .single();

  if (error) {
    console.error("SUPABASE ERROR:");
    console.error(error);
  } else {
    console.log("SUCCESS:");
    console.log(data);
    
    // Cleanup
    await supabase.from("users").delete().eq("id", data.id);
  }
}

test();
