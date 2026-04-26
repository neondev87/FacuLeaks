export default function BgCross() {
  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 0,
      width: "40vw",
      maxWidth: 600,
      height: "100vh",
      backgroundImage: "url('/art/bg-cross.png')",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right center",
      backgroundSize: "contain",
      opacity: 0.06,
      pointerEvents: "none",
      zIndex: 1,
    }} />
  );
}