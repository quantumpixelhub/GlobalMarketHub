export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-600">GlobalMarketHub</h1>
          <div className="space-x-4">
            <a href="/products" className="text-gray-700 hover:text-emerald-600">
              Products
            </a>
            <a href="/cart" className="text-gray-700 hover:text-emerald-600">
              Cart
            </a>
            <a href="/auth/login" className="text-gray-700 hover:text-emerald-600">
              Login
            </a>
          </div>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Welcome to GlobalMarketHub
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Shop organic foods, skincare & cosmetics from top Bangladesh e-commerce platforms
        </p>
        <div className="space-x-4">
          <a
            href="/products"
            className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            Shop Now
          </a>
          <a
            href="/auth/register"
            className="inline-block border-2 border-emerald-600 text-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-50 transition"
          >
            Sign Up
          </a>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8 text-center">Featured Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h4 className="text-xl font-semibold mb-2">Organic Food</h4>
              <p className="text-gray-600">Fresh, certified organic products from trusted sellers</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h4 className="text-xl font-semibold mb-2">Skincare</h4>
              <p className="text-gray-600">Premium skincare products for all skin types</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h4 className="text-xl font-semibold mb-2">Cosmetics</h4>
              <p className="text-gray-600">Professional cosmetics from international brands</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2026 GlobalMarketHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
