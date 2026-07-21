export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="gate">
      <div className="gate-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="gate-icon" src="/icon-192.png" alt="" width={72} height={72} />
        <h1 className="gate-title">Poopy Month</h1>
        <p className="gate-sub">Enter the password to carry on.</p>
        <form action="/api/unlock" method="post" className="gate-form">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            className="gate-input"
          />
          {error ? <p className="gate-err">Not quite, try again.</p> : null}
          <button type="submit" className="gate-btn">
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
