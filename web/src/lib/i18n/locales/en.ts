/**
 * English dictionary. Typed as `Dictionary` (the shape of `es.ts`), so the
 * compiler flags any missing or extra key versus the Spanish source of truth.
 */
import type { Dictionary } from './es';

export const en: Dictionary = {
	nav: {
		cases: 'Cases',
		howWeWork: 'How we work',
		contact: 'Contact'
	},

	hero: {
		badge: 'Automation for businesses in Rosario',
		titleA: 'Your business is losing money in places',
		titleEm: "you can't see",
		titleB: '. We find them.',
		subtitle:
			'We design systems that connect WhatsApp, spreadsheets, reviews and orders so your business responds on its own — without losing control of what happens.',
		ctaPrimary: 'See cases in action',
		ctaSecondary: 'Tell us about my case',
		lynxAlt: 'A lynx watching a valley from a rock, alert to the whole landscape'
	},

	cases: {
		title: 'Three ways this is already working',
		meta: '003 cases · simulated data',
		intro:
			'Three situations any business will recognize, with the system actually running. Try the first one yourself — reply as if you were the customer and watch what happens.',
		case1: {
			tag: 'Customer service',
			title: 'The WhatsApp that never sleeps',
			hook: 'How many customers went elsewhere while your phone rang nonstop?',
			body: 'A restaurant gets 20 to 40 messages a day with the same questions. While someone cooks or waits tables, those messages pile up — and some customers leave for somewhere else before they get an answer.',
			try: 'Try it yourself'
		},
		case2: {
			tag: 'Reputation',
			title: 'The one-star review nobody saw',
			hook: 'When was the last time you looked at what Google says about your business?',
			body: 'A hair salon has a great reputation on Instagram but never checks Google Maps. A negative review sat unanswered for three weeks — visible to everyone who looked up the business before deciding whether to walk in.',
			result: 'No review goes unanswered.',
			resultStrong: 'You find out in minutes, not weeks.'
		},
		case3: {
			tag: 'Sales',
			title: 'The quote that goes cold on its own',
			hook: 'How much money slipped away in quotes you sent that nobody followed up on?',
			body: 'A service shop sends quotes over WhatsApp and never follows up. Some customers simply forget to reply — and that money never shows up anywhere again.',
			result: 'Every quote gets followed up automatically.',
			resultStrong: 'The money stops going cold.'
		},
		stats: {
			s1num: '3',
			s1: 'channels connected per system on average (WhatsApp, spreadsheets, reviews)',
			s2num: '~2 wks',
			s2: 'from the first assessment to a working system',
			s3num: '0',
			s3: 'changes the business team has to learn to operate'
		}
	},

	process: {
		title: 'How we work',
		kicker: 'process',
		steps: {
			s1: {
				t: 'Assessment',
				d: "A short conversation to understand where time or money is leaking today. You don't need anything digitized yet."
			},
			s2: {
				t: 'Build',
				d: 'We build the system by connecting the tools you already use — WhatsApp, spreadsheets, social — without asking you to switch platforms.'
			},
			s3: {
				t: 'Test with real data',
				d: 'The system runs in parallel for a few days to tune responses and rules before your day-to-day depends on it.'
			},
			s4: {
				t: 'Ongoing support',
				d: "Once it's live, we monitor and adjust. The system gets better over time — it doesn't stay frozen the day it ships."
			}
		}
	},

	contact: {
		title: 'Does any of this sound familiar?',
		subtitle:
			'If there is a task that repeats every single day in your business — and you can tell it could run itself — that is the conversation we want to have.',
		infoTitle: 'Contact',
		emailLabel: 'Email',
		emailValue: 'hola@lince.dev',
		whatsappLabel: 'WhatsApp',
		whatsappValue: 'Rosario, Santa Fe',
		replyLabel: 'Reply',
		replyValue: 'within 24 hrs'
	},

	footer:
		'Lince — automation systems for local businesses. Illustrative cases with simulated data.',

	meta: {
		title: 'Lince — Automation for businesses',
		description:
			'We design systems that connect WhatsApp, spreadsheets, reviews and orders so your business responds on its own, without losing control. Automation for businesses in Rosario.',
		ogDescription: "Your business is losing money in places you can't see. We find them."
	},

	form: {
		name: 'Your name',
		namePh: 'What should we call you',
		business: 'Your business',
		businessOptional: '(optional)',
		businessPh: 'Name of the shop or trade',
		contact: 'Email or WhatsApp',
		contactPh: 'Where we should reach you',
		message: 'Which task repeats every day?',
		messagePh: 'Tell us briefly about your case',
		submit: 'Tell us about my case',
		submitting: 'Sending…',
		invalid: 'Please review the highlighted fields.',
		sending: 'Sending…',
		success: "Done! We got your message. We'll get back to you within 24 hrs.",
		botThanks: "Thanks! We'll be in touch."
	},

	receipt: {
		title: 'Quote follow-up',
		sub: 'Ríos Workshop · last 30 days',
		sent: 'Quotes sent',
		noReply: 'No reply after 48 hrs',
		recovered: 'Recovered with a reminder',
		recoveredIncome: 'Income recovered'
	},

	monitor: {
		header: 'Live monitor · Marrón Studio',
		f1Label: 'Review detected · Google Maps',
		f1Stars: '1 of 5 stars',
		f1Quote: '"I waited 40 minutes past my appointment and nobody said a word. So disrespectful."',
		f1Meta: '8 minutes ago · unanswered',
		f2Label: 'Analyzing tone',
		f2Quote:
			'Customer upset about the delay. High risk: mentions disrespect and could sway others.',
		f2Meta: 'priority: urgent',
		f3Label: 'Suggested response',
		f3Response:
			"\"We're so sorry about the wait, Ana. That's not the experience we want to give. We'd love to make it up to you on your next visit — we'll message you privately.\"",
		f3Meta: 'tone: warm · ready to send',
		f4Label: 'Resolved',
		f4Check: 'Answered in 12 minutes',
		f4Quote: 'The owner got an alert instantly. The review no longer sat for three weeks.',
		f4Meta: 'average response time: 14 min'
	},

	chat: {
		businessName: 'El Fogón Grill House',
		online: 'online',
		typing: 'typing...',
		logAria: 'Demo conversation',
		typingAria: 'Typing',
		inputAria: 'Your reply',
		sendAria: 'Send',
		restartHard: '↺ Start another conversation',
		restartSoft: '↺ Try again'
	},

	ui: {
		theme: 'Theme',
		toLight: 'Switch to light theme',
		toDark: 'Switch to dark theme',
		language: 'Language',
		switchToEnglish: 'Switch to English',
		switchToSpanish: 'Cambiar a español'
	},

	admin: {
		brand: 'Lince · Panel',
		loading: 'Loading panel…',
		login: {
			subtitle: 'Team access',
			missingEnvBefore: 'Supabase variables are missing. Copy',
			missingEnvAfter: 'and fill them in.',
			email: 'Email',
			password: 'Password',
			submit: 'Sign in',
			submitting: 'Signing in…'
		},
		tabs: {
			summary: 'Summary',
			leads: 'Leads',
			budgets: 'Quotes',
			reviews: 'Reviews'
		},
		userEmailFallback: '',
		logout: 'Sign out',
		summary: {
			title: 'Summary',
			subtitle: 'A quick look at how the business is doing.',
			error: 'We could not load the metrics.',
			leads: 'Leads',
			budgets: 'Quotes',
			reviews: 'Reviews',
			leadsNew: 'New',
			leadsInConvo: 'In conversation',
			leadsWon: 'Won',
			budgetsSent: 'Sent',
			budgetsNoReply: 'No reply',
			budgetsWon: 'Won',
			reviewsNew: 'New',
			reviewsAnalyzing: 'Analyzing',
			reviewsAnswered: 'Answered'
		},
		leads: {
			title: 'Leads received',
			subtitle: 'Contacts that came in from the landing page form.',
			searchPh: 'Search name, business, contact…',
			allStatuses: 'All statuses',
			exportCsv: 'Export CSV',
			error: 'We could not load the leads.',
			empty: 'No leads for this filter.',
			count: '{n} lead(s).',
			colDate: 'Date',
			colName: 'Name',
			colBusiness: 'Business',
			colContact: 'Contact',
			colMessage: 'Message',
			colStatus: 'Status',
			colNotes: 'Notes'
		},
		budgets: {
			title: 'Quotes',
			subtitle: 'Quotes sent and their follow-up.',
			error: 'We could not load the quotes.',
			empty: 'No quotes yet.',
			count: '{n} quote(s).',
			customer: 'Customer',
			contact: 'Email or WhatsApp',
			amount: 'Amount',
			description: 'Description',
			add: 'Add quote',
			adding: 'Adding…',
			added: 'Added ✓',
			saveError: 'Could not save.',
			exportCsv: 'Export CSV',
			colSent: 'Sent',
			colCustomer: 'Customer',
			colContact: 'Contact',
			colAmount: 'Amount',
			colDescription: 'Description',
			colFollowups: 'Reminders',
			colStatus: 'Status'
		},
		reviews: {
			title: 'Reviews',
			subtitle: 'Detected reviews to manage and respond to.',
			error: 'We could not load the reviews.',
			empty: 'No reviews loaded.',
			count: '{n} review(s).',
			anon: 'Anonymous',
			starsAria: '{n} of 5',
			suggestedLabel: 'Suggested:',
			suggest: 'Suggest a response',
			generating: 'Generating…'
		},
		csv: {
			date: 'Date',
			name: 'Name',
			business: 'Business',
			contact: 'Contact',
			message: 'Message',
			status: 'Status',
			notes: 'Notes',
			sent: 'Sent',
			customer: 'Customer',
			amount: 'Amount',
			description: 'Description',
			followups: 'Reminders'
		},
		status: {
			lead: {
				nuevo: 'new',
				contactado: 'contacted',
				en_conversacion: 'in conversation',
				ganado: 'won',
				descartado: 'discarded'
			},
			budget: {
				enviado: 'sent',
				sin_respuesta: 'no reply',
				recordado: 'reminded',
				ganado: 'won',
				perdido: 'lost'
			},
			review: {
				nueva: 'new',
				analizando: 'analyzing',
				respondida: 'answered'
			},
			priority: {
				urgente: 'urgent',
				media: 'medium',
				baja: 'low'
			}
		},
		notesPh: 'Notes…',
		notesAria: 'Internal notes',
		statusAria: 'Change status',
		notSaved: 'not saved',
		retry: 'Retry'
	},

	errors: {
		network: 'We could not reach the server. Try again in a moment.',
		networkRetry: 'We could not reach the server. Try again in a minute.',
		generic: 'Something went wrong. Try again.',
		genericServer: 'Error {status}',
		load403:
			'You signed in, but your user does not have the admin role. Promote it (see supabase/README.md).',
		load401: 'Your session expired or is invalid. Please sign in again.',
		auth: {
			invalidLogin: 'Wrong email or password.',
			emailNotConfirmed:
				'Your email is not confirmed in Supabase yet (Authentication → Users → confirm).',
			network:
				'We could not reach Supabase. Check PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
			genericWith: 'We could not sign you in: {message}',
			generic: 'We could not sign you in.'
		}
	}
};
