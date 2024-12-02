import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request) {
  try {
    const { record } = await request.json();
    console.log("Received notification request:", record);

    // Verify recipient_id exists
    if (!record.recipient_id) {
      throw new Error("recipient_id is required");
    }

    // Get the auth_id from users table using recipient_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("auth_id")
      .eq("id", record.recipient_id)
      .single();

    if (userError || !userData?.auth_id) {
      throw new Error(`Could not find auth_id for user ${record.recipient_id}`);
    }

    // Send to OneSignal with additional logging
    console.log("Sending to OneSignal:", {
      app_id: process.env.ONESIGNAL_APP_ID,
      recipient_id: userData.auth_id,
      title: record.title,
      message: record.message,
    });

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: { en: record.message },
        headings: { en: record.title },
        include_external_user_ids: [userData.auth_id.toString()],
        target_channel: "push",
        data: {
          type: record.type,
          recipient_type: record.recipient_type,
        },
        filters: [
          { field: "tag", key: "user_type", relation: "=", value: "driver" },
        ],
      }),
    });

    const result = await response.json();
    console.log("OneSignal response:", result);

    // Update the notification record with delivery status
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        delivery_attempted: true,
        delivery_response: result,
      })
      .eq("id", record.id);

    if (updateError) {
      console.error("Error updating notification status:", updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
