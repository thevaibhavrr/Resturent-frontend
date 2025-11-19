import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Privacy Policy</CardTitle>
          <p className="text-sm text-gray-500 text-center">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-gray-700">
              We collect information that you provide directly to us, such as when you create an account, place an order, or contact us. 
              This may include your name, email address, phone number, and payment information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-gray-700">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your account and orders</li>
              <li>Improve our services and develop new features</li>
              <li>Send you promotional offers and updates (you can opt-out at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate security measures to protect your personal information from unauthorized access, 
              alteration, disclosure, or destruction. All payment transactions are encrypted using SSL technology.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Third-Party Services</h2>
            <p className="text-gray-700">
              We may use third-party services to process payments, analyze usage, and improve our services. 
              These services have their own privacy policies governing the use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Your Rights</h2>
            <p className="text-gray-700">
              You have the right to access, update, or delete your personal information. 
              You may also request a copy of your data or withdraw your consent for data processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@restaurant.com
              <br />
              Phone: (123) 456-7890
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
