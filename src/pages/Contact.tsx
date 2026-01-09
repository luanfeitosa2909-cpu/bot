import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Mail,
  MessageCircle,
  Instagram,
  Youtube,
  Twitter,
  Twitch,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Clock
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatStarter from './ChatStarter';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const socialLinks = [
    {
      icon: <Instagram className="h-6 w-6" />,
      label: "Instagram",
      href: "https://instagram.com/brasilsimracing",
      color: "hover:text-pink-500",
      followers: "15K+"
    },
    {
      icon: <Youtube className="h-6 w-6" />,
      label: "YouTube",
      href: "https://youtube.com/brasilsimracing",
      color: "hover:text-red-500",
      followers: "8K+"
    },
    {
      icon: <Twitter className="h-6 w-6" />,
      label: "Twitter",
      href: "https://twitter.com/brasilsimracing",
      color: "hover:text-blue-400",
      followers: "5K+"
    },
    {
      icon: <Twitch className="h-6 w-6" />,
      label: "Twitch",
      href: "https://twitch.tv/brasilsimracing",
      color: "hover:text-purple-500",
      followers: "3K+"
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      label: "Discord",
      href: "https://discord.gg/brasilsimracing",
      color: "hover:text-indigo-500",
      followers: "12K+"
    }
  ];

  const contactOptions = [
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Suporte Geral",
      description: "Dúvidas sobre inscrições, regras ou problemas técnicos",
      email: "suporte@brasilsimracing.com.br",
      response: "Resposta em 24h"
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Parcerias",
      description: "Interessado em parcerias ou colaborações comerciais",
      email: "parcerias@brasilsimracing.com.br",
      response: "Resposta em 48h"
    },
    {
      icon: <Phone className="h-8 w-8" />,
      title: "Imprensa",
      description: "Contato para veículos de comunicação e mídia",
      email: "imprensa@brasilsimracing.com.br",
      response: "Resposta em 24h"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    // Simular envio
    setSubmitted(true);
    setError("");
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">
            <span className="text-primary">💬</span> Entre em Contato
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Tem uma dúvida? Quer fazer uma parceria? Estamos aqui para ajudar!
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid gap-6 md:grid-cols-3 mb-16 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {contactOptions.map((option, idx) => (
            <Card key={idx} className="glass-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  {option.icon}
                </div>
                <h3 className="font-semibold mb-2">{option.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                <div className="space-y-2">
                  <a href={`mailto:${option.email}`} className="text-sm text-primary hover:underline block">
                    {option.email}
                  </a>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {option.response}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-12 lg:grid-cols-3 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="glass-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Envie uma Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitted && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-600">Mensagem enviada com sucesso!</h4>
                      <p className="text-sm text-muted-foreground">Obrigado por entrar em contato. Responderemos em breve.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-600">Erro</h4>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Assunto *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="O que você gostaria de falar"
                      value={formData.subject}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Digite sua mensagem aqui..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={submitted}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitted ? "Enviando..." : "Enviar Mensagem"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.35s" }}>
            {/* Email Principal */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email Principal</h3>
                    <a
                      href="mailto:contato@brasilsimracing.com.br"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      contato@brasilsimracing.com.br
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Horário de Atendimento */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Horário de Atendimento</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>Segunda a Sexta: 9h - 18h</p>
                      <p>Sábado: 10h - 16h</p>
                      <p>Domingo: Fechado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Localização</h3>
                    <p className="text-sm text-muted-foreground">Brasil</p>
                    <Badge variant="secondary" className="mt-2">Online 24/7</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conecte-se Conosco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Siga-nos nas redes sociais para ficar por dentro das últimas novidades,
                transmissões ao vivo e conteúdo exclusivo da comunidade.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className={`text-primary ${social.color}`}>
                      {social.icon}
                    </div>
                    <span className="font-medium text-xs text-center">{social.label}</span>
                    <span className="text-xs text-muted-foreground">{social.followers}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="text-center py-8 animate-fade-in" style={{ animationDelay: "0.45s" }}>
          <h2 className="text-2xl font-bold mb-4">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground mb-6">Consulte nossa página de Perguntas Frequentes ou entre em contato diretamente conosco.</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/faq">📖 Ver FAQ</Link>
            </Button>
            <Button variant="outline" onClick={() => { (window as any).openChat && (window as any).openChat(formData.name); }}>💬 Iniciar Chat</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;