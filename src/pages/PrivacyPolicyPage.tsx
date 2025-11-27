import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Privacy Policy for VR Billing
          </CardTitle>
          <p className="text-sm text-gray-500 text-center">
            Developer: Vaibhav / Belivmart <br />
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* REQUIRED by Google */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Introduction</h2>
            <p className="text-gray-700">
              VR Billing (“the App”) is developed and maintained by 
              <strong> Vaibhav / Belivmart </strong> (“Developer”).  
              This Privacy Policy explains how your information is collected, used, and protected when using our mobile applications.
            </p>
          </section>

          {/* NEW SECTION — Apps Covered */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Apps Covered by This Policy</h2>
            <p className="text-gray-700">
              This privacy policy applies to all mobile applications developed by 
              <strong> Belivmart </strong>, including but not limited to:
            </p>

            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>
                <strong>VR Billing (Restaurant Billing App)</strong> – <em>com.restaurant.billing</em>
              </li>
            </ul>

            <p className="text-gray-700 mt-2">
              By using any of the applications listed above, you agree to the data practices described in this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-gray-700">
              We collect information that you provide directly to us, such as when you create an
              account, generate bills, or contact support. This may include:
            </p>

            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Order and billing data</li>
              <li>Device information (for app performance)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-gray-700">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-700">
              <li>Generate bills and manage restaurant tables</li>
              <li>Provide customer support</li>
              <li>Improve app performance and add new features</li>
              <li>Send important app notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Data Security</h2>
            <p className="text-gray-700">
              We use industry-standard security measures to protect your data from unauthorized
              access, alteration, or disclosure. Sensitive data is encrypted and stored securely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Third-Party Services</h2>
            <p className="text-gray-700">
              We may use trusted third-party services for analytics, hosting, or performance improvement.
              These services follow their own privacy policies and comply with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Your Rights</h2>
            <p className="text-gray-700">
              You have the right to access, update, or delete your personal information.
              You can also request data export or withdrawal of consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. All changes will be posted on this page,
              and the “Last updated” date will be modified accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, please contact us:
              <br />
              <strong>Email:</strong> your-email@example.com <br />
              <strong>Developer:</strong> Vaibhav / Belivmart
            </p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
