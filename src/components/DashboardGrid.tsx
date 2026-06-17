'use client'

import { ReactNode } from 'react'

interface DashboardGridProps {
  children: ReactNode
}

export default function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <div className="dashboard-grid">
      {children}
      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
      `}</style>
    </div>
  )
}