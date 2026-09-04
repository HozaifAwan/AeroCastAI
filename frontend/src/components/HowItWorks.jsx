import { FaBrain, FaDatabase, FaChartLine, FaBolt, FaShieldAlt, FaTools } from 'react-icons/fa';
import AI3DVisualization from './AI3DVisualization'; // <-- Add this import

const HowItWorks = () => {
  const steps = [
    {
      icon: <FaDatabase className="text-[#e09a58] text-4xl mb-4 mx-auto" />,
      title: "Phase 1: Data Architecture",
      description:
        "AeroCastAI begins with a highly structured data pipeline built to fetch, sanitize, and align live and historical meteorological variables. This includes atmospheric pressure, humidity, temperature layers, and wind patterns — all structured into model-ready formats to ensure rapid AI consumption.",
      poweredBy: "Open-Meteo current and hourly observations"
    },
    {
      icon: <FaBrain className="text-[#e09a58] text-4xl mb-4 mx-auto" />,
      title: "Phase 2: Feature Engineering",
      description:
        "Tornadic signals aren't obvious — they hide in the margins of weather data. Through extensive experimentation, I engineered a custom set of features designed to surface these subtle precursors, prioritizing predictive value over volume. This process involved careful tuning, analysis, and elimination of noisy inputs.",
      poweredBy: "Powered by: Targeted Meteorological Feature Extraction"
    },
    {
      icon: <FaChartLine className="text-[#e09a58] text-4xl mb-4 mx-auto" />,
      title: "Phase 3: AI Core Construction",
      description:
        "The AeroCast core is an XGBoost classifier trained for experimental tornado-risk classification. V3 validates the exact 12-feature contract and reports lightweight feature contributions alongside each score.",
      poweredBy: "Powered by: Custom XGBoost Architecture"
    },
    {
      icon: <FaBolt className="text-[#e09a58] text-4xl mb-4 mx-auto" />,
      title: "Phase 4: Live Weather Integration",
      description:
        "For each request, the backend retrieves current conditions and the previous UTC hour from Open-Meteo, computes three weather deltas, validates every value, and evaluates the saved model artifact.",
      poweredBy: "Powered by: Open-Meteo API + Automated Sync Logic"
    },
    {
      icon: <FaShieldAlt className="text-[#e09a58] text-4xl mb-4 mx-auto" />,
      title: "Phase 5: Continuous Verification",
      description:
        "Manual and Sentinel evaluations are logged for audit and future validation. The current model does not retrain itself; any future retraining must be deliberate, tested, and versioned.",
      poweredBy: "Powered by: Structured Prediction Logging & Model Feedback"
    },
    {
      icon: <FaTools className="text-[#e09a58] text-4xl mb-4 mx-auto" />,
      title: "Phase 6: Full-Stack Deployment & Automation",
      description:
        "FastAPI serves predictions, subscriptions, health, and official alert data. Sentinel can evaluate subscribed locations on a schedule with dry-run defaults, cooldowns, and delivery deduplication.",
      poweredBy: "Powered by: Custom-Built FastAPI + Vite/React Stack"
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#191b17] text-[#f2eee4]">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          The Science Behind <span className="text-[#e09a58]">AeroCastAI</span>
        </h2>
        <p className="text-lg md:text-xl text-[#aaa99f] mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          AeroCastAI is a full-stack experiment in structured weather ingestion, reproducible model inference, and responsible risk communication. The model score and official NWS alerts remain separate throughout the system.
        </p>
      </div>

      <AI3DVisualization /> {/* <-- Now outside the container, will be full width */}

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 mt-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`bg-[#242822] p-6 rounded-lg shadow-xl border border-[#3b4037] flex flex-col transition-all duration-300 hover:shadow-[0_18px_50px_rgba(196,122,57,0.12)] hover:border-[#c47a39] ${
                steps.length % 3 === 1 && index === steps.length - 1
                  ? 'lg:col-span-3 lg:max-w-2xl lg:mx-auto'
                  : steps.length % 2 === 1 && index === steps.length - 1 && steps.length % 3 !== 1
                  ? 'md:col-span-2 lg:col-span-1 lg:max-w-md lg:mx-auto'
                  : ''
              }`}
            >
              <div className="flex-shrink-0 mb-4 text-center">{step.icon}</div>
              <h3 className="text-2xl font-semibold mb-3 text-[#f2eee4] text-center">{step.title}</h3>
              <p className="text-[#aaa99f] text-sm leading-relaxed mb-4 flex-grow">{step.description}</p>
              <p className="text-xs text-[#879b78] font-medium mt-auto text-center">{step.poweredBy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
