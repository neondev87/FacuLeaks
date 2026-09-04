// ── Ícono de micrófono ──
export default function MicIcon({ size=18, recording=false }) {
  const col = recording ? "#3ddc84" : "rgba(255,255,255,.6)";
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ display:"block" }}>
      <rect x="6.5" y="2" width="5" height="8" rx="2.5" stroke={col} strokeWidth=".8" fill="none"/>
      <path d="M3.5 9.5 C3.5 13 14.5 13 14.5 9.5" stroke={col} strokeWidth=".8" strokeLinecap="round" fill="none"/>
      <line x1="9" y1="13.2" x2="9" y2="15.5" stroke={col} strokeWidth=".8" strokeLinecap="round"/>
      <line x1="6.5" y1="15.5" x2="11.5" y2="15.5" stroke={col} strokeWidth=".8" strokeLinecap="round"/>
    </svg>
  );
}
