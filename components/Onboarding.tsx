
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Globe, Sparkles, Briefcase, GraduationCap, Plane, Heart, Users, Check, Clock, Languages } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

const STEPS = [
  { id: 'welcome', title: "Welcome" },
  { id: 'target_lang', title: "Language" },
  { id: 'motivation', title: "Motivation" },
  { id: 'level', title: "Level" },
  { id: 'commitment', title: "Goal" }
];

const TARGET_LANGUAGES = [
  { id: 'English', label: 'English', flag: '🇺🇸', greeting: 'Hello' },
  { id: 'Spanish', label: 'Spanish', flag: '🇪🇸', greeting: 'Hola' },
  { id: 'French', label: 'French', flag: '🇫🇷', greeting: 'Bonjour' },
  { id: 'German', label: 'German', flag: '🇩🇪', greeting: 'Hallo' },
  { id: 'Italian', label: 'Italian', flag: '🇮🇹', greeting: 'Ciao' },
  { id: 'Japanese', label: 'Japanese', flag: '🇯🇵', greeting: 'こんにちは' },
  { id: 'Portuguese', label: 'Portuguese', flag: '🇧🇷', greeting: 'Olá' },
  { id: 'Chinese', label: 'Chinese', flag: '🇨🇳', greeting: '你好' },
];

const MOTIVATIONS = [
  { id: 'career', label: 'Career Boost', icon: Briefcase, desc: 'Meetings & Interviews' },
  { id: 'travel', label: 'Travel', icon: Plane, desc: 'Navigating & Dining' },
  { id: 'education', label: 'Education', icon: GraduationCap, desc: 'Study Abroad' },
  { id: 'social', label: 'Socializing', icon: Users, desc: 'Making Friends' },
  { id: 'family', label: 'Family', icon: Heart, desc: 'Connecting with Kin' },
];

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'I know basic greetings and words.' },
  { id: 'intermediate', label: 'Intermediate', desc: 'I can have simple conversations.' },
  { id: 'advanced', label: 'Advanced', desc: 'I want to sound like a native speaker.' },
];

const GOALS = [
  { minutes: 5, label: 'Casual', desc: '5 min / day' },
  { minutes: 10, label: 'Regular', desc: '10 min / day' },
  { minutes: 20, label: 'Serious', desc: '20 min / day' },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  
  // Initialize state from storage if available
  const [data, setData] = useState<Partial<UserProfile>>(() => {
    const saved = localStorage.getItem('slang_profile');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return { native_language: 'Spanish', target_language: 'English' };
        }
    }
    return {
        native_language: 'Spanish', // Default, can be changed in app
        target_language: 'English',
    };
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete(data);
    }
  };

  const updateData = (key: keyof UserProfile, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
    setTimeout(handleNext, 300); // Auto-advance for better flow
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-12 min-h-[500px] flex flex-col">
          
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mb-8 text-indigo-600 dark:text-indigo-400">
                <Globe className="w-10 h-10" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Welcome to Fluvio
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-sm leading-relaxed">
                Your personal AI coach for mastering pronunciation and fluency in just minutes a day.
              </p>
              <button 
                onClick={handleNext}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all w-full md:w-auto flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 1: Target Language */}
          {step === 1 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">What language are you learning?</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">We'll customize pronunciation guides for you.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {TARGET_LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => updateData('target_language', lang.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group ${
                        data.target_language === lang.id 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{lang.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{lang.greeting}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Motivation */}
          {step === 2 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">What connects you to learning?</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">We'll tailor your practice content to this goal.</p>
              
              <div className="grid grid-cols-1 gap-3">
                {MOTIVATIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => updateData('motivation', m.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group ${
                        data.motivation === m.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : ''
                    }`}
                  >
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <m.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{m.label}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{m.desc}</p>
                    </div>
                    <ArrowRight className={`w-5 h-5 transition-all ${data.motivation === m.id ? 'text-indigo-500 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Level */}
          {step === 3 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">How would you describe your level?</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">This helps us calibrate the AI feedback sensitivity.</p>
              
              <div className="space-y-4">
                {LEVELS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => updateData('level', l.id)}
                    className={`w-full p-5 rounded-xl border-2 hover:border-indigo-600 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 text-left transition-all hover:shadow-lg relative overflow-hidden group ${
                        data.level === l.id ? 'border-indigo-600 dark:border-indigo-500' : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="relative z-10">
                      <p className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{l.label}</p>
                      <p className="text-slate-500 dark:text-slate-400">{l.desc}</p>
                    </div>
                    <div className={`absolute top-0 right-0 p-4 transition-opacity text-indigo-600 ${data.level === l.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <Check className="w-6 h-6" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Commitment */}
          {step === 4 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Build a daily habit</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Small, consistent efforts lead to fluency.</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                {GOALS.map(g => (
                  <button
                    key={g.minutes}
                    onClick={() => setData(prev => ({ ...prev, daily_goal_minutes: g.minutes }))}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      data.daily_goal_minutes === g.minutes
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-md scale-105'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Clock className={`w-6 h-6 ${data.daily_goal_minutes === g.minutes ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-lg">{g.minutes}m</span>
                    <span className="text-xs font-medium opacity-70">{g.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto">
                 <button 
                  onClick={() => onComplete(data)}
                  disabled={!data.daily_goal_minutes}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                    data.daily_goal_minutes 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl hover:-translate-y-0.5' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5" /> Create My Plan
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Onboarding;
