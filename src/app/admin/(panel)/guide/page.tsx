import Link from 'next/link';
import { PageHeading } from '@/components/admin/common';

type Step = { title: string; href?: string; link?: string; steps: React.ReactNode[] };

const GUIDES: Step[] = [
  {
    title: 'Post a build-out update',
    href: '/admin/milestones',
    link: 'Build-out milestones',
    steps: [
      'Open Build-out milestones and click the phase you are working on (or Add milestone for a new one).',
      'Set the status badge: Completed, In progress or Upcoming. The evolution gauge on the site updates from these.',
      'Write a short update caption, then click Add from media library to upload progress photos, finish samples or walkthrough videos straight from your computer or phone.',
      'Give each photo its own alt text (what the photo shows), then Save milestone. It appears on the Build-Out page, the home page teaser and the Behind-the-Build gallery right away.',
    ],
  },
  {
    title: 'Swap in finished salon photos at launch',
    href: '/admin/media',
    link: 'Media library',
    steps: [
      'Open the Media library and click a sample or construction photo.',
      'Click Replace file and choose the finished photo. Every page that used the old photo now shows the new one, with its alt text kept.',
      'To use a photo somewhere new, open the page in Pages, open the section and click Change on its image. Pick or upload the file, then describe it for that spot.',
      'Add finished walkthrough videos to the last milestone (Final Reveal) and mark it Completed.',
    ],
  },
  {
    title: 'Manage Founding Member waitlist leads',
    href: '/admin/leads',
    link: 'VIP waitlist leads',
    steps: [
      'Every form submission appears in VIP waitlist leads and the new-lead count shows in the sidebar.',
      'Click a lead to see their details, call or email them, set a status (New, Contacted, Toured, Signed, Archived) and keep private notes.',
      'Click Export CSV to download the full list for a spreadsheet or email tool.',
      'Edit the wording of the automatic welcome email in Site settings → Emails.',
    ],
  },
  {
    title: 'Set up email (once)',
    href: '/admin/email',
    link: 'Email',
    steps: [
      'Open Email and choose your provider (Gmail, Outlook, Zoho, Brevo, SendGrid, Mailgun or other). The server and port fill in for you.',
      'Enter the username and password for the mailbox. Gmail and Outlook need an “app password”, not your normal password.',
      'Set the From name and From email, click Test connection, then Send test email to check it arrives.',
      'Switch on Send emails and click Save. Welcome emails, tour emails and your alerts now go out automatically.',
    ],
  },
  {
    title: 'Launch Phase 2: directory and tour booking',
    href: '/admin',
    link: 'Dashboard',
    steps: [
      <>Before launch, add your pros in <Link className="underline" href="/admin/members">Member directory</Link> with headshot, specialty, Instagram and booking link. They stay hidden until launch.</>,
      <>Set the days and times you offer tours in <Link className="underline" href="/admin/settings">Site settings → Tour booking</Link>.</>,
      'On the Dashboard click Switch to Phase 2. “Find a Beauty Pro” and “Book a Tour” go live, every waitlist button becomes “Book a Tour”, and the announcement bar shows its Phase 2 message.',
      <>Tour requests then arrive in <Link className="underline" href="/admin/bookings">Tour bookings</Link>, where you confirm, complete or cancel them; confirming or cancelling emails the guest automatically. Switching back to Phase 1 hides everything again.</>,
    ],
  },
  {
    title: 'Edit text, sections and SEO',
    href: '/admin/pages',
    link: 'Pages',
    steps: [
      'Open a page in Pages. Each block is a section you can open, edit, hide, duplicate, reorder or show only in one phase.',
      'Use Add section to insert new blocks such as a gallery, FAQ or text and image.',
      'In the right column set the page’s search title, description and social share image. Keep titles under 60 characters and descriptions under 160.',
      'Click Save. Changes are live immediately.',
    ],
  },
  {
    title: 'Logo, colors, menus and favicon',
    href: '/admin/settings',
    link: 'Site settings',
    steps: [
      'General: logo for dark and light backgrounds, browser tab icon (favicon), address, phone and email.',
      'Launch & banner: the two announcement bar messages and the buttons used in each phase.',
      'Navigation, Social & Instagram, SEO, Colors and Form options are each on their own tab.',
    ],
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHeading
        title="How-to guide"
        description="Step-by-step instructions for the everyday tasks: build-out updates, launch photos, waitlist leads and switching on the directory and tour booking."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {GUIDES.map((g, i) => (
          <section key={g.title} className="rounded-xl border bg-background p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-semibold">
                <span className="mr-2 text-amber-600">{String(i + 1).padStart(2, '0')}</span>
                {g.title}
              </h2>
              {g.href && (
                <Link href={g.href} className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  {g.link} →
                </Link>
              )}
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground marker:text-foreground">
              {g.steps.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
