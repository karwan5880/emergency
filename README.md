# Emergency App - Modern Emergency Management Application

A cutting-edge emergency management application built with Next.js, React, TypeScript, and modern web technologies.

## 🚀 Features

- **User Authentication**: Secure sign-up and sign-in with Clerk
- **Emergency Reporting**: Report and track emergency incidents
- **Real-time Notifications**: Instant alerts and updates
- **Priority Management**: Categorize emergencies by priority level
- **Status Tracking**: Monitor emergency status in real-time
- **Dashboard Analytics**: Overview of active and resolved emergencies
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with SSR
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Lucide React** - Icon library

### Backend & Database
- **Convex** - Full-stack TypeScript platform for real-time apps
- **Clerk** - Modern authentication solution

### Additional Services
- **Vercel** - Hosting & deployment

## 📁 Project Structure

```
emergency/
├── src/
│   ├── app/
│   │   ├── dashboard/        # Dashboard page
│   │   ├── sign-in/          # Sign-in page
│   │   ├── sign-up/          # Sign-up page
│   │   ├── layout.tsx        # Root layout with providers
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   └── ui/               # shadcn/ui components
│   └── lib/                  # Utility functions
├── convex/
│   └── schema.ts             # Convex database schema
└── public/                   # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub account
- Clerk account (https://dashboard.clerk.com)
- Convex account (https://www.convex.dev)

### Installation

1. Navigate to the emergency directory:
```bash
cd emergency
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

4. Set up Convex:
```bash
npx convex dev
```
Follow the prompts to create a new Convex project or link to an existing one.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Architecture

### Database Schema
- **users**: User profiles and metadata
- **emergencies**: Emergency reports and incidents
- **notifications**: User notifications and alerts

### Authentication Flow
1. User signs up/in via Clerk
2. User data synced to Convex
3. Dashboard accessible only to authenticated users
4. Real-time updates via Convex subscriptions

## 🔒 Security

- Bank-level 256-bit encryption
- Secure authentication with Clerk
- Type-safe operations with TypeScript
- Input validation on all forms
- HTTPS-only in production
- Environment variables for sensitive data

## 📊 Core Features Implementation

### Dashboard
- Emergency overview
- Quick action buttons
- Recent emergencies list
- Status tracking

### Emergency Management
- Report new emergencies
- Set priority levels
- Track status updates
- Real-time notifications

### Notifications
- Real-time emergency alerts
- Status update notifications
- Priority-based notifications

## 🚢 Deployment

Deploy to Vercel with one click:

1. Push to GitHub
2. Connect GitHub to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

## 📈 Future Enhancements

- [ ] Location-based emergency tracking
- [ ] Team collaboration features
- [ ] Advanced analytics and reports
- [ ] Mobile app (React Native)
- [ ] Integration with emergency services
- [ ] Real-time chat functionality
- [ ] Emergency response workflows

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📝 License

This project is licensed under the MIT License.

---

**Status**: 🚀 Ready for Development

Built with the same tech stack as Fintech Banking App

