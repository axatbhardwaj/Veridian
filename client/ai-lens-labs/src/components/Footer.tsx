import { FileText, Shield, Users } from "lucide-react";
import { WalletButton } from '@/components/WalletButton';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-background to-secondary/20 border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-purple-500 p-2 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold gradient-text">KnowledgeAI</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Empowering the next generation of AI through quality knowledge sharing and fair compensation.
            </p>
            <WalletButton />
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-foreground">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Roadmap</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          
          {/* Community */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-foreground">Community</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Join as Validator</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Discord</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-foreground">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Security</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground">
              © 2024 KnowledgeAI. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Secured by Blockchain</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Community Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;