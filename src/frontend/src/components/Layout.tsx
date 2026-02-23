import { ReactNode } from 'react';
import Navigation from './Navigation';
import { ConnectionStatusBanner } from './ConnectionStatusBanner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, ChefHat, Heart } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const appIdentifier = typeof window !== 'undefined' 
    ? encodeURIComponent(window.location.hostname) 
    : 'unknown-app';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.97_0.01_60)] to-[oklch(0.95_0.02_80)]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[oklch(0.88_0.03_60)] bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[oklch(0.62_0.15_35)] to-[oklch(0.55_0.18_30)] rounded-xl flex items-center justify-center shadow-md">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[oklch(0.35_0.08_35)]">Jeevanam Kitchen</h1>
              <p className="text-xs text-muted-foreground">Smart Calculator</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <Navigation />
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8">
                <Navigation mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Connection Status Banner */}
      <ConnectionStatusBanner />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[oklch(0.88_0.03_60)] bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-1">
              Built with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[oklch(0.55_0.18_30)] hover:underline"
              >
                caffeine.ai
              </a>
            </p>
            <p className="mt-2 text-xs">© {new Date().getFullYear()} Jeevanam Smart Kitchen Calculator</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
