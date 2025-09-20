'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import {
  Trophy,
  Users,
  Target,
  Zap,
  Calendar,
  ArrowRight,
  Star,
  Award,
  Flame,
  Shield,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Trophy,
      title: 'Victory Tracking',
      description: 'Celebrate every win, goal, and achievement with our comprehensive scoring system',
      color: 'text-yellow-400'
    },
    {
      icon: Users,
      title: 'Team Unity',
      description: 'Bring your squad together with shared stats, leaderboards, and team spirit',
      color: 'text-blue-400'
    },
    {
      icon: Target,
      title: 'Performance Rules',
      description: 'Custom point systems that reward the grit and determination of real team sports',
      color: 'text-green-400'
    },
    {
      icon: Calendar,
      title: 'Game Management',
      description: 'From scheduling to live scores - manage every aspect of your team sports journey',
      color: 'text-purple-400'
    },
    {
      icon: Flame,
      title: 'Live Action',
      description: 'Real-time wallboards and live scores that capture the heat of competition',
      color: 'text-red-400'
    },
    {
      icon: Shield,
      title: 'Club Loyalty',
      description: 'Built for clubs who stick together through wins, losses, and everything between',
      color: 'text-orange-400'
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header with Video Background */}
      <header className="relative min-h-screen overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/shoe-video.mp4" type="video/mp4" />
          </video>

          {/* Video Overlay with Gradient */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: 'radial-gradient(circle at center, #e879f9, #a855f7, #7c2d92, #4c1d95)'
            }}
          />

          {/* Additional dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-4 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center backdrop-blur-sm">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">Shoey</h1>
            </div>

            <Link href="/dashboard">
              <GlassButton variant="primary" icon={ArrowRight}>
                Enter App
              </GlassButton>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-4 py-12 md:py-20 flex items-center min-h-[80vh]">
          <div className="max-w-7xl mx-auto text-center w-full">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
                Victory Tastes Better
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                  From the Boot
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 max-w-4xl mx-auto drop-shadow-lg">
                The team sports management system that celebrates every goal, every win,
                and every moment of glory with the same down-to-earth spirit as a proper shoey.
              </p>
            </div>

            <div className="flex justify-center mb-12">
              <Link href="/dashboard">
                <GlassButton variant="primary" size="lg" icon={Trophy}>
                  Start Managing Your Team
                </GlassButton>
              </Link>
            </div>

            {/* Hero Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <GlassCard className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Team First</h3>
                <p className="text-white/60">Built for clubs that know team sports is about more than just the score</p>
              </GlassCard>

              <GlassCard className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto mb-4">
                  <Award size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Earn Your Victory</h3>
                <p className="text-white/60">Custom rules that reward grit, teamwork, and that winning spirit</p>
              </GlassCard>

              <GlassCard className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
                  <Flame size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Live the Moment</h3>
                <p className="text-white/60">Real-time scores and stats that capture every thrilling second</p>
              </GlassCard>
            </div>
          </div>
        </div>
      </header>


      {/* What is Shoey Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <GlassCard padding="lg">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Why "Shoey"?
                </h2>
                <p className="text-lg text-white/80 mb-6">
                  A <strong className="text-white">shoey</strong> is an Australian drinking ritual -
                  pouring a celebratory drink into a shoe and drinking it after a big victory.
                  Made famous by F1 champion Daniel Ricciardo, it embodies that raw,
                  down-to-earth celebration of overcoming adversity.
                </p>
                <p className="text-lg text-white/80 mb-8">
                  Just like team sports itself - it's not about being fancy or dignified.
                  It's about <strong className="text-yellow-400">real team spirit</strong>,
                  celebrating hard-fought victories, and the unbreakable bonds forged
                  through sweat, determination, and shared triumph.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white">Authentic team celebration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white">Down-to-earth attitude</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white">Victory earned, not given</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-2xl p-8 border border-white/10">
                  <div className="text-center">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-4">That's the Spirit!</h3>
                    <p className="text-white/80 italic">
                      "Whether it's drinking from a boot or managing your team -
                      it's all about celebrating the wins that matter most."
                    </p>
                    <div className="mt-6 text-sm text-white/60">
                      - Daniel Ricciardo, F1 Champion & Shoey Legend
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Built for Victory
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Every feature designed to celebrate your team's journey from training ground heroics to championship glory
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <GlassCard key={index} className="p-6 hover:scale-105 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-lg bg-white/10 ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard padding="lg">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Celebrate Victory?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join the teams who know that every goal deserves to be celebrated,
              every player deserves recognition, and every victory tastes better when shared.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <GlassButton variant="primary" size="lg" icon={Trophy}>
                  Start Your Victory Journey
                </GlassButton>
              </Link>
              <GlassButton variant="glass" size="lg" icon={Users}>
                Contact Our Team
              </GlassButton>
            </div>

            <div className="mt-8 text-sm text-white/60">
              Free to start • No credit card required • Built by sports people, for sports people
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Shoey</span>
          </div>
          <p className="text-white/60 mb-4">
            Victory tastes better from the boot. 🥾🏆
          </p>
          <div className="text-sm text-white/40">
            © 2025 Shoey Team Sports Management. Built with the same spirit as a proper celebration.
          </div>
        </div>
      </footer>
    </div>
  );
}