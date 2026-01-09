import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let mounted = true;
    async function loadFaqs() {
      // Try multiple static filenames (some environments use faq.json or faqs.json)
      const staticFiles = ['/data/faqs.json', '/data/faq.json'];
      for (const path of staticFiles) {
        try {
          const staticResp = await fetch(path);
          if (!staticResp.ok) continue;
          const ct = staticResp.headers.get('content-type') || '';
          if (!ct.includes('application/json')) continue;
          const data = await staticResp.json();
          if (mounted) setFaqs(Array.isArray(data) ? data : []);
          return;
        } catch (e) {
          // ignore and try next
        }
      }

      try {
        const apiResp = await fetch('/api/faqs');
        if (apiResp.ok) {
          const ct = apiResp.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await apiResp.json();
            if (mounted) setFaqs(Array.isArray(data) ? data : []);
            return;
          }
        }
      } catch (e) {
        // ignore
      }

      if (mounted) setFaqs([]);
    }

    loadFaqs().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const setc = new Set(faqs.map(f => f.category).filter(Boolean));
    return ["all", ...Array.from(setc)];
  }, [faqs]);

  const countsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    faqs.forEach(f => {
      const c = f.category || 'Geral';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [faqs]);

  const filtered = useMemo(() => {
    return faqs.filter(f => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [faqs, query, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-8 w-full mb-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Perguntas Frequentes</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Encontre respostas rápidas para as dúvidas mais comuns da comunidade.</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3 items-center">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar pergunta ou resposta..." className="pl-10" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-muted-foreground mr-2">Categoria:</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm border ${selectedCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/10 border-border'}`}
                >
                  {cat === 'all' ? 'Todas' : cat} {cat !== 'all' && <span className="ml-2 text-xs text-muted-foreground">({countsByCategory[cat] || 0})</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 text-sm text-muted-foreground">Mostrando <span className="font-semibold text-primary">{filtered.length}</span> de <span className="font-semibold">{faqs.length}</span> perguntas</div>
            {filtered.length === 0 ? (
              <Card className="glass-card p-6 text-center">
                <CardContent>
                  Nenhuma pergunta encontrada para os filtros aplicados.
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible>
                {filtered.map(item => (
                  <AccordionItem value={`faq-${item.id}`} key={item.id}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <div>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Dicas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                  <li>Use a busca para localizar termos específicos.</li>
                  <li>Verifique a categoria para filtrar por assunto.</li>
                  <li>Se não encontrar, use o formulário em Contato.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-card mt-4">
              <CardHeader>
                <CardTitle>Precisa de ajuda ainda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Se não encontrou a resposta, entre em contato via formulário ou inicie um chat com o suporte.</p>
                <a href="/contact" className="inline-block text-primary hover:underline">Ir para Contato</a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
