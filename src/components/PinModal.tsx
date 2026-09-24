import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { sounds } from '../utils/sound';
import { Lock, Delete, X, ShieldAlert, KeyRound, Check } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  targetRole: Role;
  targetName: string;
  expectedPin: string;
  masterPin: string;
  isDeviceLocked?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  targetRole,
  targetName,
  expectedPin,
  masterPin,
  isDeviceLocked,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage(null);
      setShake(false);
    }
  }, [isOpen, targetRole]);

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    sounds.playTap();
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage(null);

    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      sounds.playTap();
      setPin(prev => prev.slice(0, -1));
      setErrorMessage(null);
    }
  };

  const verifyPin = (enteredPin: string) => {
    // Check if matching target PIN or Mum's master PIN
    if (enteredPin === expectedPin || enteredPin === masterPin) {
      sounds.playCorrect();
      onSuccess();
    } else {
      sounds.playWrong();
      setShake(true);
      setErrorMessage('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setPin('');
        setShake(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xs bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-center ${
          shake ? 'animate-bounce border-rose-500' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
            <Lock className="w-4 h-4" />
            <span>ACCOUNT SECURITY</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt */}
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-white font-['Outfit']">
            Switch to {targetName}
          </h3>
          <p className="text-xs text-slate-400">
            {isDeviceLocked
              ? 'This device is locked. Enter PIN to switch accounts.'
              : `Enter 4-digit PIN for ${targetName}`}
          </p>
        </div>

        {/* PIN Dot Indicators */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                  : 'border-slate-600 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="text-xs text-rose-400 font-medium flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-lg border border-slate-700/60 active:scale-95 transition-transform cursor-pointer shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-12 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-800 active:scale-95 transition-transform cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-lg border border-slate-700/60 active:scale-95 transition-transform cursor-pointer shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-850 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 active:scale-95 transition-transform cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Default Helper Hint */}
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-left space-y-0.5 font-mono">
          <div className="text-slate-400 font-semibold flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>Default PINs (change in Mum GM Settings):</span>
          </div>
          <div>• Jasmine: <strong className="text-slate-300">1234</strong></div>
          <div>• Jessie: <strong className="text-slate-300">5678</strong></div>
          <div>• Mum (Master): <strong className="text-slate-300">8888</strong></div>
        </div>
      </div>
    </div>
  );
};
