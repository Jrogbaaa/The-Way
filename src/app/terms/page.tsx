import React from 'react';
import { Metadata } from 'next';
import MarkdownContent from '@/components/ui/markdown-content';

const termsContent = `
# Terms of Service

## 1. Introduction

Welcome to THE WAY ("Platform"). By accessing or using our Platform, you agree to be bound by these Terms of Service ("Terms").

## 2. Service Description

THE WAY provides AI-powered image and video generation, editing, and management tools for creators and businesses.

## 3. User Accounts

To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.

## 4. User Conduct

You agree not to:
- Use the Platform for any illegal purpose
- Upload content that infringes on intellectual property rights
- Generate content that is harmful, abusive, or violates our content policies
- Attempt to gain unauthorized access to any part of the Platform

## 5. Content Rights

You retain rights to content you upload. For AI-generated content, rights are governed by our Content License Agreement.

## 6. Limitation of Liability

To the maximum extent permitted by law, we disclaim all warranties and limit our liability for any damages arising from use of our services.

## 7. Modifications

We may modify these Terms at any time by posting updated Terms on the Platform. Your continued use of the Platform constitutes acceptance of the modified Terms.

## 8. Termination

We reserve the right to terminate or suspend your account for violations of these Terms.

## 9. Governing Law

These Terms are governed by the laws of the jurisdiction where our company is registered.

## Contact

For questions about these Terms, please contact us at support@theway.ai
`;

export const metadata = {
  title: 'Terms of Service | THE WAY',
  description: 'Terms of Service for THE WAY platform',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <MarkdownContent content={termsContent} className="prose-lg" />
    </div>
  );
} 