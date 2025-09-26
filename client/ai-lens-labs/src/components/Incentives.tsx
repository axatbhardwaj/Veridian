import { PenTool, Users, Bot } from "lucide-react";

const Incentives = () => {
  const incentives = [
    {
      icon: <PenTool className="w-12 h-12" />,
      title: "Writers Earn",
      subtitle: "For Original Knowledge",
      description: "Get rewarded for sharing your unique insights, research, and expertise with AI systems worldwide.",
      highlight: "Continuous passive income from your content"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Validators Get Paid",
      subtitle: "For Quality Curation",
      description: "Earn tokens for reviewing content and maintaining platform quality through expert validation.",
      highlight: "Build reputation while earning rewards"
    },
    {
      icon: <Bot className="w-12 h-12" />,
      title: "AI Models Access",
      subtitle: "Fresh, Uncrawled Data",
      description: "AI systems get access to premium, validated content that hasn't been scraped from the web.",
      highlight: "Unique training data for better AI"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-primary-light/10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Win-Win <span className="gradient-text">Incentives</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A sustainable ecosystem where everyone benefits from quality knowledge sharing
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {incentives.map((incentive, index) => (
            <div key={index} className="text-center space-y-6 animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary to-purple-500 p-6 rounded-3xl text-white w-24 h-24 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                  {incentive.icon}
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">{incentive.title}</h3>
                <p className="text-primary font-semibold">{incentive.subtitle}</p>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">{incentive.description}</p>
              
              <div className="bg-accent/30 rounded-xl p-4 border border-primary/20">
                <p className="text-sm font-medium text-primary">{incentive.highlight}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16 animate-fade-in">
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-8 border border-primary/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 gradient-text">Join the Knowledge Economy</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Be part of the future where knowledge creators, validators, and AI systems work together in harmony
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-primary">100K+</p>
                <p className="text-sm text-muted-foreground">Content Pieces</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-primary">5,000+</p>
                <p className="text-sm text-muted-foreground">Active Validators</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-primary">$2M+</p>
                <p className="text-sm text-muted-foreground">Paid to Creators</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Incentives;