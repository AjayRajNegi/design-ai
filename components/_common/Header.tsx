"use client";
import { useTheme } from "next-themes";
import Logo from "../Logo";
import Link from "next/link";
import { Button } from "../ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="sticky top-0 right-0 left-0 z-30">
      <header className="h-16 border-b bg-background py-4">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center">
          <Logo />

          <div className="flex-1 hidden items-center md:flex gap-8">
            <Link className="text-foreground-muted text-sm" href="/">
              Home
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 ">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="relative rounded-full h-8 w-8"
            >
              <SunIcon
                className={cn(
                  "absolute h-5 w-5 transition",
                  isDark ? "scale-100" : "scale-0",
                )}
              />
              <MoonIcon
                className={cn(
                  "absolute h-5 w-5 transition",
                  isDark ? "scale-0" : "scale-100",
                )}
              />
            </Button>
            <LoginLink>
              <Button>Sign in</Button>
            </LoginLink>
          </div>
        </div>
      </header>
    </div>
  );
}
