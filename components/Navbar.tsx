'use client'

import { useClerk, SignedIn, SignedOut } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { CloudUpload, ChevronDown, User, Menu, X } from 'lucide-react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown'
import { Avatar } from '@heroui/avatar'
import { Button } from '@heroui/button'
import { useState, useEffect, useRef } from 'react'

interface SerializedUser {
  id: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  username?: string | null
  emailAddress?: string | null
}

interface NavbarProps {
  user?: SerializedUser | null
}

export default function Navbar({ user }: NavbarProps) {
  const { signOut } = useClerk()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Check if we're on the dashboard page
  const isOnDashboard =
    pathname === '/dashboard' || pathname?.startsWith('/dashboard/')

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Handle clicks outside the mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        // Check if the click is not on the menu button (which has its own handler)
        const target = event.target as HTMLElement
        if (!target.closest('[data-menu-button="true"]')) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const handleSignOut = () => {
    signOut(() => {
      router.push('/')
    })
  }

  // Process user data with defaults if not provided
  const userDetails = {
    fullName: user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : '',
    initials: user
      ? `${user.firstName || ''} ${user.lastName || ''}`
          .trim()
          .split(' ')
          .map((name) => name?.[0] || '')
          .join('')
          .toUpperCase() || 'U'
      : 'U',
    displayName: user
      ? user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username || user.emailAddress || 'User'
      : 'User',
    email: user?.emailAddress || '',
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header
      className={`bg-default-50 border-b border-default-200 sticky top-0 z-50 transition-shadow ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="container mx-auto py-3 md:py-4 px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-10">
            <CloudUpload className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Droply</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-4 items-center">
            {/* Show these buttons when user is signed out */}
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="flat" color="primary">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="solid" color="primary">
                  Sign Up
                </Button>
              </Link>
            </SignedOut>

            {/* Show these when user is signed in */}
            <SignedIn>
              <div className="flex items-center gap-4">
                {!isOnDashboard && (
                  <Link href="/dashboard">
                    <Button variant="flat" color="primary">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      className="p-0 bg-transparent min-w-0"
                      endContent={<ChevronDown className="h-4 w-4 ml-2" />}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={userDetails.initials}
                          size="sm"
                          src={user?.imageUrl || undefined}
                          className="h-8 w-8 flex-shrink-0"
                          fallback={<User className="h-4 w-4" />}
                        />
                        <span className="text-default-600 hidden sm:inline">
                          {userDetails.displayName}
                        </span>
                      </div>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="User actions">
                    <DropdownItem
                      key="profile"
                      description={userDetails.email || 'View your profile'}
                      onClick={() => router.push('/dashboard?tab=profile')}
                    >
                      Profile
                    </DropdownItem>
                    <DropdownItem
                      key="files"
                      description="Manage your files"
                      onClick={() => router.push('/dashboard')}
                    >
                      My Files
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      description="Sign out of your account"
                      className="text-danger"
                      color="danger"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <SignedIn>
              <Avatar
                name={userDetails.initials}
                size="sm"
                src={user?.imageUrl || undefined}
                className="h-8 w-8 flex-shrink-0"
                fallback={<User className="h-4 w-4" />}
              />
            </SignedIn>
            <button
              className="z-50 p-2"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              data-menu-button="true"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-default-700" />
              ) : (
                <Menu className="h-6 w-6 text-default-700" />
              )}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Mobile Menu */}
          <div
            ref={mobileMenuRef}
            className={`fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-default-50 z-40 flex flex-col pt-20 px-6 shadow-xl transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            } md:hidden`}
          >
            <SignedOut>
              <div className="flex flex-col gap-4 items-center">
                <Link
                  href="/sign-in"
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="flat" color="primary" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="solid" color="primary" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex flex-col gap-6">
                {/* User info */}
                <div className="flex items-center gap-3 py-4 border-b border-default-200">
                  <Avatar
                    name={userDetails.initials}
                    size="md"
                    src={user?.imageUrl || undefined}
                    className="h-10 w-10 flex-shrink-0"
                    fallback={<User className="h-5 w-5" />}
                  />
                  <div>
                    <p className="font-medium">{userDetails.displayName}</p>
                    <p className="text-sm text-default-500">
                      {userDetails.email}
                    </p>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="flex flex-col gap-4">
                  {!isOnDashboard && (
                    <Link
                      href="/dashboard"
                      className="py-2 px-3 hover:bg-default-100 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/dashboard?tab=profile"
                    className="py-2 px-3 hover:bg-default-100 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    className="py-2 px-3 text-left text-danger hover:bg-danger-50 rounded-md transition-colors mt-4"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleSignOut()
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  )
}
