import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log("API route called");

  try {
    const { title, description } = await req.json();
    console.log("Received data:", { title, description });

    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    console.log("OneSignal App ID:", ONESIGNAL_APP_ID);
    console.log(
      "OneSignal REST API Key:",
      ONESIGNAL_REST_API_KEY ? "Set" : "Not set"
    );

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error(
        "OneSignal credentials are not set in environment variables"
      );
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"],
        contents: { en: description },
        headings: { en: title },
      }),
    });

    const data = await response.json();
    console.log("OneSignal API Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "OneSignal API request failed");
    }

    // Create announcement record with 'processing' status
    const { data: announcement, error: dbError } = await supabase
      .from("announcements")
      .insert({
        title,
        message: description,
        sent_at: new Date().toISOString(),
        status: "processing",
        sent_by: req.auth?.userId, // If you have auth context
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Update announcement status on success
    await supabase
      .from("announcements")
      .update({
        status: "sent",
        sent_count: data.recipients || 0,
      })
      .eq("id", announcement.id);

    return NextResponse.json({
      success: true,
      data,
      announcementId: announcement.id,
    });
  } catch (error) {
    // If there's an announcement in progress, mark it as failed
    if (announcement?.id) {
      await supabase
        .from("announcements")
        .update({ status: "failed" })
        .eq("id", announcement.id);
    }

    console.error("Detailed error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send notification",
        details: error.message,
        serverError: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
