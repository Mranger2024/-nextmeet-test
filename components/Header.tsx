export default function Header() {
  return (
    <header className="w-full px-6 py-4 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          NextMeet
        </h1>
        <nav className="space-x-4">
          <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            Start Chat
          </button>
        </nav>
      </div>
    </header>
  )
} 