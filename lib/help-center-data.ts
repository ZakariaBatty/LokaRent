export interface Article {
  id: string
  title: string
  description: string
  content: string
  category: string
  readTime: number
  views: number
  helpful: number
  published: string
  tags: string[]
  videoUrl?: string
  relatedArticles: string[]
}

export interface Category {
  id: string
  title: string
  description: string
  icon: string
  articles: string[]
  color: string
}

export const helpCenterCategories: Category[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "New to LokaRent? Start here with the essentials",
    icon: "Rocket",
    color: "blue",
    articles: ["gs-01", "gs-02", "gs-03", "gs-04"],
  },
  {
    id: "user-guides",
    title: "User Guides",
    description: "Master every feature with detailed guides",
    icon: "BookOpen",
    color: "purple",
    articles: ["ug-01", "ug-02", "ug-03", "ug-04", "ug-05"],
  },
  {
    id: "video-tutorials",
    title: "Video Tutorials",
    description: "Learn by watching step-by-step videos",
    icon: "Play",
    color: "amber",
    articles: ["vt-01", "vt-02", "vt-03"],
  },
  {
    id: "faq",
    title: "FAQ",
    description: "Answers to common questions",
    icon: "HelpCircle",
    color: "cyan",
    articles: ["faq-01", "faq-02", "faq-03", "faq-04", "faq-05"],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Solve common issues quickly",
    icon: "Zap",
    color: "rose",
    articles: ["ts-01", "ts-02", "ts-03", "ts-04"],
  },
  {
    id: "whats-new",
    title: "What's New",
    description: "Latest features and improvements",
    icon: "Star",
    color: "green",
    articles: ["wn-01", "wn-02", "wn-03"],
  },
  {
    id: "feature-requests",
    title: "Feature Requests",
    description: "Suggest and vote on new features",
    icon: "Lightbulb",
    color: "indigo",
    articles: ["fr-01", "fr-02"],
  },
]

export const helpCenterArticles: Record<string, Article> = {
  // Getting Started
  "gs-01": {
    id: "gs-01",
    title: "Setting Up Your First Rental",
    description: "Learn how to create and manage your first car rental",
    content: `# Setting Up Your First Rental

LokaRent makes it easy to get started with car rentals. Follow these steps to create your first rental:

## Step 1: Add Your Vehicle
1. Go to Fleet > Add New Vehicle
2. Fill in the vehicle details (brand, model, registration plate)
3. Set rental rates and availability
4. Upload vehicle photos

## Step 2: Configure Pricing
Set your daily, weekly, and monthly rates. You can also add seasonal pricing adjustments.

## Step 3: Create a Reservation
1. Go to Reservations > New Reservation
2. Select a customer and vehicle
3. Set rental dates and terms
4. Complete the booking

## Best Practices
- Keep vehicle information up-to-date
- Set realistic pricing based on market demand
- Enable automatic pricing based on demand
- Use templates for standard rental agreements`,
    category: "getting-started",
    readTime: 5,
    views: 2340,
    helpful: 89,
    published: "2024-01-15",
    tags: ["vehicles", "reservations", "pricing"],
    relatedArticles: ["gs-02", "ug-01"],
  },
  "gs-02": {
    id: "gs-02",
    title: "Dashboard Overview",
    description: "Understand the main dashboard and its key metrics",
    content: `# Dashboard Overview

The LokaRent dashboard gives you a complete overview of your rental business at a glance.

## Key Metrics
- **Active Reservations**: Current bookings and their status
- **Revenue**: Today's and month's earnings
- **Fleet Status**: Vehicle availability and utilization
- **Recent Activity**: Latest bookings and updates

## Widgets
- Reservation timeline
- Revenue charts
- Vehicle availability
- Top performing vehicles
- Upcoming maintenance alerts

## Customization
You can customize which widgets appear on your dashboard by clicking the settings icon.`,
    category: "getting-started",
    readTime: 3,
    views: 1890,
    helpful: 76,
    published: "2024-01-14",
    tags: ["dashboard", "overview"],
    relatedArticles: ["gs-01", "ug-02"],
  },
  "gs-03": {
    id: "gs-03",
    title: "Managing Your Fleet",
    description: "Complete guide to fleet management",
    content: `# Managing Your Fleet

Your fleet is the backbone of your rental business. Here's how to manage it effectively.

## Adding Vehicles
1. Click Fleet > Add Vehicle
2. Enter vehicle information
3. Upload photos and documents
4. Set availability calendar
5. Configure pricing tiers

## Vehicle Maintenance
- Schedule regular maintenance
- Track maintenance history
- Get alerts for upcoming service dates
- Manage maintenance costs

## Insurance & Documents
- Upload insurance certificates
- Track document expiration dates
- Manage vehicle registrations
- Store inspection reports`,
    category: "getting-started",
    readTime: 6,
    views: 2100,
    helpful: 82,
    published: "2024-01-13",
    tags: ["fleet", "vehicles", "maintenance"],
    relatedArticles: ["ug-02", "ts-01"],
  },
  "gs-04": {
    id: "gs-04",
    title: "Customer Management",
    description: "Best practices for managing customer profiles",
    content: `# Customer Management

Building strong customer relationships is essential to your success.

## Creating Customer Profiles
- Store complete contact information
- Track rental history
- Save payment preferences
- Add custom notes and preferences

## Customer Communication
- Send reservation confirmations
- Remind customers about upcoming rentals
- Request feedback after rentals
- Handle special requests

## Customer Tiers
Organize customers by tier based on booking frequency and value:
- Bronze: New customers
- Silver: Regular customers
- Gold: VIP customers with special benefits`,
    category: "getting-started",
    readTime: 4,
    views: 1650,
    helpful: 71,
    published: "2024-01-12",
    tags: ["customers", "profiles"],
    relatedArticles: ["ug-03"],
  },

  // User Guides
  "ug-01": {
    id: "ug-01",
    title: "Creating and Managing Reservations",
    description: "Deep dive into reservation management features",
    content: `# Creating and Managing Reservations

Reservations are the core of your rental business. Learn how to manage them efficiently.

## Creating a Reservation
1. Navigate to Reservations
2. Click New Reservation
3. Select a customer (existing or new)
4. Choose a vehicle
5. Set rental dates and terms
6. Add insurance and additional services
7. Complete payment
8. Send confirmation

## Managing Active Reservations
- View all active bookings on the calendar
- Track rental progress
- Handle customer requests
- Process early returns or extensions

## Reservation Status Flow
- Pending → Confirmed → Checked Out → In Progress → Returned → Completed
- Handle cancellations with appropriate refund policies
- Track no-shows and late returns`,
    category: "user-guides",
    readTime: 7,
    views: 3200,
    helpful: 91,
    published: "2024-01-10",
    tags: ["reservations", "bookings"],
    relatedArticles: ["gs-01", "ug-02"],
  },
  "ug-02": {
    id: "ug-02",
    title: "Financial Management & Invoicing",
    description: "Handle payments, invoices, and financial reporting",
    content: `# Financial Management & Invoicing

Master your rental business finances with comprehensive tools.

## Managing Payments
- Accept multiple payment methods
- Set payment terms (deposit, balance)
- Track payment status
- Handle partial payments
- Process refunds

## Creating Invoices
1. Go to Invoices
2. Create new invoice or from reservation
3. Customize invoice template
4. Add taxes and fees
5. Send to customer
6. Track payment status

## Financial Reports
- Monthly revenue reports
- Customer payment summaries
- Outstanding payments tracking
- Tax preparation reports`,
    category: "user-guides",
    readTime: 6,
    views: 2850,
    helpful: 85,
    published: "2024-01-09",
    tags: ["invoices", "payments", "finances"],
    relatedArticles: ["ug-03", "faq-02"],
  },
  "ug-03": {
    id: "ug-03",
    title: "Driver Assignment & Management",
    description: "Efficiently assign and manage drivers",
    content: `# Driver Assignment & Management

Manage your driver team and assignments effectively.

## Adding Drivers
1. Go to Drivers section
2. Add new driver with contact info
3. Upload license and documents
4. Set availability and zones
5. Configure commission/payment terms

## Assigning to Reservations
- Auto-assign based on availability
- Manually select drivers
- View driver workload
- Handle driver substitutions

## Driver Performance
- Track ratings from customers
- Monitor on-time performance
- Review incident reports
- Manage driver schedules`,
    category: "user-guides",
    readTime: 5,
    views: 2200,
    helpful: 78,
    published: "2024-01-08",
    tags: ["drivers", "management"],
    relatedArticles: ["gs-04", "ug-04"],
  },
  "ug-04": {
    id: "ug-04",
    title: "Contract Management",
    description: "Create, track, and manage rental agreements",
    content: `# Contract Management

Protect your business with proper contract management.

## Creating Contract Templates
- Define standard terms and conditions
- Customize for different vehicle types
- Include liability clauses
- Add damage policies
- Include insurance requirements

## Contract Workflow
1. Select or create template
2. Customize for specific rental
3. Send to customer for review
4. Track e-signature status
5. Store signed copies
6. Generate PDF for records

## Contract Analytics
- Track most common modifications
- Monitor acceptance rates
- Identify problem clauses
- Improve templates over time`,
    category: "user-guides",
    readTime: 5,
    views: 1950,
    helpful: 82,
    published: "2024-01-07",
    tags: ["contracts", "agreements"],
    relatedArticles: ["ug-01", "ug-02"],
  },
  "ug-05": {
    id: "ug-05",
    title: "Communication & Notifications",
    description: "Stay connected with customers via WhatsApp and more",
    content: `# Communication & Notifications

Keep customers informed with our integrated communication system.

## WhatsApp Integration
- Send rental confirmations
- Share pickup instructions
- Send reminders
- Handle customer inquiries
- Send feedback requests

## Email Notifications
- Automated booking confirmations
- Payment reminders
- Rental start/end notifications
- Customer feedback surveys
- Promotional messages

## Notification Settings
- Customize message templates
- Set delivery schedules
- Manage opt-ins/opt-outs
- Track delivery status
- Monitor customer engagement`,
    category: "user-guides",
    readTime: 4,
    views: 1600,
    helpful: 73,
    published: "2024-01-06",
    tags: ["communication", "whatsapp", "notifications"],
    relatedArticles: ["gs-02"],
  },

  // Video Tutorials
  "vt-01": {
    id: "vt-01",
    title: "Getting Started in 5 Minutes",
    description: "Quick video walkthrough of LokaRent basics",
    content: `# Getting Started in 5 Minutes

This video covers the essential steps to start renting cars on LokaRent.

## What You'll Learn
- Navigate the dashboard
- Add your first vehicle
- Create your first reservation
- Process payment
- Send confirmation to customer

## Duration: 5 minutes

Watch the video embedded below to get started:`,
    category: "video-tutorials",
    readTime: 5,
    views: 4500,
    helpful: 92,
    published: "2024-01-05",
    tags: ["video", "tutorial", "getting-started"],
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    relatedArticles: ["gs-01", "gs-02"],
  },
  "vt-02": {
    id: "vt-02",
    title: "Advanced Pricing Strategies",
    description: "Master dynamic pricing and seasonal rates",
    content: `# Advanced Pricing Strategies

Learn how to maximize revenue with intelligent pricing strategies.

## What You'll Learn
- Set base daily rates
- Configure weekly/monthly discounts
- Implement seasonal pricing
- Dynamic pricing based on demand
- Competitor analysis tools
- Seasonal adjustment strategies

## Duration: 12 minutes`,
    category: "video-tutorials",
    readTime: 12,
    views: 2100,
    helpful: 88,
    published: "2024-01-04",
    tags: ["video", "pricing", "advanced"],
    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
    relatedArticles: ["ug-01"],
  },
  "vt-03": {
    id: "vt-03",
    title: "Customer Communication Mastery",
    description: "Learn to leverage WhatsApp and email effectively",
    content: `# Customer Communication Mastery

Build lasting customer relationships through effective communication.

## What You'll Learn
- Send WhatsApp messages
- Use email automation
- Create message templates
- Handle customer inquiries
- Track communication history
- Best practices for retention

## Duration: 8 minutes`,
    category: "video-tutorials",
    readTime: 8,
    views: 1800,
    helpful: 85,
    published: "2024-01-03",
    tags: ["video", "communication", "tutorial"],
    videoUrl: "https://www.youtube.com/embed/OPf0YbXqDm0",
    relatedArticles: ["ug-05"],
  },

  // FAQ
  "faq-01": {
    id: "faq-01",
    title: "How do I add a vehicle to my fleet?",
    description: "Steps to add a new car to your rental fleet",
    content: `# How do I add a vehicle to my fleet?

## Quick Answer
Go to Fleet > Add Vehicle, fill in the details, upload photos, and set availability.

## Detailed Steps
1. Click on "Fleet" in the sidebar
2. Click "Add New Vehicle" button
3. Fill in required information:
   - Brand and Model
   - License Plate
   - Registration Number
   - VIN (Vehicle Identification Number)
   - Year of Manufacture
4. Upload vehicle photos (front, side, interior)
5. Set availability calendar
6. Configure pricing tiers
7. Add insurance and maintenance info
8. Save and publish

## Tips
- Add high-quality photos to increase bookings
- Set competitive pricing
- Update availability immediately
- Keep documents current`,
    category: "faq",
    readTime: 3,
    views: 5600,
    helpful: 94,
    published: "2024-01-02",
    tags: ["faq", "fleet", "vehicle"],
    relatedArticles: ["gs-03", "ug-02"],
  },
  "faq-02": {
    id: "faq-02",
    title: "What payment methods do you accept?",
    description: "Information about accepted payment methods",
    content: `# What payment methods do you accept?

## Accepted Payment Methods
We accept the following payment methods:
- Credit cards (Visa, Mastercard, American Express)
- Debit cards
- Bank transfers
- Digital wallets (Apple Pay, Google Pay)
- PayPal

## Payment Processing
- Payments are processed securely
- Receipts are sent automatically
- Refunds processed within 3-5 business days
- No hidden fees or surcharges
- Support for multiple currencies

## Setting Payment Methods
Customers can save payment methods for faster checkout on future rentals.`,
    category: "faq",
    readTime: 2,
    views: 4200,
    helpful: 91,
    published: "2024-01-01",
    tags: ["faq", "payments", "methods"],
    relatedArticles: ["ug-02"],
  },
  "faq-03": {
    id: "faq-03",
    title: "Can I set multiple pricing tiers?",
    description: "Understanding pricing options and tiers",
    content: `# Can I set multiple pricing tiers?

## Yes! Multiple Pricing Options
You can set different prices for:
- Daily rates
- Weekly rates (usually 10-20% discount)
- Monthly rates (30-40% discount)
- Seasonal pricing
- Special event pricing

## How to Set Pricing
1. Go to Fleet > Select Vehicle
2. Click Pricing tab
3. Set base daily rate
4. Add weekly discount percentage
5. Add monthly discount percentage
6. Configure seasonal adjustments
7. Save changes

## Best Practices
- Monitor competitor pricing
- Adjust seasonally
- Offer loyalty discounts
- Use dynamic pricing tools`,
    category: "faq",
    readTime: 2,
    views: 3800,
    helpful: 87,
    published: "2023-12-31",
    tags: ["faq", "pricing", "rates"],
    relatedArticles: ["ug-01", "vt-02"],
  },
  "faq-04": {
    id: "faq-04",
    title: "How do I handle customer cancellations?",
    description: "Cancellation policy and processing refunds",
    content: `# How do I handle customer cancellations?

## Cancellation Policy Options
You can set:
- Free cancellation (anytime)
- Free cancellation up to X days before
- Partial refund if cancelled within X days
- No refund if cancelled within X days

## Processing a Cancellation
1. Go to Reservations
2. Find the booking to cancel
3. Click "Cancel Reservation"
4. Select reason for cancellation
5. Review refund calculation
6. Confirm cancellation
7. Refund is processed automatically

## Refund Timeline
- Refunds processed within 3-5 business days
- Customer receives notification
- Full audit trail maintained

## Best Practice
Set clear cancellation policies upfront to avoid disputes.`,
    category: "faq",
    readTime: 3,
    views: 3500,
    helpful: 85,
    published: "2023-12-30",
    tags: ["faq", "cancellations", "refunds"],
    relatedArticles: ["ug-01"],
  },
  "faq-05": {
    id: "faq-05",
    title: "How do I track vehicle maintenance?",
    description: "Managing maintenance schedules and history",
    content: `# How do I track vehicle maintenance?

## Maintenance Tracking Features
- Schedule regular maintenance
- Log maintenance history
- Track maintenance costs
- Get reminders before due dates
- Manage service provider contacts

## Setting Up Maintenance Schedule
1. Go to Fleet > Select Vehicle
2. Click Maintenance tab
3. Add maintenance type (Oil change, Inspection, etc.)
4. Set frequency (every X miles/months)
5. Add service provider details
6. Set reminder dates

## Maintenance History
View complete service records for each vehicle including:
- Date of service
- Type of maintenance
- Cost
- Mileage
- Service provider details
- Next due date

## Benefits
- Keep vehicles in top condition
- Extend vehicle lifespan
- Maintain warranty coverage
- Reduce breakdowns`,
    category: "faq",
    readTime: 3,
    views: 2900,
    helpful: 82,
    published: "2023-12-29",
    tags: ["faq", "maintenance", "vehicles"],
    relatedArticles: ["gs-03", "ug-02"],
  },

  // Troubleshooting
  "ts-01": {
    id: "ts-01",
    title: "Reservation Won't Save",
    description: "Troubleshoot and fix reservation saving issues",
    content: `# Reservation Won't Save - Troubleshooting Guide

## Common Causes and Solutions

### 1. Missing Required Fields
**Problem**: Form shows red validation errors
**Solution**: 
- Fill in all required fields (marked with *)
- Check customer email format
- Ensure dates are valid
- Verify vehicle is available for selected dates

### 2. Dates Already Booked
**Problem**: "Vehicle not available" error
**Solution**:
- Check the availability calendar
- Select different dates
- Choose a different vehicle
- Contact the customer to adjust dates

### 3. Payment Failed
**Problem**: Payment declined during booking
**Solution**:
- Verify payment method details
- Try a different payment method
- Contact payment support
- Check account balance

### 4. Browser Cache Issues
**Solution**:
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh the page (Ctrl+R)
- Try a different browser
- Disable browser extensions

## Still Not Working?
Contact our support team for immediate assistance.`,
    category: "troubleshooting",
    readTime: 4,
    views: 2400,
    helpful: 79,
    published: "2023-12-28",
    tags: ["troubleshooting", "reservations", "issues"],
    relatedArticles: ["ug-01"],
  },
  "ts-02": {
    id: "ts-02",
    title: "WhatsApp Messages Not Sending",
    description: "Fix WhatsApp communication issues",
    content: `# WhatsApp Messages Not Sending - Troubleshooting Guide

## Quick Checks
1. Verify customer phone number is correct with +country code
2. Ensure customer has WhatsApp account
3. Check message length (max 4096 characters)
4. Confirm internet connection

## Common Issues

### 1. Invalid Phone Number
**Solution**:
- Include country code (e.g., +212 for Morocco)
- Remove any spaces or dashes
- Ensure 10 digits for local numbers

### 2. Customer Not Receiving
**Problem**: Message shows as sent but not received
**Solution**:
- Check customer's WhatsApp app is updated
- Verify customer hasn't blocked your number
- Try sending again after 24 hours
- Check WhatsApp connection status

### 3. Message Template Issues
**Solution**:
- Use pre-approved templates
- Avoid special characters
- Keep formatting simple
- Test with a personal number first

## Message Status
- Sent (1 tick): Delivered to WhatsApp
- Delivered (2 ticks): Received by customer
- Read (2 blue ticks): Customer opened message`,
    category: "troubleshooting",
    readTime: 3,
    views: 1800,
    helpful: 76,
    published: "2023-12-27",
    tags: ["troubleshooting", "whatsapp", "communication"],
    relatedArticles: ["ug-05"],
  },
  "ts-03": {
    id: "ts-03",
    title: "Login Issues",
    description: "Troubleshoot account access problems",
    content: `# Login Issues - Troubleshooting Guide

## Can't Remember Password?
1. Click "Forgot Password" on login page
2. Enter your email address
3. Check your email for reset link
4. Click link and create new password
5. Password must be at least 12 characters
6. Include uppercase, lowercase, number, symbol
7. Try logging in with new password

## Email Not Received
1. Check spam/junk folder
2. Wait 5-10 minutes for email
3. Try requesting another reset link
4. Verify email address is correct

## Two-Factor Authentication Issues
**Backup codes**:
- Use backup codes if you can't access authenticator
- Keep backup codes in safe location
- Request new codes if needed

## Account Locked
- Too many failed login attempts lock your account temporarily
- Wait 30 minutes before trying again
- Contact support if locked longer`,
    category: "troubleshooting",
    readTime: 2,
    views: 1600,
    helpful: 88,
    published: "2023-12-26",
    tags: ["troubleshooting", "login", "account"],
    relatedArticles: [],
  },
  "ts-04": {
    id: "ts-04",
    title: "Performance Issues & Slow Loading",
    description: "Fix slow performance and loading problems",
    content: `# Performance Issues & Slow Loading

## Browser Performance
1. Clear browser cache
2. Disable unnecessary extensions
3. Update browser to latest version
4. Try a different browser
5. Close unnecessary tabs

## Network Issues
- Check internet connection speed
- Test with speedtest.net
- Switch to wired connection if possible
- Move closer to WiFi router

## Device Issues
- Restart your device
- Close background applications
- Free up disk space
- Check available RAM

## Application Optimization
- Large reports may take longer to load
- Filter data to show fewer rows
- Use date ranges to limit results
- Archive old data

## Still Slow?
Contact support with:
- Your device/browser info
- Internet speed test results
- Screenshot of issue
- Time issue occurred`,
    category: "troubleshooting",
    readTime: 3,
    views: 1400,
    helpful: 81,
    published: "2023-12-25",
    tags: ["troubleshooting", "performance", "speed"],
    relatedArticles: [],
  },

  // What's New
  "wn-01": {
    id: "wn-01",
    title: "New Dynamic Pricing Algorithm",
    description: "Automatically optimize prices based on demand",
    content: `# New Dynamic Pricing Algorithm

We're excited to announce our new AI-powered dynamic pricing system!

## What's New
Our new pricing algorithm automatically adjusts your rates based on:
- Current demand levels
- Competitor pricing
- Seasonal trends
- Historical booking patterns
- Special events

## Benefits
- Maximize revenue automatically
- Stay competitive
- Save time on manual adjustments
- Optimize occupancy rates
- Increase profit margins

## How to Use
1. Go to Fleet > Select Vehicle
2. Click "Pricing" tab
3. Enable "Dynamic Pricing"
4. Set minimum and maximum prices
5. Let the algorithm optimize

## Getting Started
The algorithm learns from 2 weeks of data before starting optimization.

## Learn More
Check our detailed pricing guide for advanced options.`,
    category: "whats-new",
    readTime: 3,
    views: 3200,
    helpful: 90,
    published: "2024-01-20",
    tags: ["new", "pricing", "feature"],
    relatedArticles: ["ug-01", "vt-02"],
  },
  "wn-02": {
    id: "wn-02",
    title: "Multilingual Support - English & French",
    description: "LokaRent now available in multiple languages",
    content: `# Multilingual Support - English & French

LokaRent is now available in English and French!

## What's Supported
- Complete UI in English and French
- All documentation translated
- Customer communications in preferred language
- Reports in multiple languages

## How to Switch Languages
1. Click the language selector (top right)
2. Choose your preferred language
3. UI updates immediately
4. Your preference is saved

## Languages Available
- English (US, UK)
- French (Standard, Moroccan Arabic coming soon!)

## Feedback
We'd love to hear your feedback on the translations.
Send suggestions to support@lokarent.com

## More Languages Coming
We're working on adding Spanish, Arabic, and German soon!`,
    category: "whats-new",
    readTime: 2,
    views: 2800,
    helpful: 87,
    published: "2024-01-18",
    tags: ["new", "feature", "languages"],
    relatedArticles: [],
  },
  "wn-03": {
    id: "wn-03",
    title: "WhatsApp Integration Launch",
    description: "Send messages and manage communication via WhatsApp",
    content: `# WhatsApp Integration Launch

We're thrilled to announce seamless WhatsApp integration!

## Features
- Send booking confirmations via WhatsApp
- Share pickup instructions
- Send reminders
- Receive customer messages in one place
- Professional messaging templates
- Message history and analytics

## Getting Started
1. Go to Communication > WhatsApp
2. Connect your WhatsApp Business account
3. Create message templates
4. Start sending messages

## Use Cases
- Booking confirmations
- Pickup/dropoff instructions
- Reminder notifications
- Special offers
- Customer support

## Benefits
- Higher open rates than email
- Instant delivery
- Customer prefer WhatsApp
- Build stronger relationships

## Learn More
Check our WhatsApp integration guide.`,
    category: "whats-new",
    readTime: 2,
    views: 2600,
    helpful: 92,
    published: "2024-01-16",
    tags: ["new", "whatsapp", "integration"],
    relatedArticles: ["ug-05"],
  },

  // Feature Requests
  "fr-01": {
    id: "fr-01",
    title: "Popular Feature Requests",
    description: "See what features the community wants most",
    content: `# Popular Feature Requests

Help shape LokaRent's future by voting on features you want to see!

## Top Requested Features

### 1. Mobile App (456 votes)
Native iOS and Android apps for managing rentals on the go

### 2. Loyalty Program (389 votes)
Build customer loyalty with rewards and loyalty points

### 3. API Integration (312 votes)
Connect LokaRent with your other business tools via API

### 4. GPS Tracking (298 votes)
Real-time GPS tracking of vehicles during rentals

### 5. Insurance Integration (276 votes)
Direct integration with insurance providers

### 6. Advanced Analytics (245 votes)
More detailed reports and business intelligence

### 7. Team Collaboration (198 votes)
Better tools for team communication and task management

### 8. Maintenance Automation (176 votes)
Automated maintenance scheduling and reminders

## How to Vote
Click on any feature to vote or suggest your own idea!

## Voting Impact
Features with the most votes are prioritized in our development roadmap.`,
    category: "feature-requests",
    readTime: 3,
    views: 2200,
    helpful: 84,
    published: "2024-01-14",
    tags: ["requests", "voting", "community"],
    relatedArticles: [],
  },
  "fr-02": {
    id: "fr-02",
    title: "Submit Your Feature Request",
    description: "Suggest ideas for new features or improvements",
    content: `# Submit Your Feature Request

Have an idea to make LokaRent better? We'd love to hear it!

## How to Submit a Request
1. Click "Feature Requests" in Help Center
2. Click "Suggest a Feature" button
3. Write your feature title
4. Describe the feature in detail
5. Explain the benefit for your business
6. Submit for community review

## What Makes a Good Request
- Clear and concise title
- Detailed description of what you want
- Explain the problem it solves
- Show how it would be useful
- Include real-world use cases

## Community Voting
Once submitted, other users can:
- Vote on your request
- Add comments
- Suggest improvements
- Share similar needs

## What Happens Next
- We review all requests monthly
- Top requests are added to roadmap
- You'll be notified when implemented
- Share your feedback

## Examples of Good Requests
- "Add bulk import of vehicles from CSV"
- "Enable recurring reservation templates"
- "Integrate with booking.com"

Start a conversation and help us build the perfect rental management platform!`,
    category: "feature-requests",
    readTime: 3,
    views: 1900,
    helpful: 79,
    published: "2024-01-12",
    tags: ["requests", "submission", "ideas"],
    relatedArticles: ["fr-01"],
  },
}
