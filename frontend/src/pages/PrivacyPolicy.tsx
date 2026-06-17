import { Link } from 'react-router-dom';
import '../styles/LegalPages.css';

function PrivacyPolicy() {
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
        <h1>Privacy Policy</h1>
        <p className="legal-date">Last updated: June 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>
            We collect information necessary to operate the Platform, including:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and role (teacher or administrator).</li>
            <li><strong>Educational Data:</strong> Class rosters, student names, assessment scores, and performance analytics uploaded or entered by users.</li>
            <li><strong>Usage Data:</strong> Login timestamps, features accessed, and interaction logs for system improvement.</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide and maintain the Platform and its features.</li>
            <li>Generate analytics, reports, and performance insights.</li>
            <li>Improve the Platform based on usage patterns and feedback.</li>
            <li>Communicate important updates or changes to the service.</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Sharing</h2>
          <p>
            We do not sell or share personal data with third parties except:
          </p>
          <ul>
            <li>As required by law or legal process.</li>
            <li>With service providers who assist in operating the Platform (e.g., hosting), under strict confidentiality agreements.</li>
            <li>With your explicit consent.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Retention</h2>
          <p>
            Educational data is retained as long as the account is active. Upon account
            deletion, data is permanently removed within a reasonable timeframe. Backup
            copies may persist temporarily but will not be accessible.
          </p>
        </section>

        <section>
          <h2>5. Security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your
            data against unauthorized access, loss, or alteration. However, no system is
            completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            Depending on applicable law, you may have the right to access, correct, or
            delete your personal data. To exercise these rights, please contact your
            system administrator.
          </p>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted
            on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please contact the system
            administrator.
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <p>&copy; 2026 Quarterly Insights Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
