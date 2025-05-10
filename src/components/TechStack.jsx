function TechStack() {
    const techs = ["React", "TailwindCSS", "Vite", "Leaflet.js", "OpenStreetMap"];
    
    return (
      <section className="text-center py-16 bg-[#1B263B]">
        <h3 className="text-3xl font-bold mb-8">Powered By</h3>
        <div className="flex flex-wrap justify-center gap-8">
          {techs.map((tech, index) => (
            <div key={index} className="bg-[#778DA9] text-[#0D1B2A] font-bold py-4 px-6 rounded-lg hover:scale-105 transform transition">
              {tech}
            </div>
          ))}
        </div>
      </section>
    );
  }
  export default TechStack;
  