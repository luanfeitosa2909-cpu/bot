import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart3, Calendar, TrendingUp, Users, Trophy, Flag, Newspaper, Award, ShieldCheck, Clock, Settings, Zap, MessageCircle, GitCompare, TrendingDown, DollarSign, Monitor, Gamepad, Headset, Video, Gift } from 'lucide-react';
import { AdminStats, Race, News, User, Standing } from './types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditDialog from './EditDialog';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

interface AdminDashboardProps {
  stats: AdminStats;
  races: Race[];
  setRaces: React.Dispatch<React.SetStateAction<Race[]>>;
  news: News[];
  setNews: React.Dispatch<React.SetStateAction<News[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  standings: Standing[];
  setStandings: React.Dispatch<React.SetStateAction<Standing[]>>;
  isLoading: boolean;
  setActiveTab?: (tab: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, races, setRaces, news, setNews, users, setUsers, standings, setStandings, isLoading, setActiveTab }) => {
  const [editItem, setEditItem] = useState<Race | News | User | Standing | null>(null);
  const [dialogType, setDialogType] = useState<'races' | 'news' | 'users' | 'standings' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    try {
      if (dialogType === 'races') {
        const savedItem = {
          ...data,
          id: data.id || `race-${Date.now()}`,
          createdAt: data.createdAt || new Date().toISOString()
        } as Race;
        
        setRaces(prev => data.id
          ? prev.map(item => item.id === data.id ? savedItem : item)
          : [savedItem, ...prev]
        );
      } else if (dialogType === 'news') {
        const savedItem = {
          ...data,
          id: data.id || `news-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as News;
        
        setNews(prev => data.id
          ? prev.map(item => item.id === data.id ? savedItem : item)
          : [...prev, savedItem]
        );
      } else if (dialogType === 'users') {
        const savedItem: User = {
          id: data.id as string || `user-${Date.now()}`,
          username: data.username as string || `user${Date.now()}`,
          displayName: data.displayName as string || data.username as string,
          role: data.role as string || 'user',
          isActive: data.isActive === 'true' || data.isActive === true
        };
        
        setUsers(prev => data.id
          ? prev.map(item => item.id === data.id ? savedItem : item)
          : [...prev, savedItem]
        );
      } else if (dialogType === 'standings') {
        const savedItem = {
          ...data,
          id: data.id || `standing-${Date.now()}`
        } as Standing;
        
        setStandings(prev => data.id
          ? prev.map(item => item.id === data.id ? savedItem : item)
          : [...prev, savedItem]
        );
      }
      
      setIsDialogOpen(false);
      setEditItem(null);
      setDialogType(null);
      
      toast({
        title: "Sucesso",
        description: `Item criado com sucesso.`,
      });
    } catch (error) {
      console.error(`Error saving item:`, error);
      toast({
        title: "Erro",
        description: `Falha ao salvar item. Por favor, tente novamente.`,
        variant: "destructive",
      });
    }
  }, [dialogType, setRaces, setNews, setUsers, setStandings, toast]);

  const handleQuickActionClick = (type: 'races' | 'news' | 'users' | 'standings') => {
    setDialogType(type);
    
    // Set default values for each type
    if (type === 'races') {
      setEditItem({
        id: '',
        title: '',
        track: '',
        date: new Date().toISOString(),
        time: '20:00',
        laps: '',
        duration: '',
        pilots: 0,
        description: '',
        championship: '',
        trackTemp: 0,
        airTemp: 0,
        windSpeed: 0,
        windDirection: '',
        fuelRecommendation: 0,
        tirePressureFront: 0,
        tirePressureRear: 0,
        brakeBias: 0,
        setupNotes: '',
        participants: 0,
        maxParticipants: 20,
        prize: 0,
        category: 'formula',
        status: 'upcoming',
        createdAt: new Date().toISOString()
      });
    } else if (type === 'news') {
      setEditItem({
        id: '',
        title: '',
        content: '',
        summary: '',
        image: '',
        author: '',
        category: '',
        published: false,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (type === 'users') {
      setEditItem({
        id: '',
        username: `user${Date.now()}`,
        displayName: '',
        role: 'user',
        isActive: true
      });
    } else if (type === 'standings') {
      setEditItem({
        id: '',
        userId: '',
        userName: '',
        points: 0,
        position: 0,
        wins: 0,
        podiums: 0,
        races: 0,
        category: '',
        season: ''
      });
    }
    
    setIsDialogOpen(true);
  };

  const statItems = [
    { title: 'Total de Usuários', value: stats.totalUsers, icon: <Users className="h-8 w-8 text-blue-600" />, color: 'text-blue-600' },
    { title: 'Usuários Ativos', value: stats.activeUsers, icon: <TrendingUp className="h-8 w-8 text-green-600" />, color: 'text-green-600' },
    { title: 'Total de Corridas', value: stats.totalRaces, icon: <Flag className="h-8 w-8 text-orange-600" />, color: 'text-orange-600' },
    { title: 'Corridas Completas', value: stats.completedRaces, icon: <Trophy className="h-8 w-8 text-purple-600" />, color: 'text-purple-600' },
    { title: 'Notícias Publicadas', value: stats.publishedNews, icon: <Newspaper className="h-8 w-8 text-cyan-600" />, color: 'text-cyan-600' },
    { title: 'Total de Conquistas', value: stats.totalAchievements, icon: <Award className="h-8 w-8 text-yellow-600" />, color: 'text-yellow-600' },
  ];

  const quickActions = [
    {
      title: 'Criar Nova Corrida',
      description: 'Organize um novo evento para a comunidade',
      icon: <Flag className="h-6 w-6 text-primary" />,
      color: 'bg-primary/10',
      type: 'races' as const
    },
    {
      title: 'Publicar Notícia',
      description: 'Compartilhe novidades com a comunidade',
      icon: <Newspaper className="h-6 w-6 text-secondary" />,
      color: 'bg-secondary/10',
      type: 'news' as const
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Administre contas e permissões',
      icon: <Users className="h-6 w-6 text-green-600" />,
      color: 'bg-green-500/10',
      type: 'users' as const
    },
    {
      title: 'Configurar Campeonatos',
      description: 'Crie e gerencie classificações',
      icon: <Trophy className="h-6 w-6 text-yellow-600" />,
      color: 'bg-yellow-500/10',
      type: 'standings' as const
    }
  ];

  const systemStatus = [
    {
      name: 'Servidor Principal',
      status: 'online',
      icon: <Monitor className="h-5 w-5 text-green-500" />
    },
    {
      name: 'Banco de Dados',
      status: 'online',
      icon: <Settings className="h-5 w-5 text-green-500" />
    },
    {
      name: 'Serviço UDP',
      status: 'online',
      icon: <Zap className="h-5 w-5 text-green-500" />
    },
    {
      name: 'WebSocket',
      status: 'online',
      icon: <GitCompare className="h-5 w-5 text-green-500" />
    }
  ];

  const recentActivity = [
    ...(races.slice(0, 2).map(race => ({
      type: 'race' as const,
      action: `${race.status === 'completed' ? 'Corrida concluída' : race.status === 'ongoing' ? 'Corrida em andamento' : 'Próxima corrida'}`,
      race: race.title,
      time: new Date(race.date).toLocaleDateString('pt-BR'),
      icon: <Flag className="h-4 w-4 text-orange-500" />
    }))),
    ...(news.slice(0, 2).map(item => ({
      type: 'news' as const,
      action: item.published ? 'Artigo publicado' : 'Artigo em rascunho',
      newsTitle: item.title,
      time: new Date(item.createdAt).toLocaleDateString('pt-BR'),
      icon: <Newspaper className="h-4 w-4 text-cyan-500" />
    }))),
    ...(users.slice(0, 2).map(user => ({
      type: 'user' as const,
      action: user.isActive ? 'Usuário ativo' : 'Usuário inativo',
      userName: user.displayName || user.username,
      time: new Date().toLocaleDateString('pt-BR'),
      icon: <Users className="h-4 w-4 text-blue-500" />
    })))
  ].slice(0, 4);

  const performanceMetrics = [
    { name: 'Crescimento de Usuários (7 dias)', value: '+12.5%', trend: 'up' },
    { name: 'Taxa de Conclusão de Corridas', value: '94.2%', trend: 'up' },
    { name: 'Engajamento de Notícias', value: '8.3K visualizações', trend: 'up' },
    { name: 'Atividade de Usuários', value: '72% ativos', trend: 'down' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-muted-foreground">Visão geral e gerenciamento da Brasil Sim Racing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Ações Rápidas
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statItems.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className={`hover:shadow-lg transition-shadow cursor-pointer ${action.color}`}>
            <CardContent className="p-6" onClick={() => {
              if (action.type === 'standings' && setActiveTab) {
                // Navigate to standings section instead of opening dialog
                setActiveTab('standings');
              } else {
                handleQuickActionClick(action.type);
              }
            }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                {action.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Status do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.map((system, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {system.icon}
                    <span className="font-medium">{system.name}</span>
                  </div>
                  <Badge variant={system.status === 'online' ? 'default' : 'destructive'}>
                    {system.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Métricas de Desempenho</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <Badge variant="secondary">{metric.value}</Badge>
                  </div>
                  <Progress value={Math.min(100, parseFloat(metric.value) || 0)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activity">Atividade Recente</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Atividade Recente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{activity.action}</span>
                            {activity.type === 'user' && 'userName' in activity && <span className="text-muted-foreground ml-2">@{activity.userName}</span>}
                            {activity.type === 'race' && 'race' in activity && <span className="text-muted-foreground ml-2">- {activity.race}</span>}
                            {activity.type === 'news' && 'newsTitle' in activity && <span className="text-muted-foreground ml-2">- {activity.newsTitle}</span>}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Informações do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Recursos do Servidor</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Uso de CPU</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                      <div className="flex justify-between mt-2">
                        <span>Uso de Memória</span>
                        <span>65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                      <div className="flex justify-between mt-2">
                        <span>Armazenamento</span>
                        <span>32% usado</span>
                      </div>
                      <Progress value={32} className="h-2" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Configurações</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Versão do Sistema</span>
                        <span>2.1.4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última Atualização</span>
                        <span>03/01/2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge variant="default">Operacional</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Atividades Recentes do Sistema</span>
              </CardTitle>
              <CardDescription>Últimas ações e eventos na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Nenhuma atividade recente</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-muted/50">
                      <div className="flex-shrink-0 mt-1">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{activity.action}</span>
                          {activity.type === 'race' && 'race' in activity && activity.race && (
                            <span className="text-muted-foreground truncate">- {activity.race}</span>
                          )}
                          {activity.type === 'news' && 'newsTitle' in activity && activity.newsTitle && (
                            <span className="text-muted-foreground truncate">- {activity.newsTitle}</span>
                          )}
                          {activity.type === 'user' && 'userName' in activity && activity.userName && (
                            <span className="text-muted-foreground">@{activity.userName}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          📅 {activity.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Statistics */}
              <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{news.filter(n => n.published).length}</div>
                  <div className="text-xs text-muted-foreground">Notícias Publicadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{races.filter(r => r.status === 'completed').length}</div>
                  <div className="text-xs text-muted-foreground">Corridas Concluídas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div>
                  <div className="text-xs text-muted-foreground">Usuários Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{standings.length}</div>
                  <div className="text-xs text-muted-foreground">Campeonatos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Análise de Usuários</span>
                </CardTitle>
                <CardDescription>Distribuição e estatísticas dos usuários da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Distribuição de Usuários</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Pilotos Ativos</span>
                        <span className="font-bold">{stats.activeUsers}</span>
                      </div>
                      <Progress value={stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0} className="h-2" />
                      
                      <div className="flex justify-between items-center pt-2">
                        <span>Pilotos Inativos</span>
                        <span className="font-bold">{stats.totalUsers - stats.activeUsers}</span>
                      </div>
                      <Progress value={stats.totalUsers > 0 ? ((stats.totalUsers - stats.activeUsers) / stats.totalUsers) * 100 : 0} className="h-2" />
                      
                      <div className="pt-3 border-t text-muted-foreground">
                        <p className="text-xs">Total: <span className="font-bold">{stats.totalUsers}</span> usuários</p>
                        <p className="text-xs mt-1">Taxa de atividade: <span className="font-bold">{stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flag className="h-5 w-5" />
                  <span>Análise de Corridas</span>
                </CardTitle>
                <CardDescription>Status e desempenho dos eventos de corrida</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Status das Corridas</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Corridas Completas</span>
                        <span className="font-bold text-green-600">{stats.completedRaces}</span>
                      </div>
                      <Progress value={stats.totalRaces > 0 ? (stats.completedRaces / stats.totalRaces) * 100 : 0} className="h-2" />
                      
                      <div className="flex justify-between items-center pt-2">
                        <span>Corridas Pendentes</span>
                        <span className="font-bold text-blue-600">{stats.totalRaces - stats.completedRaces}</span>
                      </div>
                      <Progress value={stats.totalRaces > 0 ? ((stats.totalRaces - stats.completedRaces) / stats.totalRaces) * 100 : 0} className="h-2" />
                      
                      <div className="pt-3 border-t text-muted-foreground">
                        <p className="text-xs">Total: <span className="font-bold">{stats.totalRaces}</span> corridas</p>
                        <p className="text-xs mt-1">Taxa de conclusão: <span className="font-bold">{stats.totalRaces > 0 ? Math.round((stats.completedRaces / stats.totalRaces) * 100) : 0}%</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Newspaper className="h-5 w-5" />
                  <span>Análise de Conteúdo</span>
                </CardTitle>
                <CardDescription>Estatísticas de notícias e publicações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-muted-foreground mb-1">Total de Notícias</p>
                    <p className="text-3xl font-bold text-blue-600">{news.length}</p>
                    <p className="text-xs text-muted-foreground mt-2">Publicadas: {stats.publishedNews} | Rascunhos: {news.length - stats.publishedNews}</p>
                  </div>
                  
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <p className="text-sm text-muted-foreground mb-1">Visualizações Totais</p>
                    <p className="text-3xl font-bold text-cyan-600">{news.reduce((sum, item) => sum + (item.views || 0), 0)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Média por artigo: {news.length > 0 ? Math.round(news.reduce((sum, item) => sum + (item.views || 0), 0) / news.length) : 0}</p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-muted-foreground mb-1">Conquistas</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalAchievements}</p>
                    <p className="text-xs text-muted-foreground mt-2">Prêmios e badges disponíveis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Welcome Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Bem-vindo ao Painel de Administração! Use a barra lateral para navegar entre as diferentes seções de gerenciamento.
        </AlertDescription>
      </Alert>
      
      {/* Edit Dialog for Quick Actions */}
      {dialogType && editItem && (
        <EditDialog
          item={editItem}
          type={dialogType}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditItem(null);
            setDialogType(null);
          }}
          onSave={handleSave}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default AdminDashboard;