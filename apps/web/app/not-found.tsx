import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Page not found</h1>
      <Link href="/">Home</Link>
    </div>
  );
}
