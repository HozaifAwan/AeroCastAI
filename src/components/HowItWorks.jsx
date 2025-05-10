function HowItWorks() {
    const steps = [
      "Real-time weather data is collected from multiple trusted sources.",
      "Advanced AI models analyze atmospheric conditions and predict risk.",
      "Instant tornado risk reports are generated for your location."
    ];
    
    return (
      <section className="text-center py-16 px-6">
        <h3 className="text-3xl font-bold mb-8">How It Works</h3>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-[#415A77] p-6 rounded-lg shadow-md w-full md:w-1/3 hover:scale-105 transition transform">
              <h4 className="text-2xl font-bold mb-4">Step {index + 1}</h4>
              <p className="text-gray-200">{step}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  export default HowItWorks;
  