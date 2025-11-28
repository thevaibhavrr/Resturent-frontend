import { useEffect, useState } from "react";
import { AlertCircle, CreditCard, X } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { checkSubscriptionStatus } from "../api/planApi";
import { getCurrentUser } from "../utils/auth";

interface SubscriptionAlertProps {
  onExpired?: () => void;
}

export function SubscriptionAlert({ onExpired }: SubscriptionAlertProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    loadSubscriptionStatus();
    // Check every 5 minutes
    const interval = setInterval(loadSubscriptionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSubscriptionStatus = async () => {
    if (!user?.restaurantId) return;
    
    try {
      const data = await checkSubscriptionStatus(user.restaurantId);
      setSubscription(data);
      
      // If expired, call the callback
      if (!data.isActive && onExpired) {
        onExpired();
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription) return null;

  // If plan expired, show blocking modal
  if (!subscription.isActive) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-white">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-red-900 mb-2">
                Subscription Expired
              </h2>
              <p className="text-gray-600">
                Your <strong>{subscription.planName}</strong> plan has expired.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Expired on: {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-medium">
                Please recharge your plan to continue using the restaurant management system.
              </p>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              variant="destructive"
              onClick={() => {
                // TODO: Navigate to recharge page or contact admin
                alert('Please contact administrator to recharge your plan.');
              }}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Recharge Now
            </Button>

            <p className="text-xs text-gray-500">
              Contact support if you need assistance
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // If plan expiring soon (7 days or less), show warning banner
  if (subscription.daysRemaining <= 7 && !dismissed) {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 ${
        subscription.daysRemaining <= 3 ? 'bg-red-600' : 'bg-yellow-500'
      } text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">
                  {subscription.daysRemaining <= 3 
                    ? `⚠️ Plan Expiring in ${subscription.daysRemaining} Days!` 
                    : `Plan Expiring Soon - ${subscription.daysRemaining} Days Remaining`
                  }
                </p>
                <p className="text-sm opacity-90">
                  Your {subscription.planName} plan expires on {new Date(subscription.endDate).toLocaleDateString()}. 
                  Recharge now to avoid service interruption.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => {
                  // TODO: Navigate to recharge page
                  alert('Redirecting to recharge page...');
                }}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Recharge
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setDismissed(true)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
