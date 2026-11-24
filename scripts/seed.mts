/**
 * Seeds the database with sample content, generated placeholder images and an admin account.
 *
 *   pnpm seed            # refuses to run when pages already exist
 *   pnpm seed --reset    # rebuilds pages, settings and collections with fresh sample images.
 *                        # Keeps admin users, the Cloudinary connection, files you uploaded,
 *                        # and leads/bookings (add --include-inbox to wipe those too).
 *
 * Reads DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME from .env.
 * Images are uploaded to the Cloudinary account saved in Admin → Cloudinary.
 */
import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { closeDb, db, mongoDriver } from '../src/prisma/db';
import { CLOUDINARY_SETTINGS_KEY, deleteFromCloudinary, parseStoredConfig, toCredentials, uploadToCloudinary } from '../src/lib/cloudinary';
import { DEFAULT_SETTINGS } from '../src/lib/settings';
import { buildPhoto, favicon, floorPlan, headshot, heroRendering, moodBoard, ogImage, render, suiteImage, type BuildScene } from './seed-assets.mts';

const reset = process.argv.includes('--reset');
const includeInbox = process.argv.includes('--include-inbox');
const SAMPLE_TAG = 'sample';

async function cloudinaryCredentials() {
  const row = await db.orm.settings.where({ key: CLOUDINARY_SETTINGS_KEY }).first();
  return toCredentials(parseStoredConfig(row?.data));
}
type Credentials = NonNullable<Awaited<ReturnType<typeof cloudinaryCredentials>>>;
let credentials: Credentials;

type Ref = { mediaId: string; alt: string };

async function upload(buffer: Buffer, originalName: string, mimeType: string, title: string, alt: string, tags: string[]) {
  const blur = await sharp(buffer).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
  const uploaded = await uploadToCloudinary(credentials, buffer, { filename: originalName, mimeType });
  const row = await db.orm.media.create({
    publicId: uploaded.public_id,
    resourceType: uploaded.resource_type,
    url: uploaded.secure_url,
    filename: originalName,
    originalName,
    mimeType,
    kind: 'image',
    size: uploaded.bytes ?? buffer.length,
    width: uploaded.width ?? null,
    height: uploaded.height ?? null,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
    title,
    defaultAlt: alt,
    // Marks generated files so a reset removes them and nothing the owner uploaded.
    tags: [...tags, SAMPLE_TAG],
  });
  process.stdout.write('.');
  return { id: row.id, ref: (placementAlt = alt): Ref => ({ mediaId: row.id, alt: placementAlt }) };
}

const section = (type: string, data: Record<string, unknown>, opts: Partial<{ theme: 'light' | 'ivory' | 'dark'; phase: 'all' | 'phase1' | 'phase2'; anchor: string }> = {}) => ({
  id: randomUUID(),
  type,
  enabled: true,
  phase: opts.phase ?? 'all',
  anchor: opts.anchor ?? '',
  theme: opts.theme ?? 'light',
  data,
});

const siteCta = { useSiteCta: true, cta: { label: '', href: '' } };

async function main() {
  const existing = await db.orm.pages.select('id').first();
  if (existing && !reset) {
    console.error('The database already has pages. Run with --reset to wipe site content and seed again.');
    process.exit(1);
  }

  const found = await cloudinaryCredentials();
  if (!found) {
    console.error('Cloudinary is not connected. Sign in to /admin, open Cloudinary, save your credentials, then run the seed again.');
    process.exit(1);
  }
  credentials = found;

  if (reset) {
    console.log('Wiping site content…');
    const raw = mongoDriver();
    // Only generated sample files go, in Cloudinary and the library; uploads are kept.
    const samples = await raw.collection('media').find({ tags: SAMPLE_TAG }, { projection: { publicId: 1, resourceType: 1 } }).toArray();
    for (const m of samples) {
      await deleteFromCloudinary(credentials, String(m.publicId), String(m.resourceType)).catch(() => undefined);
    }
    await raw.collection('media').deleteMany({ tags: SAMPLE_TAG });
    const collections = ['pages', 'milestones', 'suites', 'members', ...(includeInbox ? ['leads', 'bookings'] : [])];
    for (const name of collections) {
      await raw.collection(name).deleteMany({});
    }
    // Keep the Cloudinary connection; only the site settings are reseeded.
    await raw.collection('settings').deleteMany({ key: 'site' });
  }

  /* ------------------------------ Admin user ----------------------------- */
  const email = (process.env.ADMIN_EMAIL ?? 'admin@shearchemistry.test').toLowerCase();
  const name = process.env.ADMIN_NAME ?? 'Site Owner';
  let password = process.env.ADMIN_PASSWORD;
  if (!(await db.orm.admin_users.where({ email }).first())) {
    const generated = !password;
    password ??= randomBytes(9).toString('base64url');
    await db.orm.admin_users.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'owner', lastLoginAt: null });
    console.log(`Admin account created: ${email}${generated ? ` / ${password} (generated; set ADMIN_PASSWORD in .env to choose your own)` : ' (password from ADMIN_PASSWORD)'}`);
  } else {
    console.log(`Admin account ${email} already exists; left unchanged.`);
  }

  /* -------------------------------- Media -------------------------------- */
  process.stdout.write('Generating and uploading images');
  const hero = await upload(await render.jpg(heroRendering()), 'architectural-rendering-corridor.jpg', 'image/jpeg', 'Architectural rendering · suite corridor', 'Architectural rendering of the Shear Chemistry suite corridor with arched mirrors and warm gold lighting', ['rendering', 'hero']);
  const mood = await upload(await render.jpg(moodBoard()), 'brand-mood-board.jpg', 'image/jpeg', 'Brand mood board', 'Mood board of black, metallic gold, marble and warm wood finishes', ['brand', 'mood board']);
  const suitesImg = {
    singleDry: await upload(await render.jpg(suiteImage({ wet: false, double: false, tone: '#f1ebe1' })), 'single-dry-suite.jpg', 'image/jpeg', 'Single dry suite', 'Single dry salon suite with arched mirror, styling chair and built-in cabinetry', ['suites']),
    singleWet: await upload(await render.jpg(suiteImage({ wet: true, double: false, tone: '#ece4d8' })), 'single-wet-suite.jpg', 'image/jpeg', 'Single wet suite', 'Single wet salon suite with private shampoo bowl, styling chair and mirror', ['suites']),
    doubleDry: await upload(await render.jpg(suiteImage({ wet: false, double: true, tone: '#efe7da' })), 'double-dry-suite.jpg', 'image/jpeg', 'Double dry suite', 'Double dry salon suite with two styling stations and cabinetry', ['suites']),
    doubleWet: await upload(await render.jpg(suiteImage({ wet: true, double: true, tone: '#e9e0d2' })), 'double-wet-suite.jpg', 'image/jpeg', 'Double wet suite', 'Double wet salon suite with two stations and a private shampoo bowl', ['suites']),
  };
  const plan = floorPlan();
  const planImg = await upload(await render.png(plan.svg), 'floor-plan-3813-sqft.png', 'image/png', 'Floor plan · 3,813 sq ft', 'Floor plan of Shear Chemistry Salon Suites showing 20 suites along a central corridor, the lobby, wash and dry lounge and breakroom', ['floor plan']);
  const scene = async (s: BuildScene, title: string, alt: string) => upload(await render.jpg(buildPhoto(s)), `build-${s}.jpg`, 'image/jpeg', title, alt, ['build-out']);
  const build = {
    blueprint: await scene('blueprint', 'Approved permit drawings', 'Approved architectural permit drawings for the Moreland Avenue build-out'),
    framing: await scene('framing', 'Suite wall framing', 'Freshly framed suite walls inside the 3,813 square foot space'),
    plumbing: await scene('plumbing', 'Rough-in plumbing', 'Copper and PEX rough-in plumbing for the wet suites and shampoo bowls'),
    finishes: await scene('finishes', 'Finish samples', 'Marble-look tile and gold trim finish samples for the suites'),
    smartlock: await scene('smartlock', 'Smart-lock suite door', 'Black suite door with a gold keypad smart lock'),
    reveal: await scene('reveal', 'Final reveal preview', 'Preview rendering of the finished corridor ahead of the grand opening'),
  };
  const heads = [];
  for (let i = 0; i < 6; i++) heads.push(await upload(await render.jpg(headshot(i)), `pro-headshot-${i + 1}.jpg`, 'image/jpeg', `Pro headshot ${i + 1}`, 'Portrait of a Shear Chemistry beauty professional', ['members']));
  const og = await upload(await render.png(ogImage()), 'social-share.png', 'image/png', 'Social share image', 'Shear Chemistry Salon Suites, opening May 2027 on Moreland Avenue in Southeast Atlanta', ['seo']);
  const icon = await upload(await render.png(favicon()), 'favicon.png', 'image/png', 'Favicon', 'Shear Chemistry monogram', ['brand']);
  console.log(' done');

  /* ------------------------------- Settings ------------------------------ */
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.general.favicon = icon.ref();
  settings.seo.ogImage = og.ref();
  await db.orm.settings.create({ key: 'site', data: JSON.parse(JSON.stringify(settings)) });

  /* -------------------------------- Pages -------------------------------- */
  const waitlistCta = { useSiteCta: false, cta: { label: 'Join the Founding Member List', href: '/founding-members#waitlist' } };
  const pages = [
    {
      slug: 'home',
      title: 'Home',
      seoTitle: 'Luxury Salon Suites in Southeast Atlanta | Shear Chemistry',
      seoDescription: 'Upscale turnkey salon suites for rent on Moreland Ave in Southeast Atlanta. 20 private wet & dry suites, 24/7 access, wash & dry lounge. Opening May 2027.',
      sections: [
        section('hero', {
          eyebrow: 'Coming May 2027 · Moreland Avenue, Atlanta',
          heading: 'Where artistry meets business chemistry.',
          highlight: 'business chemistry.',
          subheading: 'An upscale, 20-suite turnkey studio for independent beauty and wellness professionals. Your name on the door, your prices, your schedule, with everything else already in the formula.',
          background: hero.ref(),
          overlay: 35,
          height: 'full',
          useSiteCta: false,
          cta: { label: 'Join the Founding Member List', href: '/founding-members#waitlist' },
          secondaryCta: { label: 'Explore the suites', href: '/suites' },
          badges: ['20 Turnkey Suites', '3,813 Sq Ft', '24/7 Access'],
        }, { theme: 'dark' }),
        section('stats', {
          items: [
            { value: '20', suffix: '', label: 'Private turnkey suites' },
            { value: '3,813', suffix: 'sq ft', label: 'Of upscale studio space' },
            { value: '24/7', suffix: '', label: 'Smart-lock access' },
            { value: '100%', suffix: '', label: 'Utilities & Wi-Fi included' },
          ],
        }, { theme: 'dark' }),
        section('formula', {
          eyebrow: 'The Formula',
          heading: 'Every element your business needs, already mixed in.',
          intro: 'We combined the essentials independent pros ask for most, so you can focus on clients, not landlords and utility bills.',
          items: [
            { symbol: 'Ak', icon: 'KeyRound', title: '24/7 Smart-Lock Access & Security', description: 'Keyless entry, monitored common areas and your own lockable suite. Work the hours your clients want.' },
            { symbol: 'Wd', icon: 'Droplets', title: 'Shared Wash & Dry Lounge', description: 'Dedicated shampoo bowls and hooded dryers, so dry-suite pros can still offer full services.' },
            { symbol: 'Ln', icon: 'WashingMachine', title: 'Complimentary Commercial Laundry', description: 'Commercial washers and dryers on site for towels and capes, at no extra cost.' },
            { symbol: 'Ut', icon: 'Wifi', title: 'All Utilities & High-Speed Wi-Fi', description: 'Power, water, HVAC and business-grade internet are in your rent. One predictable payment.' },
            { symbol: 'Br', icon: 'Coffee', title: 'Breakroom, Directory Kiosk & Parking', description: 'A breakroom to recharge, a wall-mounted directory kiosk for clients, and ample on-site parking.' },
            { symbol: 'Sc', icon: 'Sparkles', title: 'Turnkey & Customizable', description: 'Move in with chair, mirror and cabinetry ready, then make the neutral suite unmistakably yours.' },
          ],
          image: null,
        }, { theme: 'ivory' }),
        section('splitContent', {
          eyebrow: 'Our Chemistry',
          heading: 'Built for the entrepreneur behind the chair.',
          body: "Shear Chemistry is a co-working studio designed around one belief: independent beauty pros deserve a space as elevated as their work.\n\nInside our 3,813 sq ft studio at **1341 Moreland Avenue**, next to Halidom Eatery, you'll find twenty private suites, a shared wash & dry lounge, and a community of stylists, barbers, estheticians, lash artists and wellness pros building real businesses.",
          image: mood.ref('Shear Chemistry mood board of black, gold, marble and warm wood finishes'),
          imagePosition: 'right',
          bullets: ['Private, lockable suites', 'Your brand, your pricing', 'Flexible membership terms', 'Grand opening May 2027'],
          ...waitlistCta,
        }, { theme: 'light' }),
        section('buildTeaser', {
          eyebrow: 'The Build-Out',
          heading: 'Watch the formula come together.',
          intro: 'Our commercial interior build-out is underway. Follow every phase, from permits to the final reveal, in our visual progress journal.',
          image: null,
          cta: { label: 'See the progress journal', href: '/build-out' },
        }, { theme: 'dark' }),
        section('instagram', {
          eyebrow: 'Live from the build',
          heading: 'Follow along on Instagram',
          intro: 'Behind-the-scenes construction updates, finish reveals and founding member spotlights.',
          limit: 6,
          posts: [
            { image: build.framing.ref(), caption: 'Walls are up. Suite layouts are officially real.', href: '' },
            { image: build.plumbing.ref(), caption: 'Rough-in plumbing for our wet suites and wash lounge.', href: '' },
            { image: build.finishes.ref(), caption: 'Finish samples just arrived. Black, gold and marble.', href: '' },
            { image: mood.ref(), caption: 'The mood board behind every suite.', href: '' },
            { image: build.blueprint.ref(), caption: 'Permits approved! The build-out begins.', href: '' },
            { image: build.smartlock.ref(), caption: 'Sneak peek: smart-lock suite doors.', href: '' },
          ],
        }, { theme: 'ivory' }),
        section('ctaBanner', {
          eyebrow: 'Founding Member VIP Waitlist',
          heading: 'Claim your place in the formula.',
          intro: 'Founding Members get first pick of suites, early pricing and a private tour before we open to the public.',
          background: hero.ref('Warm-lit corridor rendering of Shear Chemistry Salon Suites'),
          ...siteCta,
        }, { theme: 'dark' }),
      ],
    },
    {
      slug: 'suites',
      title: 'The Suites',
      seoTitle: 'Salon Suites for Rent in Atlanta',
      seoDescription: 'Explore 20 turnkey salon suites in Southeast Atlanta: single and double, wet and dry. Styling chair, mirror and cabinetry included. See the floor plan.',
      sections: [
        section('pageHeader', { eyebrow: 'The Suites', heading: 'Twenty suites. Four formulas. One you.', intro: 'Choose single or double, wet or dry. Every suite arrives turnkey and neutral, ready for you to customize.', background: suitesImg.doubleWet.ref() }, { theme: 'dark' }),
        section('suiteTypes', {
          eyebrow: 'Suite configurations',
          heading: 'Find the configuration that fits your craft.',
          intro: 'Wet suites include a private shampoo bowl. Dry suites share our fully equipped Wash & Dry Lounge.',
          included: ['Professional styling chair', 'Full-length mirror', 'Built-in cabinetry & storage', 'Lockable suite door', 'All utilities & Wi-Fi', 'Freedom to paint & decorate'],
          ...waitlistCta,
        }, { theme: 'ivory' }),
        section('floorPlan', {
          eyebrow: 'Floor plan',
          heading: 'See where your suite sits.',
          intro: 'Our 3,813 sq ft layout places every suite along a central corridor, a few steps from the main entrance, the Wash & Dry Lounge and the breakroom.',
          image: planImg.ref(),
          hotspots: plan.hotspots,
        }, { theme: 'light' }),
        section('splitContent', {
          eyebrow: 'Customization freedom',
          heading: 'A neutral canvas for your signature.',
          body: 'Every suite is delivered in a clean, neutral palette with professional furnishings installed. Bring your own art, lighting, retail shelving and color. It is your studio; we simply handle the building.',
          image: suitesImg.singleDry.ref(),
          imagePosition: 'left',
          bullets: ['Paint and decorate your walls', 'Add retail displays', 'Set your own hours', 'Keep 100% of your service revenue'],
          ...siteCta,
        }, { theme: 'ivory' }),
      ],
    },
    {
      slug: 'build-out',
      title: 'The Build-Out',
      seoTitle: 'Build-Out Progress Journal',
      seoDescription: 'Follow the build-out of Shear Chemistry Salon Suites on Moreland Avenue, from permits and framing to custom finishes and our May 2027 grand opening.',
      sections: [
        section('pageHeader', { eyebrow: 'Visual progress journal', heading: 'The evolution of Shear Chemistry.', intro: 'From approved permits to the final reveal, here is every phase of our journey to the May 2027 opening.', background: build.framing.ref() }, { theme: 'dark' }),
        section('milestones', { eyebrow: 'May 2027 milestone tracker', heading: 'Four phases to opening day.', intro: 'We update this tracker as each phase moves forward.', showGauge: true }, { theme: 'dark' }),
        section('buildGallery', { eyebrow: 'Behind the build', heading: 'Photos, videos & finish samples.', intro: 'Tap any image to view it full screen.' }, { theme: 'ivory' }),
        section('ctaBanner', { eyebrow: 'Be first through the doors', heading: 'Want a front-row seat to the reveal?', intro: 'Founding Members get first access to finished-suite walkthroughs.', background: null, ...siteCta }, { theme: 'dark' }),
      ],
    },
    {
      slug: 'founding-members',
      title: 'Founding Members',
      seoTitle: 'Founding Member Waitlist & FAQ',
      seoDescription: 'Join the Founding Member VIP waitlist for Shear Chemistry Salon Suites at 1341 Moreland Ave, Atlanta. Parking, neighborhood map and FAQ.',
      sections: [
        section('pageHeader', { eyebrow: 'Founding Members', heading: 'Get on the list before the doors open.', intro: 'A limited number of Founding Members will be the first to choose suites at 1341 Moreland Avenue.', background: mood.ref() }, { theme: 'dark' }),
        section('waitlistForm', {
          eyebrow: 'Founding Member VIP Waitlist',
          heading: 'Reserve your spot in the formula.',
          intro: 'Tell us a little about your business. We will send a welcome email with next steps right away.',
          image: suitesImg.singleWet.ref(),
          perks: ['Priority suite selection before public leasing', 'Founding Member pricing', 'Private walkthrough in Spring 2027', 'Build-out updates and finish reveals first'],
          submitLabel: 'Join the Founding Member List',
          successTitle: "You're on the VIP list.",
          successMessage: 'Check your inbox for a welcome email with next steps. We will be in touch personally as tours open.',
        }, { theme: 'light', phase: 'phase1', anchor: 'waitlist' }),
        section('ctaBanner', { eyebrow: 'Now leasing', heading: 'See your future suite in person.', intro: 'Private tours are open. Choose a time that works for you.', background: hero.ref(), useSiteCta: true, cta: { label: '', href: '' } }, { theme: 'dark', phase: 'phase2' }),
        section('location', {
          eyebrow: 'Neighborhood & parking',
          heading: 'Right on Moreland Avenue.',
          intro: 'In the heart of Southeast Atlanta, next door to Halidom Eatery, with easy access for you and your clients.',
          mapQuery: '1341 Moreland Ave SE, Atlanta, GA 30316',
          parking: [
            { icon: 'ParkingSquare', title: 'Parking for pros', description: 'Free, ample on-site parking for members, with easy load-in for supplies and equipment.' },
            { icon: 'Car', title: 'Parking for clients', description: 'Free on-site client parking steps from the entrance, plus a quick drop-off spot by the door.' },
            { icon: 'DoorOpen', title: 'Suite 201 entrance', description: 'Follow the gold signage to our main door and directory kiosk.' },
            { icon: 'Clock', title: '24/7 for pros', description: 'Smart-lock access means early starts and late appointments are no problem.' },
          ],
          nearby: [
            { name: 'Halidom Eatery', detail: 'Next door' },
            { name: 'East Atlanta Village', detail: '5 min drive' },
            { name: 'I-20', detail: '3 min drive' },
            { name: 'Grant Park & Ormewood Park', detail: '6 min drive' },
          ],
        }, { theme: 'ivory', anchor: 'location' }),
        section('faq', {
          eyebrow: 'FAQ',
          heading: 'Questions, answered.',
          intro: "Don't see yours? Email us and we'll get back to you within a day.",
          items: [
            { category: 'Licensing', question: 'Do I need a license to rent a suite?', answer: 'Yes. Every pro needs a current Georgia license for their service (cosmetology, barbering, esthetics, nail technology or massage therapy). We verify licenses during onboarding.' },
            { category: 'Licensing', question: 'Do I need my own business license?', answer: 'Most pros operate as independent businesses, so we recommend registering your business with the City of Atlanta. We are happy to point you to resources.' },
            { category: 'Insurance', question: 'Is professional liability insurance required?', answer: 'Yes. Members carry their own professional liability insurance and list Shear Chemistry as an additional insured. Policies are typically affordable and easy to set up.' },
            { category: 'Membership', question: 'What are the membership terms?', answer: 'We offer weekly-billed memberships with flexible term lengths. Founding Members receive priority pricing and first choice of suites. Full details are shared during your tour.' },
            { category: 'Membership', question: "What's included in my rent?", answer: '- Utilities and high-speed Wi-Fi\n- 24/7 smart-lock access\n- Wash & Dry Lounge and laundry\n- Breakroom, directory kiosk and parking' },
            { category: 'Customization', question: 'Can I decorate my suite?', answer: 'Absolutely. Suites are delivered neutral so you can paint, hang art, add lighting and set up retail displays to match your brand.' },
            { category: 'Timeline', question: 'When do you open?', answer: 'Our build-out is underway with a grand opening planned for **May 2027**. Follow along on the [Build-Out page](/build-out).' },
            { category: 'Timeline', question: 'When can I tour?', answer: 'Private tours begin in Spring 2027, once walkthroughs are safe. Founding Members are invited first.' },
          ],
        }, { theme: 'light', anchor: 'faq' }),
      ],
    },
    {
      slug: 'find-a-pro',
      title: 'Find a Beauty Pro',
      availability: 'phase2',
      seoTitle: 'Find a Beauty Pro in SE Atlanta',
      seoDescription: 'Find independent hair stylists, barbers, lash artists, estheticians, nail techs and wellness pros at Shear Chemistry Salon Suites on Moreland Ave, Atlanta.',
      sections: [
        section('pageHeader', { eyebrow: 'Member directory', heading: 'Find your beauty pro.', intro: 'Meet the independent artists of Shear Chemistry and book directly with them.', background: null }, { theme: 'dark' }),
        section('directory', { eyebrow: '', heading: '', intro: '', emptyMessage: 'Our pros are moving in. Check back soon.' }, { theme: 'ivory' }),
      ],
    },
    {
      slug: 'book-a-tour',
      title: 'Book a Tour',
      availability: 'phase2',
      seoTitle: 'Book a Private Suite Tour',
      seoDescription: 'Schedule a private tour of Shear Chemistry Salon Suites at 1341 Moreland Ave, Atlanta. See single and double, wet and dry suites in person.',
      sections: [
        section('pageHeader', { eyebrow: 'Private tours', heading: 'Come see the chemistry.', intro: 'Pick a time for a private, one-on-one walkthrough of the studio and available suites.', background: hero.ref() }, { theme: 'dark' }),
        section('tourBooking', {
          eyebrow: 'Book a tour',
          heading: 'Choose your time.',
          intro: 'Tours last about 30 minutes. Bring your questions, and your vision.',
          image: suitesImg.doubleDry.ref(),
          expectations: ['Walk through available suites', 'See the Wash & Dry Lounge', 'Review membership options', 'Reserve your suite on the spot'],
          successTitle: 'Your tour is requested.',
          successMessage: 'We sent a confirmation to your email and will confirm your appointment shortly.',
        }, { theme: 'light', anchor: 'book' }),
      ],
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      seoTitle: 'Privacy Policy',
      seoDescription: 'How Shear Chemistry Salon Suites collects and uses your information.',
      sections: [
        section('richText', {
          heading: 'Privacy Policy',
          body: "We collect the details you share through our forms (such as your name, email, phone number and suite preferences) only to respond to your inquiry, share leasing updates and schedule tours.\n\n### What we never do\n- Sell your information\n- Share it with third parties for marketing\n\n### Contact\nQuestions? Email [hello@shearchemistrysuites.com](mailto:hello@shearchemistrysuites.com).\n\n*Sample text. Replace with your final policy.*",
        }, { theme: 'ivory' }),
      ],
    },
  ];
  for (const [i, p] of pages.entries()) {
    await db.orm.pages.create({
      slug: p.slug,
      title: p.title,
      status: 'published',
      availability: ('availability' in p ? p.availability : 'all') as string,
      sections: JSON.parse(JSON.stringify(p.sections)),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      ogImage: null,
      noIndex: p.slug === 'privacy-policy',
      order: i + 1,
    });
  }

  /* ----------------------------- Collections ----------------------------- */
  const milestones = [
    { title: 'Permits & Prep', dateLabel: 'October – November 2026', status: 'completed', caption: 'Lease signed, architectural drawings finalized and building permits **approved**. Demolition and site prep are complete.', gallery: [build.blueprint.ref(), mood.ref()] },
    { title: 'Framing & Plumbing', dateLabel: 'December 2026 – January 2027', status: 'in-progress', caption: 'Suite walls are framed and rough-in plumbing is going in for the wet suites and the Wash & Dry Lounge.', gallery: [build.framing.ref(), build.plumbing.ref()] },
    { title: 'Custom Finishes & Smart Locks', dateLabel: 'February – April 2027', status: 'upcoming', caption: 'Tile, cabinetry, lighting and black-and-gold signage go in, along with smart locks on every suite.', gallery: [build.finishes.ref(), build.smartlock.ref()] },
    { title: 'Final Reveal & May 2027 Opening', dateLabel: 'May 2027', status: 'upcoming', caption: 'Final walkthroughs, Founding Member move-in and our grand opening celebration on Moreland Avenue.', gallery: [build.reveal.ref()] },
  ];
  for (const [i, m] of milestones.entries()) await db.orm.milestones.create({ ...m, order: i + 1 });

  const suites = [
    { name: 'Single Dry Suite', size: 'single', wetDry: 'dry', count: 8, available: 8, sqft: '≈ 110 sq ft', priceLabel: 'Founding Member pricing shared on tour', summary: 'A private studio for lash, brow, esthetics, nail and cut-focused pros.', description: 'Uses the shared Wash & Dry Lounge for shampoo services.', features: ['Hydraulic styling chair', 'Full-length mirror', 'Built-in cabinetry', 'Dedicated outlets & lighting'], image: suitesImg.singleDry.ref() },
    { name: 'Single Wet Suite', size: 'single', wetDry: 'wet', count: 6, available: 6, sqft: '≈ 120 sq ft', priceLabel: 'Founding Member pricing shared on tour', summary: 'Everything a stylist or colorist needs, including a private shampoo bowl.', description: 'Ideal for color and full-service hair pros who want every step in one room.', features: ['Private shampoo bowl', 'Hydraulic styling chair', 'Full-length mirror', 'Built-in cabinetry'], image: suitesImg.singleWet.ref() },
    { name: 'Double Dry Suite', size: 'double', wetDry: 'dry', count: 3, available: 3, sqft: '≈ 200 sq ft', priceLabel: 'Founding Member pricing shared on tour', summary: 'Room for two stations, a treatment bed, or a growing team.', description: 'Perfect for partners, esthetician + lash combos, or a chair plus retail.', features: ['Two styling stations', 'Space for a treatment bed', 'Extra storage', 'Retail display wall'], image: suitesImg.doubleDry.ref() },
    { name: 'Double Wet Suite', size: 'double', wetDry: 'wet', count: 3, available: 3, sqft: '≈ 220 sq ft', priceLabel: 'Founding Member pricing shared on tour', summary: 'Our largest suite, with a private shampoo bowl and two stations.', description: 'Built for busy colorists and duos who want a full salon experience.', features: ['Private shampoo bowl', 'Two styling stations', 'Extra storage', 'Retail display wall'], image: suitesImg.doubleWet.ref() },
  ];
  for (const [i, s] of suites.entries()) await db.orm.suites.create({ ...s, gallery: [], published: true, order: i + 1 });

  const members = [
    { name: 'Jasmine Carter', businessName: 'Coil & Crown Studio', suiteNumber: '03', specialty: 'Hair', bio: 'Natural hair specialist focused on healthy silk presses, color and protective styles.', instagram: 'coilandcrown.atl', bookingUrl: 'https://glossgenius.com', featured: true },
    { name: 'Marcus Reed', businessName: 'Reed Cuts', suiteNumber: '07', specialty: 'Barbering', bio: 'Precision fades, beard sculpting and hot towel shaves in a laid-back suite.', instagram: 'reedcuts', bookingUrl: 'https://booksy.com', featured: false },
    { name: 'Ava Nguyen', businessName: 'Lash Lab ATL', suiteNumber: '12', specialty: 'Lashes', bio: 'Classic, hybrid and volume lash extensions with a focus on lash health.', instagram: 'lashlab.atl', bookingUrl: 'https://vagaro.com', featured: false },
    { name: 'Simone Brooks', businessName: 'Glow Theory Skin', suiteNumber: '15', specialty: 'Esthetics', bio: 'Licensed esthetician offering custom facials, dermaplaning and brow design.', instagram: 'glowtheoryskin', bookingUrl: 'https://squareup.com', featured: true },
    { name: 'Elena Torres', businessName: 'Polished by Elena', suiteNumber: '16', specialty: 'Nails', bio: 'Structured gel manicures and minimalist nail art.', instagram: 'polishedbyelena', bookingUrl: 'https://glossgenius.com', featured: false },
    { name: 'Dana Wells', businessName: 'Still Point Wellness', suiteNumber: '19', specialty: 'Wellness', bio: 'Licensed massage therapist specializing in deep tissue and lymphatic drainage.', instagram: 'stillpoint.wellness', bookingUrl: 'https://vagaro.com', featured: false },
  ];
  for (const [i, m] of members.entries()) await db.orm.members.create({ ...m, headshot: heads[i].ref(`Headshot of ${m.name} of ${m.businessName}`), published: true, order: i + 1 });

  const leads = [
    ['Tiana Morris', '404-555-0181', 'tiana.morris@example.com', 'Hair Stylist', 'Single', 'Wet (with shampoo bowl)', 'May 2027 (Grand Opening)', 'Currently booth renting in Decatur, ready for my own space!', 'new'],
    ['Andre Lewis', '678-555-0122', 'andre.lewis@example.com', 'Barber', 'Single', 'Dry', 'May 2027 (Grand Opening)', '', 'contacted'],
    ['Kayla Simmons', '470-555-0199', 'kayla.s@example.com', 'Lash Artist', 'Single', 'Dry', 'Summer 2027', 'Would love a suite near the front.', 'new'],
    ['Brianna & Nia Hall', '404-555-0110', 'hallsisters@example.com', 'Colorist', 'Double', 'Wet (with shampoo bowl)', 'May 2027 (Grand Opening)', 'Two colorists looking to share a double suite.', 'toured'],
    ['Priya Desai', '770-555-0147', 'priya.desai@example.com', 'Esthetician', 'Single', 'Dry', 'Fall 2027', '', 'new'],
    ['Chris Johnson', '404-555-0163', 'chris.j@example.com', 'Massage / Wellness', 'Double', 'Dry', 'Just exploring', 'Need room for a massage table.', 'archived'],
    ['Lauren Kim', '678-555-0175', 'lauren.kim@example.com', 'Nail Technician', 'Single', 'Not sure yet', 'Summer 2027', '', 'signed'],
    ['Jordan Price', '470-555-0138', 'jordan.price@example.com', 'Brow Artist', 'Not sure yet', 'Dry', 'May 2027 (Grand Opening)', '', 'new'],
  ];
  // Sample inquiries only go into an empty inbox, so real leads never get mixed with fake ones.
  const seedLeads = !(await db.orm.leads.select('id').first());
  if (seedLeads) {
    for (const [name, phone, email, specialty, suiteSize, suiteType, moveIn, message, status] of leads) {
      await db.orm.leads.create({ name, phone, email, specialty, suiteSize, suiteType, moveIn, message, status, notes: '', emailStatus: 'sent' });
    }
  }

  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  const seedBookings = !(await db.orm.bookings.select('id').first());
  if (seedBookings) await db.orm.bookings.create({ name: 'Tiana Morris', email: 'tiana.morris@example.com', phone: '404-555-0181', specialty: 'Hair Stylist', date: inDays(5), time: '11:00', notes: 'Interested in a wet suite.', status: 'confirmed', emailStatus: 'sent' });
  if (seedBookings) await db.orm.bookings.create({ name: 'Priya Desai', email: 'priya.desai@example.com', phone: '770-555-0147', specialty: 'Esthetician', date: inDays(8), time: '14:00', notes: '', status: 'pending', emailStatus: 'sent' });

  console.log(`Seeded ${pages.length} pages, ${milestones.length} milestones, ${suites.length} suite types, ${members.length} pros, ${seedLeads ? leads.length : 0} sample leads and ${seedBookings ? 2 : 0} sample bookings.`);
}

main()
  .then(() => closeDb())
  .catch(async (err) => {
    console.error(err);
    await closeDb();
    process.exit(1);
  });
