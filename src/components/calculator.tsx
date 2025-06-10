"use client"

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<number>(0);
  const [isShift, setIsShift] = useState(false);

  const handleNumber = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOperator = (op: string) => {
    setDisplay(prev => prev + op);
  };

  const handleEqual = () => {
    try {
      const sanitizedExpression = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      const result = Function('"use strict";return (' + sanitizedExpression + ')')();
      setDisplay(result.toString());
    } catch {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleFunction = (func: string) => {
    try {
      const num = parseFloat(display);
      let result: number;

      switch (func) {
        case 'sin':
          result = isShift ? Math.asin(num) : Math.sin(num);
          break;
        case 'cos':
          result = isShift ? Math.acos(num) : Math.cos(num);
          break;
        case 'tan':
          result = isShift ? Math.atan(num) : Math.tan(num);
          break;
        case 'log':
          result = isShift ? Math.exp(num) : Math.log(num);
          break;
        case 'sqrt':
          result = isShift ? num * num : Math.sqrt(num);
          break;
        default:
          return;
      }
      setDisplay(result.toString());
    } catch {
      setDisplay('Error');
    }
  };

  const buttons = [
    ['MC', 'MR', 'M+', 'M-', 'MS'],
    ['sin', 'cos', 'tan', 'log', '√'],
    ['7', '8', '9', '÷', 'C'],
    ['4', '5', '6', '×', '('],
    ['1', '2', '3', '-', ')'],
    ['0', '.', '=', '+', 'Shift'],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Scientific Calculator</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <input
            type="text"
            value={display}
            readOnly
            className="w-full text-right text-2xl font-mono bg-transparent outline-none"
          />
        </div>

        <div className="grid grid-cols-5 gap-2">
          {buttons.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((button) => (
                <button
                  key={button}
                  onClick={() => {
                    switch (button) {
                      case '=':
                        handleEqual();
                        break;
                      case 'C':
                        handleClear();
                        break;
                      case 'MC':
                        setMemory(0);
                        break;
                      case 'MR':
                        setDisplay(memory.toString());
                        break;
                      case 'M+':
                        setMemory(memory + parseFloat(display));
                        break;
                      case 'M-':
                        setMemory(memory - parseFloat(display));
                        break;
                      case 'MS':
                        setMemory(parseFloat(display));
                        break;
                      case 'Shift':
                        setIsShift(!isShift);
                        break;
                      case 'sin':
                      case 'cos':
                      case 'tan':
                      case 'log':
                      case '√':
                        handleFunction(button);
                        break;
                      case '+':
                      case '-':
                      case '×':
                      case '÷':
                      case '(':
                      case ')':
                        handleOperator(button);
                        break;
                      default:
                        handleNumber(button);
                    }
                  }}
                  className={`p-3 rounded-lg transition-colors duration-200 ${
                    button === 'Shift' 
                      ? isShift 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      : ['sin', 'cos', 'tan', 'log', '√'].includes(button)
                      ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
                      : ['MC', 'MR', 'M+', 'M-', 'MS'].includes(button)
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      : ['C', '='].includes(button)
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : ['+', '-', '×', '÷'].includes(button)
                      ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                      : 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-900'
                  }`}
                >
                  {isShift && ['sin', 'cos', 'tan', 'log', '√'].includes(button)
                    ? {
                        'sin': 'asin',
                        'cos': 'acos',
                        'tan': 'atan',
                        'log': 'exp',
                        '√': 'x²'
                      }[button]
                    : button}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}