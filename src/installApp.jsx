// Instalarea aplicației pe telefon / calculator (PWA).
// - Android / Chrome / Edge: browserul trimite „beforeinstallprompt”; butonul deschide fereastra lui de instalare.
// - iPhone / iPad (Safari): nu există instalare din buton; arătăm pașii (Partajează → „Adaugă pe ecranul principal”).
// - Dacă aplicația rulează deja instalată, butonul nu apare.
import React, { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();            // fereastra se deschide doar când apasă utilizatorul pe buton
    deferredPrompt = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

// { canInstall, ios, install() }
export function useInstall() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const standalone = isStandalone();
  return {
    canInstall: !standalone && (Boolean(deferredPrompt) || isIos()),
    ios: isIos() && !deferredPrompt,
    async install() {
      if (!deferredPrompt) return false;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      notify();
      return outcome === "accepted";
    },
  };
}

function IosSteps({ onClose }) {
  return (
    <div className="authBackdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="authDialog installDialog">
        <button type="button" className="authClose" onClick={onClose} aria-label="Închide"><X size={18} /></button>
        <img src="/icons/apple-touch-icon.png" alt="" className="installIcon" />
        <h2>Instalează pe iPhone</h2>
        <p className="authSub">În Safari, în 3 pași:</p>
        <ol className="installSteps">
          <li><span><Share size={18} /></span> Apasă butonul <strong>Partajează</strong> din bara de jos (pătratul cu săgeată).</li>
          <li><span><SquarePlus size={18} /></span> Alege <strong>„Adaugă pe ecranul principal”</strong>.</li>
          <li><span>✓</span> Apasă <strong>„Adaugă”</strong> — iconița Be Fit From Home apare pe ecranul telefonului.</li>
        </ol>
        <p className="authSub">Dacă folosești Chrome pe iPhone, deschide site-ul în Safari pentru acest pas.</p>
      </div>
    </div>
  );
}

// butonul „Instalează aplicația” (nu apare dacă instalarea nu e posibilă sau aplicația e deja instalată)
export function InstallButton({ className = "" }) {
  const { canInstall, ios, install } = useInstall();
  const [steps, setSteps] = useState(false);
  if (!canInstall) return null;
  return (
    <>
      <button className={`installBtn ${className}`} onClick={() => (ios ? setSteps(true) : install())}>
        <Download size={17} />
        <span>
          <strong>Instalează aplicația</strong>
          <small>Iconiță pe ecranul telefonului</small>
        </span>
      </button>
      {steps && <IosSteps onClose={() => setSteps(false)} />}
    </>
  );
}

// banner pe pagina de start (doar pe telefon), care se poate închide definitiv
export function InstallBanner() {
  const { canInstall, ios, install } = useInstall();
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem("instalare-ascunsa") === "1"; } catch { return false; }
  });
  const [steps, setSteps] = useState(false);
  if (!canInstall || hidden) return null;
  const close = () => {
    setHidden(true);
    try { localStorage.setItem("instalare-ascunsa", "1"); } catch { /* fără stocare */ }
  };
  return (
    <div className="installBanner">
      <img src="/icons/icon-192.png" alt="" />
      <div>
        <strong>Instalează Be Fit From Home</strong>
        <small>Deschide-o direct de pe ecranul telefonului, ca pe o aplicație.</small>
      </div>
      <button className="mealSaveBtn" onClick={() => (ios ? setSteps(true) : install())}>Instalează</button>
      <button className="installClose" onClick={close} aria-label="Nu acum"><X size={16} /></button>
      {steps && <IosSteps onClose={() => setSteps(false)} />}
    </div>
  );
}
