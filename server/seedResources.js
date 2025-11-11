const mongoose = require('mongoose');
const Resource = require('./models/Resource');
require('dotenv').config();

const mentalHealthResources = [
  // Crisis Support & Emergency Resources
  {
    title: 'National Suicide Prevention Lifeline',
    description: '24/7 free and confidential support for people in distress, prevention and crisis resources.',
    category: 'crisis-support',
    type: 'helpline',
    link: 'tel:988',
    coverImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop&crop=center',
    organization: 'Substance Abuse and Mental Health Services Administration',
    tags: ['crisis', 'suicide prevention', 'emergency', '24/7'],
    isEmergency: true,
    isFree: true,
    targetAudience: ['teens', 'adults', 'seniors'],
    conditions: ['depression', 'anxiety', 'general'],
    contact: {
      phone: '988',
      hours: '24/7'
    },
    rating: 5
  },
  {
    title: 'Crisis Text Line',
    description: 'Free, 24/7 support for those in crisis. Text HOME to 741741 to connect with a Crisis Counselor.',
    category: 'crisis-support',
    type: 'helpline',
    link: 'sms:741741',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=450&fit=crop&crop=center',
    organization: 'Crisis Text Line',
    tags: ['crisis', 'text support', 'emergency', '24/7'],
    isEmergency: true,
    isFree: true,
    targetAudience: ['teens', 'adults'],
    conditions: ['depression', 'anxiety', 'general'],
    contact: {
      phone: '741741',
      hours: '24/7'
    },
    rating: 5
  },
  {
    title: 'SAMHSA National Helpline',
    description: 'Free, confidential, 24/7 treatment referral service for individuals and families facing mental health disorders.',
    category: 'crisis-support',
    type: 'helpline',
    link: 'tel:1-800-662-4357',
    coverImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop&crop=center',
    organization: 'SAMHSA',
    tags: ['treatment referral', 'mental health', '24/7', 'confidential'],
    isEmergency: true,
    isFree: true,
    targetAudience: ['adults', 'parents', 'caregivers'],
    conditions: ['general', 'addiction'],
    contact: {
      phone: '1-800-662-4357',
      hours: '24/7'
    },
    rating: 5
  },

  // Educational Articles
  {
    title: 'Understanding Anxiety Disorders: Types, Symptoms, and Treatment',
    description: 'Comprehensive guide to anxiety disorders including GAD, panic disorder, social anxiety, and phobias. Learn about symptoms, causes, and evidence-based treatments.',
    category: 'anxiety-support',
    type: 'article',
    link: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop&crop=center',
    author: 'National Institute of Mental Health',
    organization: 'NIMH',
    tags: ['anxiety', 'education', 'symptoms', 'treatment'],
    duration: '15 min read',
    isFree: true,
    targetAudience: ['adults', 'teens', 'caregivers'],
    conditions: ['anxiety'],
    rating: 4.8
  },
  {
    title: 'Depression: More Than Just Sadness',
    description: 'Learn about major depressive disorder, its symptoms, risk factors, and various treatment options including therapy and medication.',
    category: 'depression-support',
    type: 'article',
    link: 'https://www.nimh.nih.gov/health/topics/depression',
    coverImage: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=450&fit=crop&crop=center',
    author: 'National Institute of Mental Health',
    organization: 'NIMH',
    tags: ['depression', 'symptoms', 'treatment', 'education'],
    duration: '12 min read',
    isFree: true,
    targetAudience: ['adults', 'teens', 'caregivers'],
    conditions: ['depression'],
    rating: 4.9
  },
  {
    title: 'PTSD: Understanding Trauma and Recovery',
    description: 'Comprehensive information about post-traumatic stress disorder, its symptoms, and effective treatment approaches.',
    category: 'general-wellness',
    type: 'article',
    link: 'https://www.ptsd.va.gov/understand/what/index.asp',
    coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop&crop=center',
    author: 'U.S. Department of Veterans Affairs',
    organization: 'VA',
    tags: ['ptsd', 'trauma', 'recovery', 'veterans'],
    duration: '18 min read',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['ptsd'],
    rating: 4.7
  },

  // Meditation & Mindfulness Resources
  {
    title: 'Headspace: Meditation and Sleep',
    description: 'Popular meditation app with guided sessions for stress, anxiety, sleep, and focus. Offers beginner-friendly programs.',
    category: 'meditation',
    type: 'app',
    link: 'https://www.headspace.com',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop&crop=center',
    organization: 'Headspace Inc.',
    tags: ['meditation', 'mindfulness', 'sleep', 'stress relief'],
    duration: '3-60 min sessions',
    isFree: false,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety', 'general'],
    rating: 4.6
  },
  {
    title: 'Insight Timer: Free Meditation App',
    description: 'Free meditation app with thousands of guided meditations, music tracks, and talks from mindfulness experts.',
    category: 'meditation',
    type: 'app',
    link: 'https://insighttimer.com',
    coverImage: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=450&fit=crop&crop=center',
    organization: 'Insight Network Inc.',
    tags: ['meditation', 'free', 'guided', 'community'],
    duration: '1-60 min sessions',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety', 'general'],
    rating: 4.8
  },
  {
    title: 'UCLA Mindful Awareness Research Center',
    description: 'Free guided meditations and mindfulness resources from UCLA researchers and practitioners.',
    category: 'meditation',
    type: 'website',
    link: 'https://www.uclahealth.org/marc/mindful-meditations',
    coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=450&fit=crop&crop=center',
    organization: 'UCLA',
    tags: ['mindfulness', 'research-based', 'free', 'guided meditation'],
    duration: '3-19 min sessions',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety', 'general'],
    rating: 4.7
  },

  // Video Resources
  {
    title: 'TED Talk: The Power of Vulnerability',
    description: 'Brené Brown discusses how vulnerability is the birthplace of courage, creativity, and change.',
    category: 'self-help',
    type: 'video',
    link: 'https://www.ted.com/talks/brene_brown_the_power_of_vulnerability',
    coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop&crop=center',
    author: 'Brené Brown',
    organization: 'TED',
    tags: ['vulnerability', 'courage', 'shame resilience', 'connection'],
    duration: '20 min',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['general'],
    rating: 4.9
  },
  {
    title: 'Anxiety and Depression: What\'s the Difference?',
    description: 'Educational video explaining the differences between anxiety and depression, their symptoms, and treatment options.',
    category: 'general-wellness',
    type: 'video',
    link: 'https://www.youtube.com/watch?v=example',
    coverImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop&crop=center',
    author: 'Mental Health America',
    organization: 'Mental Health America',
    tags: ['anxiety', 'depression', 'education', 'symptoms'],
    duration: '8 min',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['anxiety', 'depression'],
    rating: 4.5
  },

  // Self-Help Tools & Worksheets
  {
    title: 'CBT Thought Record Worksheet',
    description: 'Cognitive Behavioral Therapy worksheet to help identify and challenge negative thought patterns.',
    category: 'self-help',
    type: 'tool',
    link: 'https://www.psychologytools.com/resource/cbt-thought-record/',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop&crop=center',
    organization: 'Psychology Tools',
    tags: ['cbt', 'thought record', 'cognitive therapy', 'worksheet'],
    duration: '10-15 min',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['anxiety', 'depression'],
    rating: 4.6
  },
  {
    title: 'Mood Tracking Journal',
    description: 'Daily mood tracking template to help identify patterns and triggers in your emotional well-being.',
    category: 'self-help',
    type: 'tool',
    link: 'https://www.moodpath.com/en/mood-journal/',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop&crop=center',
    organization: 'Moodpath',
    tags: ['mood tracking', 'journal', 'patterns', 'self-awareness'],
    duration: '5 min daily',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['depression', 'bipolar', 'general'],
    rating: 4.4
  },

  // Stress Management Resources
  {
    title: 'Progressive Muscle Relaxation Guide',
    description: 'Step-by-step guide to progressive muscle relaxation technique for stress and anxiety relief.',
    category: 'stress-management',
    type: 'tool',
    link: 'https://www.anxietycanada.com/sites/default/files/MuscleRelaxation.pdf',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop&crop=center',
    organization: 'Anxiety Canada',
    tags: ['relaxation', 'muscle tension', 'stress relief', 'technique'],
    duration: '15-20 min',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety'],
    rating: 4.5
  },
  {
    title: 'Deep Breathing Exercises for Stress Relief',
    description: 'Learn various breathing techniques including 4-7-8 breathing, box breathing, and diaphragmatic breathing to reduce stress and anxiety.',
    category: 'stress-management',
    type: 'article',
    link: 'https://www.healthline.com/health/breathing-exercises-for-stress',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=450&fit=crop&crop=center',
    organization: 'Healthline',
    tags: ['breathing exercises', 'stress relief', 'anxiety', 'relaxation'],
    duration: '5-10 min',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety'],
    rating: 4.6
  },
  {
    title: 'Stress Management Techniques from Mayo Clinic',
    description: 'Comprehensive guide to stress management including time management, relaxation techniques, and lifestyle changes.',
    category: 'stress-management',
    type: 'article',
    link: 'https://www.mayoclinic.org/healthy-lifestyle/stress-management/in-depth/stress-management/art-20044151',
    coverImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop&crop=center',
    organization: 'Mayo Clinic',
    tags: ['stress management', 'lifestyle', 'time management', 'health'],
    duration: '12 min read',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['stress'],
    rating: 4.8
  },
  {
    title: 'Mindfulness-Based Stress Reduction (MBSR)',
    description: 'Evidence-based program that teaches mindfulness meditation to help cope with stress, pain, and illness.',
    category: 'stress-management',
    type: 'website',
    link: 'https://www.mindfulnesscds.com/',
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop&crop=center',
    organization: 'Center for Mindfulness',
    tags: ['mindfulness', 'meditation', 'stress reduction', 'evidence-based'],
    duration: '8-week program',
    isFree: false,
    targetAudience: ['adults'],
    conditions: ['stress', 'general'],
    rating: 4.7
  },
  {
    title: 'Quick Stress Relief Techniques',
    description: 'Simple and effective stress relief techniques you can use anywhere, anytime in just a few minutes.',
    category: 'stress-management',
    type: 'tool',
    link: 'https://www.helpguide.org/articles/stress/quick-stress-relief.htm',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop&crop=center',
    organization: 'HelpGuide',
    tags: ['quick relief', 'stress techniques', 'emergency', 'workplace'],
    duration: '2-5 min',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety'],
    rating: 4.5
  },
  {
    title: 'Stress & Anxiety Companion App',
    description: 'Free app offering guided meditations, breathing exercises, and stress tracking tools.',
    category: 'stress-management',
    type: 'app',
    link: 'https://play.google.com/store/apps/details?id=com.anxietyhelper',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=450&fit=crop&crop=center',
    organization: 'Anxiety Helper',
    tags: ['stress tracking', 'meditation', 'breathing', 'mobile app'],
    duration: '5-30 min sessions',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety'],
    rating: 4.4
  },
  {
    title: 'Workplace Stress Management Guide',
    description: 'Strategies for managing stress at work, including boundary setting, time management, and communication skills.',
    category: 'stress-management',
    type: 'article',
    link: 'https://www.apa.org/topics/stress/workplace',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop&crop=center',
    organization: 'American Psychological Association',
    tags: ['workplace stress', 'professional', 'boundaries', 'communication'],
    duration: '15 min read',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['stress'],
    rating: 4.6
  },
  {
    title: 'Stress Relief Through Physical Exercise',
    description: 'How different types of physical activity can reduce stress hormones and boost mood-enhancing endorphins.',
    category: 'stress-management',
    type: 'video',
    link: 'https://www.youtube.com/watch?v=stress-exercise-relief',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop&crop=center',
    author: 'Dr. Sarah Johnson',
    organization: 'Wellness Institute',
    tags: ['exercise', 'physical activity', 'endorphins', 'stress hormones'],
    duration: '12 min',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress'],
    rating: 4.5
  },
  {
    title: 'Cognitive Techniques for Stress Management',
    description: 'Learn cognitive restructuring and thought challenging techniques to manage stress-inducing thoughts.',
    category: 'stress-management',
    type: 'tool',
    link: 'https://www.psychologytools.com/resource/cognitive-techniques-stress/',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop&crop=center',
    organization: 'Psychology Tools',
    tags: ['cognitive therapy', 'thought challenging', 'restructuring', 'cbt'],
    duration: '20-30 min',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['stress', 'anxiety'],
    rating: 4.7
  },
  {
    title: 'Nature Sounds for Stress Relief',
    description: 'Collection of natural soundscapes including rain, ocean waves, and forest sounds for relaxation and stress relief.',
    category: 'stress-management',
    type: 'website',
    link: 'https://www.noisli.com/',
    coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=450&fit=crop&crop=center',
    organization: 'Noisli',
    tags: ['nature sounds', 'relaxation', 'background noise', 'focus'],
    duration: 'Continuous',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'general'],
    rating: 4.3
  },
  {
    title: 'Stress Management for Students',
    description: 'Specific strategies for managing academic stress, test anxiety, and balancing school with life.',
    category: 'stress-management',
    type: 'article',
    link: 'https://www.counseling.org/knowledge-center/mental-health-resources/stress-management-students',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop&crop=center',
    organization: 'American Counseling Association',
    tags: ['student stress', 'academic pressure', 'test anxiety', 'study tips'],
    duration: '10 min read',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['stress', 'anxiety'],
    rating: 4.4
  },
  {
    title: 'The Stress Management Handbook',
    description: 'Comprehensive book covering various stress management techniques, from relaxation to lifestyle changes.',
    category: 'stress-management',
    type: 'book',
    link: 'https://www.amazon.com/Stress-Management-Handbook-Practical-Strategies/dp/1234567890',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop&crop=center',
    author: 'Dr. Michael Thompson',
    organization: 'Wellness Publications',
    tags: ['comprehensive guide', 'techniques', 'lifestyle', 'handbook'],
    isFree: false,
    targetAudience: ['adults'],
    conditions: ['stress'],
    rating: 4.6
  },

  // Professional Therapy Resources
  {
    title: 'Psychology Today Therapist Directory',
    description: 'Find licensed therapists, psychologists, and counselors in your area. Filter by specialty, insurance, and treatment approach.',
    category: 'therapy',
    type: 'website',
    link: 'https://www.psychologytoday.com/us/therapists',
    coverImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop&crop=center',
    organization: 'Psychology Today',
    tags: ['therapist finder', 'directory', 'licensed professionals', 'local'],
    isFree: true,
    targetAudience: ['adults', 'teens', 'parents'],
    conditions: ['general'],
    rating: 4.3
  },
  {
    title: 'BetterHelp Online Therapy',
    description: 'Online therapy platform connecting you with licensed therapists for video, phone, and text sessions.',
    category: 'therapy',
    type: 'website',
    link: 'https://www.betterhelp.com',
    coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop&crop=center',
    organization: 'BetterHelp',
    tags: ['online therapy', 'licensed therapists', 'convenient', 'flexible'],
    isFree: false,
    targetAudience: ['adults'],
    conditions: ['general'],
    rating: 4.2
  },
  {
    title: 'NAMI Support Groups',
    description: 'Find local support groups for individuals and families affected by mental health conditions.',
    category: 'therapy',
    type: 'website',
    link: 'https://www.nami.org/Support-Education/Support-Groups',
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop&crop=center',
    organization: 'National Alliance on Mental Illness',
    tags: ['support groups', 'peer support', 'family support', 'local'],
    isFree: true,
    targetAudience: ['adults', 'parents', 'caregivers'],
    conditions: ['general'],
    rating: 4.7
  },

  // Sleep Resources
  {
    title: 'Sleep Foundation: Healthy Sleep Habits',
    description: 'Comprehensive guide to improving sleep quality, sleep hygiene, and addressing common sleep disorders.',
    category: 'sleep',
    type: 'article',
    link: 'https://www.sleepfoundation.org/how-sleep-works/healthy-sleep-habits',
    coverImage: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=450&fit=crop&crop=center',
    organization: 'Sleep Foundation',
    tags: ['sleep hygiene', 'sleep quality', 'insomnia', 'healthy habits'],
    duration: '10 min read',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['general'],
    rating: 4.6
  },
  {
    title: 'Calm: Sleep Stories and Meditation',
    description: 'App featuring sleep stories, meditation, and relaxation techniques to improve sleep quality.',
    category: 'sleep',
    type: 'app',
    link: 'https://www.calm.com',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop&crop=center',
    organization: 'Calm.com Inc.',
    tags: ['sleep stories', 'meditation', 'relaxation', 'bedtime'],
    duration: '10-45 min',
    isFree: false,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety'],
    rating: 4.5
  },

  // Exercise & Physical Wellness
  {
    title: 'Exercise for Mental Health',
    description: 'Research-backed information on how physical exercise can improve mental health and reduce symptoms of depression and anxiety.',
    category: 'exercise',
    type: 'article',
    link: 'https://www.health.harvard.edu/mind-and-mood/exercise-is-an-all-natural-treatment-to-fight-depression',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop&crop=center',
    author: 'Harvard Health Publishing',
    organization: 'Harvard Medical School',
    tags: ['exercise', 'depression', 'anxiety', 'physical activity'],
    duration: '8 min read',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['depression', 'anxiety'],
    rating: 4.7
  },
  {
    title: 'Yoga for Mental Health',
    description: 'Free yoga videos specifically designed to support mental health and emotional well-being.',
    category: 'exercise',
    type: 'video',
    link: 'https://www.youtube.com/c/yogawithadriene',
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop&crop=center',
    author: 'Adriene Mishler',
    organization: 'Yoga with Adriene',
    tags: ['yoga', 'mental health', 'stress relief', 'mindfulness'],
    duration: '10-60 min',
    isFree: true,
    targetAudience: ['adults', 'teens'],
    conditions: ['stress', 'anxiety'],
    rating: 4.8
  },

  // Nutrition & Mental Health
  {
    title: 'Nutrition and Mental Health',
    description: 'Evidence-based information on how diet and nutrition affect mental health and mood.',
    category: 'nutrition',
    type: 'article',
    link: 'https://www.mentalhealth.org.uk/a-to-z/d/diet-and-mental-health',
    coverImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=450&fit=crop&crop=center',
    organization: 'Mental Health Foundation',
    tags: ['nutrition', 'diet', 'mood', 'brain health'],
    duration: '12 min read',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['general'],
    rating: 4.4
  },

  // Books & Literature
  {
    title: 'Feeling Good: The New Mood Therapy',
    description: 'Classic self-help book on cognitive behavioral therapy techniques for overcoming depression and anxiety.',
    category: 'self-help',
    type: 'book',
    link: 'https://www.amazon.com/Feeling-Good-New-Mood-Therapy/dp/0380810336',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop&crop=center',
    author: 'David D. Burns, M.D.',
    tags: ['cbt', 'depression', 'self-help', 'classic'],
    isFree: false,
    targetAudience: ['adults'],
    conditions: ['depression', 'anxiety'],
    rating: 4.6
  },
  {
    title: 'The Anxiety and Worry Workbook',
    description: 'Practical workbook with CBT techniques and exercises for managing anxiety and worry.',
    category: 'self-help',
    type: 'book',
    link: 'https://www.newharbinger.com/9781572244344/the-anxiety-and-worry-workbook/',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop&crop=center',
    author: 'David A. Clark, Aaron T. Beck',
    organization: 'New Harbinger Publications',
    tags: ['anxiety', 'workbook', 'cbt', 'exercises'],
    isFree: false,
    targetAudience: ['adults'],
    conditions: ['anxiety'],
    rating: 4.5
  },

  // Podcasts
  {
    title: 'The Mental Illness Happy Hour',
    description: 'Honest discussions about mental health, featuring interviews with comedians, artists, and regular people.',
    category: 'podcasts',
    type: 'podcast',
    link: 'https://mentalpod.com/',
    coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=450&fit=crop&crop=center',
    author: 'Paul Gilmartin',
    tags: ['mental health', 'interviews', 'honest conversations', 'comedy'],
    duration: '60-90 min episodes',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['general'],
    rating: 4.6
  },
  {
    title: 'Ten Percent Happier',
    description: 'Meditation and mindfulness podcast featuring practical advice from experts and real-world applications.',
    category: 'meditation',
    type: 'podcast',
    link: 'https://www.tenpercent.com/podcast',
    coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=450&fit=crop&crop=center',
    author: 'Dan Harris',
    organization: 'Ten Percent Happier',
    tags: ['meditation', 'mindfulness', 'practical', 'experts'],
    duration: '20-45 min episodes',
    isFree: true,
    targetAudience: ['adults'],
    conditions: ['stress', 'anxiety'],
    rating: 4.7
  }
];

async function seedResources() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-app');
    console.log('Connected to MongoDB');

    // Clear existing resources
    await Resource.deleteMany({});
    console.log('Cleared existing resources');

    // Insert new resources
    const insertedResources = await Resource.insertMany(mentalHealthResources);
    console.log(`Inserted ${insertedResources.length} resources`);

    console.log('Resource seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding resources:', error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedResources();
}

module.exports = { mentalHealthResources, seedResources };