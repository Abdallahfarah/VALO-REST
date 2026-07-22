import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import valoLogo from '../../../../Docs/valo-logo.webp';

export interface FeatureCardItem {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBgClass: string;
  iconTextClass: string;
}

export interface AuthLayoutProps {
  variant?: 'restaurant' | 'superadmin';
  headline: ReactNode;
  subheadline: string;
  featureCards?: FeatureCardItem[];
  title: string;
  subtitle: string;
  footerText?: string;
  children: ReactNode;
  headerBadge?: ReactNode;
}

const animationStyles = `
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}

.animate-fade-down {
  animation: fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-fade-up {
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-slide-up {
  animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-scale-in {
  animation: scaleIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-float-1 {
  animation: float 6s ease-in-out infinite;
}
.animate-float-2 {
  animation: float 6s ease-in-out infinite;
  animation-delay: 1.5s;
}
.animate-float-3 {
  animation: float 6s ease-in-out infinite;
  animation-delay: 3s;
}
`;

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  variant = 'restaurant',
  headline,
  subheadline,
  featureCards = [],
  title,
  subtitle,
  footerText = 'Powered by Dhadhan HUB',
  children,
  headerBadge
}) => {
  const isSuperAdmin = variant === 'superadmin';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFFFFF]">
      <style>{animationStyles}</style>

      {/* Left Pane - Branding & Floating Feature Cards */}
      <div className={`hidden md:flex w-full md:w-[40%] ${isSuperAdmin ? 'bg-[#0B1630]' : 'bg-[#0F172A]'} relative overflow-hidden flex-col p-8 lg:p-16 text-white shrink-0 justify-between md:min-h-screen`}>
        {/* Background Image Overlay with deep overlay */}
        <div className="absolute inset-0 opacity-20 select-none pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=75&w=1200&fm=webp" 
            alt="Restaurant Interior"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width={1200}
            height={800}
          />
          <div className={`absolute inset-0 ${isSuperAdmin ? 'bg-[#0B1630]/80' : 'bg-[#0F172A]/70'} mix-blend-multiply`} />
          <div className={`absolute inset-0 bg-gradient-to-t ${isSuperAdmin ? 'from-[#0B1630]' : 'from-[#0F172A]'} via-transparent to-transparent`} />
        </div>

        <div className="relative z-10 my-auto space-y-8 lg:space-y-12">
          <div className="space-y-4 animate-fade-up">
            <h2 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight">
              {headline}
            </h2>
            <p className="text-[#64748B] text-sm lg:text-base leading-relaxed max-w-md font-medium">
              {subheadline}
            </p>
          </div>

          {/* Feature Cards */}
          {featureCards.length > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:gap-6 pt-4">
              {featureCards.map((card, idx) => {
                const IconComponent = card.icon;
                const floatClass = idx === 0 ? 'animate-float-1' : idx === 1 ? 'animate-float-2' : 'animate-float-3';
                return (
                  <div key={idx} className={`flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm ${floatClass} hover:border-[#334155]/60 hover:-translate-y-1 transition-all duration-300`}>
                    <div className={`w-10 h-10 rounded-xl ${card.iconBgClass} border flex items-center justify-center shrink-0 ${card.iconTextClass}`}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{card.title}</h3>
                      <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">{card.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer tag */}
        <div className="hidden lg:block mt-auto relative z-10 pt-8">
          <p className="text-[#64748B] text-[10px] font-bold tracking-wider uppercase">{footerText}</p>
        </div>
      </div>

      {/* Right Pane - Form Card Container */}
      <div className="flex-1 bg-slate-50 md:bg-[#FFFFFF] flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16 min-h-screen relative">
        
        {/* Mobile Hero Banner */}
        <div className="relative w-full h-40 overflow-hidden rounded-[20px] mb-6 md:hidden shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=70&w=600" 
            alt="Restaurant Interior Mobile"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-[#0F172A]/70 mix-blend-multiply" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
            <h2 className="text-xl font-bold leading-tight">Dhadhan HUB</h2>
            <span className="text-[#F97316] text-xs font-bold">Restaurant Operations Platform</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-lg bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-6 sm:p-10 md:p-12 shadow-sm animate-scale-in flex flex-col mx-auto my-auto justify-center">
          
          {/* Header Badge or Logo */}
          {headerBadge ? (
            <div className="mb-4 flex justify-center animate-fade-down">
              {headerBadge}
            </div>
          ) : (
            <div className="mb-6 flex justify-center animate-fade-down">
              <img 
                src={valoLogo} 
                alt="Dhadhan HUB Logo" 
                className="h-10 w-auto object-contain"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={50}
                height={40}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="mb-6 flex flex-col items-center justify-center">
            <h1 className="text-[32px] sm:text-[40px] font-bold text-[#0F172A] tracking-tight text-center leading-none">{title}</h1>
            <p className="text-[#64748B] font-medium text-xs sm:text-sm text-center mt-2">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
