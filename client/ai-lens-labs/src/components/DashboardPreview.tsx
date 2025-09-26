import { Button } from "@/components/ui/button";
import authorDashboard from "@/assets/author-dashboard-mockup.jpg";
import validatorDashboard from "@/assets/validator-dashboard-mockup.jpg";
import { ArrowRight, TrendingUp, FileText, Star } from "lucide-react";

const DashboardPreview = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Dashboard <span className="gradient-text">Preview</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how creators and validators manage their content and earnings
          </p>
        </div>
        
        <div className="space-y-20">
          {/* Author Dashboard */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold">Author Dashboard</h3>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Manage your uploaded content, track validation ratings, monitor earnings, and claim your crypto rewards weekly.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Track content performance and ratings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Monitor real-time earnings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">One-click crypto claims</span>
                </div>
              </div>
              
              <Button className="hero-button">
                View Demo <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            
            <div className="animate-fade-in">
              <img 
                src={authorDashboard} 
                alt="Author dashboard mockup" 
                className="w-full h-auto rounded-2xl shadow-2xl border border-purple-100"
              />
            </div>
          </div>
          
          {/* Validator Dashboard */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="lg:order-2 space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-bold">Validator Dashboard</h3>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Review and rate content submissions, earn validator incentives, and help maintain platform quality standards.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Review content queue</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Rate content quality (1-10)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Earn validation rewards</span>
                </div>
              </div>
              
              <Button className="hero-button">
                Become Validator <TrendingUp className="w-5 h-5 ml-2" />
              </Button>
            </div>
            
            <div className="lg:order-1 animate-fade-in">
              <img 
                src={validatorDashboard} 
                alt="Validator dashboard mockup" 
                className="w-full h-auto rounded-2xl shadow-2xl border border-purple-100"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;