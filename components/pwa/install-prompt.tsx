"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const DISMISSED_KEY = "orbita:pwa-install-dismissed:v1";
const INSTALLED_KEY = "orbita:pwa-installed:v1";
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    let coolingDown = false;
    let alreadyInstalled = false;

    try {
      const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || 0);
      coolingDown = dismissedAt > 0 && Date.now() - dismissedAt < COOLDOWN_MS;
      alreadyInstalled = window.localStorage.getItem(INSTALLED_KEY) === "true";
    } catch {
      // O aviso continua funcionando mesmo sem acesso ao armazenamento.
    }

    const frame = window.requestAnimationFrame(() => {
      if (isStandalone || alreadyInstalled) setInstalled(true);
      if (coolingDown) setDismissed(true);

      const agent = navigator.userAgent;
      const isIos =
        /iPad|iPhone|iPod/.test(agent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isSafari =
        /Safari/.test(agent) &&
        !/CriOS|FxiOS|EdgiOS|OPiOS/.test(agent);

      if (!isStandalone && !alreadyInstalled && !coolingDown && isIos && isSafari) {
        setShowIosHint(true);
      }
    });

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setShowIosHint(false);
      setInstallEvent(event as InstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallEvent(null);
      setShowIosHint(false);

      try {
        window.localStorage.setItem(INSTALLED_KEY, "true");
      } catch {
        // A instalação já foi concluída pelo navegador.
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  function dismissPrompt() {
    setDismissed(true);

    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // A preferência permanece válida durante esta sessão.
    }
  }

  async function installApp() {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);

    if (choice.outcome === "accepted") {
      setInstalled(true);
      try {
        window.localStorage.setItem(INSTALLED_KEY, "true");
      } catch {
        // O navegador confirmou a escolha.
      }
    } else {
      dismissPrompt();
    }
  }

  if (installed || dismissed || (!installEvent && !showIosHint)) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Instalar aplicativo Órbita"
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-brand/30 bg-surface/95 p-4 shadow-[var(--shadow-2)] backdrop-blur-md lg:inset-x-auto lg:right-5 lg:bottom-5"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
        {showIosHint ? (
          <Share2 className="size-5" aria-hidden="true" />
        ) : (
          <Download className="size-5" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {showIosHint ? "Leve o Órbita com você" : "Instale o Órbita"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {showIosHint
            ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início."
            : "Acesse seus projetos e tarefas como um aplicativo."}
        </p>
      </div>

      {installEvent && (
        <button
          type="button"
          onClick={() => void installApp()}
          className="min-h-11 shrink-0 rounded-xl bg-brand px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Instalar
        </button>
      )}

      <button
        type="button"
        onClick={dismissPrompt}
        aria-label="Fechar aviso de instalação"
        className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-ink"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </aside>
  );
}
