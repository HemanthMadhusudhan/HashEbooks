import { useEffect } from 'react';
import { ArrowLeft, Mail, Linkedin, BookOpen, Users, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import hashebooksLogo from '@/assets/hashebooks-logo.webp';

const teamMembers = [
  {
    name: 'Hemanth H M',
    role: 'UI/UX Designer',
    bio: 'Dedicated to crafting beautiful and user-friendly designs that make reading enjoyable for everyone.',
  },
  {
    name: 'Saketh S Tandige',
    role: 'Full Stack Developer',
    bio: 'Passionate about building accessible digital libraries and promoting reading culture through technology.',
  },
  {
    name: 'Harshavardhana B',
    role: 'Frontend Developer',
    bio: 'Focused on creating intuitive user interfaces and seamless reading experiences for book lovers.',
  },
  {
    name: 'Avinash G K',
    role: 'Backend Developer',
    bio: 'Expert in database design and API development, ensuring HashEBooks runs smoothly and efficiently.',
  },
];

const AboutUs = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <img src={hashebooksLogo} alt="HashEBooks" className="h-10 w-auto" />
                <h1 className="font-serif text-2xl font-bold text-foreground">HashEBooks</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Project Under Development</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            About HashEBooks
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A modern digital library platform designed to make reading accessible, organized, and enjoyable for everyone.
          </p>
        </section>

        {/* Mission Section */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Our Mission</h3>
              <p className="text-sm text-muted-foreground">
                To create a seamless digital reading experience that brings books closer to readers worldwide.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Our Vision</h3>
              <p className="text-sm text-muted-foreground">
                To become the go-to platform for digital book management, supporting readers and authors alike.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Our Values</h3>
              <p className="text-sm text-muted-foreground">
                Accessibility, simplicity, and a passion for reading drive everything we build.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-8">
            Meet Our Team
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.name} className="bg-card border-border overflow-hidden">
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{member.name}</h3>
                  <p className="text-xs text-primary mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
            Get In Touch
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Have questions, suggestions, or want to collaborate? We would love to hear from you!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" className="gap-2" asChild>
              <a href="mailto:support@hashebooks.online">
                <Mail className="w-4 h-4" />
                support@hashebooks.online
              </a>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href="https://www.linkedin.com/in/hemanth-h-m-a82b652a9" target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 px-4 mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2026 HashEBooks. Built with ❤️ by the HashEBooks Team.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
