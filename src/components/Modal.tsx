'use client'

import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .modal-header h3 {
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #999;
        }

        .modal-close:hover {
          color: #333;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .modal-footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #f0f0f0;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  )
}

interface FormFieldProps {
  label: string
  children: ReactNode
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
      <style jsx>{`
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field label {
          font-weight: 600;
          color: #333;
        }
      `}</style>
    </div>
  )
}

interface ModalButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  type?: 'button' | 'submit'
}

export function ModalButton({ children, variant = 'primary', onClick, type = 'button' }: ModalButtonProps) {
  return (
    <button
      type={type}
      className={`modal-btn ${variant}`}
      onClick={onClick}
    >
      {children}
      <style jsx>{`
        .modal-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .modal-btn.primary {
          background: #667eea;
          color: white;
        }

        .modal-btn.secondary {
          background: #95a5a6;
          color: white;
        }

        .modal-btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </button>
  )
}