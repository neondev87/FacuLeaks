"use client";

import { useState, useEffect, useRef } from "react";

export default function DownloadBar({ filename, trigger }) {
  const [visible,  setVisible]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [done,     setDone]     = useState(false);
  const rafRef   = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    // Reset
    setProgress(0);
    setDone(false);
    setVisible(true);

    const duration = 2200;
    const start    = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct     = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, 2000);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, [trigger]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes slideInBar {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeOutBar {
          from { opacity:1; }
          to   { opacity:0; }
        }
        @keyframes blinkCursor {
          0%,100% { opacity:1 }
          50%     { opacity:0 }
        }
        .dl-bar-wrap {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          width: 320px;
          background: #050505;
          border: 1px solid rgba(255,255,255,.12);
          padding: 12px 14px;
          font-family: 'IBM Plex Mono', monospace;
          animation: ${done ? "fadeOutBar 1s ease 1.2s forwards" : "slideInBar .25s ease"};
        }
        .dl-bar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .dl-bar-prompt {
          font-size: 9px;
          color: rgba(255,255,255,.25);
          letter-spacing: .1em;
          white-space: nowrap;
        }
        .dl-bar-filename {
          font-size: 11px;
          color: rgba(255,255,255,.75);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .dl-bar-pct {
          font-size: 10px;
          letter-spacing: .06em;
          flex-shrink: 0;
        }
        .dl-bar-track {
          height: 2px;
          background: rgba(255,255,255,.08);
          width: 100%;
        }
        .dl-bar-fill {
          height: 2px;
          transition: width .1s linear;
        }
        .dl-bar-status {
          margin-top: 7px;
          font-size: 9px;
          letter-spacing: .1em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dl-cursor {
          display: inline-block;
          width: 6px;
          height: 11px;
          background: rgba(255,255,255,.5);
          animation: blinkCursor 1s step-end infinite;
          vertical-align: middle;
        }
      `}</style>

      <div className="dl-bar-wrap">
        <div className="dl-bar-header">
          <span className="dl-bar-prompt">C:\FacuLeaks&gt;</span>
          <span className="dl-bar-filename">{filename}</span>
          <span className="dl-bar-pct" style={{ color: done ? "#3ddc84" : "rgba(255,255,255,.5)" }}>
            {progress}%
          </span>
        </div>

        <div className="dl-bar-track">
          <div
            className="dl-bar-fill"
            style={{
              width:      `${progress}%`,
              background: done ? "#3ddc84" : "rgba(255,255,255,.6)",
            }}
          />
        </div>

        <div className="dl-bar-status">
          {done ? (
            <span style={{ color: "#3ddc84", letterSpacing: ".1em" }}>
              ✓ COMPLETADO
            </span>
          ) : (
            <>
              <span style={{ color: "rgba(255,255,255,.3)" }}>descargando</span>
              <span className="dl-cursor" />
            </>
          )}
        </div>
      </div>
    </>
  );
}