import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Dialog,
  DialogPanel,
} from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useWeb3 } from '../context/Web3Context';
import logo from './images/logo.jpg';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { account, isConnected, disconnectWallet } = useWeb3();
  const [userEmail, setUserEmail] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleNavigation = (href) => {
    setMobileMenuOpen(false);
  
    if (href === '#Home' || href === '#About' || href === '#Values') {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const section = document.getElementById(href.slice(1).toLowerCase());
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }, 400); // Delay to allow the page to load
      } else {
        const section = document.getElementById(href.slice(1).toLowerCase());
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (href === '#Dashboard') {
      if (userEmail || isConnected) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  };
  
  const scrollToSection = (href) => {
    if (href === '#Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const section = document.getElementById(href.slice(1).toLowerCase());
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navigation = [
    { name: 'Home', href: '#Home' },
    { name: 'About', href: '#About' },
    { name: 'Values', href: '#Values' },
    { name: 'Dashboard', href: '#Dashboard' },
    { name: 'Upload', href: '/hardsim' },
  ];

  return (
    <header className="bg-gradient-to-r from-[#000000] to-[#000000] shadow-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4" aria-label="Global">
        <div className="flex lg:flex-1">
          <a href="/" className="-m-1.5 p-1.5 flex items-center ml-2"> {/* Added ml-2 for left margin */}
            <p className="text-2xl font-extrabold leading-7 text-[#6C63FF] tracking-wider hover:text-[#FF6584] transition-colors duration-200">
              CrashChain
            </p>
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-[#F5F5F5] hover:bg-[#6C63FF] hover:text-white transition-colors duration-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex lg:gap-x-10">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                if (item.href.startsWith('#')) {
                  handleNavigation(item.href);
                } else {
                  navigate(item.href);
                }
              }}
              className="text-base font-semibold leading-6 text-[#F5F5F5] hover:text-[#FF6584] hover:underline underline-offset-4 transition-all duration-200"
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:space-x-6">
          {isConnected && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-[#F5F5F5] bg-[#6C63FF] px-3 py-1 rounded-full">
                {formatAddress(account)}
              </span>
              <button
                onClick={disconnectWallet}
                className="text-sm font-medium text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          )}
          {userEmail ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-[#F5F5F5] bg-[#6C63FF] px-3 py-1 rounded-full">
                {userEmail.split('@')[0]}
              </span>
              <button
                onClick={() => signOut(auth)}
                className="text-sm font-medium text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm font-semibold leading-6 text-[#F5F5F5] hover:text-[#FF6584] hover:underline underline-offset-4 transition-all duration-200"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
