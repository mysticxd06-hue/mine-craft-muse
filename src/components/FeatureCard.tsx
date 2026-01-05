import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor?: "cyan" | "magenta" | "purple" | "green";
}

const accentStyles = {
  cyan: {
    iconBg: "bg-primary/20",
    iconHover: "group-hover:bg-primary/30",
    iconColor: "text-primary",
    border: "hover:border-primary/50",
    glow: "group-hover:shadow-[0_0_30px_hsl(175_100%_50%/0.2)]",
  },
  magenta: {
    iconBg: "bg-accent/20",
    iconHover: "group-hover:bg-accent/30",
    iconColor: "text-accent",
    border: "hover:border-accent/50",
    glow: "group-hover:shadow-[0_0_30px_hsl(320_100%_60%/0.2)]",
  },
  purple: {
    iconBg: "bg-neon-purple/20",
    iconHover: "group-hover:bg-neon-purple/30",
    iconColor: "text-neon-purple",
    border: "hover:border-neon-purple/50",
    glow: "group-hover:shadow-[0_0_30px_hsl(270_100%_65%/0.2)]",
  },
  green: {
    iconBg: "bg-neon-green/20",
    iconHover: "group-hover:bg-neon-green/30",
    iconColor: "text-neon-green",
    border: "hover:border-neon-green/50",
    glow: "group-hover:shadow-[0_0_30px_hsl(120_100%_50%/0.2)]",
  },
};

export function FeatureCard({ icon: Icon, title, description, accentColor = "cyan" }: FeatureCardProps) {
  const styles = accentStyles[accentColor];
  
  return (
    <div className={`group relative p-6 bg-card/50 backdrop-blur-sm border border-border rounded-xl transition-all duration-500 hover-lift ${styles.border} ${styles.glow}`}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-xl">
        <div className={`absolute -top-8 -right-8 w-16 h-16 rotate-45 ${styles.iconBg} opacity-50 group-hover:opacity-100 transition-opacity`} />
      </div>
      
      <div className="relative z-10">
        <div className={`h-14 w-14 rounded-lg ${styles.iconBg} ${styles.iconHover} flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110`}>
          <Icon className={`h-7 w-7 ${styles.iconColor}`} />
        </div>
        
        <h3 className="font-display font-semibold text-lg text-foreground mb-3 tracking-wide">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed font-body">
          {description}
        </p>
      </div>
      
      {/* Bottom border glow */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 ${styles.iconBg.replace('/20', '')} group-hover:w-3/4 transition-all duration-500 rounded-full`} />
    </div>
  );
}
