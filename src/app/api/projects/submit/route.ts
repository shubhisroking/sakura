import { createProject } from "@/lib/airtable";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, description, userId } = await request.json();

    if (!name || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const records = await createProject({
      name,
      description,
      userId
    });

    if (records && records.length > 0) {
      const record = records[0];
      const project = {
        id: record.id,
        name: record.fields.Name,
        description: record.fields.Description,
        userId: record.fields.UserId,
        totalHours: record.fields.TotalHours || 0,
        createdAt: record.fields.CreatedAt,
        updatedAt: record.fields.UpdatedAt,
      };

      return NextResponse.json(project);
    } else {
      throw new Error("Failed to create project record");
    }
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
