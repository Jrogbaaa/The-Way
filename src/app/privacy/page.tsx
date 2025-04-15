'use client';

import React from 'react';
import { Metadata } from 'next';
import MarkdownContent from '@/components/ui/markdown-content';

const privacyContent = `
# Privacy Policy

## 1. Introduction

This Privacy Policy describes how THE WAY ("we," "our," or "us") collects, uses, and shares your personal information when you use our platform.

## 2. Information We Collect

### 2.1 Information You Provide

- Account information: When you register, we collect your name, email, and password
- Profile information: Any additional details you add to your profile
- Content: Images, videos, and other content you upload
- Communications: Information you provide when contacting support

### 2.2 Automatically Collected Information

- Usage data: How you interact with our platform
- Device information: Browser type, operating system, and device settings
- Location information: General location based on IP address
- Cookies and similar technologies: To enhance your experience

## 3. How We Use Your Information

We use your information to:
- Provide, maintain, and improve our services
- Process and fulfill your requests
- Communicate with you about your account and our services
- Personalize your experience
- Detect and prevent fraud and abuse
- Comply with legal obligations

## 4. Sharing Your Information

We may share information with:
- Service providers who perform services on our behalf
- Legal authorities when required by law
- Business partners with your consent
- In connection with a merger, sale, or acquisition

## 5. Data Security

We implement appropriate technical and organizational measures to protect your personal information.

## 6. Your Rights and Choices

Depending on your location, you may have rights to:
- Access or delete your personal information
- Object to certain processing activities
- Correct inaccurate information
- Data portability

## 7. Changes to This Policy

We may update this Privacy Policy periodically. We will notify you of any material changes.

## 8. Contact Us

If you have questions about this Privacy Policy, please contact us at privacy@theway.ai
`;

export const metadata = {
  title: 'Privacy Policy | THE WAY',
  description: 'Privacy Policy for THE WAY platform',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <MarkdownContent content={privacyContent} className="prose-lg" />
    </div>
  );
} 