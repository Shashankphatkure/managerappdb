import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Log cron job execution start
    const { error: logError } = await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'driver_mode_off',
        executed_at: new Date().toISOString(),
        result: 'Started execution'
      });
    
    if (logError) {
      console.error('Error logging cron job execution:', logError);
    }
    
    // Get active drivers with available/busy status
    const { data: drivers, error: driversError } = await supabase
      .from("users")
      .select("id, full_name, status")
      .eq("is_active", true)
      .in("status", ["available", "busy"]);
    
    if (driversError) {
      throw driversError;
    }
    
    // Update drivers to "unavailable" status
    const updatePromises = [];
    const updatedDriverIds = [];
    const updatedDriverNames = [];
    
    for (const driver of drivers) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ status: "unavailable" })
        .eq("id", driver.id);
      
      if (!updateError) {
        updatedDriverIds.push(driver.id);
        updatedDriverNames.push(driver.full_name);
      } else {
        console.error(`Error updating driver ${driver.id}:`, updateError);
      }
    }
    
    // Log successful execution with details
    const result = {
      success: true,
      message: `Set ${updatedDriverIds.length} drivers to unavailable status`,
      total_drivers_processed: drivers.length,
      drivers_updated: updatedDriverIds.length,
      driver_names: updatedDriverNames
    };
    
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'driver_mode_off',
        executed_at: new Date().toISOString(),
        result: JSON.stringify(result)
      });
    
    // Send notifications to drivers
    if (updatedDriverIds.length > 0) {
      const notifications = updatedDriverIds.map(driverId => ({
        recipient_id: driverId,
        recipient_type: "driver",
        title: "Status Update",
        message: "Your driver status has been set to unavailable as part of end-of-day process.",
        type: "status_update",
        delivery_attempted: false
      }));
      
      await supabase.from("notifications").insert(notifications);
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Error in driver-mode-off cron job:", error);
    
    // Log error
    try {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.from('cron_job_logs').insert({
        job_name: 'driver_mode_off',
        executed_at: new Date().toISOString(),
        result: `Error: ${error.message}`
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST method for backward compatibility
export async function POST() {
  return GET();
} 