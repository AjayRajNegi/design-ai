import Link from "next/link";

export default function Logo() {
	return (
		<Link href="/" className="flex-1 flex items-center gap-1 text-2xl">
			<span className="inline-block font-semibold text-primary">X</span>
			<span className="font-base text-foreground">design.ai</span>
		</Link>
	);
}
