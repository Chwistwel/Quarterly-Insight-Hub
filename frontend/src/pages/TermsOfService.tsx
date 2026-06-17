import { Link } from 'react-router-dom';
import '../styles/LegalPages.css';

function TermsOfService() {
  return (
    <div className="legal-page">
      <header className="legal-topbar">
        <Link to="/" className="legal-back-link">&larr; Back to Home</Link>
        <div className="brand">
          <div className="brand-mark">QIH</div>
          <strong>Quarterly Insights Hub</strong>
        </div>
      </header>

      <main className="legal-content">
        <h1>Terms of Service</h1>
        <p className="legal-date">Last updated: June 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Quarterly Insights Hub ("the Platform"), you agree to be
            bound by these Terms of Service. If you do not agree, you may not use the
            Platform.
          </p>
        </section>

        <section>
          <h2>2. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials
            and for all activities that occur under your account. You agree to notify us
            immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2>3. Acceptable Use</h2>
          <p>
            You agree to use the Platform only for lawful educational purposes. You may not:
          </p>
          <ul>
            <li>Use the Platform to store or transmit any unlawful or harmful material.</li>
            <li>Attempt to gain unauthorized access to any part of the Platform.</li>
            <li>Interfere with the proper functioning of the Platform.</li>
            <li>Upload data that infringes on the rights of any third party.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Privacy</h2>
          <p>
            We take the privacy of student and educator data seriously. Our data handling
            practices are described in our Privacy Policy. By using the Platform, you
            consent to the collection and use of data as described therein.
          </p>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            The Platform, including its design, code, and content, is the property of
            Quarterly Insights Hub. You may not copy, modify, distribute, or reverse
            engineer any part of the Platform without prior written consent.
          </p>
        </section>

        <section>
          <h2>6. Limitation of Liability</h2>
          <p>
            Quarterly Insights Hub shall not be liable for any indirect, incidental,
            special, or consequential damages arising from your use of the Platform,
            including but not limited to loss of data or interruption of service.
          </p>
        </section>

        <section>
          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to update these terms at any time. Users will be notified
            of material changes. Continued use of the Platform after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            For questions about these terms, please contact the system administrator.
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <p>&copy; 2026 Quarterly Insights Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default TermsOfService;
