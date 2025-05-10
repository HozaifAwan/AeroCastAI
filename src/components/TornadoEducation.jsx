function TornadoEducation() {
  const info = [
    {
      title: "What is the EF Scale?",
      content: "The Enhanced Fujita (EF) Scale rates tornadoes from EF0 to EF5 based on estimated wind speeds and damage. EF5 represents the most violent tornadoes with winds over 200 mph."
    },
    {
      title: "How Do Tornadoes Form?",
      content: "Tornadoes form when warm, moist air meets cold, dry air, creating instability. If strong wind shear is present, rotating updrafts can develop into tornadoes under supercell thunderstorms."
    },
    {
      title: "Watch vs. Warning?",
      content: "A Tornado Watch means conditions are favorable. A Tornado Warning means a tornado has been sighted or indicated by radar — seek shelter immediately."
    },
    {
      title: "Tornado Signs to Watch For",
      content: "Greenish sky, wall clouds, funnel-shaped clouds, hail, and a loud roaring sound are common warning signs of an approaching tornado."
    },
    {
      title: "Why Tornado Prediction Is Hard",
      content: "Tornadoes form rapidly and are influenced by many subtle atmospheric factors. Predicting exact location, timing, and intensity remains one of meteorology’s biggest challenges."
    }
  ];

  return (
    <section className="text-center py-16 px-6 bg-[#0D1B2A]">
      <h3 className="text-3xl font-bold mb-10">Understanding Tornadoes</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {info.map((item, index) => (
          <div key={index} className="bg-[#1B263B] p-6 rounded-lg shadow-lg text-left">
            <h4 className="text-xl font-semibold mb-2 text-[#778DA9]">{item.title}</h4>
            <p className="text-gray-300">{item.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
export default TornadoEducation;
