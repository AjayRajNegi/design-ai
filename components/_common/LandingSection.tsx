"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { formatDistanceToNow } from "date-fns";
import { FolderOpenDotIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import { useCreateProject, useGetProjects } from "@/features/use-project";
import type { ProjectType } from "@/types/project";
import { Suggestion, Suggestions } from "../ai-elements/suggestion";
import PromptInput from "../PromptInput";
import Header from "./Header";

const suggestions = [
	{
		label: "E-commerce",
		icon: "👟",
		value: `Sneaker product page. Large high-quality product image on a light gray background. Color selector swatches, size selector grid, and a sticky "Add to Cart" button at the bottom. Title and price in bold, oversized typography. Mobile app, single screen. Style: Neo-Brutalism. High contrast, thick black outlines on buttons and cards, hard shadows (no blur), unrefined geometry, bold solid colors (yellow and black). Trendy streetwear aesthetic.`,
	},
	{
		label: "Finance",
		icon: "💳",
		value: `Personal finance dashboard. Overview of total balance, monthly income and expenses, and savings progress. Spending breakdown with colorful category charts, recent transactions list, and a prominent "Add Transaction" button. Clean card-based layout with clear financial hierarchy. Title and balance in large typography. Mobile app, single screen. Style: Modern Minimalism. Soft neutral backgrounds, subtle gradients, rounded cards, muted greens and blues, crisp typography, generous whitespace. Premium fintech aesthetic.`,
	},
	{
		label: "Food Delivery",
		icon: "🍛",
		value: `Food delivery app home screen. Large promotional banner featuring delicious food photography. Horizontal cuisine category selector, restaurant cards with ratings, delivery times, and price ranges. Search bar at the top and floating cart button at the bottom. Mobile app, single screen. Style: Vibrant Contemporary. Warm orange and coral accents, rounded cards, bold typography, appetizing photography, subtle shadows, energetic and friendly aesthetic.`,
	},
	{
		label: "Music Streaming",
		icon: "🎶",
		value: `Music streaming player screen. Large album artwork centered prominently, song title and artist in bold typography, progress bar, playback controls, shuffle and repeat buttons, and a queue shortcut. Minimal distractions with immersive visual focus. Mobile app, single screen. Style: Dark Atmospheric. Deep black background, vibrant purple gradients, subtle glow effects, oversized album artwork, clean white typography, premium music experience.`,
	},
	{
		label: "Fitness",
		icon: "🏋🏻",
		value: `Fitness tracking dashboard. Daily activity rings showing steps, calories, and workout progress. Prominent weekly activity chart, current streak indicator, workout recommendation cards, and a bold "Start Workout" button. Mobile app, single screen. Style: Sporty Futurism. Dark charcoal background, electric lime accents, oversized numerical metrics, sharp geometric shapes, bold condensed typography, energetic athletic aesthetic.`,
	},
];
export default function LandingSection() {
	const { user } = useKindeBrowserClient();
	const userId = user?.id || "";
	const [promptText, setPromptText] = useState<string>("");

	const { data: projects, isLoading, isError } = useGetProjects(userId);

	const { mutate, isPending } = useCreateProject();
	const handleSubmit = () => {
		if (!promptText) return;
		mutate(promptText);
	};
	const handleSuggestionClick = (val: string) => {
		setPromptText(val);
	};

	return (
		<div className="min-h-screen w-full">
			<div className="flex flex-col">
				<Header />
				<div className="relative overflow-hidden pt-40">
					<div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
						<div className="space-y-3">
							<h1 className="text-center font-base text-4xl tracking-tight sm:text-5xl">
								Design mobile apps <br className="md:hidden" />
								<span className="text-primary">in minutes</span>
							</h1>
							<p className="mx-auto max-w-2xl text-center font-base tracking-tight text-foreground leading-relaxed sm:text-lg ">
								Go from idea to beautifyl app mockups in minutes by chatting
								with AI.
							</p>
						</div>
						<div className="flex w-full max-w-3xl flex-col items-center gap-8 relative z-50 mt-10">
							<div className="w-full">
								<PromptInput
									className="ring-2 ring-primary "
									promptText={promptText}
									setPromptText={setPromptText}
									isLoading={isPending}
									onSubmit={handleSubmit}
								/>
							</div>
							<div className="flex flex-wrap justify-center gap-2 px-5">
								<Suggestions>
									{suggestions.map((s) => (
										<Suggestion
											key={s.label}
											suggestion={s.label}
											className="text-xs! h-7! px-2.5! pt-1!"
											onClick={() => handleSuggestionClick(s.value)}
										>
											{s.icon}
											<span>{s.label}</span>
										</Suggestion>
									))}
								</Suggestions>
							</div>
						</div>

						<div className="absolute -translate-1/2 left-1/2 w-[5000px] h-[3000px] top-[80%] -z-10">
							<div className="-translate-x-1/2 absolute bottom-[calc(100%-300px)] left-1/2 h-[2000px] w-[2000px] opacity-20 bg-radial-primary"></div>
							<div className="absolute -mt-2.5 size-full rounded-[50%] bg-primary/20 opacity-70 [box-shadow:0_-15px_24.8px_var(--primary)]"></div>
							<div
								className="absolute z-0 size-full rounded-[50%}
                bg-background"
							></div>
						</div>
					</div>
				</div>

				<div className="w-full py-10">
					<div className="mx-auto max-w-4xl">
						{userId && (
							<section className="w-full py-8">
								<div className="mx-auto max-w-6xl px-5 sm:px-8">
									<div className="mb-6 flex items-center justify-between">
										<div>
											<h2 className="text-2xl font-base tracking-tight">
												Recent Projects
											</h2>
											<p className="mt-1 text-sm text-muted-foreground">
												Continue where you left off.
											</p>
										</div>

										{projects?.length ? (
											<span className="text-sm text-muted-foreground">
												{projects.length} projects
											</span>
										) : null}
									</div>

									{isLoading ? (
										<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
											{Array.from({ length: 6 }).map((_, i) => (
												<div
													key={i}
													className="overflow-hidden rounded-xl border bg-card"
												>
													<div className="aspect-[16/10] animate-pulse bg-muted" />
													<div className="space-y-2 p-4">
														<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
														<div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
													</div>
												</div>
											))}
										</div>
									) : projects?.length ? (
										<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
											{projects.map((project: ProjectType) => (
												<ProjectCard key={project.id} project={project} />
											))}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
											<FolderOpenDotIcon className="mb-4 size-10 text-muted-foreground" />
											<h3 className="font-medium">No projects yet</h3>
											<p className="mt-1 text-sm text-muted-foreground">
												Create your first project using the prompt above.
											</p>
										</div>
									)}

									{isError && (
										<p className="mt-4 text-sm text-destructive">
											Failed to load projects. Please try again.
										</p>
									)}
								</div>
							</section>
						)}

						{isError && <p className="text-red-500">Failed to load projects</p>}
					</div>
				</div>
			</div>
		</div>
	);
}

const ProjectCard = memo(({ project }: { project: ProjectType }) => {
	const createdAtDate = new Date(project.createdAt);
	const timeAgo = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
	});

	return (
		<Link
			href={`/project/${project.id}`}
			className="group block min-w-0 overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
		>
			{/* Thumbnail */}
			<div className="relative aspect-[16/10] overflow-hidden bg-muted">
				{project.thumbnail ? (
					<Image
						src={project.thumbnail}
						alt={`${project.name} preview`}
						fill
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
						className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
					/>
				) : (
					<div className="flex size-full items-center justify-center">
						<div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
							<FolderOpenDotIcon className="size-7 text-primary" />
						</div>
					</div>
				)}

				{/* Open indicator */}
				<div className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
					<span className="text-sm">↗</span>
				</div>
			</div>

			{/* Project information */}
			<div className="flex items-center justify-between gap-3 p-4">
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-semibold">{project.name}</h3>
					<p className="mt-1 text-xs text-muted-foreground">Edited {timeAgo}</p>
				</div>

				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
					<FolderOpenDotIcon className="size-4" />
				</div>
			</div>
		</Link>
	);
});

ProjectCard.displayName = "ProjectCard";
