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
