'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon?: string
}

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  userRole: string
  userName: string
  navItems: NavItem[]
}

export default function DashboardLayout({
  children,
  title,
  userRole,
  userName,
  navItems
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentTitle, setCurrentTitle] = useState(title)

  const handleLogout = () => {
    // Clear session and redirect to login
    router.push('/login')
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Hosi-Link</h2>
          <p>{userRole} Dashboard</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-header">
          <h1 id="page-title">{currentTitle}</h1>
          <div className="user-info">
            <span id="user-name">{userName}</span>
          </div>
        </div>
        {children}
      </main>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
        }

        .sidebar {
          width: 250px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
        }

        .sidebar-header {
          text-align: center;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          margin-bottom: 20px;
        }

        .sidebar-header h2 {
          font-size: 1.8rem;
          margin-bottom: 5px;
        }

        .sidebar-header p {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .sidebar-nav :global(.nav-link) {
          color: white;
          text-decoration: none;
          padding: 12px 15px;
          border-radius: 8px;
          transition: background 0.3s;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-nav :global(.nav-link:hover),
        .sidebar-nav :global(.nav-link.active) {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-nav :global(.nav-link.active) {
          font-weight: 600;
        }

        .sidebar-footer {
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logout-btn {
          background: rgba(231, 76, 60, 0.8);
          color: white;
          padding: 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          font-weight: 600;
          transition: background 0.3s;
        }

        .logout-btn:hover {
          background: rgba(231, 76, 60, 1);
        }

        .main-content {
          flex: 1;
          margin-left: 250px;
          padding: 30px;
          overflow-y: auto;
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .main-header h1 {
          color: #333;
          font-size: 2rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-info span {
          color: #666;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            position: relative;
            height: auto;
          }

          .main-content {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  )
}