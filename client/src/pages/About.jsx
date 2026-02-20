import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';
import { CheckCircle, Heart, Truck, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import hero images for the Gallery section
import hero1 from '../assets/hero.webp';
import hero2 from '../assets/hero2.webp';
import hero3 from '../assets/hero3.webp';
import hero4 from '../assets/hero4.webp';
import hero5 from '../assets/hero5.webp';
import hero7 from '../assets/hero7.webp';
import hero8 from '../assets/hero8.webp';
import hero9 from '../assets/hero9.webp';

// Gallery images array for OUR GALLERY section
const heroGalleryImages = [hero1, hero2, hero3, hero4, hero5, hero7, hero8, hero9];

// Gallery images for the Premium Collection section (from public folder)
const galleryImages = [
  '/gallery1.webp',
  '/gallery2.webp',
  '/gallery3.webp',
  '/gallery4.webp',
  '/gallery5.webp',
  '/gallery6.webp',
];

const About = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play for Premium Collection gallery
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentHeroIndex((prevIndex) => 
          prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, galleryImages.length]);

  // Auto-play for OUR GALLERY section
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGalleryIndex((prevIndex) => 
        prevIndex === heroGalleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4500);
    
    return () => {
      clearInterval(interval);
    };
  }, [heroGalleryImages.length]);

  const handlePrevHeroSlide = () => {
    setCurrentHeroIndex((prevIndex) => 
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
  };

  const handleNextHeroSlide = () => {
    setCurrentHeroIndex((prevIndex) => 
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
    setIsAutoPlaying(false);
  };

  // Navigation for OUR GALLERY
  const handlePrevGallery = () => {
    setCurrentGalleryIndex((prevIndex) => 
      prevIndex === 0 ? heroGalleryImages.length - 1 : prevIndex - 1
    );
  };

  const handleNextGallery = () => {
    setCurrentGalleryIndex((prevIndex) => 
      prevIndex === heroGalleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-12 pb-0 relative overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-white ">
        <div className="absolute inset-0 opacity-90"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content */}
            <div className="lg:w-1/2">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                WE ARE
                <span className="block text-amber-400 mt-2">DAILY</span>
              </h1>
              
              <div className="space-y-6">
                <p className="dark:text-gray-300 text-lg leading-relaxed">
                  Born from a passion for timeless style and modern comfort, Daily redefines everyday fashion. 
                  We believe that what you wear daily should make you feel confident, comfortable, and uniquely you.
                </p>
                
                <p className="dark:text-gray-300 text-lg leading-relaxed">
                  Our journey began with a simple idea: create clothing that seamlessly blends quality craftsmanship 
                  with contemporary design—pieces that become your go-to favorites, day after day.
                </p>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-amber-400" size={20} />
                    <span className="dark:text-gray-300">Premium Quality</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="text-amber-400" size={20} />
                    <span className="dark:text-gray-300">Sustainable Materials</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Truck className="text-amber-400" size={20} />
                    <span className="dark:text-gray-300">Worldwide Shipping</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="text-amber-400" size={20} />
                    <span className="dark:text-gray-300">Ethical Production</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Premium Collection Gallery */}
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                
                {/* Gallery Container */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl backdrop-blur-sm h-[500px]">
                  <div
                    className="flex transition-transform duration-700 ease-in-out h-full"
                    style={{
                      width: `${galleryImages.length * 100}%`,
                      transform: `translateX(-${(100 / galleryImages.length) * currentHeroIndex}%)`,
                    }}
                  >
                    {galleryImages.map((src, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 h-full relative"
                        style={{ width: `${100 / galleryImages.length}%` }}
                      >
                        <div 
                          className="w-full h-full bg-cover bg-center"
                          style={{ 
                            backgroundImage: `url(${src})`,
                            backgroundPosition: 'center center'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handlePrevHeroSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 transition-all duration-300 hover:scale-110"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNextHeroSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 transition-all duration-300 hover:scale-110"
                  >
                    ›
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10">
                    <div className="text-xs text-amber-300 uppercase tracking-wider font-semibold">
                      Premium Collection
                    </div>
                    <div className="text-white font-bold text-lg font-[Inter]">
                      Daily Styles Gallery
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR GALLERY Section */}
      <section className="py-16 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              OUR <span className="text-amber-400">GALLERY</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              A visual journey through our craftsmanship and style
            </p>
          </div>

          {/* Hero Images Gallery Slider */}
          <div className="relative">
            <div className="relative h-[600px] rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-white/20 shadow-2xl">
              <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{
                  width: `${heroGalleryImages.length * 100}%`,
                  transform: `translateX(-${(100 / heroGalleryImages.length) * currentGalleryIndex}%)`,
                }}
              >
                {heroGalleryImages.map((src, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 h-full relative"
                    style={{ width: `${100 / heroGalleryImages.length}%` }}
                  >
                    <img
                      src={src}
                      alt={`Hero collection ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={handlePrevGallery}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full z-10 transition-all duration-300 hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button
                onClick={handleNextGallery}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full z-10 transition-all duration-300 hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>

              {/* Overlay with counter */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10">
                <div className="text-xs text-amber-300 uppercase tracking-wider font-semibold">
                  Hero Collection
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-white font-bold text-lg font-[Inter]">
                    Featured Styles
                  </div>
                  <div className="text-white text-sm bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    {currentGalleryIndex + 1} / {heroGalleryImages.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000"
                style={{ width: `${((currentGalleryIndex + 1) / heroGalleryImages.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Gallery Description */}
          <div className="mt-12 text-center max-w-3xl mx-auto">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Explore our curated hero collection showcasing the essence of Daily. From design to production, 
              each image captures the dedication and passion we put into every piece we create.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="pt-12 pb-8 bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              OUR <span className="text-amber-400">PROMISE</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Three pillars that define our commitment to you and the planet
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-black border border-gray-200 dark:border-gray-800 rounded-2xl p-8 group hover:border-amber-400/30 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">👔</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Timeless Design</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We create clothing that transcends trends. Each piece is thoughtfully designed to remain 
                stylish season after season, focusing on clean lines and versatile silhouettes.
              </p>
              <div className="flex items-center text-amber-500 dark:text-amber-400 text-sm font-medium">
                <span>Discover Our Collection</span>
                <span className="ml-2">→</span>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-black border border-gray-200 dark:border-gray-800 rounded-2xl p-8 group hover:border-amber-400/30 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sustainable Craft</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Committed to a better future, we use eco-friendly materials and ethical production methods. 
                Every garment tells a story of mindful creation and respect for our planet.
              </p>
              <div className="flex items-center text-amber-500 dark:text-amber-400 text-sm font-medium">
                <span>Learn About Our Process</span>
                <span className="ml-2">→</span>
              </div>
            </div>
            
            {/* Card 3 */}
            <div className="bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-black border border-gray-200 dark:border-gray-800 rounded-2xl p-8 group hover:border-amber-400/30 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Exceptional Comfort</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Premium fabrics that feel as good as they look. We obsess over the details—from stitching 
                to seams—to ensure your Daily wear is your most comfortable wear.
              </p>
              <div className="flex items-center text-amber-500 dark:text-amber-400 text-sm font-medium">
                <span>Experience Quality</span>
                <span className="ml-2">→</span>
              </div>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div className="mt-20 text-center">
            <div className="inline-block relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-amber-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <Link to={'/products'} className="relative bg-black border-2 border-amber-500 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-amber-500 hover:text-black transition-all duration-300">
                SHOP THE COLLECTION
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;