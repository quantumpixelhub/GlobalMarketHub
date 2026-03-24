export function LogoVariations() {
  return (
    <div className="w-full p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">Logo Design Variations</h1>
        <p className="text-center text-gray-600 mb-12">Choose your favorite logo design for GlobalMarketHub</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Logo 1: Modern Minimalist */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Minimalist design */}
                <g transform="translate(50, 25)">
                  {/* Shopping bag shape */}
                  <path d="M20 10 L30 10 L32 40 Q32 45 27 45 L13 45 Q8 45 8 40 L10 10 Z" fill="#0891b2" />
                  {/* Globe dots */}
                  <circle cx="5" cy="25" r="2.5" fill="#06b6d4" />
                  <circle cx="45" cy="25" r="2.5" fill="#06b6d4" />
                  <circle cx="25" cy="15" r="2.5" fill="#06b6d4" />
                </g>
                {/* Text */}
                <text x="100" y="70" fontSize="18" fontWeight="bold" fill="#0891b2">GMH</text>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Minimalist Cyber</h3>
            <p className="text-gray-600 text-sm text-center">Modern, clean shopping bag with global dots</p>
            <button className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 2: Bold Geometric */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-emerald-50 to-red-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Bold geometric */}
                <g transform="translate(40, 20)">
                  {/* Hexagon with arrows */}
                  <path d="M40 10 L70 25 L70 55 L40 70 L10 55 L10 25 Z" fill="none" stroke="#dc2626" strokeWidth="3" />
                  <path d="M40 30 L50 50" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M40 30 L30 50" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Bold Hexagon</h3>
            <p className="text-gray-600 text-sm text-center">Trading arrows in hexagon shape</p>
            <button className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 3: Circular Badge */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Circular badge */}
                <g transform="translate(50, 15)">
                  <circle cx="25" cy="25" r="22" fill="none" stroke="#a855f7" strokeWidth="2" />
                  <circle cx="25" cy="25" r="18" fill="rgba(168, 85, 247, 0.1)" />
                  {/* Shopping with rings */}
                  <path d="M22 18 L28 18 L29 32 L21 32 Z" fill="#a855f7" />
                  <circle cx="16" cy="30" r="2" fill="#a855f7" />
                  <circle cx="34" cy="30" r="2" fill="#a855f7" />
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Circular Badge</h3>
            <p className="text-gray-600 text-sm text-center">Modern circular design with badge style</p>
            <button className="w-full mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 4: Tech Connected */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Tech nodes */}
                <g transform="translate(35, 20)">
                  {/* Nodes */}
                  <circle cx="15" cy="15" r="3.5" fill="#10b981" />
                  <circle cx="50" cy="15" r="3.5" fill="#10b981" />
                  <circle cx="32.5" cy="45" r="3.5" fill="#10b981" />
                  {/* Connections */}
                  <line x1="15" y1="15" x2="50" y2="15" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                  <line x1="15" y1="15" x2="32.5" y2="45" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                  <line x1="50" y1="15" x2="32.5" y2="45" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                  {/* Center */}
                  <circle cx="32.5" cy="25" r="2" fill="#059669" />
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Connected Network</h3>
            <p className="text-gray-600 text-sm text-center">Tech-focused interconnected nodes</p>
            <button className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 5: Retro Vintage */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-yellow-50 to-emerald-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Retro vintage */}
                <g transform="translate(40, 15)">
                  <path d="M25 10 Q40 10 45 25 Q40 40 25 40 Q10 40 5 25 Q10 10 25 10 Z" 
                        fill="none" stroke="#ea580c" strokeWidth="2.5" strokeDasharray="2,2" />
                  {/* Retro bag */}
                  <path d="M20 20 L30 20 L32 35 L18 35 Z" fill="#ea580c" opacity="0.7" />
                  <rect x="20" y="18" width="10" height="3" fill="#ea580c" />
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Retro Vintage</h3>
            <p className="text-gray-600 text-sm text-center">Classic vintage marketplace style</p>
            <button className="w-full mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 6: Modern Shopping Hub */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-red-50 to-rose-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Shopping hub */}
                <g transform="translate(35, 15)">
                  {/* Central hub */}
                  <circle cx="30" cy="25" r="12" fill="#e11d48" opacity="0.1" stroke="#e11d48" strokeWidth="2" />
                  {/* Shopping bags around */}
                  <path d="M28 8 L32 8 L33 18 L27 18 Z" fill="#e11d48" />
                  <path d="M15 20 L20 16 L24 22 L20 26 Z" fill="#e11d48" opacity="0.8" />
                  <path d="M45 20 L50 16 L54 22 L50 26 Z" fill="#e11d48" opacity="0.8" />
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Shopping Hub</h3>
            <p className="text-gray-600 text-sm text-center">Multiple shopping bags around hub</p>
            <button className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 7: Dynamic Globe */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Dynamic globe */}
                <g transform="translate(35, 15)">
                  <circle cx="30" cy="25" r="18" fill="none" stroke="#4f46e5" strokeWidth="2" />
                  <ellipse cx="30" cy="25" rx="18" ry="8" fill="none" stroke="#4f46e5" strokeWidth="1.5" opacity="0.5" />
                  <path d="M30 7 Q30 25 30 43" stroke="#4f46e5" strokeWidth="1.5" opacity="0.5" />
                  {/* Arrows crossing */}
                  <path d="M20 25 L40 25" stroke="#818cf8" strokeWidth="2" />
                  <path d="M30 18 L30 32" stroke="#818cf8" strokeWidth="2" />
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Dynamic Globe</h3>
            <p className="text-gray-600 text-sm text-center">Globe with global trade arrows</p>
            <button className="w-full mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 8: Lettermark GMH */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Lettermark */}
                <g transform="translate(40, 15)">
                  {/* Shape background */}
                  <rect x="5" y="5" width="60" height="60" rx="8" fill="none" stroke="#0d9488" strokeWidth="2" />
                  {/* Letters */}
                  <text x="35" y="50" fontSize="36" fontWeight="bold" fill="#0d9488" textAnchor="middle">GMH</text>
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Lettermark GMH</h3>
            <p className="text-gray-600 text-sm text-center">Clean lettermark with modern frame</p>
            <button className="w-full mt-4 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors">
              Choose This
            </button>
          </div>

          {/* Logo 9: Premium Gradient Fusion */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-blue-300">
            <div className="flex items-center justify-center h-24 mb-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded">
              <svg viewBox="0 0 200 100" className="h-20 w-auto" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                {/* Premium design */}
                <g transform="translate(40, 15)">
                  <circle cx="30" cy="25" r="20" fill="none" stroke="url(#premiumGrad)" strokeWidth="2.5" />
                  <path d="M20 20 L40 20 L42 35 L18 35 Z" fill="url(#premiumGrad)" opacity="0.9" />
                  <circle cx="15" cy="15" r="2" fill="url(#premiumGrad)" />
                  <circle cx="45" cy="15" r="2" fill="url(#premiumGrad)" />
                </g>
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-center">Premium Gradient</h3>
            <p className="text-gray-600 text-sm text-center">
              <span className="text-blue-600 font-semibold">✨ RECOMMENDED ✨</span>
              <br />
              Modern gradient with shopping icon
            </p>
            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded hover:opacity-90 transition-opacity font-semibold">
              Choose This (Recommended)
            </button>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">How to Choose?</h2>
          <ul className="space-y-3 text-gray-700">
            <li>✓ <strong>Modern Minimalist:</strong> Best for tech-forward, clean aesthetic</li>
            <li>✓ <strong>Bold Hexagon:</strong> Perfect for energy and trading focus</li>
            <li>✓ <strong>Circular Badge:</strong> Great for app icons and favicons</li>
            <li>✓ <strong>Connected Network:</strong> Ideal if emphasizing global connectivity</li>
            <li>✓ <strong>Retro Vintage:</strong> Unique, memorable, nostalgic appeal</li>
            <li>✓ <strong>Shopping Hub:</strong> Most directly represents marketplace</li>
            <li>✓ <strong>Dynamic Globe:</strong> Best for global trade messaging</li>
            <li>✓ <strong>Lettermark GMH:</strong> Professional, timeless lettermark style</li>
            <li>✨ <strong>Premium Gradient:</strong> Most modern, versatile, professional (RECOMMENDED)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
