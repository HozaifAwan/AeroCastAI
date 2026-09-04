import SystemStatus from './SystemStatus';

function Navbar() {
    return (
      <header className="operations-nav">
        <h1>
          AeroCast<span>AI</span><small> V3</small>
        </h1>
        <SystemStatus />
        <nav>
          <a href="#predictor">Predictor</a>
          <a href="#map">Map</a>
          <a href="#about">Science</a>
          <a href="#alerts">Alerts</a>
          <a href="https://github.com/HozaifAwan" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>
    );
}
export default Navbar;
