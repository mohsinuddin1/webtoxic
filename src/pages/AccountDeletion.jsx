import { Link } from 'react-router-dom';

export default function AccountDeletion() {
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
                    <h1 className="text-3xl font-bold tracking-tight mb-3">Account Deletion Request</h1>
                    <p className="text-[var(--color-text-secondary)] text-sm font-medium">
                        PureScan AI Developer Policy
                    </p>
                </div>

                <section className="space-y-4">
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        At PureScan AI, we value your privacy and give you full control over your data. If you wish to delete your account and all associated data, you can do so directly within the app or by submitting a request through email.
                    </p>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center text-xl">
                            📱
                        </div>
                        <h2 className="text-xl font-semibold">Method 1: Delete from within the App</h2>
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        The fastest way to delete your data is directly through the PureScan AI app:
                    </p>

                    <ol className="space-y-3 text-[var(--color-text-secondary)] text-sm leading-relaxed pl-4 border-l-2 border-[var(--color-border-light)] ml-5 list-decimal list-inside">
                        <li>Open the <strong>PureScan AI</strong> app on your device.</li>
                        <li>Navigate to the <strong>Settings</strong> tab.</li>
                        <li>Scroll down and tap on <strong>Delete Account</strong>.</li>
                        <li>Confirm your choice. Your account will be deleted immediately.</li>
                    </ol>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center text-xl">
                            ✉️
                        </div>
                        <h2 className="text-xl font-semibold">Method 2: Request via Email</h2>
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        If you have already uninstalled the app or cannot access it, you can request account deletion by contacting us via email:
                    </p>

                    <div className="bg-[var(--color-surface-elevated)] p-5 rounded-2xl border border-[var(--color-border-light)]">
                        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                            Send an email to <a href="mailto:purescanai@outlook.com?subject=Account%20Deletion%20Request" className="text-[var(--color-accent)] font-medium hover:underline">purescanai@outlook.com</a> with the following details:
                        </p>
                        <ul className="space-y-2 text-[var(--color-text-secondary)] text-sm mb-4">
                            <li>• <strong>Subject:</strong> Account Deletion Request</li>
                            <li>• <strong>Body:</strong> Please include the email address associated with your PureScan AI account.</li>
                        </ul>
                        <a href="mailto:purescanai@outlook.com?subject=Account%20Deletion%20Request" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-text-primary)] text-[var(--color-surface)] rounded-xl text-sm font-semibold active:scale-95 transition-transform w-full sm:w-auto">
                            Send Deletion Email
                        </a>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-muted)] flex items-center justify-center text-xl">
                            🗑️
                        </div>
                        <h2 className="text-xl font-semibold">What happens to your data?</h2>
                    </div>

                    <div className="space-y-4 pl-4 border-l-2 border-[var(--color-border-light)] ml-5">
                        <div>
                            <h3 className="font-semibold mb-1 text-red-500">Data completely deleted:</h3>
                            <ul className="text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-1 mt-1">
                                <li>• Your profile data (Email, Name, Avatar)</li>
                                <li>• Authentication credentials</li>
                                <li>• Health preferences (Dietary profiles, Allergies, Goals)</li>
                                <li>• All of your past scanning history</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-1 mt-4">Data kept indefinitely:</h3>
                            <ul className="text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-1 mt-1">
                                <li>• Completely anonymized and aggregated analytics used to improve system performance. This data cannot be linked back to you.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-1 mt-4">Data Retention Period:</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                Once an account deletion request is initiated via the app, data is deleted immediately. If requested via email, we process the deletion within <strong>14 days</strong> of confirming your identity.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
