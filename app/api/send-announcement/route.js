import { NextResponse } from "next/server";
import OneSignal from "@onesignal/node-onesignal";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  console.error("OneSignal credentials are not properly configured");
}

const client = new OneSignal.Client(ONESIGNAL_REST_API_KEY, ONESIGNAL_APP_ID);

export async function POST(request) {
  try {
    const { title, message, url, imageUrl } = await request.json();

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Title and message are required",
        },
        { status: 400 }
      );
    }

    console.log("Sending notification:", { title, message, url, imageUrl });

    const notification = {
      app_id: ONESIGNAL_APP_ID,
      contents: {
        en: message,
      },
      headings: {
        en: title,
      },
      included_segments: ["Subscribed Users"],
    };

    // Add optional parameters only if they exist
    if (url) notification.url = url;
    if (imageUrl) notification.chrome_web_image = imageUrl;

    console.log("OneSignal notification payload:", notification);

    const response = await client.createNotification(notification);
    console.log("OneSignal API response:", response);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("OneSignal Error:", {
      message: error.message,
      stack: error.stack,
      error,
    });

    return NextResponse.json(
      {
        error: "Failed to send notification",
        message: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
