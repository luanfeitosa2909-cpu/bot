import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import ChatWidget from '@/components/ChatWidget';
import { useAuth } from '@/context/AuthContext';

const ChatStarter: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [initialName, setInitialName] = useState<string | undefined>(undefined);

  // Expose a global helper so any page can open the chat with a name
  useEffect(() => {
    (window as any).openChat = (name?: string) => {
      if (name) setInitialName(name);
      setOpen(true);
    };

    const handler = (ev: Event) => {
      try {
        // @ts-ignore
        const detail = (ev as CustomEvent)?.detail;
        if (detail && detail.name) setInitialName(detail.name);
        setOpen(true);
      } catch (e) {}
    };
    window.addEventListener('open-chat', handler as EventListener);
    return () => {
      try { delete (window as any).openChat; } catch (e) {}
      window.removeEventListener('open-chat', handler as EventListener);
    };
  }, []);

  const displayName = initialName || (user ? (user.displayName || user.username) : undefined) || 'Anônimo';

  return (
    <>
      {/* Floating bubble (global) */}
      <button
        aria-label="Abrir chat de suporte"
        onClick={() => setOpen(v => !v)}
        className="fixed z-50 right-4 bottom-4 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <span className="sr-only">Abrir chat</span>
        <span className="text-xl">💬</span>
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full ring-2 ring-white" />
      </button>

      {/* Inline starter (for pages that want a local button) */}
      <div className="inline-block">
        <Button onClick={() => { (window as any).openChat(); }} variant="outline">💬 Iniciar Chat</Button>
      </div>

      <ChatWidget open={open} onClose={() => setOpen(false)} initialName={displayName} />
    </>
  );
};

export default ChatStarter;
