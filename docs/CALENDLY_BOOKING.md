# Calendly Booking Integration Guide

## Overview

This guide provides step-by-step instructions for integrating Calendly scheduling into your portfolio website, replacing the complex booking system with a simple, professional scheduling solution.

## Table of Contents

1. [Calendly Setup](#calendly-setup)
2. [Portfolio Integration](#portfolio-integration)
3. [Component Implementation](#component-implementation)
4. [Testing & Verification](#testing--verification)
5. [Analytics Setup](#analytics-setup)
6. [Documentation Updates](#documentation-updates)

---

## Calendly Setup

### Step 1: Create Calendly Account

1. **Sign Up**
   - Visit [calendly.com](https://calendly.com)
   - Click "Sign up for free"
   - Choose "Individual" plan
   - Sign up with Google, Outlook, or email

2. **Verify Email**
   - Check your inbox for verification email
   - Click verification link
   - Complete your profile setup

### Step 2: Configure Event Types

1. **Primary Event Type: 30 Minute Interview**
   - Go to "Event Types" → "Add New Event Type"
   - Choose "One-on-One" → "Scheduled Meeting"
   - Configure:
     ```
     Event Name: 30 Minute Interview
     Duration: 30 minutes
     Location: Online meeting (Calendly video or custom)
     Description: Portfolio review and discussion about potential opportunities
     ```

2. **Optional Event Types**
   - **60 Minute Project Discussion** (for detailed project inquiries)
   - **15 Minute Quick Chat** (for brief questions)

3. **Availability Settings**
   - Go to "Availability" → "Set your hours"
   - Configure working hours (e.g., Mon-Fri 9AM-5PM)
   - Set buffer time (15 minutes before/after)
   - Add notice period (e.g., 4 hours notice)

4. **Branding**
   - Go to "Branding" → "Upload logo"
   - Set brand colors (match your portfolio)
   - Customize confirmation page

### Step 3: Get Your Calendly URL

1. **Find Your Link**
   - Go to "Home" → "Share your link"
   - Copy your Calendly URL: `https://calendly.com/your-username/30min`

2. **Custom URL (Optional)**
   - Go to "Integrations" → "Custom URL"
   - Set custom subdomain if available

---

## Portfolio Integration

### Step 4: Update CTA Buttons

1. **Update Base CTAButtons Component**
   ```typescript
   // src/components/CTAButtons.tsx
   interface CTAButton {
     href: string
     label: string
     external?: boolean
     target?: string
     rel?: string
   }
   
   const buttons: CTAButton[] = [
     { 
       href: "/chat", 
       label: "BOOK ME" 
     },
     { 
       href: "https://calendly.com/your-username/30min",
       label: "SCHEDULE INTERVIEW",
       external: true,
       target: "_blank",
       rel: "noopener noreferrer"
     }
   ]
   ```

2. **Update Rainbow Template CTAButtons**
   ```typescript
   // src/templates/rainbow/components/CTAButtons.tsx
   // Apply same changes with Rainbow theme styling
   ```

### Step 5: Create Contact Section Component

1. **Create Base ContactSection**
   ```typescript
   // src/components/ContactSection.tsx
   'use client'
   
   import React from 'react'
   import Link from 'next/link'
   
   interface ContactSectionProps {
     email?: string
     calendly?: string
     linkedin?: string
     github?: string
   }
   
   export function ContactSection({ 
     email = "hello@yourdomain.com",
     calendly,
     linkedin,
     github 
   }: ContactSectionProps) {
     return (
       <section className="py-20 px-4">
         <div className="max-w-4xl mx-auto text-center">
           <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
           
           <div className="grid md:grid-cols-2 gap-6 mb-8">
             <div className="bg-white/10 backdrop-blur rounded-xl p-6">
               <h3 className="text-xl font-semibold mb-4">Schedule Interview</h3>
               <p className="mb-4">Book a 30-minute call to discuss opportunities</p>
               {calendly && (
                 <Link
                   href={calendly}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                 >
                   Schedule Call
                 </Link>
               )}
             </div>
             
             <div className="bg-white/10 backdrop-blur rounded-xl p-6">
               <h3 className="text-xl font-semibold mb-4">Direct Contact</h3>
               <p className="mb-4">Send me an email with your project details</p>
               <a
                 href={`mailto:${email}`}
                 className="inline-block bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all"
               >
                 Send Email
               </a>
             </div>
           </div>
           
           <div className="flex justify-center gap-4">
             {linkedin && (
               <Link
                 href={linkedin}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-white/70 hover:text-white transition-colors"
               >
                 LinkedIn
               </Link>
             )}
             {github && (
               <Link
                 href={github}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-white/70 hover:text-white transition-colors"
               >
                 GitHub
               </Link>
             )}
           </div>
         </div>
       </section>
     )
   }
   ```

2. **Create Rainbow Theme Version**
   ```typescript
   // src/templates/rainbow/components/ContactSection.tsx
   // Same component with Rainbow theme styling and gradients
   ```

---

## Component Implementation

### Step 6: Update Navigation

1. **Add to Header Navigation**
   ```typescript
   // src/templates/rainbow/components/Header.tsx
   // Add "Schedule Interview" link to navigation menu
   <Link
     href="https://calendly.com/your-username/30min"
     target="_blank"
     rel="noopener noreferrer"
     className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-green-400 hover:via-cyan-300 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(100,200,255,0.3)]"
   >
     Schedule Interview
   </Link>
   ```

### Step 7: Update Hero Section

1. **Verify Hero CTA**
   ```typescript
   // src/templates/rainbow/components/Hero.tsx
   // Ensure CTAButtons is rendered with updated Calendly link
   <CTAButtons className="justify-center" />
   ```

### Step 8: Add Contextual Links

1. **Project Pages**
   ```typescript
   // Add to ProjectCard components
   <Link
     href="https://calendly.com/your-username/30min"
     target="_blank"
     rel="noopener noreferrer"
     className="text-sm text-white/70 hover:text-white"
   >
     Discuss This Project →
   </Link>
   ```

2. **About/Experience Pages**
   ```typescript
   // Add discussion links to experience items
   <Link
     href="https://calendly.com/your-username/60min"
     target="_blank"
     rel="noopener noreferrer"
   >
     Discuss Similar Projects
   </Link>
   ```

---

## Testing & Verification

### Step 9: Desktop Testing

1. **Test All Links**
   - Click "SCHEDULE INTERVIEW" button in Hero
   - Click "Schedule Interview" in Header navigation
   - Click "Schedule Call" in ContactSection
   - Verify all open Calendly in new tab

2. **Test Calendly Flow**
   - Select available time slot
   - Fill out required fields
   - Confirm booking (don't complete payment if testing)
   - Verify confirmation email received

### Step 10: Mobile Testing

1. **Responsive Testing**
   - Test on mobile devices (iOS/Android)
   - Verify buttons are touch-friendly
   - Test Calendly mobile experience
   - Check email on mobile

2. **Performance Testing**
   - Check page load speed with new links
   - Verify no console errors
   - Test with slow network conditions

### Step 11: Cross-Browser Testing

1. **Browser Compatibility**
   - Chrome, Firefox, Safari, Edge
   - Test external link behavior
   - Verify security attributes work

---

## Analytics Setup

### Step 12: Google Analytics Events

1. **Track Calendly Clicks**
   ```typescript
   // Add to CTAButtons or create tracking wrapper
   const handleCalendlyClick = () => {
     // Google Analytics event
     gtag('event', 'click', {
       event_category: 'engagement',
       event_label: 'calendly_schedule',
       value: 1
     })
   }
   ```

2. **UTM Parameters**
   ```typescript
   // Add UTM to Calendly links
   const calendlyUrl = "https://calendly.com/your-username/30min?utm_source=portfolio&utm_medium=cta_button&utm_campaign=interview_scheduling"
   ```

### Step 13: Calendly Analytics

1. **Enable Calendly Tracking**
   - Go to Calendly "Integrations" → "Google Analytics"
   - Connect your GA account
   - Enable event tracking

2. **Monitor Metrics**
   - Track conversion rate (clicks → bookings)
   - Monitor popular time slots
   - Analyze no-show rates

---

## Documentation Updates

### Step 14: Update README.md

1. **Add Contact Section**
   ```markdown
   ## 📞 Get In Touch
   
   - **Schedule Interview**: [Book a 30-minute call](https://calendly.com/your-username/30min)
   - **Email**: hello@yourdomain.com
   - **LinkedIn**: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
   - **GitHub**: [github.com/yourusername](https://github.com/yourusername)
   ```

### Step 15: Update PLAN.md

1. **Mark Phase 4C.1 as Completed**
   ```markdown
   ### Phase 4C.1 — Calendly Setup & Integration (Priority: High)
   
   **Status**: ✅ COMPLETED (2026-04-05)
   ```

2. **Update Progress**
   - Document what was implemented
   - Note any deviations from plan
   - Record lessons learned

---

## Troubleshooting

### Common Issues

1. **Links Not Working**
   - Verify Calendly URL is correct
   - Check external link attributes
   - Test in different browsers

2. **Mobile Issues**
   - Increase button touch targets
   - Test on actual devices (not just emulator)
   - Check viewport settings

3. **Analytics Not Tracking**
   - Verify GA configuration
   - Check UTM parameters
   - Test with Google Tag Assistant

### Support Resources

- [Calendly Help Center](https://help.calendly.com)
- [Calendly Embed Documentation](https://developer.calendly.com)
- Portfolio GitHub Issues (for technical problems)

---

## Success Metrics

Track these metrics to measure success:

### Primary Metrics
- **Interviews scheduled per month**
- **Conversion rate** (portfolio visits → scheduled interviews)
- **No-show rate** (should be <20%)

### Secondary Metrics
- **Time on scheduling page**
- **Mobile vs desktop split**
- **Most popular event types**

### Optimization Opportunities
- A/B test button text
- Test different event durations
- Optimize availability windows

---

## Future Enhancements

When ready, consider these upgrades:

1. **Advanced Calendly Features**
   - Paid Calendly tier for more customization
   - Team scheduling (if working with others)
   - Custom workflows and integrations

2. **Enhanced Analytics**
   - Heat mapping of scheduling behavior
   - Conversion funnel optimization
   - A/B testing framework

3. **Additional Contact Methods**
   - Contact form integration
   - WhatsApp integration
   - Social media DM scheduling

---

## Maintenance Checklist

### Monthly Tasks
- [ ] Review Calendly availability settings
- [ ] Check analytics for conversion trends
- [ ] Verify all links still work
- [ ] Update event descriptions if needed

### Quarterly Tasks
- [ ] Review and update branding
- [ ] Assess need for additional event types
- [ ] Optimize based on usage data
- [ ] Consider Calendly plan upgrade

---

**Last Updated**: 2026-04-05  
**Version**: 1.0  
**Next Review**: 2026-07-05