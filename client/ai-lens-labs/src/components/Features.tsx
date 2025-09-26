import { Shield, Users, Coins, Brain } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Shield className="w-10 h-10" />,
      title: "Secure Uploads with Wallet Sign-In",
      description: "Connect your Ethereum wallet for secure, decentralized content uploads with full ownership control."
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Fair Validator Ratings System",
      description: "Expert validators ensure quality through transparent, incentivized review processes."
    },
    {
      icon: <Coins className="w-10 h-10" />,
      title: "Transparent Crypto Rewards",
      description: "Track your earnings in real-time with transparent, blockchain-based payment systems."
    },
    {
      icon: <Brain className="w-10 h-10" />,
      title: "AI-Powered Marketplace",
      description: "Direct marketplace where AI models discover and purchase rare, high-quality content."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Platform <span className="gradient-text">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built for creators, validators, and AI systems with trust and transparency at the core
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="glass-card p-8 group animate-slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
              <div className="bg-gradient-to-br from-primary to-purple-500 p-3 rounded-2xl text-white w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              
              <h3 className="text-2xl font-semibold mb-4 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;