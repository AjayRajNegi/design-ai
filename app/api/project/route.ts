import { generateProjectName } from "@/app/action/action";
import prisma from "@/lib/primsa";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) throw new Error("Unauthorized.");
    if (!prompt) throw new Error("Missing Prompt.");

    const userId = user.id;
    const projectName = await generateProjectName(prompt);
    const project = await prisma.project.create({
      data: {
        userId,
        name: projectName,
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.log("Error occured:", error);
    return NextResponse.json(
      {
        error: "Failed to create a projcet.",
      },
      { status: 500 },
    );
  }
}
