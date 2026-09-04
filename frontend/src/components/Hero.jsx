import { motion as Motion } from 'framer-motion';

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-radar" aria-hidden="true"><span /></div>
      <p className="eyebrow">Experimental severe-weather intelligence</p>
      <Motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="hero-title"
      >
        Welcome to{' '}
        <span>
          <span>AeroCast</span>
          <span className="accent">AI</span>
        </span>
      </Motion.h2>
      <p className="hero-copy">
        Location-specific atmospheric analysis, explainable ML risk signals,
        and official NWS alerts—presented as distinct sources of information.
      </p>
      <a className="primary-button hero-action" href="#predictor">Analyze a location</a>
    </section>
  );
}
export default Hero;
