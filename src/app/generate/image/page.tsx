'use client';

import { TextImageGenerator } from "@/components/image-generation/TextImageGenerator";
import MainLayout from "@/components/layout/MainLayout"; // Assuming MainLayout is desired
import { Metadata } from "next"; // Import Metadata type if needed (client component cannot export metadata directly)

// Metadata might need to be defined in a parent layout or page if this remains strictly client-side
// export const metadata: Metadata = {
//   title: "Text to Image Generator | The Way",
//   description: "Generate images from text prompts using AI.",
// };

export default function GenerateImagePage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Text to Image Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Create stunning visuals simply by describing what you want to see.
            </p>
        </div>

        {/* Text Image Generator Component */}
        <TextImageGenerator />
      </div>
    </MainLayout>
  );
} 