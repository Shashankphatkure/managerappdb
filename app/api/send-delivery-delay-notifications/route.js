import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get all confirmed/accepted/picked_up orders
    const { data: activeOrders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        driverid, 
        drivername,
        customername,
        destination,
        status,
        time,
        created_at,
        batch_id,
        store_name,
        delivery_sequence
      `)
      .in("status", ["confirmed", "accepted", "picked_up"]);
    
    if (ordersError) {
      throw ordersError;
    }
    
    // Get the current time
    const currentTime = new Date();
    
    // Find orders that should have been delivered but aren't
    const delayedOrders = activeOrders.filter(order => {
      // Skip if there's no estimated time
      if (!order.time) return false;
      
      // Parse the time string (e.g., "30 mins" -> 30 minutes)
      let estimatedMinutes = 0;
      const timeMatch = order.time.match(/(\d+)\s*min/i);
      if (timeMatch && timeMatch[1]) {
        estimatedMinutes = parseInt(timeMatch[1]);
      } else {
        // If the format is different, try to extract hours
        const hourMatch = order.time.match(/(\d+)\s*hour/i);
        if (hourMatch && hourMatch[1]) {
          estimatedMinutes = parseInt(hourMatch[1]) * 60;
        } else {
          return false; // Couldn't parse time format
        }
      }
      
      // Calculate expected delivery time
      const orderCreatedAt = new Date(order.created_at);
      const expectedDeliveryTime = new Date(orderCreatedAt.getTime() + estimatedMinutes * 60000);
      
      // Check if the current time is past the expected delivery time
      return currentTime > expectedDeliveryTime;
    });
    
    // Create and send notifications for delayed orders
    if (delayedOrders.length > 0) {
      const notifications = delayedOrders.map(order => ({
        recipient_id: order.driverid,
        recipient_type: "driver",
        title: "Delivery Delay Alert",
        message: `You have a delayed delivery for ${order.customername}. Please update your status.`,
        type: "delay_warning",
        order_id: order.id,
        delivery_attempted: false
      }));
      
      // Insert notifications into database
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);
      
      if (notificationError) {
        throw notificationError;
      }
      
      // Get driver external device IDs for OneSignal
      const driverIds = [...new Set(delayedOrders.map(order => order.driverid))];
      
      if (driverIds.length > 0) {
        const { data: drivers, error: driversError } = await supabase
          .from("users")
          .select("id, external_device_id")
          .in("id", driverIds);
        
        if (driversError) {
          throw driversError;
        }
        
        // Create a map of driver IDs to their device IDs
        const deviceIdMap = {};
        drivers.forEach(driver => {
          if (driver.external_device_id) {
            deviceIdMap[driver.id] = driver.external_device_id;
          }
        });
        
        // Group notifications by driver to send in bulk
        const notificationsByDriver = {};
        
        delayedOrders.forEach(order => {
          if (!notificationsByDriver[order.driverid]) {
            notificationsByDriver[order.driverid] = [];
          }
          
          notificationsByDriver[order.driverid].push(order);
        });
        
        // Prepare and send OneSignal notifications
        const oneSignalPromises = Object.keys(notificationsByDriver).map(async (driverId) => {
          const deviceId = deviceIdMap[driverId];
          
          if (!deviceId) return null; // Skip if no device ID
          
          const driverOrders = notificationsByDriver[driverId];
          const orderCount = driverOrders.length;
          const firstOrder = driverOrders[0];
          
          // Prepare OneSignal payload
          const oneSignalPayload = {
            app_id: process.env.ONESIGNAL_APP_ID,
            include_player_ids: [deviceId],
            headings: { en: "Delivery Delay Alert" },
            contents: { 
              en: orderCount === 1 
                ? `Your delivery to ${firstOrder.customername} is delayed. Please update your status.`
                : `You have ${orderCount} delayed deliveries. Please update your status.`
            },
            data: {
              type: "delay_warning",
              order_ids: driverOrders.map(o => o.id)
            }
          };
          
          // Send to OneSignal
          try {
            const response = await fetch("https://onesignal.com/api/v1/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
              },
              body: JSON.stringify(oneSignalPayload)
            });
            
            const responseData = await response.json();
            
            // Update notifications with delivery response
            await supabase
              .from("notifications")
              .update({ 
                delivery_attempted: true,
                delivery_response: responseData
              })
              .in("order_id", driverOrders.map(o => o.id))
              .eq("type", "delay_warning");
            
            return responseData;
          } catch (error) {
            console.error("OneSignal API error:", error);
            return null;
          }
        });
        
        await Promise.all(oneSignalPromises.filter(Boolean));
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${delayedOrders.length} delayed orders`,
      delayed_orders: delayedOrders.map(o => o.id)
    });
    
  } catch (error) {
    console.error("Error sending delay notifications:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET method for manual testing
export async function GET() {
  return NextResponse.json({
    message: "This endpoint requires a POST request to trigger notifications"
  });
} 