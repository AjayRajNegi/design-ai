import { generateProjectName } from "@/app/action/action";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/primsa";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) throw new Error("Unauthorized.");

    const project = await prisma.project.findFirst({
      where: {
        userId: user.id,
        id: id,
      },
      include: {
        frames: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        project,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Error occured:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch project.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { prompt } = await req.json();
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) throw new Error("Unauthorized.");
    if (!prompt) throw new Error("Missing Prompt.");

    const userId = user.id;
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        frames: true,
      },
    });

    if (!project) throw new Error("Project not found.");

    try {
      await inngest.send({
        name: "ui/generate.screens",
        data: {
          userId,
          projectId: id,
          prompt,
          frames: project.frames,
          theme: project.theme,
        },
      });
    } catch (error) {
      console.log(error);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.log("Error occured:", error);
    return NextResponse.json(
      {
        error: "Failed to generate frame.",
      },
      { status: 500 },
    );
  }
}
