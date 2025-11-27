import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const TermsAndConditionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Terms and Conditions – VR Billing
          </CardTitle>
          <p className="text-sm text-gray-500 text-center">
            Developer: Vaibhav / Belivmart <br />
            Effective Date: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Google Required Intro Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Introduction</h2>
            <p className="text-gray-700">
              These Terms and Conditions ("Terms") govern the use of VR Billing ("the App"),
              developed and provided by <strong>Vaibhav / Belivmart</strong> ("Developer").
              By using the App, you agree to be bound by these Terms.  
              If you do not agree, please discontinue using the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By installing, accessing, or using the App, you accept and agree to these Terms.
              If you do not accept any part of these Terms, you must stop using the App immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Use of the App</h2>
            <p className="text-gray-700">
              You agree to use VR Billing only for lawful business purposes related to billing,
              restaurant table management, and order handling. You must not:
            </p>

            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>Use the app in violation of any local or national laws</li>
              <li>Upload harmful, malicious, or fraudulent data</li>
              <li>Attempt to hack, disrupt, or compromise app security</li>
              <li>Impersonate any person, business, or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Orders, Billing & Payments</h2>
            <p className="text-gray-700">
              All billing records generated within the App are created by the user (your business).
              VR Billing is only a tool and does not handle or process actual payments.
            </p>

            <p className="text-gray-700 mt-2">
              Any payment or financial transactions made outside the App are solely between the 
              user and their customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Cancellation and Refunds</h2>
            <p className="text-gray-700">
              Subscription or service refunds (if applicable) depend on the terms shown at the time 
              of purchase. Refund decisions are made solely by the Developer.
            </p>
            <p className="text-gray-700 mt-2">
              Billing created inside the app is fully controlled by the user and cannot be reversed
              by the Developer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Intellectual Property Rights</h2>
            <p className="text-gray-700">
              VR Billing, including its design, features, code, and branding, is the exclusive 
              property of <strong>Vaibhav / Belivmart</strong>.  
              You may not copy, modify, reverse-engineer, or distribute any part of the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
            <p className="text-gray-700">
              The Developer is not responsible for:
            </p>

            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>Any loss of business or revenue</li>
              <li>Incorrect billing entries created by the user</li>
              <li>Technical errors due to device issues</li>
              <li>Data loss caused by user negligence or third-party apps</li>
            </ul>

            <p className="text-gray-700 mt-2">
              Use the App at your own risk.  
              To the maximum extent allowed by law, the Developer’s liability is limited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Modifications to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to amend or update these Terms at any time.  
              Changes will be posted on this page with an updated Effective Date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by the laws of India, without regard to conflict-of-law
              principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact Information</h2>
            <p className="text-gray-700">
              For any questions regarding these Terms, please contact:
              <br />
              <strong>Email:</strong> your-email@example.com <br />
              <strong>Developer:</strong> Vaibhav / Belivmart <br />
              <strong>Address:</strong> Neemuch / Mandsaur (MP), India
            </p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
};

export default TermsAndConditionsPage;
