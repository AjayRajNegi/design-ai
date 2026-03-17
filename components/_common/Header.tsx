"use client";
import { useTheme } from "next-themes";
import Logo from "../Logo";
import Link from "next/link";
import { Button } from "../ui/button";
import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LoginLink,
  LogoutLink,
  useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useRef, useState } from "react";

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            {user ? (
              <div className="relative" ref={ref}>
                <button onClick={() => setOpen((prev) => !prev)}>
                  <Avatar className="h-8 w-8 shrink-0 rounded-full">
                    <AvatarImage
                      src={user?.picture || ""}
                      alt={user?.given_name || ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.given_name?.charAt(0)}
                      {user?.family_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-md z-50">
                    <div className="px-3 py-2 text-sm font-medium">
                      My Account
                    </div>
                    <div className="h-px bg-border mx-1" />
                    <div className="p-1">
                      <LogoutLink className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                        <LogOutIcon size={16} />
                        Logout
                      </LogoutLink>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <LoginLink>
                <Button>Sign in</Button>
              </LoginLink>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
