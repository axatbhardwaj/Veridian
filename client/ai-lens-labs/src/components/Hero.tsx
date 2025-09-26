import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-ai-collaboration.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary-light/20 to-accent/30" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="gradient-text">Monetize Your Knowledge.</span>
              <br />
              <span className="text-foreground">Power the Next Generation of AI.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Upload your articles or insights, get rated by validators, and earn crypto when AI models use your content.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="hero-button text-lg" asChild>
                <a href="/upload">Start Uploading</a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white">
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Right content - Hero image */}
          <div className="animate-slide-up">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="AI and human collaboration illustration" 
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-glow" />
      <div className="absolute bottom-32 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-glow" />
    </section>
  );
};

export default Hero;