import type { CollectionConfig } from 'payload'
import { adminOrEditor } from '@/access/adminOrEditor'

export const AvailabilityRules: CollectionConfig = {
  slug: 'availabilityRules',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'timezone', 'startTime', 'endTime', 'active'],
    group: 'Booking',
  },
  access: {
    read: adminOrEditor,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      defaultValue: 'Default Availability',
      admin: {
        description: 'Internal name for this availability rule',
      },
    },
    {
      name: 'timezone',
      type: 'text',
      required: true,
      defaultValue: 'Asia/Manila',
      admin: {
        description: 'IANA timezone identifier (e.g., Asia/Manila, America/New_York)',
      },
    },
    {
      name: 'daysOfWeek',
      type: 'select',
      required: true,
      hasMany: true,
      options: [
        {
          label: 'Monday',
          value: '1',
        },
        {
          label: 'Tuesday',
          value: '2',
        },
        {
          label: 'Wednesday',
          value: '3',
        },
        {
          label: 'Thursday',
          value: '4',
        },
        {
          label: 'Friday',
          value: '5',
        },
        {
          label: 'Saturday',
          value: '6',
        },
        {
          label: 'Sunday',
          value: '7',
        },
      ],
      defaultValue: ['1', '2', '3', '4', '5'],
    },
    {
      name: 'startTime',
      type: 'text',
      required: true,
      defaultValue: '09:00',
      admin: {
        description: 'Start time in HH:MM format (24-hour)',
      },
    },
    {
      name: 'endTime',
      type: 'text',
      required: true,
      defaultValue: '17:00',
      admin: {
        description: 'End time in HH:MM format (24-hour)',
      },
    },
    {
      name: 'slotDurationMinutes',
      type: 'number',
      required: true,
      defaultValue: 30,
      admin: {
        description: 'Duration of each booking slot in minutes',
      },
    },
    {
      name: 'bufferMinutes',
      type: 'number',
      required: true,
      defaultValue: 15,
      admin: {
        description: 'Buffer time between bookings in minutes',
      },
    },
    {
      name: 'advanceNoticeDays',
      type: 'number',
      required: true,
      defaultValue: 7,
      admin: {
        description:
          'Minimum days in advance a booking can be made (e.g., 7 = clients must book at least 1 week ahead)',
      },
    },
    {
      name: 'maxAdvanceDays',
      type: 'number',
      required: true,
      defaultValue: 60,
      admin: {
        description: 'Maximum days in advance a booking can be made',
      },
    },
    {
      name: 'maxBookingsPerDay',
      type: 'number',
      defaultValue: 8,
      admin: {
        description: 'Maximum number of bookings allowed per day',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Enable this availability rule',
      },
    },
    {
      name: 'blockedDates',
      type: 'array',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: {
            date: {
              displayFormat: 'MMM dd, yyyy',
            },
          },
        },
        {
          name: 'reason',
          type: 'text',
          admin: {
            description: 'Reason for blocking this date',
          },
        },
      ],
      admin: {
        description: 'Specific dates to block (holidays, personal time, etc.)',
      },
    },
  ],
  timestamps: true,
}
