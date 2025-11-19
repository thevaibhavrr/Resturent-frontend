import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const TermsAndConditionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Terms and Conditions</CardTitle>
          <p className="text-sm text-gray-500 text-center">Effective Date: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing or using our services, you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Use of Service</h2>
            <p className="text-gray-700">
              You agree to use our services only for lawful purposes and in accordance with these Terms. 
              You must not use our services:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>In any way that violates any applicable laws or regulations</li>
              <li>To transmit any harmful or malicious code</li>
              <li>To impersonate any person or entity</li>
              <li>To interfere with or disrupt the service or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Ordering and Payments</h2>
            <p className="text-gray-700">
              All orders are subject to availability. We reserve the right to refuse service, 
              terminate accounts, or cancel orders at our sole discretion.
            </p>
            <p className="text-gray-700 mt-2">
              Payment is required at the time of ordering. We accept various payment methods as indicated 
              during the checkout process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Cancellation and Refunds</h2>
            <p className="text-gray-700">
              Cancellation policies may vary depending on the type of order. Please refer to our 
              cancellation policy at the time of ordering for specific details.
            </p>
            <p className="text-gray-700 mt-2">
              Refunds, if applicable, will be processed according to our refund policy and may take 
              5-10 business days to reflect in your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Intellectual Property</h2>
            <p className="text-gray-700">
              All content included in or made available through our service, such as text, graphics, 
              logos, and images, is the property of our restaurant or its content suppliers and 
              protected by copyright and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
            <p className="text-gray-700">
              To the maximum extent permitted by law, we shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages resulting from your use of 
              our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these terms at any time. We will provide notice of any 
              material changes through our website or by other means.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Governing Law</h2>
            <p className="text-gray-700">
              These terms shall be governed by and construed in accordance with the laws of the jurisdiction 
              in which our restaurant is located, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact Information</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms and Conditions, please contact us at:
              <br />
              Email: legal@restaurant.com
              <br />
              Phone: (123) 456-7890
              <br />
              Address: 123 Restaurant St, Foodie City, FC 12345
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsAndConditionsPage;
