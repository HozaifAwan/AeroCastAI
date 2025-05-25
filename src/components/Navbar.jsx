function Navbar() {
    return (
      <header className="flex justify-between items-center p-6 shadow-md bg-[#0D1B2A] sticky top-0 z-50">
        <h1 className="text-2xl font-bold">
          AeroCast<span className="text-[#38bdf8]">AI</span>
        </h1>
        <nav className="space-x-8 text-lg">
          <a href="#map" className="hover:text-[#38bdf8] transition">Live Map</a>
          <a href="#about" className="hover:text-[#38bdf8] transition">About</a>
          <a href="https://github.com/HozaifAwan" target="_blank" className="hover:text-[#38bdf8] transition">GitHub</a>
          <a href="#contact" className="hover:text-[#38bdf8] transition">Contact</a>
        </nav>
      </header>
    );
}
export default Navbar;
