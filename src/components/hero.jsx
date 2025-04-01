import Orb from "./orb";

export default function Hero() {
  return (
    <div id="home" className="w-full h-screen bg-[#000000] flex justify-center items-center relative overflow-hidden">
      
      {/* Orb Positioned in Center, Behind Heading */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="orb-container">
          <Orb 
            hoverIntensity={0.5} 
            rotateOnHover={true} 
            hue={0} 
            forceHoverState={false} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative isolate px-6 pt-1 lg:px-8 z-10">
        <div className="mx-auto max-w-2xl py-8 sm:py-40 lg:py-12">
          <div className="hidden sm:mb-6 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-[#F5F5F5] ring-1 ring-[#6C63FF] hover:ring-[#FF6584]">
              Blockchain-Powered Accident Reports. <a href="#About" className="font-semibold text-[#6C63FF] hover:text-[#FF6584]"><span className="absolute inset-0" aria-hidden="true"></span>Read more <span aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#F5F5F5] sm:text-6xl">
              Revolutionizing Vehicle Accident Investigation with Blockchain
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#F5F5F5]">
              Our digital forensics solution uses blockchain to ensure transparency, immutability, and accuracy in accident reports. Trust in cutting-edge technology for reliable results.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a 
                href="/signup"
                className="rounded-md bg-[#6C63FF] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4F4CFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C63FF]"
              >
                Get Started
              </a>
              <a 
                href="#About"
                className="text-sm font-semibold leading-6 text-[#00FFFF] hover:text-[#FF6584]"
              >
                Learn More <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Animated 3D Blocks */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-[#6C63FF] shadow-lg transform rotate-45 animate-moveBack"></div>
      <div className="absolute top-40 right-20 w-20 h-20 bg-[#FF6584] shadow-lg transform rotate-45 animate-moveBack"></div>
      <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-[#00FFFF] shadow-lg transform rotate-45 animate-moveBack"></div>
      <div className="absolute bottom-10 right-1/4 w-12 h-12 bg-[#F5F5F5] shadow-lg transform rotate-45 animate-moveBack"></div>

      {/* Tailwind CSS Animation */}
      <style jsx>{`
        @keyframes moveBack {
          0% {
            transform: translateZ(0px) rotate(45deg);
          }
          100% {
            transform: translateZ(-200px) scale(0.8) rotate(45deg);
            opacity: 0.7;
          }
        }
        .animate-moveBack {
          animation: moveBack 5s infinite alternate ease-in-out;
        }
        .orb-container {
          width: 280px;
          height: 280px;
          transform: scale(1.4);
        }
      `}</style>

    </div>
  );
}
