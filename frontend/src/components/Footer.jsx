function Footer() {
    return (
      <footer id="contact" className="text-center py-10 bg-[#0D1B2A] text-gray-400 text-sm">
        <p>Contact: <a href="mailto:hozaifawan@gmail.com" className="underline hover:text-white">hozaifawan@gmail.com</a></p>
        <p className="mt-2">© {new Date().getFullYear()} AeroCastAI Inc. All rights reserved.</p>
        <p className="mt-1">
          <a href="https://github.com/HozaifAwan" target="_blank" className="underline hover:text-white">Visit our GitHub</a>
        </p>
      </footer>
    );
  }
  export default Footer;
  