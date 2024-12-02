import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { record } = await request.json();

    // Send to OneSignal
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
        include_external_user_ids: [record.recipient_id],
      }),
    });

    const result = await response.json();

    // Update the notification record with delivery status
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        delivery_attempted: true,
        delivery_response: result,
      })
      .eq("id", record.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
