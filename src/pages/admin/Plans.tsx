import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAllPlans, Plan } from '../../api/planApi';

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
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

  const handleSelectPlan = async (planId: string) => {
    try {
      setSelectedPlan(planId);
      setProcessingPayment(true);
      // TODO: Implement payment processing logic here
      toast.success('Plan selected successfully');
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
            className={`p-6 relative overflow-hidden transition-all ${
              selectedPlan === plan._id ? 'border-primary shadow-lg scale-105' : ''
            }`}
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
                variant={selectedPlan === plan._id ? "default" : "outline"}
                disabled={processingPayment}
                onClick={() => handleSelectPlan(plan._id)}
              >
                {processingPayment && selectedPlan === plan._id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {selectedPlan === plan._id ? 'Selected' : 'Select Plan'}
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}