import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, MapPin, Users, Share, Thermometer, Wind, Trophy as TrophyIcon, Clock, Maximize, Minimize,
  LayoutGrid, LayoutList, Download, Eye, AlertTriangle, Zap, Server, TrendingUp, Search as SearchIcon
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface EnrichedParticipant {
  username: string;
  displayName: string;
  avatar: string | null;
  stats: { wins: number; podiums: number; points: number };
  team: string;
  achievements: any[];
  registeredAt: string;
}

interface Race {
  id: number;
  title: string;
  track: string;
  date: string;
  time: string;
  description?: string;
  image?: string;
  laps?: string;
  duration?: string;
  pilots?: number;
  participants: EnrichedParticipant[];
  championship?: string;
  trackTemp?: string;
  airTemp?: string;
  windSpeed?: string;
  windDirection?: string;
  fuelRecommendation?: string;
  status?: string;
  serverIp?: string;
  serverPort?: string;
  maxParticipants?: string | number;
  category?: string;
  prize?: string;
  requirement?: string;
  createdAt?: string;
  udpListenAddress?: string;
  udpSendAddress?: string;
  udpEnabled?: boolean;
  udpRefreshInterval?: number;
}

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return '-';
  try { const d = new Date(dateStr + (timeStr ? `T${timeStr}` : '')); return d.toLocaleString('pt-BR'); } catch (e) { return dateStr; }
};

const useCountdown = (isoDate?: string) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(()=>setNow(Date.now()), 1000); return ()=>clearInterval(t); }, []);
  return useMemo(() => {
    if (!isoDate) return null;
    const target = new Date(isoDate).getTime();
    const diff = target - now; if (diff <= 0) return { finished: true, text: 'Iniciada' };
    const days = Math.floor(diff/(1000*60*60*24));
    const hours = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
    const mins = Math.floor((diff%(1000*60*60))/(1000*60));
    const secs = Math.floor((diff%(1000*60))/1000);
    return { finished:false, text: `${days}d ${hours}h ${mins}m ${secs}s` };
  }, [isoDate, now]);
};

const RaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race|null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'position'|'name'|'points'>('position');
  const [selectedParticipant, setSelectedParticipant] = useState<EnrichedParticipant|null>(null);
  const [udpRunning, setUdpRunning] = useState(false);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  useEffect(() => {
    if (!id) return; setLoading(true);
    fetch(`/api/races/${id}/enriched`).then(r=>r.json()).then(d=>setRace(d)).catch(e=>console.error(e)).finally(()=>setLoading(false));
  }, [id]);

  useEffect(()=>{ if (!race) return; fetch('/api/session').then(r=>r.json()).then(s=>{ if (s.user) setIsRegistered(race.participants.some(p=>p.username===s.user.username)); }).catch(()=>{}); }, [race]);

  const participantsFiltered = useMemo(()=>{
    if (!race) return [] as EnrichedParticipant[];
    let p = [...race.participants];
    if (search) { const q = search.toLowerCase(); p = p.filter(x=>x.displayName.toLowerCase().includes(q)||x.username.toLowerCase().includes(q)|| (x.team||'').toLowerCase().includes(q)); }
    if (sortKey==='name') p.sort((a,b)=>a.displayName.localeCompare(b.displayName));
    if (sortKey==='points') p.sort((a,b)=> (b.stats.points||0)-(a.stats.points||0));
    return p;
  }, [race, search, sortKey]);

  const raceStartISO = race ? (race.date ? (race.time ? `${race.date}T${race.time}` : race.date) : undefined) : undefined;
  const countdown = useCountdown(raceStartISO);

  const handleRegister = async ()=>{
    if (!race) return; setRegistering(true);
    try { const res = await fetch(`/api/races/${race.id}/register`, { method:'POST', credentials:'include' }); const j = await res.json(); if (j.ok) { const updated = await fetch(`/api/races/${race.id}/enriched`).then(r=>r.json()); setRace(updated); setIsRegistered(true); } else { alert(j.message||'Erro'); } } catch(e){console.error(e); alert('Erro');}
    setRegistering(false);
  };

  const exportParticipantsCSV = ()=>{
    if (!race) return; const rows=[['Pos','Username','DisplayName','Team','Wins','Podiums','Points','RegisteredAt']]; race.participants.forEach((p,i)=>rows.push([String(i+1), p.username, p.displayName, p.team||'', String(p.stats.wins||0), String(p.stats.podiums||0), String(p.stats.points||0), p.registeredAt]));
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`race-${race.id}-participants.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const handleShare = async ()=>{
    try { if (navigator.share) await navigator.share({ title: race?.title||'Corrida', text:'Confira esta corrida', url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); alert('Link copiado'); } } catch(e){console.error(e);}  
  };

  const toggleUdp = async ()=>{
    if (!race) return; try { const resp = await fetch('/api/test/configure-udp-for-race', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ raceId: race.id }) }); const j = await resp.json(); if (j.ok) { setUdpRunning(true); alert('UDP iniciado: '+(j.udpPort||'ok')); } else alert('Falha ao iniciar UDP'); } catch(e){console.error(e); alert('Erro'); }
  };

  const small = (n?: string|number) => n===undefined||n===null?'-':String(n);

  if (loading) return (<div className="min-h-screen bg-background"><Header/><div className="container py-8"><Skeleton className="h-12 w-full mb-4"/><Skeleton className="h-64 w-full"/></div><Footer/></div>);
  if (!race) return (<div className="min-h-screen bg-background"><Header/><div className="container py-8 text-center"><h2 className="text-2xl font-bold">Corrida não encontrada</h2><Button onClick={()=>navigate('/races')} className="mt-4"><ArrowLeft className="h-4 w-4 mr-2"/>Voltar</Button></div><Footer/></div>);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative">
        <div className="h-64 lg:h-96 w-full bg-gradient-to-r from-black/40 via-transparent to-black/30 relative overflow-hidden">
          {race.image ? <img src={race.image} alt={race.title} className="absolute inset-0 w-full h-full object-cover opacity-90" /> : <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700"/>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="container relative z-10 py-8 lg:py-16 flex items-end">
            <div className="w-full text-white">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight">{race.title}</h1>
                  <div className="flex items-center gap-3 mt-3 text-sm opacity-90">
                    <MapPin className="h-4 w-4"/> <span>{race.track}</span>
                    <Calendar className="h-4 w-4"/> <span>{formatDateTime(race.date, race.time)}</span>
                    <Badge className={`ml-2 ${race.status==='live'?'bg-red-600':race.status==='completed'?'bg-green-600':'bg-primary'}`}>{race.status==='live'?'AO VIVO':race.status==='completed'?'FINALIZADA':'PRÓXIMA'}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleShare}><Share className="h-4 w-4 mr-2"/>Compartilhar</Button>
                  <Button variant="secondary" onClick={exportParticipantsCSV}><Download className="h-4 w-4 mr-2"/>Exportar CSV</Button>
                  <Button onClick={()=>window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Ver Detalhes</Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-3xl">{race.description}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="p-3 bg-black/30 rounded text-xs"><div className="text-2xs text-muted-foreground">Contagem</div><div className="font-semibold">{countdown?countdown.text:'-'}</div></div>
                <div className="p-3 bg-black/30 rounded text-xs"><div className="text-2xs text-muted-foreground">Pilotos</div><div className="font-semibold">{race.participants.length}/{small(race.maxParticipants)}</div></div>
                <div className="ml-auto flex items-center gap-2"><Button size="lg" onClick={handleRegister} disabled={isRegistered||registering}>{isRegistered?'✓ Inscrito':registering?'Inscrevendo...':'🏁 Inscrever-se'}</Button></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2"><Users className="h-5 w-5"/> Pilotos</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted/20 rounded px-2 py-1"><SearchIcon className="h-4 w-4 mr-2"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar piloto" className="bg-transparent outline-none text-sm w-48"/></div>
                    <div className="flex items-center gap-1"><button onClick={()=>setSortKey(sortKey==='name'?'points':'name')} className="text-sm px-2 py-1 rounded bg-muted/20">Ordenar: {sortKey}</button>
                    <div className="ml-2 flex items-center gap-1"><button onClick={()=>setViewMode('grid')} className={`p-2 ${viewMode==='grid'?'bg-primary text-primary-foreground rounded':''}`}><LayoutGrid className="h-4 w-4"/></button><button onClick={()=>setViewMode('list')} className={`p-2 ${viewMode==='list'?'bg-primary text-primary-foreground rounded':''}`}><LayoutList className="h-4 w-4"/></button></div></div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participantsFiltered.length===0 ? <div className="p-6 text-center text-sm text-muted-foreground">Nenhum piloto corresponde à pesquisa</div> : (
                  viewMode==='grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{participantsFiltered.map((p, idx)=> (
                      <div key={p.username} className="p-4 rounded-lg border hover:shadow-lg transition bg-card">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12"><AvatarImage src={p.avatar||undefined} /><AvatarFallback>{p.displayName.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between"><div><div className="font-semibold">{p.displayName}</div><div className="text-xs text-muted-foreground">{p.team}</div></div><div className="text-right"><div className="text-sm font-bold">{p.stats.points}</div><div className="text-xs text-muted-foreground">pts</div></div></div>
                            <div className="mt-3 flex items-center gap-2"><Button size="sm" onClick={()=>setSelectedParticipant(p)}>Detalhes</Button><Button variant="outline" size="sm" onClick={()=>{navigator.clipboard.writeText(p.username); alert('Username copiado');}}>Copiar</Button></div>
                          </div>
                        </div>
                      </div>
                    ))}</div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Pos</th><th className="p-3 text-left">Piloto</th><th className="p-3 text-center">Pts</th><th className="p-3 text-left">Equipe</th><th className="p-3 text-left">Inscrição</th></tr></thead><tbody>{participantsFiltered.map((p, idx)=>(<tr key={p.username} className="border-b hover:bg-muted/20 transition-colors"><td className="p-3 font-bold">{idx+1}</td><td className="p-3 flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarImage src={p.avatar||undefined} /><AvatarFallback>{p.displayName.substring(0,1)}</AvatarFallback></Avatar><span>{p.displayName}</span></td><td className="p-3 text-center font-semibold">{p.stats.points}</td><td className="p-3">{p.team}</td><td className="p-3 text-xs text-muted-foreground">{new Date(p.registeredAt).toLocaleDateString('pt-BR')}</td></tr>))}</tbody></table></div>
                  )
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center justify-between">Sistema de Corrida <span className="text-sm text-muted-foreground">Controles & Telemetria</span></CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><div className="text-xs text-muted-foreground">Servidor</div><div className="font-semibold">{race.serverIp||'Não configurado'}:{race.serverPort||'-'}</div></div><div className="space-y-2"><div className="text-xs text-muted-foreground">UDP</div><div className="font-semibold">{race.udpEnabled? 'Ativado':'Desativado'}</div></div></div>
                <div className="mt-4 flex items-center gap-2"><Button onClick={toggleUdp}><Server className="h-4 w-4 mr-2"/>Iniciar UDP</Button><Button variant="outline" onClick={()=>setTelemetryEnabled(!telemetryEnabled)}>{telemetryEnabled?'Desativar Telemetria':'Ativar Telemetria'}</Button><Button variant="ghost" onClick={()=>alert('Assistir transmissão (futura)')}><Eye className="h-4 w-4 mr-2"/>Assistir</Button></div>
                <Separator className="my-4"/>
                <div className="text-sm text-muted-foreground">Recomendações de combustível</div><div className="font-semibold">{small(race.fuelRecommendation)}%</div>
                <div className="text-xs text-muted-foreground mt-2">Notas</div><div className="text-sm">{race.requirement||'Nenhuma observação'}</div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="sticky top-20"><CardHeader><CardTitle>Resumo</CardTitle></CardHeader><CardContent>
              <div className="space-y-2"><div className="text-xs text-muted-foreground">Data</div><div className="font-semibold">{formatDateTime(race.date, race.time)}</div>
              <div className="text-xs text-muted-foreground mt-3">Voltas / Duração</div><div className="font-semibold">{small(race.laps)} / {small(race.duration)}</div>
              <div className="text-xs text-muted-foreground mt-3">Categoria</div><div className="font-semibold">{race.category||'-'}</div>
              <div className="text-xs text-muted-foreground mt-3">Prêmio</div><div className="font-semibold">{race.prize||'-'}</div>
              </div>
              <Separator className="my-3"/>
              <div className="flex flex-col gap-2"><Button onClick={exportParticipantsCSV}>Exportar Lista</Button><Button variant="outline" onClick={()=>navigator.clipboard.writeText(window.location.href)}>Copiar Link</Button></div>
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Clima</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex items-center justify-between"><div className="text-xs text-muted-foreground">Pista</div><div className="font-semibold">{small(race.trackTemp)}°C</div></div><div className="flex items-center justify-between"><div className="text-xs text-muted-foreground">Ar</div><div className="font-semibold">{small(race.airTemp)}°C</div></div><div className="flex items-center justify-between"><div className="text-xs text-muted-foreground">Vento</div><div className="font-semibold">{small(race.windSpeed)} km/h</div></div></div></CardContent></Card>

            {race.requirement && (<Card className="border-yellow-400/30 bg-yellow-50/5"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500"/>Requisitos</CardTitle></CardHeader><CardContent><div className="text-sm text-muted-foreground">{race.requirement}</div></CardContent></Card>)}
          </aside>
        </div>
      </main>
      <Footer />

      <Dialog open={!!selectedParticipant} onOpenChange={(open)=>{ if(!open) setSelectedParticipant(null); }}>
        <DialogContent>
          {selectedParticipant && (<div className="space-y-4"><div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarImage src={selectedParticipant.avatar||undefined} /><AvatarFallback>{selectedParticipant.displayName.substring(0,2).toUpperCase()}</AvatarFallback></Avatar><div><h3 className="text-lg font-bold">{selectedParticipant.displayName}</h3><div className="text-sm text-muted-foreground">{selectedParticipant.username}</div></div><div className="ml-auto text-right"><div className="font-semibold text-lg">{selectedParticipant.stats.points} pts</div><div className="text-xs text-muted-foreground">{selectedParticipant.stats.wins} vitórias • {selectedParticipant.stats.podiums} pódios</div></div></div><div><h4 className="font-semibold">Conquistas</h4><div className="flex gap-2 mt-2">{selectedParticipant.achievements && selectedParticipant.achievements.length>0 ? selectedParticipant.achievements.map((a,i)=><div key={i} className="p-2 bg-muted/10 rounded text-sm">{a.name||'Conquista'}</div>) : <div className="text-sm text-muted-foreground">Nenhuma conquista</div>}</div></div><div className="flex items-center gap-2"><Button onClick={()=>{ navigator.clipboard.writeText(selectedParticipant.username); alert('Username copiado'); }}>Copiar Username</Button><Button variant="outline" onClick={()=>setSelectedParticipant(null)}>Fechar</Button></div></div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RaceDetail;
