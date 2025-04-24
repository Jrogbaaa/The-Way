import { Metadata } from "next";
import { StoryboardCreator } from "@/components/storyboard/StoryboardCreator";
import { TextImageGenerator } from "@/components/image-generation/TextImageGenerator";

export const metadata: Metadata = {
  title: "Create Video | The Way",
  description: "Create personalized AI storyboards and generate videos from them",
};

export default function StoryboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Create Video</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Create consistent AI videos with personalized models and narrative flow
      </p>
      <StoryboardCreator />

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <TextImageGenerator />
      </div>
    </div>
  );
} 