import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

export const BookingSettings: GlobalConfig = {
  slug: 'bookingSettings',
  access: {
    read: () => true,
    update: adminOrEditor,
  },
  admin: {
    group: 'Booking',
  },
  fields: [
    {
      name: 'bookingEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Accept new booking requests',
      admin: {
        description: 'When off, the booking form stops accepting submissions.',
      },
    },
    {
      name: 'paymentTermsSummary',
      type: 'text',
      defaultValue: 'Payment is by invoice after I review and accept your request.',
      admin: {
        description: 'One line shown on the booking form before the client submits.',
      },
    },
    {
      name: 'paymentInstructions',
      type: 'textarea',
      admin: {
        description:
          'Bank / GCash details and invoice terms. Emailed to the client when a booking moves to Pending Payment. Plain text; line breaks are preserved.',
      },
    },
    {
      name: 'notificationEmail',
      type: 'email',
      admin: {
        description:
          'Where new booking alerts go. Falls back to the BOOKING_NOTIFICATION_EMAIL env var.',
      },
    },
  ],
}
