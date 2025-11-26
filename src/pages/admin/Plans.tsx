import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Check, CreditCard, Upload, X, QrCode } from 'lucide-react';
import { Loader } from '../../components/ui/loader';
import { NewtonsCradleLoader } from '../../components/ui/newtons-cradle-loader';
import { toast } from 'sonner';
import { getAllPlans, Plan } from '../../api/planApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await getAllPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentScreenshot || !selectedPlan) {
      toast.error('Please upload payment screenshot');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Upload payment screenshot
      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: screenshotPreview }),
      });
      
      if (!uploadResponse.ok) {
        toast.error('Failed to upload screenshot');
        return;
      }
      
      const uploadData = await uploadResponse.json();
      
      // Submit payment proof to backend
      // TODO: Add API endpoint to record payment proof
      console.log('Payment proof submitted:', {
        planId: selectedPlan._id,
        screenshotUrl: uploadData.url,
      });
      
      toast.success('Payment submitted successfully! Admin will verify shortly.');
      setShowPaymentDialog(false);
      setPaymentScreenshot(null);
      setScreenshotPreview('');
      setSelectedPlan(null);
    } catch (error) {
      console.error('Failed to submit payment:', error);
      toast.error('Failed to submit payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <Loader text="Loading subscription plans..." />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select the perfect plan for your restaurant's needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan._id} 
            className="p-6 relative overflow-hidden transition-all hover:shadow-lg"
          >
            {plan.durationDays >= 90 && (
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Popular
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground">{`${plan.durationDays} days of premium access`}</p>
              </div>

              <div>
                <span className="text-3xl font-bold">₹{plan.price}</span>
                <span className="text-muted-foreground">/{plan.durationDays} days</span>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => handleSelectPlan(plan)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Select Plan
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Scan the QR code and upload payment screenshot
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Selected Plan Info */}
            {selectedPlan && (
              <Card className="p-4 bg-muted">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{selectedPlan.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlan.durationDays} days</p>
                  </div>
                  <p className="text-xl font-bold">₹{selectedPlan.price}</p>
                </div>
              </Card>
            )}

            {/* QR Code Section */}
            <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg">
              <QrCode className="w-8 h-8 text-primary" />
              <p className="font-semibold">Scan QR Code to Pay</p>
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                {/* Placeholder for QR code - replace with actual QR code */}
                <div className="text-center p-4">
                  <QrCode className="w-32 h-32 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Your QR Code Here
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                UPI ID: yourrestaurant@upi
              </p>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <Label htmlFor="screenshot">Upload Payment Screenshot *</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Upload screenshot of successful payment (Max 5MB)
              </p>
              
              {screenshotPreview && (
                <div className="relative mt-3">
                  <img
                    src={screenshotPreview}
                    alt="Payment Screenshot"
                    className="w-full h-48 object-contain rounded-md border"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      setPaymentScreenshot(null);
                      setScreenshotPreview('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentScreenshot(null);
                  setScreenshotPreview('');
                  setSelectedPlan(null);
                }}
                disabled={processingPayment}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePaymentSubmit}
                disabled={!paymentScreenshot || processingPayment}
              >
                {processingPayment ? (
                  <>
                    <NewtonsCradleLoader size={16} speed={1.2} color="#ffffff" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}