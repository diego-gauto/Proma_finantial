"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="panel-header">
          <h1 id="login-title">Ingresar</h1>
        </div>
        <form action={formAction}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error ? (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          ) : null}
          <button className="button button-primary" disabled={pending} type="submit">
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
