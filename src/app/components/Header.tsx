'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setIsLoggedIn(true);
      setUserName(userData.fullName || userData.phone);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container px-4 py-3 flex justify-between items-center max-w-md mx-auto">
        <Link href="/" className="text-xl font-bold text-blue-600">
          همیار مجازی
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative group">
              <button className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  {userName.charAt(0)}
                </div>
                <span className="text-sm hidden md:inline">{userName}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}