import { getProjectsByUserId } from "@/lib/airtable";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    // Check if environment variables are set
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      console.error("Missing Airtable environment variables");
      return NextResponse.json(
        { 
          error: "Airtable configuration is missing", 
          details: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables must be set" 
        }, 
        { status: 500 }
      );
    }

    const projects = await getProjectsByUserId(userId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: "Failed to fetch projects", 
      details: errorMessage 
    }, { status: 500 });
  }
}
