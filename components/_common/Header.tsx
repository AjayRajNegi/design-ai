"use client";
import {
	LoginLink,
	LogoutLink,
	useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";
import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Logo from "../Logo";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export default function Header() {
	const { theme, setTheme } = useTheme();
	const { user } = useKindeBrowserClient();
	const isDark = theme === "dark";

	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}

		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
				{/* Brand */}
				<div className="flex flex-1 items-center">
					<Link
						href="/"
						className="rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						aria-label="Go to homepage"
					>
						<Logo />
					</Link>
				</div>

				{/* Navigation */}
				{/* <nav className="hidden items-center gap-6 md:flex">
					<Link
						href="/"
						className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						Home
					</Link>
				</nav> */}

				{/* Actions */}
				<div className="flex flex-1 items-center justify-end gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setTheme(isDark ? "light" : "dark")}
						className="size-9 rounded-full"
						aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
					>
						<SunIcon
							className={cn(
								"absolute size-4.5 transition-all duration-200",
								isDark ? "rotate-0 scale-100" : "rotate-90 scale-0",
							)}
						/>
						<MoonIcon
							className={cn(
								"absolute size-4.5 transition-all duration-200",
								isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100",
							)}
						/>
					</Button>

					{user ? (
						<div className="relative" ref={ref}>
							<button
								type="button"
								onClick={() => setOpen((prev) => !prev)}
								className="flex rounded-full outline-none ring-offset-2 transition hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary"
								aria-label="Open account menu"
								aria-haspopup="menu"
								aria-expanded={open}
							>
								<Avatar className="size-9 rounded-full border">
									<AvatarImage
										src={user.picture || ""}
										alt={user.given_name || "User"}
									/>
									<AvatarFallback className="rounded-full text-xs font-medium">
										{user.given_name?.charAt(0)}
										{user.family_name?.charAt(0)}
									</AvatarFallback>
								</Avatar>
							</button>

							{open && (
								<div
									role="menu"
									className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border bg-popover p-1.5 shadow-xl shadow-black/5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
								>
									<div className="flex items-center gap-3 px-3 py-3">
										<Avatar className="size-10 rounded-full">
											<AvatarImage
												src={user.picture || ""}
												alt={user.given_name || "User"}
											/>
											<AvatarFallback className="rounded-full">
												{user.given_name?.charAt(0)}
												{user.family_name?.charAt(0)}
											</AvatarFallback>
										</Avatar>

										<div className="min-w-0">
											<p className="truncate text-sm font-medium">
												{user.given_name} {user.family_name}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{user.email}
											</p>
										</div>
									</div>

									<div className="my-1 h-px bg-border" />

									<LogoutLink className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
										<LogOutIcon size={16} />
										Log out
									</LogoutLink>
								</div>
							)}
						</div>
					) : (
						<LoginLink>
							<Button className="h-9 rounded-full px-5">Sign in</Button>
						</LoginLink>
					)}
				</div>
			</div>
		</header>
	);
}
