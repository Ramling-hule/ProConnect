import { z } from 'zod';

export const applyMentorSchema = z.object({
  body: z.object({
    expertise: z.array(z.string()).min(1, 'At least one expertise is required.'),
    experience: z.number().min(0, 'Experience must be a positive number.'),
    bio: z.string().min(10, 'Bio must be at least 10 characters long.'),
    hourlyRate: z.number().min(0, 'Hourly rate cannot be negative.').optional(),
  }),
});

export const updateMentorProfileSchema = z.object({
  body: z.object({
    expertise: z.array(z.string()).optional(),
    experience: z.number().min(0).optional(),
    bio: z.string().min(10).optional(),
    hourlyRate: z.number().min(0).optional(),
    title: z.string().optional(),
    company: z.string().optional(),
  }),
});

export const addServiceSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    price: z.number().min(0, 'Price cannot be negative.'),
    duration: z.number().min(1, 'Duration must be at least 1 minute.'),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    serviceId: z.string().min(1, 'Service ID is required.'),
  }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().min(0).optional(),
    duration: z.number().min(1).optional(),
  }),
});

export const setAvailabilitySchema = z.object({
  body: z.object({
    availability: z.array(
      z.object({
        day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        slots: z.array(
          z.object({
            startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format.'),
            endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format.'),
          })
        ),
      })
    ),
  }),
});
