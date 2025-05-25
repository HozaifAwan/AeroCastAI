import React from 'react';
import { FaBrain, FaDatabase, FaChartLine, FaBolt, FaShieldAlt, FaTools } from 'react-icons/fa';
import AI3DVisualization from './AI3DVisualization'; // <-- Add this import

const HowItWorks = () => {
  const steps = [
    {
      icon: <FaDatabase className="text-sky-400 text-4xl mb-4 mx-auto" />,
      title: "Phase 1: Data Architecture",
      description:
        "AeroCastAI begins with a highly structured data pipeline built to fetch, sanitize, and align live and historical meteorological variables. This includes atmospheric pressure, humidity, temperature layers, and wind patterns — all structured into model-ready formats to ensure rapid AI consumption.",
      poweredBy: "Powered by: Autonomous Real-Time Data Pipelines"
    },
    {
      icon: <FaBrain className="text-sky-400 text-4xl mb-4 mx-auto" />,
      title: "Phase 2: Feature Engineering",
      description:
        "Tornadic signals aren't obvious — they hide in the margins of weather data. Through extensive experimentation, I engineered a custom set of features designed to surface these subtle precursors, prioritizing predictive value over volume. This process involved careful tuning, analysis, and elimination of noisy inputs.",
      poweredBy: "Powered by: Targeted Meteorological Feature Extraction"
    },
    {
      icon: <FaChartLine className="text-sky-400 text-4xl mb-4 mx-auto" />,
      title: "Phase 3: AI Core Construction",
      description:
        "The AI core behind AeroCastAI is a handcrafted machine learning model fine-tuned for binary tornado risk classification. Rather than using off-the-shelf black-box models, the architecture was selected, trained, and stress-tested specifically to balance real-time accuracy with interpretability.",
      poweredBy: "Powered by: Custom XGBoost Architecture"
    },
    {
      icon: <FaBolt className="text-sky-400 text-4xl mb-4 mx-auto" />,
      title: "Phase 4: Live Weather Integration",
      description:
        "By connecting directly to live sources like Open-Meteo, the system retrieves up-to-date environmental conditions and instantly feeds them into the model. The result: real-time predictions that update dynamically with changing conditions.",
      poweredBy: "Powered by: Open-Meteo API + Automated Sync Logic"
    },
    {
      icon: <FaShieldAlt className="text-sky-400 text-4xl mb-4 mx-auto" />,
      title: "Phase 5: Continuous Verification",
      description:
        "Each prediction made through the site — whether manual or automated — is logged into a dedicated dataset for future comparison and analysis. This feedback loop allows for periodic retraining and post-event validation to ensure AeroCastAI’s accuracy improves over time.",
      poweredBy: "Powered by: Structured Prediction Logging & Model Feedback"
    },
    {
      icon: <FaTools className="text-sky-400 text-4xl mb-4 mx-auto" />,
      title: "Phase 6: Full-Stack Deployment & Automation",
      description:
        "From backend to frontend, every component of AeroCastAI was deployed and automated by hand — including the model training pipeline, API endpoints, logging systems, and UI integration. It runs autonomously, without needing manual upkeep for daily predictions.",
      poweredBy: "Powered by: Custom-Built FastAPI + Vite/React Stack"
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-[#0D1B2A] to-[#1B263B] text-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          The Science Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">AeroCastAI</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-300 mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          AeroCastAI is a solo-engineered system designed from the ground up to forecast tornadic risk using real-time meteorological inputs. Built with an emphasis on accuracy, speed, and full autonomy, every layer — from data acquisition to AI prediction — was developed and optimized by a single developer through months of iteration. Here's how the system works behind the scenes:
        </p>
      </div>

      <AI3DVisualization /> {/* <-- Now outside the container, will be full width */}

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 mt-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`bg-[#152a3d] p-6 rounded-xl shadow-xl border border-slate-700/50 flex flex-col transition-all duration-300 hover:shadow-sky-500/30 hover:border-sky-500/70 ${
                steps.length % 3 === 1 && index === steps.length - 1
                  ? 'lg:col-span-3 lg:max-w-2xl lg:mx-auto'
                  : steps.length % 2 === 1 && index === steps.length - 1 && steps.length % 3 !== 1
                  ? 'md:col-span-2 lg:col-span-1 lg:max-w-md lg:mx-auto'
                  : ''
              }`}
            >
              <div className="flex-shrink-0 mb-4 text-center">{step.icon}</div>
              <h3 className="text-2xl font-semibold mb-3 text-sky-300 text-center">{step.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-grow">{step.description}</p>
              <p className="text-xs text-sky-500/80 font-medium mt-auto text-center">{step.poweredBy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
