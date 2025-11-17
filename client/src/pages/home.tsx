import NetworkStatus from '@/components/NetworkStatus';
import FeaturedWitness from '@/components/FeaturedWitness';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <div>
      {/* Hero Section with Featured Witness */}
      <section id="home" className="relative bg-background overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 pt-8 pb-8 sm:pt-16 sm:pb-16 md:pt-20 md:pb-20 lg:pt-28 lg:pb-28 overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  <span className="block">{t('home.title')}</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  {t('home.description')}
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center px-4">
                  <Link href="/witnesses" className="w-full sm:w-auto">
                    <Button className="rounded-md px-5 py-3 font-medium w-full sm:w-auto">
                      {t('home.viewAll')}
                    </Button>
                  </Link>
                  <Link href="/about" className="w-full sm:w-auto">
                    <Button variant="outline" className="rounded-md px-5 py-3 font-medium w-full sm:w-auto">
                      {t('nav.about')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Images for decoration - Blockchain Technology Concept */}
        <div className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-gradient-to-r from-background to-muted opacity-70"></div>
        <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full opacity-10">
          <img src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop" alt="Blockchain Background" className="w-full h-full object-cover" />
        </div>
      </section>
      
      {/* Network Status Section */}
      <section className="bg-muted/50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <NetworkStatus />
        </div>
      </section>
      
      {/* Featured Witness Section (Aliento) */}
      <section id="about" className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedWitness />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/80 to-secondary/80 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-6">{t('home.title')}</h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            {t('home.description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <Link href="/witnesses" className="w-full">
              <Button 
                className="w-full px-5 py-3 text-base font-medium"
                variant="default"
              >
                {t('home.viewAll')}
              </Button>
            </Link>
            <a 
              href="https://hive.io/whitepaper.pdf" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center px-5 py-3 border border-primary-foreground text-base font-medium rounded-md text-primary-foreground hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary-foreground w-full"
            >
              {t('nav.about')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
