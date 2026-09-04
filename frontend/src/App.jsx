import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LiveAlert from './components/LiveAlert';
import Mission from './components/Mission';
import HowItWorks from './components/HowItWorks';
import LivePredictor from './components/LivePredictor';
import RiskMap from './components/RiskMap';
import HistoricalTornadoes from './components/HistoricalTornadoes';
import TornadoEducation from './components/TornadoEducation';
import FAQ from './components/FAQ';
import TechStack from './components/TechStack';
import ZipSignup from './components/ZipSignup';
import Footer from './components/Footer';

const Reveal = ({ children }) => (
  <Motion.div
    initial={{ y: 18, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.45 }}
    viewport={{ once: true, margin: '-60px' }}
  >
    {children}
  </Motion.div>
);

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [officialAlerts, setOfficialAlerts] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState('');

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#151713] text-[#f2eee4]">
      <Navbar />
      <Hero />
      <LiveAlert
        analysis={analysis}
        alerts={officialAlerts}
        loading={alertsLoading}
        error={alertsError}
      />
      <Reveal><Mission /></Reveal>
      <Reveal><HowItWorks /></Reveal>
      <Reveal>
        <LivePredictor
          onAnalysis={setAnalysis}
          onAlerts={setOfficialAlerts}
          onAlertsLoading={setAlertsLoading}
          onAlertsError={setAlertsError}
        />
      </Reveal>
      <Reveal><RiskMap analysis={analysis} officialAlerts={officialAlerts} /></Reveal>
      <Reveal><HistoricalTornadoes /></Reveal>
      <Reveal><TornadoEducation /></Reveal>
      <Reveal><FAQ /></Reveal>
      <Reveal><TechStack /></Reveal>
      <Reveal>
        <section id="alerts" className="section-shell alert-signup-section">
          <div className="section-heading">
            <p className="eyebrow">Sentinel monitoring</p>
            <h2>Subscribe to experimental risk signals</h2>
            <p>AeroCast notifications supplement—never replace—official weather and emergency alerts.</p>
          </div>
          <ZipSignup />
        </section>
      </Reveal>
      <Footer />
    </div>
  );
}

export default App;
