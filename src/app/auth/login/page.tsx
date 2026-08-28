export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="panel-header">
          <h1 id="login-title">Ingresar</h1>
        </div>
        <form>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <button className="button primary-button" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
