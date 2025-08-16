import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Camera, Search } from "lucide-react";
import { Link } from "wouter";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScanner({ isOpen, onClose }: QRScannerProps) {
  const [bookingCode, setBookingCode] = useState("");

  const handleLookup = () => {
    if (bookingCode.trim()) {
      // Navigate to booking lookup page with the code
      window.location.href = `/lookup?code=${bookingCode.trim()}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Tra cứu đặt lịch</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-center text-gray-600">
            Quét mã QR hoặc nhập mã đặt lịch
          </p>

          <div className="text-center">
            <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4">
              <div className="text-center">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Camera quét QR</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingCode">Hoặc nhập mã đặt lịch</Label>
            <Input
              id="bookingCode"
              type="text"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã đặt lịch"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              className="flex-1"
              onClick={handleLookup}
              disabled={!bookingCode.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              Tra cứu
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Đóng
            </Button>
          </div>

          <div className="text-center">
            <Button variant="link" asChild>
              <Link href="/lookup">Hoặc đi đến trang tra cứu</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
