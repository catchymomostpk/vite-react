import { useLocation } from "wouter";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SplashPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen splash-gradient flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md mx-auto text-center text-white space-y-8">
        <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Coffee className="text-5xl sm:text-6xl text-white" size={64} />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold" data-testid="app-title">Chai-Fi</h1>
          <p className="text-lg sm:text-xl opacity-90" data-testid="app-subtitle">Modern Billing Solution</p>
        </div>
        <Button 
          onClick={() => navigate("/login")} 
          className="w-full sm:w-auto bg-white text-secondary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
          data-testid="button-get-started"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
