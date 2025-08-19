import { ensureTablesExist } from "@/lib/airtable";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if tables exist and create them if they don't
    const result = await ensureTablesExist();
    
    return NextResponse.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error("Error checking Airtable tables:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false,
      error: "Failed to check Airtable tables",
      message: errorMessage
    }, { status: 500 });
  }
}
