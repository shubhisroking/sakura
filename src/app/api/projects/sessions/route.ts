import { createTimerSession, updateTimerSession } from "@/lib/airtable";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { projectId, userId } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const timerSession = await createTimerSession({
      userId,
      projectId
    });

    return NextResponse.json(timerSession);
  } catch (error) {
    console.error("Error creating timer session:", error);
    return NextResponse.json({ error: "Failed to create timer session" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, endTime, duration } = await request.json();

    if (!id || !endTime || duration === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await updateTimerSession({
      id,
      endTime,
      duration
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating timer session:", error);
    return NextResponse.json({ error: "Failed to update timer session" }, { status: 500 });
  }
}
