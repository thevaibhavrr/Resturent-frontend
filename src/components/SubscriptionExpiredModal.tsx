import { AlertCircle, CreditCard } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useEffect } from "react";

interface SubscriptionExpiredModalProps {
  restaurantName: string;
  planName: string;
  endDate: string;
  daysRemaining: number;
}

export function SubscriptionExpiredModal({ 
  restaurantName, 
  planName, 
  endDate,
  daysRemaining 
}: SubscriptionExpiredModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
      <Card className="max-w-md w-full bg-white p-8 shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in duration-300 mt-8">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Subscription Expired!
            </h2>
            <p className="text-gray-600">
              Your subscription has expired. Please recharge to continue using the system.
            </p>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Restaurant:</span>
              <span className="text-sm font-semibold">{restaurantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Plan:</span>
              <span className="text-sm font-semibold">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expired On:</span>
              <span className="text-sm font-semibold text-red-600">
                {new Date(endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Days Overdue:</span>
              <span className="text-sm font-semibold text-red-600">
                {Math.abs(daysRemaining)} days
              </span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ You cannot add items to cart or create new orders until your subscription is recharged.
            </p>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-lg"
            size="lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Contact Admin to Recharge
          </Button>

          {/* Footer Note */}
          <p className="text-xs text-gray-500">
            This message will be displayed until your subscription is renewed.
          </p>
        </div>
      </Card>
    </div>
  );
}
