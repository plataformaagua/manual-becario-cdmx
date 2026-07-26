"use client";

import { FormEvent, useMemo, useState } from "react";

type View = "cover" | "login" | "balance";

const UTOPIAS_URL =
  import.meta.env.VITE_UTOPIAS_URL || "https://utopias.tudominio.mx";
const CENTROS_URL =
  import.meta.env.VITE_CENTROS_URL || "https://centros.tudominio.mx";

const MONEY_MESSAGES = [
  "Haz que tu beca rinda: primero lo necesario, después lo deseado.",
  "Un pequeño ahorro de hoy puede resolver una necesidad de mañana.",
  "Compara precios y piensa antes de comprar. Tu beca acompaña tus metas.",
  "Organiza tus gastos por semana para llegar tranquilo al siguiente depósito.",
  "Cuida tu dinero: úsalo en lo que fortalezca tus estudios y tu bienestar.",
  "Guardar una parte también es invertir en ti.",
];

function GovernmentLockup() {
  const [leftLogoLoaded, setLeftLogoLoaded] = useState(false);
  const [rightLogoLoaded, setRightLogoLoaded] = useState(false);

  return (
    <div className="government-lockup" aria-label="Gobierno de la Ciudad de México">
      <img
        className={`official-logo official-logo-left ${leftLogoLoaded ? "is-loaded" : ""}`}
        src="https://cdn.cdmx.gob.mx/assets/cdmx-header-image-left.svg"
        alt="Ciudad de México"
        onLoad={() => setLeftLogoLoaded(true)}
        onError={() => setLeftLogoLoaded(false)}
      />
      {!leftLogoLoaded && (
        <span className="logo-fallback">
          <strong>CIUDAD DE MÉXICO</strong>
          <small>Gobierno de la Ciudad</small>
        </span>
      )}
      <img
        className={`official-logo official-logo-right ${rightLogoLoaded ? "is-loaded" : ""}`}
        src="https://cdn.cdmx.gob.mx/assets/cdmx-header-image-right.svg"
        alt="Capital de la Transformación"
        onLoad={() => setRightLogoLoaded(true)}
        onError={() => setRightLogoLoaded(false)}
      />
      {!rightLogoLoaded && (
        <span className="logo-fallback logo-fallback-right">
          <strong>CAPITAL DE LA</strong>
          <small>TRANSFORMACIÓN</small>
        </span>
      )}
      <span className="lockup-divider" aria-hidden="true" />
      <span className="sectei-copy">
        <strong>SECTEI</strong>
        <small>Educación, Ciencia, Tecnología e Innovación</small>
      </span>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("cover");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const consultationDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Mexico_City",
      }).format(new Date()),
    [view],
  );

  const advice = useMemo(() => {
    const source = `${name.trim()}-${consultationDate}`;
    const seed = source
      .split("")
      .reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return MONEY_MESSAGES[seed % MONEY_MESSAGES.length];
  }, [name, consultationDate]);

  const simulatedBalance = useMemo(() => {
    const seed = (name.trim() || "becario")
      .split("")
      .reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return 1800 + (seed % 17) * 100;
  }, [name, view]);

  const openLogin = () => {
    setError("");
    setView("login");
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Escribe tu nombre para personalizar la consulta.");
      return;
    }
    if (username.trim() !== "usuario" || password !== "admin") {
      setError("Los datos no coinciden. Usa usuario y admin.");
      return;
    }
    setError("");
    setView("balance");
  };

  return (
    <main className="site-shell">
      <header className="institutional-bar">
        <GovernmentLockup />
        <span className="student-badge">Portal estudiantil</span>
      </header>

      {view === "cover" && (
        <section className="cover-view" aria-labelledby="cover-title">
          <div className="title-block">
            <p className="kicker">Tu beca, tus espacios, tu ciudad</p>
            <h1 id="cover-title">Manual del Becario CDMX</h1>
            <p className="intro">
              Encuentra servicios cercanos y consulta la información de tu beca
              desde un solo lugar.
            </p>
          </div>

          <div className="illustration-map">
            <img
              src="/manual-becario-cdmx-hero.png"
              alt="Estudiantes recorren la Ciudad de México entre una UTOPÍA, un centro PILARES con biblioteca y su tarjeta de beca."
            />

            <a
              className="hotspot hotspot-utopia"
              href={UTOPIAS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir el geovisualizador Busca tu UTOPÍA"
            >
              <span className="hotspot-icon" aria-hidden="true">⌂</span>
              <span>
                <small>Explora la ciudad</small>
                <strong>Busca tu UTOPÍA</strong>
              </span>
              <b aria-hidden="true">↗</b>
            </a>

            <a
              className="hotspot hotspot-centros"
              href={CENTROS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir el geovisualizador de PILARES y bibliotecas"
            >
              <span className="hotspot-icon" aria-hidden="true">▤</span>
              <span>
                <small>Aprende cerca de ti</small>
                <strong>PILARES o biblioteca</strong>
              </span>
              <b aria-hidden="true">↗</b>
            </a>

            <button
              className="hotspot hotspot-balance"
              onClick={openLogin}
              aria-label="Ir a la consulta demostrativa de saldo"
            >
              <span className="hotspot-icon" aria-hidden="true">$</span>
              <span>
                <small>Consulta tu beca</small>
                <strong>Checa tu saldo</strong>
              </span>
              <b aria-hidden="true">→</b>
            </button>
          </div>

          <p className="cover-note">
            Selecciona un elemento de la ilustración para comenzar.
          </p>
        </section>
      )}

      {view === "login" && (
        <section className="account-view">
          <button className="back-button" onClick={() => setView("cover")}>
            ← Volver al manual
          </button>
          <div className="account-grid">
            <div className="account-story">
              <span className="account-symbol" aria-hidden="true">◎</span>
              <p className="kicker">Consulta protegida</p>
              <h1>Confirma tu identidad</h1>
              <p>
                Ingresa los datos de demostración para consultar el saldo de
                ejemplo y una recomendación para cuidar tu beca.
              </p>
              <div className="privacy-card">
                <span aria-hidden="true">◇</span>
                Este prototipo no almacena nombres ni contraseñas.
              </div>
            </div>

            <form className="login-card" onSubmit={handleLogin}>
              <div>
                <p className="form-step">Paso 1 de 1</p>
                <h2>Datos del becario</h2>
                <p className="demo-hint">
                  Acceso demo: <b>usuario</b> / <b>admin</b>
                </p>
              </div>

              <label>
                Nombre completo
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Ej. Alejandra Martínez"
                />
              </label>
              <label>
                Usuario
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="usuario"
                />
              </label>
              <label>
                Contraseña
                <span className="password-field">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="admin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </span>
              </label>

              {error && <p className="form-error" role="alert">{error}</p>}

              <button className="primary-button" type="submit">
                Consultar saldo <span aria-hidden="true">→</span>
              </button>
              <p className="security-note">Consulta demostrativa · Sin datos financieros reales</p>
            </form>
          </div>
        </section>
      )}

      {view === "balance" && (
        <section className="balance-view">
          <button className="back-button light" onClick={() => setView("cover")}>
            ← Volver al manual
          </button>
          <div className="balance-card">
            <div className="balance-header">
              <div>
                <p className="kicker">Beca estudiantil CDMX</p>
                <h1>Hola, {name.trim()}</h1>
              </div>
              <span className="status-pill">● Cuenta activa</span>
            </div>

            <div className="balance-summary">
              <div>
                <span>Saldo disponible</span>
                <strong>
                  {simulatedBalance.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </strong>
                <small>Saldo ilustrativo para este prototipo</small>
              </div>
              <div className="card-art" aria-hidden="true">
                <span>BECA CDMX</span>
                <b>•••• 2026</b>
              </div>
            </div>

            <div className="consultation-row">
              <span>Fecha de consulta</span>
              <strong>{consultationDate}</strong>
            </div>

            <blockquote>
              <span aria-hidden="true">✦</span>
              <div>
                <small>Consejo para cuidar tu beca</small>
                <p>{advice}</p>
              </div>
            </blockquote>

            <div className="balance-actions">
              <button onClick={() => setView("cover")}>Ir al inicio</button>
              <button
                className="secondary-action"
                onClick={() => window.print()}
              >
                Imprimir consulta
              </button>
            </div>
          </div>
          <p className="prototype-warning">
            Demostración visual. Para una consulta real se requiere integrar el
            padrón y el sistema institucional de pagos.
          </p>
        </section>
      )}

      <footer>
        <span>Gobierno de la Ciudad de México · 2026</span>
        <span>Educación que transforma</span>
      </footer>
    </main>
  );
}
