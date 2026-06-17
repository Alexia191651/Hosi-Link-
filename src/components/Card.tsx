'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  variant?: 'blue' | 'green' | 'orange' | 'red'
  className?: string
}

export default function Card({ children, variant = 'blue', className = '' }: CardProps) {
  return (
    <div className={`card ${variant} ${className}`}>
      {children}
      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
        }

        .card.blue {
          border-left: 4px solid #3498db;
        }

        .card.blue :global(.card-value) {
          color: #3498db;
        }

        .card.green {
          border-left: 4px solid #2ecc71;
        }

        .card.green :global(.card-value) {
          color: #2ecc71;
        }

        .card.orange {
          border-left: 4px solid #f39c12;
        }

        .card.orange :global(.card-value) {
          color: #f39c12;
        }

        .card.red {
          border-left: 4px solid #e74c3c;
        }

        .card.red :global(.card-value) {
          color: #e74c3c;
        }
      `}</style>
    </div>
  )
}

interface CardHeaderProps {
  title: string
  action?: ReactNode
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="card-header">
      <h3>{title}</h3>
      {action}
      <style jsx>{`
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-header h3 {
          color: #333;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  )
}

interface CardValueProps {
  children: ReactNode
  fontSize?: string
}

export function CardValue({ children, fontSize = '2.5rem' }: CardValueProps) {
  return (
    <div className="card-value" style={{ fontSize }}>
      {children}
      <style jsx>{`
        .card-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  )
}

interface CardButtonProps {
  children: ReactNode
  variant?: 'blue' | 'green' | 'orange' | 'red'
  onClick?: () => void
}

export function CardButton({ children, variant = 'blue', onClick }: CardButtonProps) {
  const colorMap = {
    blue: '#3498db',
    green: '#2ecc71',
    orange: '#f39c12',
    red: '#e74c3c'
  }

  return (
    <button className="card-btn" onClick={onClick} style={{ background: colorMap[variant] }}>
      {children}
      <style jsx>{`
        .card-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s;
          color: white;
        }

        .card-btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </button>
  )
}