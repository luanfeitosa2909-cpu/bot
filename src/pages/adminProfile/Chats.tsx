import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, Clock, User, Mail, Copy, Trash2, Eye, EyeOff, MoreVertical, MessageCircle, AlertCircle, CheckCircle, XCircle, Inbox, Archive, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotification } from '@/context/NotificationContext';

interface Message { from: 'user' | 'admin'; text: string; ts: string; author?: string }
interface Chat { id: string; name: string; email?: string | null; createdAt: string; messages: Message[]; status: string; assignedAdmin?: string; unread?: boolean }

const wsUrl = () => {
  if (typeof window === 'undefined') return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}`;
};

const AdminChats: React.FC = () => {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<Chat | null>(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'assigned' | 'unread'>('all');
  const [sort, setSort] = useState<'recent' | 'oldest'>('recent');
  const [userTyping, setUserTyping] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [showRawIds, setShowRawIds] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'chat' | 'message' | null>(null);
  const [deleteMessageIndex, setDeleteMessageIndex] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | null>(null);
  const notificationQueue = useRef<Set<string>>(new Set());

  const loadList = async () => {
    const res = await fetch('/api/admin/chats', { credentials: 'include' });
    if (res.ok) { const data = await res.json(); setChats(data); }
  };

  useEffect(() => { loadList(); }, []);

  // Calculate statistics
  const stats = {
    total: chats.length,
    open: chats.filter(c => c.status === 'open').length,
    closed: chats.filter(c => c.status === 'closed').length,
    assigned: chats.filter(c => c.assignedAdmin).length,
    unread: chats.filter(c => c.unread).length
  };

  // Filter and sort chats
  const filteredChats = chats
    .filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'open' && c.status !== 'open') return false;
      if (filter === 'closed' && c.status !== 'closed') return false;
      if (filter === 'assigned' && !c.assignedAdmin) return false;
      if (filter === 'unread' && !c.unread) return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sort === 'recent' ? bTime - aTime : aTime - bTime;
    });

  const openChat = async (id: string) => {
    const res = await fetch(`/api/admin/chats/${id}`, { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    setActive(data);
    setUserTyping(false);
    setAdminTyping(false);
    // mark as read
    if (data.unread) {
      try{ await fetch(`/api/admin/chats/${id}/mark-read`, { method: 'POST', credentials: 'include' }); }catch(e){}
    }
    // open ws and subscribe
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'subscribe', chatId: id, role: 'admin' })); };
    ws.onmessage = (ev) => {
      try{
        const d = JSON.parse(ev.data);
        if (d.type === 'init' && d.chat) setActive(d.chat);
        if (d.type === 'message' && d.message) {
          setActive(prev => prev ? { ...prev, messages: [...(prev.messages||[]), d.message] } : prev);
          
          // Show notification for new messages from users
          if (d.message.from === 'user') {
            const notifId = `msg-${d.message.ts}`;
            if (!notificationQueue.current.has(notifId)) {
              notificationQueue.current.add(notifId);
              addNotification({
                type: 'message',
                title: '💬 Nova Mensagem',
                message: `${active?.name || 'Usuário'}: ${d.message.text.substring(0, 60)}${d.message.text.length > 60 ? '...' : ''}`,
                chatId: active?.id,
                senderName: active?.name,
                duration: 8000
              });
            }
          }
        }
        if (d.type === 'typing') { if (d.from === 'user') setUserTyping(!!d.typing); else setAdminTyping(!!d.typing); }
        if (d.type === 'presence') setAdminCount(d.adminCount || 0);
        if (d.type === 'assigned' || d.type === 'status') { setActive(prev => prev ? { ...prev, ...(d.assignedAdmin && { assignedAdmin: d.assignedAdmin }), ...(d.status && { status: d.status }) } : prev); }
      }catch(e){}
    };
  };

  const send = async () => {
    if (!active || !text.trim()) return;
    const body = { text: text.trim(), from: 'admin' };
    setText('');
    // notify stop typing
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try{ wsRef.current.send(JSON.stringify({ type: 'typing', chatId: active.id, typing: false, role: 'admin' })); }catch(e){}
    }
    await fetch(`/api/chats/${active.id}/message`, { method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify(body) });
    await loadList();
  };

  const sendTyping = (typing: boolean) => {
    if (!active || !wsRef.current) return;
    if (wsRef.current.readyState === WebSocket.OPEN) {
      try{ wsRef.current.send(JSON.stringify({ type: 'typing', chatId: active.id, typing, role: 'admin' })); }catch(e){}
    }
  };

  const handleInputChange = (val: string) => {
    setText(val);
    sendTyping(true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => { sendTyping(false); typingTimer.current = null; }, 2000);
  };

  const assignToMe = async () => {
    if (!active) return;
    const res = await fetch(`/api/admin/chats/${active.id}/assign`, { method: 'POST', credentials: 'include' });
    if (res.ok) { const data = await res.json(); setActive(prev => prev ? { ...prev, assignedAdmin: data.assignedAdmin } : prev); await loadList(); }
  };

  const closeChat = async () => {
    if (!active) return;
    const res = await fetch(`/api/admin/chats/${active.id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ close: active.status === 'open' }) });
    if (res.ok) { const data = await res.json(); setActive(prev => prev ? { ...prev, status: data.status } : prev); await loadList(); }
  };

  const exportChat = async () => {
    if (!active) return;
    try{ window.open(`/api/admin/chats/${active.id}/export`, '_blank'); }catch(e){}
  };

  const deleteMessage = async (messageIndex: number) => {
    if (!active) return;
    try {
      const res = await fetch(`/api/admin/chats/${active.id}/messages/${messageIndex}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setActive(prev => prev ? { ...prev, messages: prev.messages?.filter((_, i) => i !== messageIndex) } : prev);
        toast({ title: 'Sucesso', description: 'Mensagem deletada com sucesso.' });
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao deletar mensagem.', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
  };

  const deleteChat = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/admin/chats/${active.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setActive(null);
        await loadList();
        toast({ title: 'Sucesso', description: 'Conversa deletada com sucesso.' });
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao deletar conversa.', variant: 'destructive' });
    }
  };

  const confirmDeleteAction = async () => {
    if (deleteTarget === 'message' && deleteMessageIndex !== null) {
      await deleteMessage(deleteMessageIndex);
    } else if (deleteTarget === 'chat') {
      await deleteChat();
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
    setDeleteMessageIndex(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center space-x-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            <span>Gerenciar Conversas</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitore, responda e gerencie conversas com usuários em tempo real
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs">Total</CardDescription>
              <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
            </div>
            <Inbox className="h-8 w-8 text-muted-foreground/40" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs">Abertas</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600">{stats.open}</CardTitle>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-500/40" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs">Fechadas</CardDescription>
              <CardTitle className="text-2xl font-bold text-green-600">{stats.closed}</CardTitle>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500/40" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs">Atribuídas</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-600">{stats.assigned}</CardTitle>
            </div>
            <User className="h-8 w-8 text-purple-500/40" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs">Não lidas</CardDescription>
              <CardTitle className="text-2xl font-bold text-red-600">{stats.unread}</CardTitle>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500/40" />
          </div>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chats List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Conversas</CardTitle>
            <CardDescription>{filteredChats.length} de {chats.length}</CardDescription>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b space-y-3 bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou email..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-9 text-sm"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value as any)} 
                  className="flex-1 px-2 py-1.5 border border-border rounded text-sm bg-background"
                >
                  <option value="all">Todas</option>
                  <option value="open">Abertas</option>
                  <option value="closed">Fechadas</option>
                  <option value="assigned">Atribuídas</option>
                  <option value="unread">Não lidas</option>
                </select>
                <select 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value as any)} 
                  className="flex-1 px-2 py-1.5 border border-border rounded text-sm bg-background"
                >
                  <option value="recent">Recentes</option>
                  <option value="oldest">Antigas</option>
                </select>
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground p-4">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma conversa encontrada</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredChats.map(c => (
                    <div
                      key={c.id}
                      onClick={() => openChat(c.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        active?.id === c.id 
                          ? 'bg-primary/15 border border-primary/30 shadow-md' 
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-sm truncate">{c.name}</div>
                            {c.unread && (
                              <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                            )}
                          </div>
                          {c.email && <div className="text-xs text-muted-foreground truncate">{c.email}</div>}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(c.createdAt).toLocaleDateString('pt-BR', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end flex-shrink-0">
                          {c.status === 'closed' && (
                            <Badge variant="outline" className="text-xs">✓</Badge>
                          )}
                          {c.assignedAdmin && (
                            <Badge className="bg-blue-500/20 text-blue-700 text-xs border-0">
                              {c.assignedAdmin.split('|')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {c.messages && c.messages.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                          {c.messages[c.messages.length - 1].text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversation Panel */}
        <Card className="lg:col-span-2 flex flex-col">
          {active ? (
            <>
              {/* Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{active.name}</CardTitle>
                    {active.email && (
                      <a 
                        href={`mailto:${active.email}`} 
                        className="text-sm text-primary hover:underline inline-block mt-1"
                      >
                        {active.email}
                      </a>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={active.status === 'open' ? 'default' : 'secondary'}>
                        {active.status === 'open' ? '🟢 Aberta' : '⚫ Fechada'}
                      </Badge>
                      {active.assignedAdmin && (
                        <Badge className="bg-blue-500/20 text-blue-700 border-0">
                          👤 {active.assignedAdmin.split('|')[0]}
                        </Badge>
                      )}
                      {adminCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          👥 {adminCount} admin(s) online
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-3">
                  Criada em {new Date(active.createdAt).toLocaleString('pt-BR')}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {!active.assignedAdmin && (
                    <Button size="sm" onClick={assignToMe} className="bg-blue-600 hover:bg-blue-700 text-xs">
                      Atribuir a mim
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={closeChat}
                    className="text-xs"
                  >
                    {active.status === 'open' ? '✓ Fechar' : '↻ Reabrir'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportChat}
                    className="text-xs gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Exportar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => { setDeleteTarget('chat'); setDeleteConfirmOpen(true); }}
                    className="text-xs gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Deletar
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20">
                {(active.messages || []).length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                    </div>
                  </div>
                ) : (
                  (active.messages || []).map((m, i) => (
                    <div 
                      key={i} 
                      className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'} group`}
                      onMouseEnter={() => setSelectedMessageId(i)}
                      onMouseLeave={() => setSelectedMessageId(null)}
                    >
                      <div 
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                          m.from === 'admin' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-muted border border-muted-foreground/20 rounded-bl-none'
                        }`}
                      >
                        <div className="text-xs font-semibold mb-1 opacity-75">
                          {m.author || (m.from === 'user' ? active.name : 'Você')}
                        </div>
                        <div className="text-sm break-words">{m.text}</div>
                        <div className={`text-xs mt-1 opacity-70`}>
                          {new Date(m.ts).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>

                        {/* Message Actions */}
                        {selectedMessageId === i && (
                          <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex gap-1 opacity-100 transition-opacity">
                            <button
                              onClick={() => copyToClipboard(m.text)}
                              className="p-1.5 rounded bg-muted hover:bg-primary/20 transition-colors"
                              title="Copiar mensagem"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            {m.from === 'admin' && (
                              <button
                                onClick={() => { 
                                  setDeleteTarget('message'); 
                                  setDeleteMessageIndex(i); 
                                  setDeleteConfirmOpen(true); 
                                }}
                                className="p-1.5 rounded bg-muted hover:bg-red-500/20 transition-colors"
                                title="Deletar mensagem"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {userTyping && (
                  <div className="flex justify-start">
                    <div className="text-xs text-muted-foreground italic">
                      ✏️ {active.name} está digitando...
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t space-y-3 bg-background">
                <div className="flex gap-2 items-end">
                  <Input
                    value={text}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={active.status === 'closed' ? 'Conversa fechada...' : 'Digite sua resposta...'}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    disabled={active.status === 'closed'}
                    className="flex-1 text-sm"
                  />
                  <Button 
                    onClick={send} 
                    disabled={!text.trim() || active.status === 'closed'}
                    className="bg-green-600 hover:bg-green-700 text-xs"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Selecione uma conversa para começar</p>
                <p className="text-sm mt-2">As conversas ativas aparecerão à esquerda</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              {deleteTarget === 'chat' 
                ? 'Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.'
                : 'Tem certeza que deseja deletar esta mensagem? Esta ação não pode ser desfeita.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAction}
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChats;
