import FeaturedWitness from "@/components/FeaturedWitness";
import { useLanguage } from "@/context/LanguageContext";


export default function About() {
  const { t } = useLanguage();
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t('about.title')}</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            {t('about.description')}
          </p>
        </div>
        
        <FeaturedWitness />
        
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">{t('about.purpose')}</h3>
          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">
            {t('about.purposeDesc')}
          </p>
          
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-6 sm:mt-8 mb-3 sm:mb-4">{t('about.features')}</h3>
          <ul className="list-disc pl-5 sm:pl-6 space-y-2 sm:space-y-3 text-base sm:text-lg text-muted-foreground">
            <li>{t('about.feature1')}</li>
            <li>{t('about.feature2')}</li>
            <li>{t('about.feature3')}</li>
            <li>{t('about.feature4')}</li>
          </ul>
          
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-6 sm:mt-8 mb-3 sm:mb-4">Recent Updates</h3>
          <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4 sm:p-6 mb-6">
            <h4 className="text-lg font-semibold text-foreground mb-3">Block Production Schedule</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-muted-foreground">
              <li>Real-time witness block production tracking with live updates every 3 seconds</li>
              <li>Interactive schedule showing the next 20 witnesses in rotation</li>
              <li>Upcoming backup witnesses display with time-to-block estimates</li>
              <li>Complete backup witnesses list (rank 21+) with detailed information</li>
              <li>Hover tooltips showing position in queue and estimated production time</li>
              <li>Bilingual support (English/Spanish) for all schedule features</li>
            </ul>
          </div>
          
          <div className="bg-accent/30 border-l-4 border-accent rounded-r-lg p-4 sm:p-6 mb-6">
            <h4 className="text-lg font-semibold text-foreground mb-3">Enhanced Navigation</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-muted-foreground">
              <li>Dedicated Schedule page accessible from main navigation</li>
              <li>Quick schedule preview on home page</li>
              <li>Responsive design for mobile, tablet, and desktop viewing</li>
            </ul>
          </div>
          
          <div className="bg-muted border-l-4 border-muted-foreground rounded-r-lg p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-foreground mb-3">Improved User Experience</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-muted-foreground">
              <li>Click any witness in the schedule to view their detailed profile</li>
              <li>Visual indicators for currently producing witness (with "LIVE" badge)</li>
              <li>Clean, organized layout with clear section separation</li>
              <li>Countdown to next schedule shuffle with block count</li>
            </ul>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-6 sm:mt-8 mb-3 sm:mb-4">{t('about.techDesc')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-3 sm:mt-4">
            <div className="p-4 sm:p-6 bg-accent/50 rounded-lg border border-border">
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{t('about.tech')}</h4>
              <p className="text-sm sm:text-base text-muted-foreground">{t('about.techDesc')}</p>
            </div>
            <div className="p-4 sm:p-6 bg-accent/50 rounded-lg border border-border">
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{t('network.title')}</h4>
              <p className="text-sm sm:text-base text-muted-foreground">{t('network.subtitle')}</p>
            </div>
            <div className="p-4 sm:p-6 bg-accent/50 rounded-lg border border-border">
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{t('witnesses.title')}</h4>
              <p className="text-sm sm:text-base text-muted-foreground">{t('witnesses.description')}</p>
            </div>
            <div className="p-4 sm:p-6 bg-accent/50 rounded-lg border border-border">
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{t('profile.about')}</h4>
              <p className="text-sm sm:text-base text-muted-foreground">{t('about.description')}</p>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}
