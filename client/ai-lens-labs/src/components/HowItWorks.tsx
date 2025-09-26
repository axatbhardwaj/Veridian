import { Wallet, FileText, Star, DollarSign } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Upload Content",
      description: "Sign with your Ethereum wallet like MetaMask and upload your articles or insights",
      step: "01"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Get Validated",
      description: "Expert validators review and rate your content on a scale of 1-10 for quality and uniqueness",
      step: "02"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Price Setting",
      description: "A fair price is automatically set based on validation scores and content rarity",
      step: "03"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Earn Rewards",
      description: "When AI models purchase access to your content, you earn crypto revenue claimable weekly",
      step: "04"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From content upload to crypto earnings in four simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="feature-card text-center group animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="relative mb-6">
                <div className="absolute -top-4 -right-4 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                  {step.step}
                </div>
                <div className="bg-gradient-to-br from-primary to-purple-500 p-4 rounded-2xl text-white w-16 h-16 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;