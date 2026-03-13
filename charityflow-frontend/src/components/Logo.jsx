/**
 * LogoIcon — circular icon used in the navbar and CTA section.
 * The PNG has a black background which looks correct on the always-dark navbar.
 */
export function LogoIcon({ size = 36, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="CharityFlow"
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        display: "block",
      }}
      draggable={false}
    />
  );
}

/**
 * LogoFull — icon + "CharityFlow" wordmark.
 * white=true forces white text (used inside the always-dark navbar).
 */
export function LogoFull({ white = false, size = "md" }) {
  const sizes = {
    sm: { icon: 28, title: "15px", sub: "9px" },
    md: { icon: 36, title: "19px", sub: "10px" },
    lg: { icon: 44, title: "23px", sub: "11px" },
  };
  const s = sizes[size] || sizes.md;

  const titleColor = white ? "#FFFFFF" : "var(--cf-text)";
  const subColor   = white ? "rgba(255,255,255,0.55)" : "var(--cf-text-muted)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <LogoIcon size={s.icon} />
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontSize: s.title,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          <span style={{ color: titleColor }}>Charity</span>
          <span style={{ color: "var(--cf-teal-2)" }}>Flow</span>
        </div>
        <div
          style={{
            fontSize: s.sub,
            color: subColor,
            fontWeight: 400,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginTop: "3px",
          }}
        >
          Transparent Giving
        </div>
      </div>
    </div>
  );
}
