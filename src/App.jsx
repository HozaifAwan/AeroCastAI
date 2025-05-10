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
import Footer from './components/Footer';
import { motion } from 'framer-motion';

function App() {
  return (
    <motion.div
      className="bg-gradient-to-b from-[#0D1B2A] via-[#1B263B] to-[#415A77] min-h-screen text-white overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <Navbar />
      <motion.div initial={{ y: -20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <Hero />
      </motion.div>
      <LiveAlert />
      <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <Mission />
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <HowItWorks />
      </motion.div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <LivePredictor />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <RiskMap />
      </motion.div>
      <motion.div initial={{ x: 20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <HistoricalTornadoes />
      </motion.div>
      <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <TornadoEducation />
      </motion.div>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <FAQ />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <TechStack />
      </motion.div>
      <Footer />
    </motion.div>
  );
}

export default App;
