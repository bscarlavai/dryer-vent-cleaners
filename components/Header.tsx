'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Search from './Search'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <img src="/dojangs.png" alt="Dojangs - Find Taekwondo Schools" className="h-16 w-16" />
            <div>
              <h2 className="text-xl font-bold text-navy">Dojangs</h2>
              <p className="text-xs text-navy-700">Find Local Taekwondo Schools</p>
            </div>
          </Link>

          {/* Desktop Search - Give it more space */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8">
            <Search />
          </div>

          {/* Desktop Navigation - Condensed */}
          <nav className="hidden md:flex items-center space-x-6 flex-shrink-0">
            <Link
              href="/"
              className="text-navy hover:text-primary font-medium transition-colors text-sm"
            >
              Home
            </Link>
            <Link href="/taekwondo-near-me" className="text-navy hover:text-primary font-medium transition-colors text-sm">
              Near Me
            </Link>
            <Link
              href="/states"
              className="text-navy hover:text-primary font-medium transition-colors text-sm"
            >
              States
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-navy hover:text-primary hover:bg-blue-50"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Search and Near Me */}
        <div className="md:hidden mb-4 px-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Search />
            </div>
            <Link
              href="/taekwondo-near-me"
              className="inline-flex items-center justify-center px-3 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm whitespace-nowrap"
            >
              Near Me
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-primary font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/states" 
                className="text-gray-700 hover:text-primary font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse States
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 