export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light; --background: #F8FAFC; --surface: #FFFFFF; --text: #0F172A; --muted: #64748B; --border: #E2E8F0; --primary: #4F46E5; }
      @media (prefers-color-scheme: dark) { :root { color-scheme: dark; --background: #0F172A; --surface: #1E293B; --text: #F8FAFC; --muted: #CBD5E1; --border: #334155; } }
      :root.dark { color-scheme: dark; --background: #0F172A; --surface: #1E293B; --text: #F8FAFC; --muted: #CBD5E1; --border: #334155; }
      :root.light { color-scheme: light; --background: #F8FAFC; --surface: #FFFFFF; --text: #0F172A; --muted: #64748B; --border: #E2E8F0; }
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: var(--background); color: var(--text); display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; transition: background-color 180ms ease, color 180ms ease; }
      .card { box-sizing: border-box; max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid var(--border); border-radius: 0.5rem; background: var(--surface); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: var(--muted); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: var(--primary); color: #FFFFFF; }
      .secondary { background: var(--surface); color: var(--text); border-color: var(--border); }
    </style>
    <script>try{const t=localStorage.getItem('seconded-theme');if(t==='dark'||t==='light')document.documentElement.className=t}catch{}</script>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
