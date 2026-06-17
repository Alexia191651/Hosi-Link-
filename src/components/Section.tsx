'use client'

import { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  action?: ReactNode
}

export default function Section({ title, children, action }: SectionProps) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}

      <style jsx>{`
        .section {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .section-header h2 {
          color: #333;
          font-size: 1.5rem;
        }
      `}</style>
    </section>
  )
}