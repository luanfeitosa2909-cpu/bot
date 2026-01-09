import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Tag, Share2, Heart, Eye, Clock, ChevronRight, ChevronUp, ThumbsUp, Flame } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NewsItem {
  id: string | number; title: string; summary: string; date: string; category: string; image?: string; author?: string; content?: string; views?: number; published?: boolean; createdAt?: string; updatedAt?: string;
}

const categoryColors: Record<string, string> = {
  Regulamento: 'bg-destructive/10 text-destructive border-destructive/30',
  Parceria: 'bg-accent/10 text-accent border-accent/30',
  Resultados: 'bg-secondary/10 text-secondary border-secondary/30',
  Campeonato: 'bg-primary/10 text-primary border-primary/30',
  Noticias: 'bg-blue-100 text-blue-800 border-blue-200',
};

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [shares, setShares] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch('/api/news').then(r => r.json()).then(data => {
      if (!mounted) return;
      setAllNews(data);
      const found = data.find((n: NewsItem) => String(n.id) === String(id));
      if (found) {
        // increment view on server and get updated item
        fetch(`/api/news/${found.id}/view`, { method: 'POST' }).then(r=>r.json()).then(res => {
          const item = (res && res.item) ? res.item : found;
          setNews(item);
          setViews(item.views || 0);
          setLikes(item.likes || 0);
          setShares(item.shares || 0);
          // check session to determine if current user already liked
          fetch('/api/session').then(s=>s.json()).then(sess => {
            if (sess && sess.user && item.likedBy) setLiked(item.likedBy.includes(sess.user.username));
          }).catch(()=>{});
        }).catch(err => {
          console.error('view increment failed', err);
          // fallback to local data
          setNews(found);
          setViews(found.views || 0);
          setLikes(found.likes || 0);
          setShares(found.shares || 0);
        });
      }
      setLoading(false);
    }).catch(e => { console.error(e); setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    const h = () => {
      const d = document.documentElement.scrollHeight - window.innerHeight;
      const p = d > 0 ? (window.scrollY / d) * 100 : 0;
      setScrollProgress(p);
    };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const relatedPosts = useMemo(() => {
    if (!news) return [];
    return allNews.filter(n => String(n.id) !== String(id) && n.category === news.category).slice(0, 3);
  }, [allNews, news, id]);

  const trendingPosts = useMemo(() => {
    return allNews.filter(n => String(n.id) !== String(id)).sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  }, [allNews, id]);

  const handleLike = async () => {
    // require login
    try {
      const res = await fetch(`/api/news/${id}/like`, { method: 'POST', credentials: 'include' });
      if (res.status === 401) return alert('Você precisa estar logado para curtir.');
      const j = await res.json();
      if (j && j.item) {
        setNews(j.item);
        setLikes(j.item.likes || 0);
        const sess = await (await fetch('/api/session')).json().catch(()=>null);
        setLiked(sess && sess.user ? (j.item.likedBy || []).includes(sess.user.username) : false);
      }
    } catch (e) { console.error('like failed', e); alert('Erro ao curtir'); }
  };
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: news?.title, text: `Confira: ${news?.title}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
      // tell server about share
      fetch(`/api/news/${id}/share`, { method: 'POST' }).then(r=>r.json()).then(j=>{ if (j && j.item) setShares(j.item.shares || (shares+1)); }).catch(()=>setShares(s=>s+1));
    } catch (e) { console.error(e); }
  };

  if (loading) return (<div className="min-h-screen bg-background"><Header /><main className="container py-8"><Skeleton className="h-12 w-32 mb-6"/><Skeleton className="h-64 w-full mb-6 rounded-lg"/><Skeleton className="h-8 w-full mb-4"/><div className="space-y-3"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-3/4"/></div></main><Footer /></div>);
  if (!news) return (<div className="min-h-screen bg-background"><Header /><main className="container py-16"><div className="text-center"><div className="text-6xl mb-4">📰</div><h1 className="text-3xl font-bold mb-2">Notícia não encontrada</h1><p className="text-muted-foreground mb-6">A notícia que você procura não existe ou foi removida.</p><Button onClick={() => navigate('/news')}><ArrowLeft className="h-4 w-4 mr-2"/>Voltar para Notícias</Button></div></main><Footer /></div>);

  const readTime = Math.ceil(((news.content || news.summary)?.split(' ').length || 100) / 200);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary z-50" style={{ width: `${scrollProgress}%` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <Header />
      <main className="container py-8 relative z-10">
        <Button variant="ghost" onClick={() => navigate('/news')} className="mb-6"><ArrowLeft className="h-4 w-4 mr-2"/>Voltar para Notícias</Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card overflow-hidden">
              {/* Feature Image */}
              <div className="relative aspect-video overflow-hidden bg-muted/20">
                {news.image ? (
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Flame className="h-16 w-16 text-primary/40"/></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                <div className="absolute bottom-4 left-4"><Badge className={`border ${categoryColors[news.category] || categoryColors.Campeonato}`}><Tag className="h-3 w-3 mr-1"/>{news.category}</Badge></div>
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"><Eye className="h-4 w-4"/>{views} views</div>
              </div>

              <CardContent className="p-8">
                {/* Title */}
                <h1 className="text-4xl font-bold mb-4 leading-tight">{news.title}</h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4"/>{new Date(news.date || news.createdAt || '').toLocaleDateString('pt-BR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4"/>~{readTime} min de leitura</div>
                </div>

                {/* Summary */}
                <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 mb-8">{news.summary}</p>

                <Separator className="my-8" />

                {/* Content */}
                <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
                  {(news.content || news.summary).split('\n\n').map((para, i) => (
                    <p key={i} className="text-base">{para}</p>
                  ))}
                </div>

                <Separator className="my-8" />

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 py-4">
                  <Button variant={liked ? "default" : "outline"} size="sm" onClick={handleLike} className="gap-2">
                    <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`}/>{liked ? 'Curtido' : 'Curtir'} ({likes})
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare} className="gap-2"><Share2 className="h-4 w-4"/>Compartilhar ({shares})</Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <Card className="glass-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><ChevronRight className="h-5 w-5"/>Leia Também</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts.map(post => (
                    <RouterLink key={post.id} to={`/news/${post.id}`} className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-primary/30">
                      <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-1">{post.title}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(post.date || post.createdAt || '').toLocaleDateString('pt-BR')}</p>
                    </RouterLink>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={news.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${news.author}`} />
                    <AvatarFallback>{(news.author || 'A').substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div><h3 className="font-semibold">{news.author || 'BSR News'}</h3><p className="text-xs text-muted-foreground">Autor</p></div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Profissional de sim racing com experiência em jornalismo.</p>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground flex items-center gap-1"><Eye className="h-4 w-4"/>Visualizações</div><div className="text-2xl font-bold text-primary">{views}</div></div>
                <Separator/>
                <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground flex items-center gap-1"><Heart className="h-4 w-4"/>Curtidas</div><div className="text-2xl font-bold text-primary">{likes}</div></div>
                <Separator/>
                <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground flex items-center gap-1"><Share2 className="h-4 w-4"/>Compartilhamentos</div><div className="text-2xl font-bold text-primary">{shares}</div></div>
              </CardContent>
            </Card>

            {/* Trending */}
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500"/>Em Tendência</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {trendingPosts.map((post, idx) => (
                  <RouterLink key={post.id} to={`/news/${post.id}`} className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="text-sm font-bold text-primary w-6 flex-shrink-0">#{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{post.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{(post.views || 0)} visualizações</p>
                      </div>
                    </div>
                  </RouterLink>
                ))}
              </CardContent>
            </Card>

            {/* Back to Top */}
            <Button variant="outline" className="w-full" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ChevronUp className="h-4 w-4 mr-2"/>Voltar ao Topo
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewsDetailPage;
