"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-bg-0 p-8 text-ink-0">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase text-ink-2">error</p>
            <h1 className="mt-5 text-6xl">The page tore in the wrong place.</h1>
            <button className="mt-8 rounded border border-rule px-4 py-3 font-mono text-xs" onClick={reset} type="button">
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
