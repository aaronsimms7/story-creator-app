import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12 animate-[fadeIn_0.6s_ease-out]">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">
          Story Creator
        </h1>
        <p className="text-xl md:text-2xl text-white/90">
          Create magical picture books with your voice
        </p>
      </div>

      <div className="card max-w-2xl w-full text-center animate-[fadeIn_0.8s_ease-out]">
        <h2 className="text-3xl font-bold text-purple-800 mb-4">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <div className="text-4xl mb-2">🎤</div>
            <h3 className="font-bold text-purple-700">1. Create Your Character</h3>
            <p className="text-gray-600 text-sm mt-1">
              Describe your main character using your voice and watch them come to life
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-bold text-purple-700">2. Tell Your Story</h3>
            <p className="text-gray-600 text-sm mt-1">
              Narrate the adventure and see each scene illustrated as you go
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">📖</div>
            <h3 className="font-bold text-purple-700">3. Get Your Book</h3>
            <p className="text-gray-600 text-sm mt-1">
              Receive a real printed picture book you can hold
            </p>
          </div>
        </div>

        <Link
          href="/create"
          className="btn-primary inline-block text-2xl py-4 px-10 animate-[pulse_2s_ease-in-out_infinite]"
        >
          Start Creating
        </Link>
      </div>
    </main>
  );
}
