import LandingNav from '../components/LandingNav';
import LandingHero from '../components/LandingHero';
import LandingFeatures from '../components/LandingFeatures';
import LandingFAQAndFooter from '../components/LandingFAQAndFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      <LandingNav />
      <main className="pt-16">
        <LandingHero />
        <LandingFeatures />
      </main>
      <LandingFAQAndFooter />
    </div>
  );
}
