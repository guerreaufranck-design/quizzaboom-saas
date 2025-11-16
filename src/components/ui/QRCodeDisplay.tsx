import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { cn } from '../../utils/cn';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 256,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Use APP_URL from env instead of window.location.origin
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      
      // Generate full URL if just a code
      const url = value.startsWith('http')
        ? value
        : `${baseUrl}?code=${value}&view=join`;

      console.log('QR Code URL:', url); // Debug

      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [value, size]);

  return (
    <div className={cn('inline-block bg-white p-4 rounded-2xl shadow-xl', className)}>
      <canvas ref={canvasRef} />
    </div>
  );
};
