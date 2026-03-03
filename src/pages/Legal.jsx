import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-dvh bg-[var(--color-surface)] text-[var(--color-text-primary)] animate-fade-in-up">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-[var(--color-border-light)] px-4 py-4 flex items-center gap-3">
                <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-[var(--color-surface-muted)] transition-colors active:scale-95">
                    <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xl">☣️</span>
                    <span className="text-brand text-sm tracking-[0.15em] font-bold">
                        PURE<span className="text-[var(--color-accent)]">SCAN</span>
                    </span>
                </div>
            </header>

            <main className="px-5 py-8 pb-32 max-w-2xl mx-auto space-y-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-3">Privacy Policy</h1>
                    <p className="text-[var(--color-text-secondary)] text-sm font-medium">
                        Last Updated: {lastUpdated}
                    </p>
                </div>

                <section className="space-y-4">
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        Welcome to PureScan. We are committed to protecting your privacy and ensuring you have a safe experience when using our mobile applications, web applications, and services. This Privacy Policy outlines how we collect, use, and safeguard your data to comply with Google Play and Apple App Store guidelines.
                    </p>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center text-xl">
                            📊
                        </div>
                        <h2 className="text-xl font-semibold">Information We Collect</h2>
                    </div>

                    <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border-light)] ml-5">
                        <div>
                            <h3 className="font-semibold mb-1">Account Data</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                When you create an account, we collect your email address and securely store credentials to authenticate your access.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-1">Health & Preference Data</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                To provide tailored toxicity scores, we may collect your self-reported dietary preferences, allergies, health conditions, or personal goals. This data is strictly used to evaluate the suitability of food and cosmetic items for your profile.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-1">Camera & Photos</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                Our core functionality requires accessing your device's camera to scan barcodes and read product labels. The camera feed is processed in real-time and we do not permanently store images captured on your device without your explicit permission.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-1">Payment & Subscription Info</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                If you purchase a premium subscription, billing is handled securely via Apple App Store or Google Play Store (and processed via RevenueCat). We never process or store your direct credit card information.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-1">Usage Data</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                We collect anonymous and aggregated information regarding app interactions, scans, and page visits to improve our services and fix bugs (e.g., via Vercel Analytics).
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center text-xl">
                            ⚙️
                        </div>
                        <h2 className="text-xl font-semibold">How We Use Your Data</h2>
                    </div>

                    <ul className="space-y-3 text-[var(--color-text-secondary)] text-sm leading-relaxed pl-4 border-l-2 border-[var(--color-border-light)] ml-5">
                        <li>• <strong className="text-[var(--color-text-primary)]">Personalization:</strong> Matching scanned items against your specific health profiles to generate accurate toxicity & safety scores.</li>
                        <li>• <strong className="text-[var(--color-text-primary)]">Core App Functionality:</strong> Maintaining your scanning history over time and synchronizing it securely across your devices.</li>
                        <li>• <strong className="text-[var(--color-text-primary)]">Service Improvements:</strong> Understanding how our app is used and performing analytical research to improve content and scanning capabilities.</li>
                    </ul>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center text-xl">
                            🛡️
                        </div>
                        <h2 className="text-xl font-semibold">Data Sharing & Third Parties</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        We do not sell your personal data. We only share information with trusted third-party service providers (e.g., Supabase for database & authentication, RevenueCat for subscription handling) who are bound by strict confidentiality and data protection agreements to provide the service.
                    </p>
                </section>

                <section className="space-y-6 bg-[var(--color-surface-elevated)] p-6 rounded-2xl border border-[var(--color-border-light)] transform transition-transform hover:scale-[1.01]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-xl">
                            🗑️
                        </div>
                        <h2 className="text-xl font-semibold">Your Rights & Data Deletion</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        You have total control over your data. At any point, you can request full deletion of your account and all associated personal data from within the Settings page of the app. Alternatively, you may contact our support team at <a href="mailto:purescanai@outlook.com" className="text-[var(--color-accent)] font-medium hover:underline">purescanai@outlook.com</a>.
                    </p>
                    <div className="pt-2 text-xs text-[var(--color-text-muted)] mt-2">
                        * Once initiated, account deletion is irreversible and removes all your synced scanning history, preferences, and profile associations permanently.
                    </div>
                </section>

                <section className="space-y-6 border-t border-[var(--color-border-light)] pt-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center text-xl">
                            📜
                        </div>
                        <h2 className="text-xl font-semibold">Changes to This Policy</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        We may update our Privacy Policy periodically. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top. We encourage you to review this Privacy Policy periodically for any changes.
                    </p>
                </section>

                <section className="text-center pt-8 pb-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        If you have questions about this policy, please let us know at <br />
                        <a href="mailto:purescanai@outlook.com" className="text-[var(--color-accent)] font-semibold underline mt-1 inline-block">purescanai@outlook.com</a>
                    </p>
                </section>
            </main>
        </div>
    );
}
