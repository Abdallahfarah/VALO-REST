// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Get authorization header to verify caller token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("create-staff-user Edge Function invoked.");
    const token = authHeader.replace("Bearer ", "");
    console.log("Verifying caller token...");
    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser(token);

    if (callerError || !caller) {
      console.error("Token verification failed:", callerError?.message || "Invalid token");
      return new Response(JSON.stringify({ 
        error: `Unauthorized: Invalid caller session (${callerError?.message || "Invalid JWT"})` 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Caller authenticated as user ID:", caller.id);

    // 2. Resolve caller profile
    console.log("Resolving caller profile role and tenant...");
    const { data: callerProfile, error: profileError } = await supabaseClient
      .from("users")
      .select("role, tenant_id")
      .eq("id", caller.id)
      .single();
    if (profileError || !callerProfile) {
      console.error("Profile resolution failed:", profileError?.message || "Profile not found");
      return new Response(JSON.stringify({ error: "Unauthorized: Profile check failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Caller profile resolved. Role:", callerProfile.role, "Tenant ID:", callerProfile.tenant_id);

    // 3. Parse input parameters
    const { email, password, role, tenantId, fullName, preparationStation } = await req.json();
    console.log("Input payload received. Email:", email, "Role:", role, "Tenant:", tenantId, "Station:", preparationStation);

    if (!email || !password || !role || !fullName) {
      console.error("Missing required fields in payload.");
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (role === "KITCHEN_STAFF" && !preparationStation) {
      console.error("Missing preparationStation for KITCHEN_STAFF.");
      return new Response(JSON.stringify({ error: "Preparation station is required for Kitchen Display Staff" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (preparationStation && !["Chef", "Barista", "Kitchen Staff"].includes(preparationStation)) {
      console.error("Invalid preparationStation:", preparationStation);
      return new Response(JSON.stringify({ error: "Invalid preparation station. Must be Chef, Barista, or Kitchen Staff" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (password.length < 6) {
      console.error("Password is too weak.");
      return new Response(JSON.stringify({ error: "Password is too weak: should be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!email.includes("@")) {
      console.error("Invalid email address format.");
      return new Response(JSON.stringify({ error: "Invalid email address format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Role Authorization Checks
    if (callerProfile.role === "SUPER_ADMIN") {
      console.log("SUPER_ADMIN authorized to create staff.");
    } else if (callerProfile.role === "ADMIN") {
      if (callerProfile.tenant_id !== tenantId) {
        console.error("Tenant mismatch. Caller belongs to:", callerProfile.tenant_id, "Requested:", tenantId);
        return new Response(JSON.stringify({ error: "Unauthorized: Cannot create staff for another tenant" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      console.log("ADMIN authorized for tenant ID:", tenantId);
    } else {
      console.error("Forbidden: Caller role has insufficient permissions.");
      return new Response(JSON.stringify({ error: "Unauthorized: Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5. Provision the new user using auth.admin.createUser
    console.log("Invoking auth.admin.createUser for email:", email);
    const { data: newUserData, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        tenant_id: tenantId,
        preparation_station: preparationStation || null
      }
    });

    if (createUserError) {
      console.error("auth.admin.createUser failed:", createUserError.message);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("User provisioned successfully. User ID:", newUserData.user.id);

    return new Response(JSON.stringify({ user: newUserData.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Edge function execution failed:", err.message || err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
