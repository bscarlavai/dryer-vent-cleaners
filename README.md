# Dryer Vent Cleaners

A comprehensive directory of dryer vent cleaning services across the United States, built with Next.js and deployed on Cloudflare Pages.

## Features

- **State-by-State Directory**: Browse dryer vent cleaning services organized by state
- **City Pages**: Detailed listings for each city with services
- **Individual Service Pages**: Comprehensive information for each dryer vent cleaning service
- **SEO Optimized**: Built with Next.js SEO best practices
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Fast Performance**: Optimized for speed and user experience

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages
- **Database**: Supabase (for data storage)
- **SEO**: next-seo for meta tags and optimization

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dryer-vent-cleaners
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003) to view the application.

## Project Structure

```
dryer-vent-cleaners/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── states/            # State pages
│       ├── page.tsx       # All states listing
│       └── [state]/       # Individual state pages
├── components/            # Reusable components
│   ├── Header.tsx         # Site header
│   └── Footer.tsx         # Site footer
├── public/               # Static assets
└── scripts/              # Utility scripts
    └── import_data.js    # Data import script
```

## Deployment

### Cloudflare Pages

1. Build the project:
```bash
npm run build:cloudflare
```

2. Deploy to Cloudflare:
```bash
npm run deploy
```

### Environment Variables

Set these in your Cloudflare Pages dashboard:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Data Management

The site uses Supabase for data storage. To import data:

1. Set up your Supabase project and create the required tables
2. Configure environment variables
3. Run the import script:
```bash
npm run import-data
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository. 