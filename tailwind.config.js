/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode using the 'class' strategy (requires ThemeProvider)
  darkMode: ['class'],
  // Specify files where Tailwind classes will be used
  content: [
    './pages/**/*.{ts,tsx}', // Include pages if using a pages directory
    './components/**/*.{ts,tsx}', // Include custom components
    './app/**/*.{ts,tsx}', // Include if using Next.js App Router structure
    './src/**/*.{ts,tsx}', // Include all files in src
    './index.html', // Include the main HTML file
  ],
  // Optional prefix for Tailwind classes (usually not needed)
  prefix: '',
  // Theme customization
  theme: {
    // Container settings (used by 'container' class)
    container: {
      center: true, // Center the container by default
      padding: '2rem', // Default padding
      screens: {
        // Max widths for different breakpoints
        '2xl': '1400px',
      },
    },
    // Extend the default Tailwind theme
    extend: {
      // Define custom colors using CSS variables set by Shadcn UI
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))', // Focus ring color
        background: 'hsl(var(--background))', // Default background
        foreground: 'hsl(var(--foreground))', // Default text color
        primary: {
          // Primary color palette
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          // Secondary color palette
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          // Destructive actions (e.g., delete)
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          // Muted elements (less emphasis)
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          // Accents (e.g., hover states)
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          // Popover backgrounds
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          // Card backgrounds
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      // Define border radius using CSS variables set by Shadcn UI
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Define keyframe animations used by Shadcn UI components
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Add other custom keyframes if needed
      },
      // Define animation utilities using the keyframes
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      // Extend typography styles using @tailwindcss/typography plugin
      typography: (theme) => ({
        DEFAULT: {
          css: {
            // --- Base Colors ---
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))', // Headings same as body text
            '--tw-prose-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-links': 'hsl(var(--primary))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-hr': 'hsl(var(--border))',
            '--tw-prose-quotes': 'hsl(var(--foreground))',
            '--tw-prose-quote-borders': 'hsl(var(--border))',
            '--tw-prose-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-code': 'hsl(var(--foreground))', // Inline code text color
            '--tw-prose-pre-code': 'hsl(var(--secondary-foreground))', // Code block text color
            '--tw-prose-pre-bg': 'hsl(var(--secondary))', // Code block background
            '--tw-prose-th-borders': 'hsl(var(--border))',
            '--tw-prose-td-borders': 'hsl(var(--border))',
            // --- Inverted (Dark Mode) Colors ---
            '--tw-prose-invert-body': 'hsl(var(--foreground))',
            '--tw-prose-invert-headings': 'hsl(var(--foreground))',
            '--tw-prose-invert-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-links': 'hsl(var(--primary))',
            '--tw-prose-invert-bold': 'hsl(var(--foreground))',
            '--tw-prose-invert-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-hr': 'hsl(var(--border))',
            '--tw-prose-invert-quotes': 'hsl(var(--foreground))',
            '--tw-prose-invert-quote-borders': 'hsl(var(--border))',
            '--tw-prose-invert-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-code': 'hsl(var(--foreground))',
            '--tw-prose-invert-pre-code': 'hsl(var(--secondary-foreground))',
            '--tw-prose-invert-pre-bg': 'hsl(var(--secondary))',
            '--tw-prose-invert-th-borders': 'hsl(var(--border))',
            '--tw-prose-invert-td-borders': 'hsl(var(--border))',
            // --- Element Styling ---
            h1: { fontWeight: '700' },
            h2: { fontWeight: '600' },
            h3: { fontWeight: '600' },
            img: {
              // Style images within prose
              borderRadius: theme('borderRadius.md'), // Apply border radius
              marginTop: theme('spacing.4'),
              marginBottom: theme('spacing.4'),
            },
            code: {
              // Style inline code blocks
              padding: '0.2em 0.4em',
              margin: '0 0.1em',
              fontSize: '85%',
              backgroundColor: 'hsl(var(--muted))', // Use muted background
              borderRadius: theme('borderRadius.sm'),
              fontWeight: '400', // Normal font weight
            },
            'code::before': { content: '""' }, // Remove default quotes around inline code
            'code::after': { content: '""' },
            pre: {
              // Style code blocks (fenced)
              borderRadius: theme('borderRadius.md'),
              padding: theme('spacing.4'),
              overflowX: 'auto', // Enable horizontal scroll for long lines
              marginTop: theme('spacing.4'),
              marginBottom: theme('spacing.4'),
              backgroundColor: 'hsl(var(--secondary))', // Match variable
            },
            'pre code': {
              // Reset styles for code inside pre
              backgroundColor: 'transparent',
              padding: '0',
              margin: '0',
              borderRadius: '0',
              fontWeight: 'inherit',
              fontSize: 'inherit',
              color: 'inherit', // Inherit color from pre
            },
            a: {
              // Style links
              textDecoration: 'none', // No underline by default
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline', // Underline on hover
              },
            },
            ul: { listStyleType: 'disc', paddingLeft: theme('spacing.5') },
            ol: { listStyleType: 'decimal', paddingLeft: theme('spacing.5') },
            li: {
              marginTop: theme('spacing.1'),
              marginBottom: theme('spacing.1'),
            },
            '> ul > li p': {
              marginTop: theme('spacing.1'),
              marginBottom: theme('spacing.1'),
            }, // Adjust nested list paragraph spacing
            '> ol > li p': {
              marginTop: theme('spacing.1'),
              marginBottom: theme('spacing.1'),
            },
            blockquote: {
              paddingLeft: theme('spacing.4'),
              borderLeftWidth: '0.25rem', // Use rem for border
              fontStyle: 'normal', // Not italic by default
              color: 'hsl(var(--muted-foreground))', // Muted text color
              borderLeftColor: 'hsl(var(--border))',
            },
            'blockquote p:first-of-type::before': { content: 'none' }, // Remove default quote marks
            'blockquote p:last-of-type::after': { content: 'none' },
          },
        },
      }),
    },
  },
  // Register Tailwind plugins
  plugins: [
    require('tailwindcss-animate'), // For Shadcn UI animations
    require('@tailwindcss/typography'), // For Markdown preview styling
  ],
};
