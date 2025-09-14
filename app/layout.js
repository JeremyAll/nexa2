import './globals.css'

export const metadata = {
  title: 'Nexa App - AI Code Generator v2',
  description: 'Production-ready AI code generator with streaming architecture',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Nexa App v2.0
            </h1>
            <div className="flex space-x-4">
              <span className="text-sm text-gray-400">Production Ready</span>
              <span className="px-2 py-1 bg-green-500 text-xs rounded">LIVE</span>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}