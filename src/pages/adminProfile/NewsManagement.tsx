import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Newspaper, Search, Filter, SortAsc, SortDesc, Calendar, Clock, Eye, User, FileText, Zap, X } from 'lucide-react';
import { News } from './types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import EditDialog from './EditDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface NewsManagementProps {
  news: News[];
  setNews: React.Dispatch<React.SetStateAction<News[]>>;
  isLoading: boolean;
}

const NewsManagement: React.FC<NewsManagementProps> = ({ news, setNews, isLoading }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editItem, setEditItem] = useState<News | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });
  const [activeTab, setActiveTab] = useState<string>('grid');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [newsToDelete, setNewsToDelete] = useState<News | null>(null);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(news.map(n => n.category))];
    return ['all', ...uniqueCategories.filter(Boolean)];
  }, [news]);

  // Statistics
  const stats = useMemo(() => {
    const total = news.length;
    const published = news.filter(n => n.published).length;
    const draft = news.filter(n => !n.published).length;
    const totalViews = news.reduce((sum, item) => sum + (item.views || 0), 0);
    
    return { total, published, draft, totalViews };
  }, [news]);

  // Filtered and sorted news
  const filteredNews = useMemo(() => {
    let result = [...news];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.summary?.toLowerCase().includes(searchLower) ||
        item.content?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.author?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(item => 
        filterStatus === 'published' ? item.published : !item.published
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter(item => item.category === filterCategory);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc'
          ? new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
          : new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
      } else if (sortConfig.key === 'title') {
        return sortConfig.direction === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortConfig.key === 'views') {
        const aViews = a.views || 0;
        const bViews = b.views || 0;
        return sortConfig.direction === 'asc' ? aViews - bViews : bViews - aViews;
      }
      return 0;
    });

    return result;
  }, [news, searchTerm, filterStatus, filterCategory, sortConfig]);

  const handleEdit = useCallback((newsItem: News) => {
    setEditItem(newsItem);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((newsId: string) => {
    const newsItem = news.find(n => n.id === newsId);
    if (newsItem) {
      setNewsToDelete(newsItem);
      setDeleteConfirmOpen(true);
    }
  }, [news]);

  const confirmDelete = useCallback(async () => {
    if (newsToDelete) {
      try {
        const response = await fetch(`/api/news/${newsToDelete.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setNews(prev => prev.filter(item => item.id !== newsToDelete.id));
        toast({
          title: "Sucesso",
          description: `Notícia "${newsToDelete.title}" excluída com sucesso.`,
        });
        setDeleteConfirmOpen(false);
      } catch (error) {
        console.error(`Error deleting news:`, error);
        toast({
          title: "Erro",
          description: `Falha ao excluir notícia. Por favor, tente novamente.`,
          variant: "destructive",
        });
      }
    }
  }, [newsToDelete, setNews, toast]);

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    try {
      let imageUrl = data.image as string | undefined;
      
      // If image is base64, upload it first
      if (imageUrl && imageUrl.startsWith('data:')) {
        try {
          console.info('Uploading base64 image for news...');
          // Convert base64 to blob
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          
          // Create FormData for multipart upload
          const formData = new FormData();
          formData.append('file', blob, `news-${Date.now()}.jpg`);
          
          // Upload to server
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`Image upload failed: ${uploadResponse.status}`);
          }
          
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.url; // Use the returned URL
          console.info('News image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Error uploading news image:', uploadError);
          toast({
            title: "Aviso",
            description: "Falha ao fazer upload da imagem. Salvando sem imagem.",
            variant: "destructive",
          });
          imageUrl = undefined;
        }
      }
      
      const authorName = user?.displayName || user?.username || 'Admin';
      
      const savedItem = {
        ...data,
        image: imageUrl || (data.image as string), // Use uploaded URL or existing URL
        id: data.id || `news-${Date.now()}`,
        author: authorName,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as News;
      
      let response;
      if (data.id) {
        response = await fetch(`/api/news/${data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedItem),
          credentials: 'include'
        });
      } else {
        response = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedItem),
          credentials: 'include'
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      setNews(prev => data.id
        ? prev.map(item => item.id === data.id ? result.item : item)
        : [result.item, ...prev]
      );
      
      setIsDialogOpen(false);
      setEditItem(null);
      
      toast({
        title: "Sucesso",
        description: `Notícia ${data.id ? 'atualizada' : 'criada'} com sucesso.`,
      });
    } catch (error) {
      console.error(`Error saving news:`, error);
      toast({
        title: "Erro",
        description: `Falha ao salvar notícia. Por favor, tente novamente.`,
        variant: "destructive",
      });
    }
  }, [setNews, toast, user]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (published: boolean) => {
    return published 
      ? <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80">✅ Publicado</Badge>
      : <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80">📝 Rascunho</Badge>;
  };

  const renderNewsCard = (newsItem: News) => (
    <Card
      key={newsItem.id}
      className="relative group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden w-full h-full flex flex-col"
    >
      {/* Image Banner */}
      {newsItem.image && (
        <div className="relative w-full h-40 overflow-hidden bg-muted/20 group-hover:opacity-90 transition-opacity duration-300">
          <img 
            src={newsItem.image} 
            alt={newsItem.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-primary/10 border-2 border-primary/20 shadow-md transition-transform duration-300">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3 gap-2">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{newsItem.title}</CardTitle>
              {getStatusBadge(newsItem.published)}
            </div>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {newsItem.summary || newsItem.content?.substring(0, 80)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Category and Tags */}
          <div className="flex flex-wrap gap-2">
            {newsItem.category && (
              <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/10">
                {newsItem.category}
              </Badge>
            )}
            {newsItem.tags && newsItem.tags.length > 0 && (
              newsItem.tags.slice(0, 2).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))
            )}
            {newsItem.tags && newsItem.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{newsItem.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="font-semibold text-gray-900 dark:text-white">{newsItem.views || 0}</span>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold text-gray-900 dark:text-white">{new Date(newsItem.date || newsItem.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-semibold text-gray-900 dark:text-white truncate">{newsItem.author}</span>
            </div>
          </div>

          {/* Author and Date info */}
          <div className="text-xs text-muted-foreground">
            <p>Criado em: {new Date(newsItem.createdAt).toLocaleString('pt-BR')}</p>
            {newsItem.updatedAt && newsItem.updatedAt !== newsItem.createdAt && (
              <p>Atualizado em: {new Date(newsItem.updatedAt).toLocaleString('pt-BR')}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex space-x-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 border-primary text-primary hover:bg-primary/5 hover:text-primary-dark transition-all duration-200"
            onClick={() => handleEdit(newsItem)}
          >
            <Edit className="h-4 w-4 mr-2" />
            <span className="font-medium">Editar</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 h-10 hover:bg-red-600 hover:text-white transition-all duration-200"
            onClick={() => handleDelete(newsItem.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="font-medium">Excluir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('title')}>
              <div className="flex items-center space-x-1">
                <span>Título</span>
                {sortConfig.key === 'title' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </div>
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">
              Categoria
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">
              Autor
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('views')}>
              <div className="flex items-center space-x-1">
                <span>Visualizações</span>
                {sortConfig.key === 'views' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </div>
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('date')}>
              <div className="flex items-center space-x-1">
                <span>Data</span>
                {sortConfig.key === 'date' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </div>
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">
              Status
            </th>
            <th className="p-3 text-left text-sm font-semibold text-muted-foreground">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredNews.map(newsItem => (
            <tr key={newsItem.id} className="border-b border-muted/20 hover:bg-muted/50 transition-colors">
              <td className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-sm bg-primary/10 border border-primary/20">
                    <Newspaper className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium line-clamp-1">{newsItem.title}</span>
                </div>
              </td>
              <td className="p-3">
                <Badge variant="outline" className="text-xs">
                  {newsItem.category || 'Geral'}
                </Badge>
              </td>
              <td className="p-3">
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {newsItem.author}
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{newsItem.views || 0}</span>
                </div>
              </td>
              <td className="p-3">
                <div className="text-sm text-muted-foreground">
                  {new Date(newsItem.date || newsItem.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </div>
              </td>
              <td className="p-3">
                {getStatusBadge(newsItem.published)}
              </td>
              <td className="p-3">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => handleEdit(newsItem)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="text-xs">Editar</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2 hover:bg-red-600 hover:text-white transition-all"
                    onClick={() => handleDelete(newsItem.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Excluir</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center space-x-3">
            <Newspaper className="h-8 w-8 text-primary" />
            <span>Gerenciamento de Notícias</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Crie, edite e publique notícias para sua plataforma de sim racing
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => {
              setEditItem({
                id: '',
                title: '',
                content: '',
                summary: '',
                image: '',
                category: 'Geral',
                tags: [],
                published: false,
                views: 0,
                author: user?.displayName || user?.username || 'Admin',
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setIsDialogOpen(true);
            }}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Notícia</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
          <CardDescription>Total de Notícias</CardDescription>
        </Card>
        <Card className="text-center p-4">
          <CardTitle className="text-2xl font-bold text-green-600">{stats.published}</CardTitle>
          <CardDescription>Publicadas</CardDescription>
        </Card>
        <Card className="text-center p-4">
          <CardTitle className="text-2xl font-bold text-yellow-600">{stats.draft}</CardTitle>
          <CardDescription>Rascunhos</CardDescription>
        </Card>
        <Card className="text-center p-4 md:col-span-2">
          <CardTitle className="text-2xl font-bold text-blue-600">{stats.totalViews}</CardTitle>
          <CardDescription>Total de Visualizações</CardDescription>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Buscar Notícias</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por título, conteúdo, categoria ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Filtrar por Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="published">Publicadas</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Filtrar por Categoria</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'Todas' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* View Toggle and Content */}
      <Card>
        <div className="p-4 border-b border-muted/20">
          <div className="flex justify-between items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="grid">Grade</TabsTrigger>
                <TabsTrigger value="table">Tabela</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="text-sm text-muted-foreground">
              {filteredNews.length} de {news.length} notícias
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Nenhuma notícia encontrada
              </h3>
              <p className="text-muted-foreground/80">
                Tente ajustar seus filtros ou crie uma nova notícia
              </p>
            </div>
          ) : activeTab === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((newsItem, index) => (
                <div key={newsItem.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  {renderNewsCard(newsItem)}
                </div>
              ))}
            </div>
          ) : (
            renderTableView()
          )}
        </CardContent>
      </Card>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
              Tem certeza de que deseja excluir esta notícia?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">
              Notícia: <span className="text-primary font-semibold">"{newsToDelete?.title}"</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Esta ação não pode ser desfeita. Todos os dados desta notícia serão permanentemente removidos.
            </p>
          </div>
          
          <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 h-10 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                <span className="font-medium">Cancelar</span>
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="flex-1 h-10 hover:bg-red-600 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="font-medium">Confirmar Exclusão</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditDialog
        item={editItem}
        type="news"
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        isLoading={isLoading}
      />
    </div>
  );
};

export default NewsManagement;