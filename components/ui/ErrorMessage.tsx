import React from 'react';
import {IoClose} from 'react-icons/io5';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({message, onClose, className = ''}) => {
  if (!message) return null;

  return (
    <div className={`flex items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm ${className}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 hover:text-red-600 transition-colors"
          type="button"
        >
          <IoClose className="text-lg"/>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;