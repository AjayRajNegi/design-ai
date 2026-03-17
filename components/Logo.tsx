import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex-1 flex items-center gap-2 text-2xl">
      <span className="inline-block font-extrabold text-primary">X</span>
      <span className="font-semibold text-foreground">design.ai</span>
    </Link>
  );
}
