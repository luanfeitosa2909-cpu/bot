import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Search, Calendar, Tag, TrendingUp, MessageCircle, Share2, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface NewsItem {
  id: string | number;
  title: string;
  summary: string;
  date: string;
  category: string;
  image?: string;
  content?: string;
  author?: string;
  views?: number;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        // Ordenar por data descendente (mais recentes primeiro)
        const sorted = data.sort((a: NewsItem, b: NewsItem) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setNews(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch news:', err);
        setLoading(false);
      });
  }, []);

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(news.map(n => n.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [news]);

  // Filtrar notícias
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [news, searchTerm, selectedCategory]);

  // Featured post (mais recente)
  const featuredPost = filteredNews.length > 0 ? filteredNews[0] : null;
  
  // Outros posts
  const otherPosts = filteredNews.slice(1);

  // Posts em destaque (trending)
  const trendingPosts = news
    .slice(0, 5)
    .sort((a, b) => (b.views || 0) - (a.views || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Skeleton className="aspect-video w-full rounded-lg mb-4" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-tl from-accent/5 via-transparent to-primary/5 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <Header />
      <main className="container py-8 relative z-10">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-3 animate-fade-in">
            <span className="text-primary">📰</span> Notícias Brasil Sim Racing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Acompanhe as últimas novidades, resultados e análises do mundo do sim racing
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notícias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                Tudo
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-bold text-primary">{filteredNews.length}</span> de <span className="font-bold">{news.length}</span> notícias
          </div>
        </div>

        {filteredNews.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Post */}
              {featuredPost && (
                <Card className="overflow-hidden glass-card animate-fade-in group hover:shadow-2xl transition-all duration-300" style={{ animationDelay: "0.25s" }}>
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {featuredPost.image && (
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge className="mb-2 bg-primary">⭐ Destaque</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(featuredPost.date).toLocaleDateString('pt-BR')}
                      </div>
                      <Badge variant="secondary">{featuredPost.category}</Badge>
                      {featuredPost.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {featuredPost.views} visualizações
                        </div>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {featuredPost.summary}
                    </p>
                    <Link to={`/news/${featuredPost.id}`}>
                      <Button className="group/btn">
                        Ler Mais
                        <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Other Posts Grid */}
              {otherPosts.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Últimas Notícias</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {otherPosts.map((item, index) => (
                      <div
                        key={item.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                      >
                        <NewsCard
                          id={item.id.toString()}
                          category={item.category}
                          date={new Date(item.date).toLocaleDateString('pt-BR')}
                          title={item.title}
                          description={item.summary}
                          image={item.image}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending */}
              <Card className="glass-card animate-fade-in" style={{ animationDelay: "0.35s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Em Destaque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trendingPosts.map((post, idx) => (
                    <Link
                      key={post.id}
                      to={`/news/${post.id}`}
                      className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl font-bold text-primary w-6 flex-shrink-0">#{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 text-sm">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(post.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="glass-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map(cat => {
                      const count = news.filter(n => n.category === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span>{cat}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {count}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              <Card className="glass-card border-primary/50 bg-primary/5 animate-fade-in" style={{ animationDelay: "0.45s" }}>
                <CardHeader>
                  <CardTitle className="text-lg">📧 Newsletter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Receba as melhores notícias direto no seu e-mail
                  </p>
                  <Input placeholder="seu@email.com" type="email" className="text-sm" />
                  <Button size="sm" className="w-full">
                    Inscrever
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-2xl font-bold mb-2">Nenhuma notícia encontrada</h3>
            <p className="text-muted-foreground">
              Tente ajustar seus filtros
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default News;