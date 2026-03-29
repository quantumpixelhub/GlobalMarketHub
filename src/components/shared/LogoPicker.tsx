'use client';

import { useState } from 'react';

interface LogoOption {
  id: string;
  name: string;
  description: string;
  color1: string;
  color2: string;
  bgGradient: string;
  svg: string;
  recommended?: boolean;
}

const logoOptions: LogoOption[] = [
  {
    id: 'modern-flat',
    name: 'Modern Flat Market',
    description: 'Clean, modern design perfect for contemporary brands',
    color1: '#3B82F6',
    color2: '#1E40AF',
    bgGradient: 'from-rose-50 to-rose-100',
    svg: `<g transform="translate(35, 15)">
      <rect x="10" y="20" width="40" height="25" rx="4" fill="#3B82F6" opacity="0.15" />
      <path d="M25 20 L35 20 L38 45 L22 45 Z" fill="#3B82F6" />
      <circle cx="20" cy="15" r="3" fill="#1E40AF" />
      <circle cx="50" cy="15" r="3" fill="#1E40AF" />
      <path d="M30 25 L35 30 L30 35" stroke="#1E40AF" strokeWidth="2" fill="none" />
    </g>`,
    recommended: true,
  },
  {
    id: 'vibrant-commerce',
    name: 'Vibrant Commerce',
    description: 'Energetic and bold for dynamic marketplace',
    color1: '#EC4899',
    color2: '#BE185D',
    bgGradient: 'from-pink-50 to-pink-100',
    svg: `<g transform="translate(35, 15)">
      <circle cx="30" cy="20" r="15" fill="#EC4899" opacity="0.1" stroke="#EC4899" strokeWidth="2" />
      <path d="M25 22 L35 22 L37 38 L23 38 Z" fill="#EC4899" />
      <path d="M20 18 L28 25 L20 32" stroke="#BE185D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M40 18 L32 25 L40 32" stroke="#BE185D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>`,
  },
  {
    id: 'premium-gradient',
    name: 'Premium Gradient Sphere',
    description: 'Luxurious, professional with modern gradient effects',
    color1: '#8B5CF6',
    color2: '#DC2626',
    bgGradient: 'from-purple-50 to-red-50',
    svg: `<defs>
      <linearGradient id="sphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
    </defs>
    <g transform="translate(30, 15)">
      <circle cx="30" cy="25" r="18" fill="none" stroke="url(#sphereGrad)" strokeWidth="3" />
      <circle cx="30" cy="25" r="14" fill="none" stroke="url(#sphereGrad)" strokeWidth="1.5" opacity="0.5" />
      <path d="M30 7 Q30 25 30 43" stroke="url(#sphereGrad)" strokeWidth="1.5" opacity="0.5" />
    </g>`,
    recommended: true,
  },
  {
    id: 'tech-nexus',
    name: 'Tech Nexus',
    description: 'Modern technology-focused design with connected elements',
    color1: '#ff5a5f',
    color2: '#047857',
    bgGradient: 'from-rose-50 to-rose-100',
    svg: `<g transform="translate(32, 18)">
      <circle cx="15" cy="20" r="3.5" fill="#ff5a5f" />
      <circle cx="45" cy="20" r="3.5" fill="#ff5a5f" />
      <circle cx="30" cy="40" r="3.5" fill="#ff5a5f" />
      <line x1="15" y1="20" x2="45" y2="20" stroke="#047857" strokeWidth="2" opacity="0.7" />
      <line x1="15" y1="20" x2="30" y2="40" stroke="#047857" strokeWidth="2" opacity="0.7" />
      <line x1="45" y1="20" x2="30" y2="40" stroke="#047857" strokeWidth="2" opacity="0.7" />
      <circle cx="30" cy="27" r="2.5" fill="#047857" />
    </g>`,
  },
  {
    id: 'minimal-badge',
    name: 'Minimal Badge',
    description: 'Minimalist elegant badge design',
    color1: '#14B8A6',
    color2: '#D97706',
    bgGradient: 'from-teal-50 to-teal-100',
    svg: `<g transform="translate(38, 20)">
      <circle cx="18" cy="18" r="16" fill="none" stroke="#14B8A6" strokeWidth="2.5" />
      <path d="M16 10 L20 10 L21 24 L15 24 Z" fill="#14B8A6" />
      <circle cx="10" cy="24" r="1.5" fill="#D97706" />
      <circle cx="26" cy="24" r="1.5" fill="#D97706" />
    </g>`,
  },
  {
    id: 'enterprise-pro',
    name: 'Enterprise Pro',
    description: 'Professional corporate marketplace identity',
    color1: '#1F2937',
    color2: '#9CA3AF',
    bgGradient: 'from-gray-50 to-gray-100',
    svg: `<g transform="translate(35, 15)">
      <rect x="12" y="12" width="36" height="36" rx="6" fill="none" stroke="#1F2937" strokeWidth="2.5" />
      <path d="M22 22 L38 22 L40 38 L20 38 Z" fill="#1F2937" opacity="0.8" />
      <rect x="16" y="18" width="8" height="2.5" fill="#9CA3AF" />
      <circle cx="32" cy="35" r="2" fill="#9CA3AF" />
    </g>`,
  },
  {
    id: 'cosmic-fusion',
    name: 'Cosmic Fusion',
    description: 'Modern cosmic design with vibrant energy',
    color1: '#06B6D4',
    color2: '#0891B2',
    bgGradient: 'from-cyan-50 to-rose-100',
    svg: `<defs>
      <radialGradient id="cosmicGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0891B2" />
      </radialGradient>
    </defs>
    <g transform="translate(32, 15)">
      <circle cx="30" cy="25" r="20" fill="url(#cosmicGrad)" opacity="0.15" stroke="url(#cosmicGrad)" strokeWidth="2" />
      <circle cx="25" cy="18" r="3" fill="#06B6D4" />
      <circle cx="35" cy="18" r="3" fill="#06B6D4" />
      <circle cx="30" cy="32" r="3" fill="#06B6D4" />
    </g>`,
  },
  {
    id: 'dynamic-arrows',
    name: 'Dynamic Arrows',
    description: 'Movement and progress focused design',
    color1: '#EF4444',
    color2: '#B91C1C',
    bgGradient: 'from-red-50 to-rose-100',
    svg: `<g transform="translate(33, 18)">
      <path d="M20 15 L28 25 L20 35" stroke="#EF4444" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 15 L43 25 L35 35" stroke="#EF4444" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27.5" cy="25" r="1.5" fill="#B91C1C" />
    </g>`,
  },
];

export function LogoPicker() {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(logoOptions[2].id);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">Choose Your Logo</h1>
          <p className="text-xl text-gray-300">Select the design that best represents GlobalMarketHub</p>
        </div>

        {/* Logo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {logoOptions.map((logo) => (
            <div
              key={logo.id}
              className={`relative group transition-all cursor-pointer ${
                selectedLogo === logo.id
                  ? 'ring-4 ring-rose-500 shadow-2xl scale-105'
                  : 'ring-2 ring-gray-700 hover:ring-4 hover:ring-gray-500'
              }`}
              onClick={() => setSelectedLogo(logo.id)}
            >
              <div
                className={`bg-gradient-to-br ${logo.bgGradient} rounded-xl p-8 h-64 flex flex-col transition-all`}
              >
                {/* Logo Display */}
                <div className="flex-1 flex items-center justify-center mb-4">
                  <svg
                    viewBox="0 0 200 100"
                    className="h-32 w-auto drop-shadow-lg"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {logoOptions[logoOptions.indexOf(logo)].svg && (
                      <g dangerouslySetInnerHTML={{
                        __html: logoOptions[logoOptions.indexOf(logo)].svg,
                      }} />
                    )}
                  </svg>
                </div>

                {/* Info */}
                <div className="text-center">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{logo.name}</h3>
                  <p className="text-sm text-gray-600">{logo.description}</p>
                </div>

                {/* Badge */}
                {logo.recommended && (
                  <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    ✨ Recommended
                  </div>
                )}

                {/* Selection Indicator */}
                {selectedLogo === logo.id && (
                  <div className="absolute bottom-3 right-3 bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Logo Details */}
        {selectedLogo && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Logo Preview */}
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">FULL SIZE PREVIEW</h3>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 w-full">
                  <svg
                    viewBox="0 0 200 100"
                    className="h-40 w-auto mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {logoOptions.find((l) => l.id === selectedLogo)?.svg && (
                      <g
                        dangerouslySetInnerHTML={{
                          __html: logoOptions.find((l) => l.id === selectedLogo)!.svg,
                        }}
                      />
                    )}
                  </svg>
                </div>
              </div>

              {/* Details */}
              <div className="md:col-span-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {logoOptions.find((l) => l.id === selectedLogo)?.name}
                </h2>
                <p className="text-gray-600 text-lg mb-6">
                  {logoOptions.find((l) => l.id === selectedLogo)?.description}
                </p>

                {/* Color Palette */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Color Palette</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-12 rounded shadow"
                        style={{
                          backgroundColor: logoOptions.find((l) => l.id === selectedLogo)?.color1,
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        {logoOptions.find((l) => l.id === selectedLogo)?.color1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-12 rounded shadow"
                        style={{
                          backgroundColor: logoOptions.find((l) => l.id === selectedLogo)?.color2,
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        {logoOptions.find((l) => l.id === selectedLogo)?.color2}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="flex-1 bg-rose-600 text-white font-semibold py-3 rounded-lg hover:bg-rose-700 transition-colors">
                    Select This Logo
                  </button>
                  <button className="flex-1 bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors">
                    View Guidelines
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Section */}
        <div className="bg-white bg-opacity-5 backdrop-blur rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div>
              <h4 className="font-semibold mb-3 text-rose-300">Best For Modern Brands</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Modern Flat Market</li>
                <li>✓ Premium Gradient Sphere</li>
                <li>✓ Minimal Badge</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-pink-300">Best For Energy & Movement</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Vibrant Commerce</li>
                <li>✓ Dynamic Arrows</li>
                <li>✓ Cosmic Fusion</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-rose-300">Best For Professional</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Enterprise Pro</li>
                <li>✓ Tech Nexus</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-purple-300">Recommended Overall</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✨ Premium Gradient Sphere</li>
                <li>✨ Modern Flat Market</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
