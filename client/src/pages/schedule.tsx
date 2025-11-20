import WitnessSchedule from '@/components/WitnessSchedule';
import { useLanguage } from '@/context/LanguageContext';

export default function Schedule() {
  const { t } = useLanguage();

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4">
              {t('schedule.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('schedule.description')}
            </p>
          </div>

          {/* Schedule Component */}
          <WitnessSchedule showFullBackupList={true} />

          {/* Additional Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-3">How It Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• The top 20 witnesses by vote weight produce blocks in rotation</li>
                <li>• Each witness produces 1 block every time it's their turn</li>
                <li>• Backup witnesses (ranked 21+) fill remaining slots</li>
                <li>• The schedule shuffles approximately every hour</li>
                <li>• Block time on Hive is 3 seconds</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-3">Why This Matters</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Witnesses secure the blockchain by validating transactions</li>
                <li>• Top 20 witnesses have the most voting power support</li>
                <li>• Backup witnesses provide decentralization and redundancy</li>
                <li>• Missing blocks can indicate technical issues</li>
                <li>• You can vote for up to 30 witnesses to support them</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
