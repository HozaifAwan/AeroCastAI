function TechStack() {
  const techs = [
    "React",
    "TailwindCSS",
    "Vite",
    "Leaflet.js",
    "OpenStreetMap",
    "Three.js",
    "Framer Motion"
  ];

  return (
    <section className="text-center py-16 bg-[#1B263B]">
      <h3 className="text-3xl font-bold mb-8 text-white">Powered By</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {techs.map((tech, index) => (
          <div
            key={index}
            className="bg-[#2D3E50] text-sky-300 font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-[#32475b] hover:text-white transition-all duration-200"
          >
            {tech}
          </div>
        ))}
      </div>
    </section>
  );
}

export default TechStack;
