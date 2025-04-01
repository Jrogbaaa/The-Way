import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { ROUTES } from '@/lib/config';
import Logo from '@/components/ui/Logo';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <header className="w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="container mx-auto w-full px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link 
                href={ROUTES.home}
                className="flex items-center gap-2 text-lg font-semibold"
                tabIndex={0}
                aria-label="Go to home page"
              >
                <Logo size="md" />
                <span>Social AI Agent</span>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link 
                href="/models"
                className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                tabIndex={0}
                aria-label="Test AI Models"
              >
                Test Models
              </Link>
              <Link 
                href="/api-test"
                className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                tabIndex={0}
                aria-label="Test API Connections"
              >
                API Tests
              </Link>
              <Link 
                href={ROUTES.uploadPost}
                className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                tabIndex={0}
                aria-label="Analyze Post"
              >
                Analyze Post
              </Link>
              <Link 
                href={ROUTES.login}
                className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                tabIndex={0}
                aria-label="Sign in to your account"
              >
                Sign In
              </Link>
              <Button 
                asChild
              >
                <Link 
                  href={ROUTES.signup}
                  tabIndex={0}
                  aria-label="Create a new account"
                >
                  Sign Up
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-violet-500 to-indigo-600">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-5xl">
                    We know whats best for your social media. We're gonna show you how its done.
                  </h1>
                  <p className="max-w-[600px] text-gray-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Our cutting-edge platform combines the power of multiple AI models to help you create stunning content for social media.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <LinkButton 
                    href={ROUTES.signup}
                    size="lg" 
                    className="bg-white text-indigo-600 hover:bg-gray-100"
                    aria-label="Get started with our platform"
                  >
                    Get Started
                  </LinkButton>
                  <LinkButton 
                    href={ROUTES.gallery}
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10"
                    aria-label="View our content gallery"
                  >
                    View Gallery
                  </LinkButton>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-[180px] w-[180px] overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm">
                    <div className="h-full w-full bg-gradient-to-br from-pink-300 to-purple-500" />
                  </div>
                  <div className="h-[180px] w-[180px] overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm">
                    <div className="h-full w-full bg-gradient-to-bl from-blue-300 to-cyan-500" />
                  </div>
                  <div className="h-[180px] w-[180px] overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm">
                    <div className="h-full w-full bg-gradient-to-tr from-amber-300 to-orange-500" />
                  </div>
                  <div className="h-[180px] w-[180px] overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm">
                    <div className="h-full w-full bg-gradient-to-tl from-green-300 to-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Powerful AI Features
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our platform integrates multiple AI models to provide a comprehensive content creation experience.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {/* Replicate Features */}
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-800">
                <div className="rounded-full bg-violet-500/10 p-3 text-violet-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Custom AI Models</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Create and utilize custom-trained models specific to your needs.
                </p>
              </div>
              
              {/* Gemini Features */}
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-800">
                <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <path d="M14 2v6h6" />
                    <circle cx="11.5" cy="14.5" r="2.5" />
                    <path d="M13.77 17.27A5.5 5.5 0 1 0 17.25 13.8" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Content Generation</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Generate high-quality photos and get expert social media recommendations.
                </p>
              </div>
              
              {/* Google Cloud Features */}
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-800">
                <div className="rounded-full bg-green-500/10 p-3 text-green-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">AI Recognition</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Analyze your videos and photos with advanced AI recognition capabilities.
                </p>
              </div>
              
              {/* Adaptability */}
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-800">
                <div className="rounded-full bg-amber-500/10 p-3 text-amber-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Future-Proof</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Our platform is designed to integrate new AI developments as they emerge.
                </p>
              </div>
              
              {/* Plugin System */}
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-800">
                <div className="rounded-full bg-pink-500/10 p-3 text-pink-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M12 22v-5" />
                    <path d="M9 8V2" />
                    <path d="M15 8V2" />
                    <path d="M9 14v-2" />
                    <path d="M15 14v-2" />
                    <path d="M9 8a3 3 0 0 0 6 0" />
                    <path d="M12 14a3 3 0 0 0-3 3v5h6v-5a3 3 0 0 0-3-3Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Plugin System</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Extend the platform's capabilities with our flexible plugin architecture.
                </p>
              </div>
              
              {/* Collaboration */}
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 p-6 shadow-sm dark:border-gray-800">
                <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Collaboration</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Work together with your team on content creation and management.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Models Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Specialized AI Models
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our platform features specialized AI models for unique content creation tasks.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2">
              {/* Cristina Model */}
              <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
                <div className="p-6">
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-2xl font-bold">Cristina Model</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Generate realistic images of Cristina using our specialized AI model.
                    </p>
                    <LinkButton 
                      href={ROUTES.cristinaModel}
                      className="mt-4"
                      aria-label="Try the Cristina model"
                    >
                      Try It Now
                    </LinkButton>
                  </div>
                </div>
              </div>
              
              {/* Jaime Model */}
              <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
                <div className="p-6">
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-2xl font-bold">Jaime Creator</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Use the Jaime Creator model for unique and creative image generation.
                    </p>
                    <LinkButton 
                      href={ROUTES.jaimeModel}
                      className="mt-4"
                      aria-label="Try the Jaime creator model"
                    >
                      Try It Now
                    </LinkButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ICP Targeting Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-500 mb-2">
                    INTELLIGENT TARGETING
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Reach Your Ideal Customer Profile with AI Precision
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Our AI doesn't just create content—it helps you identify and target your Ideal Customer Profile (ICP) with unprecedented accuracy.
                  </p>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-violet-500 mr-2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">AI-powered audience analysis and segmentation</span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-violet-500 mr-2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Personalized content recommendations for different ICPs</span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-violet-500 mr-2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Smart A/B testing to optimize engagement</span>
                  </li>
                </ul>
                <div className="flex pt-4">
                  <LinkButton 
                    href={ROUTES.targeting}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    aria-label="Learn more about our AI targeting capabilities"
                  >
                    Explore Targeting
                  </LinkButton>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[400px] w-full overflow-hidden rounded-lg shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-500 opacity-90"></div>
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      <div className="flex flex-col space-y-2 bg-white/90 p-4 rounded-lg shadow-lg">
                        <div className="text-sm font-semibold text-violet-600">Persona A</div>
                        <div className="text-xs text-gray-600">Small Business Owner</div>
                        <div className="h-16 rounded bg-gray-100"></div>
                      </div>
                      <div className="flex flex-col space-y-2 bg-white/90 p-4 rounded-lg shadow-lg">
                        <div className="text-sm font-semibold text-violet-600">Persona B</div>
                        <div className="text-xs text-gray-600">Marketing Director</div>
                        <div className="h-16 rounded bg-gray-100"></div>
                      </div>
                      <div className="flex flex-col space-y-2 bg-white/90 p-4 rounded-lg shadow-lg">
                        <div className="text-sm font-semibold text-violet-600">Persona C</div>
                        <div className="text-xs text-gray-600">Content Creator</div>
                        <div className="h-16 rounded bg-gray-100"></div>
                      </div>
                      <div className="flex flex-col space-y-2 bg-white/90 p-4 rounded-lg shadow-lg">
                        <div className="text-sm font-semibold text-violet-600">Persona D</div>
                        <div className="text-xs text-gray-600">Social Media Influencer</div>
                        <div className="h-16 rounded bg-gray-100"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-indigo-600 to-violet-500">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-5xl">
                  Ready to Create Amazing Content?
                </h2>
                <p className="max-w-[600px] text-gray-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join our platform today and unlock the power of AI for your social media content.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <LinkButton 
                  href={ROUTES.signup}
                  size="lg" 
                  className="bg-white text-indigo-600 hover:bg-gray-100"
                  aria-label="Sign up for an account"
                >
                  Sign Up Now
                </LinkButton>
                <LinkButton 
                  href="#features"
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10"
                  aria-label="Learn more about our features"
                >
                  Learn More
                </LinkButton>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="container mx-auto w-full px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex flex-col">
              <h3 className="mb-4 text-lg font-semibold">Platform</h3>
              <Link 
                href={ROUTES.models}
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 transition-all duration-200 hover:underline"
                tabIndex={0}
                aria-label="Browse AI models"
              >
                Models
              </Link>
              <Link 
                href={ROUTES.gallery}
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 transition-all duration-200 hover:underline"
                tabIndex={0}
                aria-label="Browse content gallery"
              >
                Gallery
              </Link>
              <Link 
                href={ROUTES.chat}
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 transition-all duration-200 hover:underline"
                tabIndex={0}
                aria-label="Chat with AI expert"
              >
                AI Chat
              </Link>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-4 text-lg font-semibold">Support</h3>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Visit our documentation"
              >
                Documentation
              </Link>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Get help from our FAQs"
              >
                FAQs
              </Link>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Contact our support team"
              >
                Contact
              </Link>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-4 text-lg font-semibold">Legal</h3>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Read our privacy policy"
              >
                Privacy
              </Link>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Read our terms of service"
              >
                Terms
              </Link>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Learn about our cookie policy"
              >
                Cookies
              </Link>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-4 text-lg font-semibold">Company</h3>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Learn about our company"
              >
                About
              </Link>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Join our team"
              >
                Careers
              </Link>
              <Link 
                href="#"
                className="mb-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                tabIndex={0}
                aria-label="Read our blog"
              >
                Blog
              </Link>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Link 
                href={ROUTES.home}
                className="flex items-center gap-2 text-lg font-semibold"
                tabIndex={0}
                aria-label="Go to home page"
              >
                <Logo size="md" />
                <span>Social AI Agent</span>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Social AI Agent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
