import { motion } from 'framer-motion';

function Hero() {
  return (
    <section className="flex flex-col justify-center items-center text-center py-20 bg-[#0D1B2A]">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="text-5xl md:text-7xl font-black"
      >
        Welcome to{' '}
        <span>
          <span className="text-white">AeroCast</span>
          <span className="text-[#38bdf8]">AI</span>
        </span>
      </motion.h2>
      <p className="mt-6 max-w-xl px-4 text-lg text-[#b6d6f6]">
        AI-powered tornado prediction system using real-time weather data.
      </p>
    </section>
  );
}
export default Hero;
