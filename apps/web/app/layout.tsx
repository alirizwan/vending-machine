export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body style={{ fontFamily: 'system-ui', margin: 20 }}>
      <header style={{ marginBottom: 16 }}>
        <h1>Vending Machine UI</h1>
        <nav style={{ display: 'flex', gap: 12 }}>
          <a href="/">Login</a>
          <a href="/machine">Machine</a>
          <a href="/beverages">Beverages</a>
          <a href="/maintenance">Maintenance</a>
        </nav>
      </header>
      {children}
    </body></html>
  );
}
