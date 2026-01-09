import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RaceCard from "@/components/RaceCard";
import { Search, Filter, Calendar, Users, MapPin, Trophy, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface RaceItem {
  id: number;
  title: string;
  track: string;
  date: string;
  time: string;
  image: string;
  pilots: number;
  participants: { username: string; registeredAt: string }[];
  championship?: string;
  status?: string;
  laps?: string;
  duration?: string;
  category?: string;
  maxParticipants?: number;
}

const Races = () => {
  const [races, setRaces] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedChampionship, setSelectedChampionship] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/races')
      .then(res => res.json())
      .then(data => {
        setRaces(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch races:', err);
        setLoading(false);
      });
  }, []);

  // Extrair categorias e championships únicos dos dados
  const categories = useMemo(() => {
    const cats = new Set(races.map(r => r.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [races]);

  const championships = useMemo(() => {
    const champs = new Set(races.map(r => r.championship).filter(Boolean));
    return Array.from(champs).sort();
  }, [races]);

  // Filtrar corridas
  const filteredRaces = useMemo(() => {
    return races.filter(race => {
      const matchesSearch = 
        race.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        race.track.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || race.category === selectedCategory;
      const matchesChampionship = selectedChampionship === "all" || race.championship === selectedChampionship;
      
      let matchesStatus = true;
      if (selectedStatus !== "all") {
        const raceDate = new Date(race.date).getTime();
        const now = new Date().getTime();
        
        if (selectedStatus === "upcoming" && raceDate <= now) matchesStatus = false;
        if (selectedStatus === "completed" && raceDate > now) matchesStatus = false;
      }
      
      return matchesSearch && matchesCategory && matchesChampionship && matchesStatus;
    });
  }, [races, searchTerm, selectedCategory, selectedChampionship, selectedStatus]);

  // Agrupar por championship
  const racesByChampionship = useMemo(() => {
    const grouped: { [key: string]: RaceItem[] } = {};
    filteredRaces.forEach(race => {
      const key = race.championship || "Sem Campeonato";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(race);
    });
    return grouped;
  }, [filteredRaces]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass-card overflow-hidden rounded-xl">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
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
            <span className="text-primary">🏁</span> Corridas Brasil Sim Racing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Explore todas as corridas disponíveis, filtre por categoria e inscreva-se nas suas favoritas
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <Card className="glass-card">
              <CardContent className="p-4">
                <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{races.length}</div>
                <div className="text-xs text-muted-foreground">Corridas</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <Users className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">
                  {races.reduce((sum, r) => sum + r.pilots, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Inscritos</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <MapPin className="h-5 w-5 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{new Set(races.map(r => r.track)).size}</div>
                <div className="text-xs text-muted-foreground">Pistas</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <Calendar className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{championships.length}</div>
                <div className="text-xs text-muted-foreground">Campeonatos</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros Section */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros & Busca
            </h2>
            {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all" || selectedChampionship !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedChampionship("all");
                }}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por corrida ou pista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Championship Filter */}
            <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
              <SelectTrigger>
                <SelectValue placeholder="Campeonato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Campeonatos</SelectItem>
                {championships.map(champ => (
                  <SelectItem key={champ} value={champ}>{champ}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="upcoming">⏱ Próximas</SelectItem>
                <SelectItem value="completed">✓ Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Info */}
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-bold text-primary">{filteredRaces.length}</span> de <span className="font-bold">{races.length}</span> corridas
          </div>
        </div>

        {/* Resultados */}
        {filteredRaces.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(racesByChampionship).map(([champ, chompRaces], idx) => (
              <div key={champ} className="animate-fade-in" style={{ animationDelay: `${0.3 + idx * 0.1}s` }}>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-8 bg-primary rounded-full"></div>
                    <h2 className="text-2xl font-bold">{champ}</h2>
                    <Badge variant="secondary">{chompRaces.length} corridas</Badge>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {chompRaces.map((race, index) => (
                    <div
                      key={race.id}
                      className="animate-fade-in"
                      style={{
                        animationDelay: `${0.4 + index * 0.05}s`,
                      }}
                    >
                      <RaceCard
                        id={race.id.toString()}
                        image={race.image}
                        title={race.title}
                        track={race.track}
                        date={new Date(race.date).toLocaleDateString('pt-BR')}
                        time={race.time}
                        laps={race.laps || "N/A"}
                        duration={race.duration || "N/A"}
                        pilots={race.pilots}
                        championship={race.championship}
                        status="upcoming"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏁</div>
            <h3 className="text-2xl font-bold mb-2">Nenhuma corrida encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar seus filtros
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSelectedChampionship("all");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Races;