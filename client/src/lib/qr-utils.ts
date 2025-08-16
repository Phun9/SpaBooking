export interface QRCodeOptions {
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export class QRCodeGenerator {
  static generateQRCodeDataURL(text: string, options: QRCodeOptions = {}): string {
    const {
      width = 200,
      height = 200,
      color = '#000000',
      backgroundColor = '#ffffff'
    } = options;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Simple QR code pattern (placeholder implementation)
    // In a real application, you would use a proper QR code library
    ctx.fillStyle = color;
    
    // Create a simple pattern to represent QR code
    const blockSize = Math.floor(width / 21); // Standard QR code is 21x21 modules
    const offset = (width - blockSize * 21) / 2;

    // Draw finder patterns (corners)
    this.drawFinderPattern(ctx, offset, offset, blockSize);
    this.drawFinderPattern(ctx, offset + blockSize * 14, offset, blockSize);
    this.drawFinderPattern(ctx, offset, offset + blockSize * 14, blockSize);

    // Draw timing patterns
    for (let i = 0; i < 21; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(offset + i * blockSize, offset + 6 * blockSize, blockSize, blockSize);
        ctx.fillRect(offset + 6 * blockSize, offset + i * blockSize, blockSize, blockSize);
      }
    }

    // Draw data pattern (simplified)
    const hash = this.simpleHash(text);
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        if (this.shouldFillBlock(i, j, hash)) {
          ctx.fillRect(offset + i * blockSize, offset + j * blockSize, blockSize, blockSize);
        }
      }
    }

    return canvas.toDataURL();
  }

  private static drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, blockSize: number): void {
    // Draw 7x7 finder pattern
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          (i === 0 || i === 6 || j === 0 || j === 6) ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          ctx.fillRect(x + i * blockSize, y + j * blockSize, blockSize, blockSize);
        }
      }
    }
  }

  private static simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static shouldFillBlock(i: number, j: number, hash: number): boolean {
    // Skip finder patterns and timing patterns
    if (
      (i < 9 && j < 9) || // Top-left finder
      (i > 12 && j < 9) || // Top-right finder
      (i < 9 && j > 12) || // Bottom-left finder
      (i === 6 || j === 6) // Timing patterns
    ) {
      return false;
    }

    // Simple pattern based on hash
    return ((i + j + hash) % 3) === 0;
  }

  static generateBookingQRCode(bookingCode: string): string {
    const qrData = {
      type: 'booking',
      code: bookingCode,
      timestamp: Date.now(),
    };

    return this.generateQRCodeDataURL(JSON.stringify(qrData), {
      width: 200,
      height: 200,
      color: '#2563EB',
      backgroundColor: '#ffffff',
    });
  }

  static parseBookingQRCode(qrData: string): { code: string; timestamp: number } | null {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.type === 'booking' && parsed.code) {
        return {
          code: parsed.code,
          timestamp: parsed.timestamp,
        };
      }
    } catch (error) {
      console.error('Error parsing QR code data:', error);
    }
    return null;
  }
}

export const generateBookingQRCode = (bookingCode: string): string => {
  return QRCodeGenerator.generateBookingQRCode(bookingCode);
};

export const parseBookingQRCode = (qrData: string) => {
  return QRCodeGenerator.parseBookingQRCode(qrData);
};
