import Link from "next/link";

export default function ServerPage() {
  return (
    <main className="tracker-app">
      <p className="subtitle">
        Demo route retired.{" "}
        <Link href="/" style={{ color: "var(--green)" }}>
          Back to Move Out Quest
        </Link>
      </p>
    </main>
  );
}
