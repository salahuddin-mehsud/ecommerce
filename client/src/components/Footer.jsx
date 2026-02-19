import logo from '../assets/logo.webp';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 pb-6">
        {/* Centered brand + nav */}
        <div className="flex flex-col items-center">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Daily logo" className="h-44 w-auto object-contain" />
          </Link>

          {/* Center nav (small uppercase links like the image) */}
          <nav className="mt-6">
            <ul className="flex flex-wrap items-center justify-center gap-6 text-xs tracking-widest uppercase text-gray-400">
              <li><a href="#home" className="hover:text-white transition">Home</a></li>
              <li><a href="#perfumes" className="hover:text-white transition">Collections</a></li>
              <li><a href="#story" className="hover:text-white transition">Our Story</a></li>
              <li><a href="#notify" className="hover:text-white transition">Contact</a></li>
            </ul>
          </nav>

          {/* Short brand description centered */}
          <p className="mt-6 text-center text-gray-400 max-w-2xl">
            Crafting timeless fragrances that tell your story. Experience the essence of luxury with our exclusive perfume collection.
          </p>

          {/* Social icons row (green circular icons similar to image) */}
          <div className="mt-6 flex items-center gap-4">
            {/* Example social icons as inline SVGs. Update hrefs to your URLs. */}
            <a href="#" aria-label="Twitter" className="w-9 h-9 flex items-center justify-center rounded-full border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M22 5.92c-.7.31-1.45.52-2.24.61a3.92 3.92 0 0 0 1.72-2.16 7.82 7.82 0 0 1-2.48.95 3.9 3.9 0 0 0-6.65 3.55A11.08 11.08 0 0 1 3.15 4.9a3.9 3.9 0 0 0 1.21 5.2c-.58-.02-1.13-.18-1.61-.44v.04c0 1.9 1.34 3.48 3.12 3.85a3.92 3.92 0 0 1-1.6.06 3.9 3.9 0 0 0 3.65 2.71A7.83 7.83 0 0 1 2 19.54a11.06 11.06 0 0 0 5.98 1.75c7.17 0 11.1-5.94 11.1-11.09v-.51A7.9 7.9 0 0 0 22 5.92z" />
              </svg>
            </a>

            <a href="#" aria-label="Facebook" className="w-9 h-9 flex items-center justify-center rounded-full border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M22 12.07C22 6.56 17.52 2 12 2S2 6.56 2 12.07c0 4.86 3.44 8.88 7.94 9.75v-6.9H7.9v-2.85h2.04V9.5c0-2.02 1.2-3.13 3.03-3.13.88 0 1.8.16 1.8.16v1.98h-1.02c-1.01 0-1.33.63-1.33 1.28v1.54h2.26l-.36 2.85h-1.9v6.9C18.56 20.95 22 16.93 22 12.07z" />
              </svg>
            </a>

            <a href="#" aria-label="Instagram" className="w-9 h-9 flex items-center justify-center rounded-full border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.2A4.8 4.8 0 1 0 16.8 13 4.8 4.8 0 0 0 12 8.2zm6.4-.9a1.12 1.12 0 1 1-1.12-1.12A1.12 1.12 0 0 1 18.4 7.3zM12 10.6A1.4 1.4 0 1 1 10.6 12 1.4 1.4 0 0 1 12 10.6z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <p className="text-center text-sm text-gray-500">&copy; 2025 Daily. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
